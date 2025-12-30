import Purchases, {
    PurchasesOffering,
    PurchasesPackage,
    CustomerInfo,
    PurchasesError
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Keys should be in .env in production, but defined here for now as requested by user plan context or placeholders
const API_KEYS = {
    ios: 'appl_REVENUECAT_PUBLIC_KEY_IOS', // Placeholder
    android: 'goog_REVENUECAT_PUBLIC_KEY_ANDROID', // Placeholder
};

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

        if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: API_KEYS.ios });
        } else if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: API_KEYS.android });
        }

        if (userId) {
            await Purchases.logIn(userId);
        }

        this.initialized = true;
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
     * Purchase a package
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
     * Restore purchases
     */
    async restorePurchases(): Promise<CustomerInfo> {
        return await Purchases.restorePurchases();
    }

    /**
     * Check if user has active entitlement (e.g. "premium")
     */
    async getEntitlementStatus(entitlementId: string = 'premium'): Promise<boolean> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return customerInfo.entitlements.active[entitlementId] !== undefined;
        } catch (e) {
            console.error('[RevenueCat] Error getting entitlement:', e);
            return false;
        }
    }
}

export default RevenueCatService.getInstance();
