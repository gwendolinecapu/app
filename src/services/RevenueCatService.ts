import { Platform, LogBox } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Conditional imports for native platforms only
let Purchases: any = null;
let RevenueCatUI: any = null;
let PAYWALL_RESULT: any = null;
let PurchasesOffering: any = null;
let PurchasesPackage: any = null;
let CustomerInfo: any = null;

const isWeb = Platform.OS === 'web';

if (!isWeb) {
    try {
        const PurchasesModule = require('react-native-purchases');
        Purchases = PurchasesModule.default;
        PurchasesOffering = PurchasesModule.PurchasesOffering;
        PurchasesPackage = PurchasesModule.PurchasesPackage;
        CustomerInfo = PurchasesModule.CustomerInfo;

        const PurchasesUIModule = require('react-native-purchases-ui');
        RevenueCatUI = PurchasesUIModule.default;
        PAYWALL_RESULT = PurchasesUIModule.PAYWALL_RESULT;
    } catch (e) {
        console.warn('[RevenueCat] Native modules not available:', e);
    }
}

// API Key provided by user (test key for now)
// API Keys from environment
const API_KEYS = {
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY || '',
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || ''
};

// TODO: Verify this Entitlement ID matches the one created in RevenueCat dashboard
const ENTITLEMENT_ID = 'Plural Connect Pro';

class RevenueCatService {
    private static instance: RevenueCatService;
    private initialized: boolean = false;
    private configured: boolean = false;

    private constructor() { }

    static getInstance(): RevenueCatService {
        if (!RevenueCatService.instance) {
            RevenueCatService.instance = new RevenueCatService();
        }
        return RevenueCatService.instance;
    }

    /**
     * Initialize RevenueCat SDK
     */
    async initialize(userId?: string): Promise<void> {
        if (this.initialized) return;

        // Skip on web platform - in-app purchases not available
        if (isWeb) {
            console.log('[RevenueCat] Skipping initialization on web platform');
            this.initialized = true;
            this.configured = false;
            return;
        }

        // Check for Expo Go
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

        // If in Expo Go, skip initialization to prevent annoying red screens
        if (isExpoGo) {
            this.initialized = true;
            this.configured = false; // Mock mode
            return;
        }

        // Check if Purchases SDK is available
        if (!Purchases) {
            console.warn('[RevenueCat] SDK not available (native build required)');
            this.initialized = true;
            this.configured = false;
            return;
        }

        // Ensure keys exist, otherwise mock or warn
        if (!API_KEYS.ios && !API_KEYS.android) {
            this.initialized = true;
            return;
        }

        // Basic validation - check for placeholder or empty strings
        const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
        // API keys are usually long (around 30+ chars). Trivial keys cause SDK errors.
        if (!apiKey || apiKey === '' || apiKey.includes('YOUR_') || apiKey.length < 20) {
            console.warn('[RevenueCat] Invalid configuration: Missing or placeholder API key. Purchases will be UNCONFIGURED.');
            this.initialized = true;
            this.configured = false;
            return;
        }

        try {
            // Purchases.setLogLevel(LOG_LEVEL.VERBOSE); // Too noisy
            LogBox.ignoreLogs([
                /\[RevenueCat\].*Configuration is not valid/,
                /\[RevenueCat\].*credentials issue/,
                /\[RevenueCat\].*ProductEntitlementMapping/,
                /\[RevenueCat\].*Error fetching offerings/
            ]);

            try {
                if (Platform.OS === 'ios') {
                    Purchases.configure({ apiKey: API_KEYS.ios });
                    this.configured = true;
                } else if (Platform.OS === 'android') {
                    Purchases.configure({ apiKey: API_KEYS.android });
                    this.configured = true;
                }
            } catch (configError) {
                console.warn('[RevenueCat] Configuration failed (check API Key):', configError);
                this.configured = false;
                this.initialized = true;
                return;
            }

            if (this.configured && userId) {
                // Try to login, catch if key is invalid despite check
                try {
                    await Purchases.logIn(userId);
                } catch (loginError: any) {
                    // Start soft handling
                    console.warn('[RevenueCat] Login failed during init (check API Key):', loginError.message);
                    // If invalid credentials, de-configure
                    if (loginError.message?.includes('credentials') || loginError.message?.includes('Invalid API Key')) {
                        this.configured = false;
                    }
                }
            }

            this.initialized = true;
        } catch (error: any) {
            console.warn('[RevenueCat] Initialization failed (likely running in Expo Go without native code). Safe to ignore in dev.', error);
            // Mark as initialized but NOT configured to prevent repeated failed attempts in loop
            this.initialized = true;
            this.configured = false;
        }
    }

    /**
     * Identify user (e.g. on login)
     */
    async login(userId: string): Promise<any | null> {
        if (!this.configured || !Purchases) return null;
        try {
            const { customerInfo } = await Purchases.logIn(userId);
            return customerInfo;
        } catch (e) {
            console.warn('[RevenueCat] Login failed:', e);
            return null;
        }
    }

    /**
     * Logout user (reset to anonymous)
     */
    async logout(): Promise<any | null> {
        if (!this.configured || !Purchases) return null;
        try {
            const customerInfo = await Purchases.logOut();
            return customerInfo;
        } catch (e) {
            console.warn('[RevenueCat] Logout failed:', e);
            return null;
        }
    }

    /**
     * Get current offerings (products to display)
     */
    async getOfferings(): Promise<any | null> {
        if (!this.configured || !Purchases) return null;
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null) {
                return offerings.current;
            }
            return null;
        } catch (e) {
            console.warn('[RevenueCat] Error fetching offerings:', e);
            return null;
        }
    }

    /**
     * Purchase a package manually
     */
    async purchasePackage(
        packageToPurchase: any
    ): Promise<{ customerInfo: any; paymentSuccessful: boolean }> {
        if (!this.configured || !Purchases) {
            return { customerInfo: null, paymentSuccessful: false };
        }
        if (!this.configured) return { customerInfo: null as any, paymentSuccessful: false };
        try {
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            return { customerInfo, paymentSuccessful: true };
        } catch (e: any) {
            if (!e.userCancelled) {
                console.warn('[RevenueCat] Purchase error:', e);
            }
            return { customerInfo: null as any, paymentSuccessful: false };
        }
    }

    /**
     * Present the native RevenueCat Paywall
     */
    async presentPaywall(): Promise<boolean> {
        if (!this.configured || !RevenueCatUI) return false;
        try {
            const paywallResult = await RevenueCatUI.presentPaywall();

            // Check if paywall was successful (purchased or restored)
            if (PAYWALL_RESULT) {
                return paywallResult === PAYWALL_RESULT.PURCHASED ||
                       paywallResult === PAYWALL_RESULT.RESTORED;
            }

            // Fallback for unknown result
            return false;
        } catch (error) {
            console.warn('[RevenueCat] Paywall error:', error);
            return false;
        }
    }

    /**
     * Present the Customer Center
     */
    async presentCustomerCenter(): Promise<void> {
        if (!this.configured || !RevenueCatUI) return;
        try {
            await RevenueCatUI.presentCustomerCenter();
        } catch (error) {
            console.warn('[RevenueCat] Customer Center error:', error);
        }
    }

    /**
     * Restore purchases
     */
    async restorePurchases(): Promise<any | null> {
        if (!this.configured || !Purchases) return null;
        try {
            return await Purchases.restorePurchases();
        } catch (e) {
            console.warn('[RevenueCat] Restore failed:', e);
            return null;
        }
    }

    /**
     * Check if user has active entitlement
     */
    async isPro(customerInfo?: any): Promise<boolean> {
        if (!this.configured || !Purchases) return false;
        try {
            const info = customerInfo || await Purchases.getCustomerInfo();
            return typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        } catch (e) {
            console.warn('[RevenueCat] Error checking entitlement:', e);
            return false;
        }
    }

    /**
     * Get generic generic raw customer info
     */
    async getCustomerInfo(): Promise<any | null> {
        if (!this.configured || !Purchases) return null;
        try {
            return await Purchases.getCustomerInfo();
        } catch (e) {
            console.warn('[RevenueCat] Error getting info', e);
            return null;
        }
    }
}

export default RevenueCatService.getInstance();

