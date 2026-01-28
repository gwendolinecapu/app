import { Platform } from 'react-native';

// Mock expo-constants
jest.mock('expo-constants', () => {
    return {
        __esModule: true,
        default: {
            executionEnvironment: 'bare',
            Manifest: {},
        },
        ExecutionEnvironment: {
            StoreClient: 'storeClient',
            Bare: 'bare',
            Standalone: 'standalone',
        },
    };
});

// Mock react-native
jest.mock('react-native', () => {
    return {
        Platform: { OS: 'ios', select: (objs: any) => objs.ios },
        LogBox: { ignoreLogs: jest.fn() },
    };
});

// Mock react-native-purchases
const mockPurchases = {
    configure: jest.fn(),
    logIn: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
};

jest.mock('react-native-purchases', () => {
    return {
        __esModule: true,
        default: mockPurchases,
        PurchasesOffering: {},
        PurchasesPackage: {},
        CustomerInfo: {},
    };
});

jest.mock('react-native-purchases-ui', () => ({
    __esModule: true,
    default: {},
    PAYWALL_RESULT: {},
}));

describe('RevenueCatService', () => {
    let RevenueCatService: any;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Set env vars before requiring
        process.env.EXPO_PUBLIC_RC_IOS_KEY = 'test_key_long_enough_for_validation_123';

        // Re-require the service to ensure it picks up the mocks and runs initialization logic
        // We need to require it dynamically because it executes code on import (top-level conditional)
        RevenueCatService = require('./RevenueCatService').default;
    });

    it('should identify pro user if "Plural Connect Pro" entitlement is active', async () => {
        // Setup the mock response
        mockPurchases.getCustomerInfo.mockResolvedValue({
            entitlements: {
                active: {
                    'Plural Connect Pro': { isActive: true },
                },
            },
        });

        await RevenueCatService.initialize('user123');

        const isPro = await RevenueCatService.isPro();
        expect(isPro).toBe(true);
    });

    it('should identify pro user if "pro" entitlement is active', async () => {
        mockPurchases.getCustomerInfo.mockResolvedValue({
            entitlements: {
                active: {
                    'pro': { isActive: true },
                },
            },
        });

        await RevenueCatService.initialize('user123');

        const isPro = await RevenueCatService.isPro();
        expect(isPro).toBe(true);
    });

    it('should identify pro user if "premium" entitlement is active', async () => {
        mockPurchases.getCustomerInfo.mockResolvedValue({
            entitlements: {
                active: {
                    'premium': { isActive: true },
                },
            },
        });

        await RevenueCatService.initialize('user123');

        const isPro = await RevenueCatService.isPro();
        expect(isPro).toBe(true);
    });

    it('should return false if no matching entitlement is active', async () => {
        mockPurchases.getCustomerInfo.mockResolvedValue({
            entitlements: {
                active: {
                    'other_entitlement': { isActive: true },
                },
            },
        });

        await RevenueCatService.initialize('user123');

        const isPro = await RevenueCatService.isPro();
        expect(isPro).toBe(false);
    });
});
