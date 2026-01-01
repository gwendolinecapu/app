import Purchases, {
    PurchasesOffering,
    PurchasesPackage,
    CustomerInfo,
    LOG_LEVEL
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';

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

        // Ensure keys exist, otherwise mock or warn
        if (!API_KEYS.ios && !API_KEYS.android) {
            console.warn('[RevenueCat] No API keys found. Skipping initialization.');
            this.initialized = true;
            return;
        }

        try {
            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

            if (Platform.OS === 'ios') {
                if (API_KEYS.ios) Purchases.configure({ apiKey: API_KEYS.ios });
            } else if (Platform.OS === 'android') {
                if (API_KEYS.android) Purchases.configure({ apiKey: API_KEYS.android });
            }

            if (userId) {
                await Purchases.logIn(userId);
            }

            this.initialized = true;
        } catch (error) {
            console.warn('[RevenueCat] Initialization failed (likely running in Expo Go without native code).', error);
            // Mark as initialized to prevent repeated failed attempts in loop
            this.initialized = true;
        }
    }

    /**
     * Identify user (e.g. on login)
     */
    async login(userId: string): Promise<CustomerInfo> {
        const { customerInfo } = await Purchases.logIn(userId);
        return customerInfo;
    }

    /**
     * Logout user (reset to anonymous)
     */
    async logout(): Promise<CustomerInfo> {
        const customerInfo = await Purchases.logOut();
        return customerInfo;
    }

    /**
     * Get current offerings (products to display)
     */
    async getOfferings(): Promise<PurchasesOffering | null> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null) {
                return offerings.current;
            }
            return null;
        } catch (e) {
            console.error('[RevenueCat] Error fetching offerings:', e);
            return null;
        }
    }

    /**
     * Purchase a package manually
     */
    async purchasePackage(
        packageToPurchase: PurchasesPackage
    ): Promise<{ customerInfo: CustomerInfo; paymentSuccessful: boolean }> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            return { customerInfo, paymentSuccessful: true };
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('[RevenueCat] Purchase error:', e);
            }
            return { customerInfo: null as any, paymentSuccessful: false };
        }
    }

    /**
     * Present the native RevenueCat Paywall
     */
    async presentPaywall(): Promise<boolean> {
        try {
            const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

            switch (paywallResult) {
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    return true;
                case PAYWALL_RESULT.NOT_PRESENTED:
                case PAYWALL_RESULT.ERROR:
                case PAYWALL_RESULT.CANCELLED:
                default:
                    return false;
            }
        } catch (error) {
            console.error('[RevenueCat] Paywall error:', error);
            return false;
        }
    }

    /**
     * Present the Customer Center
     */
    async presentCustomerCenter(): Promise<void> {
        try {
            await RevenueCatUI.presentCustomerCenter();
        } catch (error) {
            console.error('[RevenueCat] Customer Center error:', error);
        }
    }

    /**
     * Restore purchases
     */
    async restorePurchases(): Promise<CustomerInfo> {
        return await Purchases.restorePurchases();
    }

    /**
     * Check if user has active entitlement
     */
    async isPro(customerInfo?: CustomerInfo): Promise<boolean> {
        try {
            const info = customerInfo || await Purchases.getCustomerInfo();
            return typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        } catch (e) {
            console.error('[RevenueCat] Error checking entitlement:', e);
            return false;
        }
    }

    /**
     * Get generic generic raw customer info
     */
    async getCustomerInfo(): Promise<CustomerInfo> {
        return await Purchases.getCustomerInfo();
    }
}

export default RevenueCatService.getInstance();
