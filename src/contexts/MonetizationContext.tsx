/**
 * MonetizationContext.tsx
 * Context global pour accéder à tout le système de monétisation
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PurchasesOffering } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import AdMediationService from '../services/AdMediationService';
import PremiumService from '../services/PremiumService';
import CreditService from '../services/CreditService';
import DecorationService from '../services/DecorationService';
import RevenueCatService from '../services/RevenueCatService';
import { PremiumConversionModal } from '../components/PremiumConversionModal';
import {
    UserTier,
    MonetizationStatus,
    RewardResult,
    NativeAdData,
    Decoration,
    ShopItem,
    CREDIT_ITEMS,
    CREDIT_PACKS,
    COSMETIC_ITEMS,
} from '../services/MonetizationTypes';

interface MonetizationContextType {
    // État
    loading: boolean;
    tier: UserTier;
    credits: number;

    // Premium
    isPremium: boolean;
    isTrialActive: boolean;
    trialDaysRemaining: number;
    premiumDaysRemaining: number;
    canUseFreeMont: boolean;

    activateFreeMonth: () => Promise<boolean>;
    isSilentTrialActive: boolean;
    shouldShowConversionModal: boolean;
    markConversionModalSeen: () => Promise<void>;

    // Sans pub
    isAdFree: boolean;
    adFreeDaysRemaining: number;

    // Reward Ads
    // Reward Ads
    canWatchRewardAd: boolean;
    rewardAdsRemaining: number;
    adFreeProgress: { current: number; needed: number };
    premiumProgress: { current: number; needed: number };
    watchRewardAd: (alterId: string) => Promise<RewardResult>;
    claimRewardAd: (alterId: string) => Promise<number>;

    // Crédits
    checkDailyLogin: (alterId: string) => Promise<boolean>;
    currentStreak: number;
    claimDailyLogin: (alterId: string) => Promise<{ amount: number; streak: number; streakBonus: number }>;

    // Boutique
    shopItems: ShopItem[];
    creditPacks: ShopItem[];
    purchaseItem: (item: ShopItem, alterId?: string) => Promise<boolean>;
    purchaseIAP: (packageId: string) => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    presentPaywall: () => Promise<boolean>;
    presentCustomerCenter: () => Promise<void>;

    // Décorations
    purchaseDecoration: (decorationId: string, alterId: string) => Promise<boolean>;
    equipDecoration: (alterId: string, decorationId: string, type: 'frame' | 'theme' | 'bubble') => Promise<boolean>;
    getEquippedDecorationId: (alter: any, type: 'frame' | 'theme' | 'bubble') => string | undefined;

    // Pubs
    getNativeAd: () => NativeAdData | null;


    // Refresh
    refresh: () => Promise<void>;
    addCredits: (amount: number, reason: string) => Promise<boolean>;
    offerings: PurchasesOffering | null;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
    const { user, refreshAlters } = useAuth();
    const [loading, setLoading] = useState(true);

    // États dérivés des services
    const [tier, setTier] = useState<UserTier>('free');
    const [credits, setCredits] = useState(0);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
    const [isConversionModalVisible, setConversionModalVisible] = useState(false);

    // ==================== INITIALIZATION ====================

    useEffect(() => {
        if (user?.uid) {
            initializeServices(user.uid);
        } else {
            setLoading(false);
        }
    }, [user?.uid]);

    const initializeServices = async (userId: string) => {
        setLoading(true);
        try {
            // Initialiser tous les services en parallèle
            await Promise.all([
                AdMediationService.initialize(),
                PremiumService.initialize(userId),
                CreditService.initialize(userId),
                DecorationService.initialize(userId),
                RevenueCatService.initialize(userId),
            ]);

            // Fetch loaded offerings
            const loadedOfferings = await RevenueCatService.getOfferings();
            setOfferings(loadedOfferings);

            // Mettre à jour les états
            refreshState();

        } catch (error) {
            console.error('[MonetizationContext] Initialization failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshState = useCallback(() => {
        setTier(PremiumService.getCurrentTier());
        setCredits(CreditService.getBalance());
        refreshAlters();
    }, [refreshAlters]);

    const refresh = useCallback(async () => {
        if (user?.uid) {
            const isPremiumRC = await RevenueCatService.isPro();
            if (isPremiumRC && !PremiumService.isPremium()) {
                // Sync logic
            }
            await PremiumService.refreshStatus();

            // Refresh offerings
            const loadedOfferings = await RevenueCatService.getOfferings();
            setOfferings(loadedOfferings);

            refreshState();
        }
    }, [user?.uid, refreshState]);

    const markConversionModalSeen = useCallback(async () => {
        await PremiumService.markConversionModalSeen();
        setConversionModalVisible(false);
        refreshState();
    }, [refreshState]);

    const addCredits = useCallback(async (amount: number, reason: string): Promise<boolean> => {
        try {
            await CreditService.addCredits(amount, 'gift', reason);
            refreshState();
            return true;
        } catch (error) {
            console.error('[MonetizationContext] addCredits failed:', error);
            return false;
        }
    }, [refreshState]);

    // ==================== PREMIUM ====================

    const isPremium = PremiumService.isPremium();
    const isTrialActive = PremiumService.isTrialActive();
    const trialDaysRemaining = PremiumService.getTrialDaysRemaining();
    const premiumDaysRemaining = PremiumService.getPremiumDaysRemaining();

    const canUseFreeMont = PremiumService.canUseFreeMont();
    const isSilentTrialActive = PremiumService.isSilentTrialActive();
    const shouldShowConversionModal = PremiumService.shouldShowConversionModal();

    const activateFreeMonth = useCallback(async () => {
        const success = await PremiumService.activateFreeMonth();
        if (success) refreshState();
        return success;
    }, [refreshState]);

    // ==================== AD FREE ====================

    const isAdFree = PremiumService.isAdFree();
    const adFreeDaysRemaining = PremiumService.getAdFreeDaysRemaining();

    // ==================== REWARD ADS ====================

    const canWatchRewardAd = AdMediationService.canWatchRewardAd() && AdMediationService.isRewardedAdReady();
    const rewardAdsRemaining = AdMediationService.getRemainingRewardAds();
    const adFreeProgress = PremiumService.getAdFreeProgress();
    const premiumProgress = PremiumService.getPremiumProgress();

    const watchRewardAd = useCallback(async (alterId: string): Promise<RewardResult> => {
        const result = await AdMediationService.showRewardedAd();

        if (result.completed) {
            await CreditService.claimRewardAd(alterId);
            await PremiumService.recordRewardAdWatch();
            refreshState();
        }
        return result;
    }, [refreshState]);

    // ==================== CREDITS ====================

    const currentStreak = CreditService.getCurrentStreak();

    const canClaimDaily = useCallback(async (alterId: string) => {
        return CreditService.canClaimDailyLogin(alterId);
    }, []);

    const claimDailyLogin = useCallback(async (alterId: string) => {
        const result = await CreditService.claimDailyLogin(alterId);
        refreshState();
        return result;
    }, [refreshState]);

    const claimRewardAd = useCallback(async (alterId: string) => {
        const result = await CreditService.claimRewardAd(alterId);
        refreshState();
        return result;
    }, [refreshState]);

    // ==================== BOUTIQUE ====================

    const purchaseItem = useCallback(async (item: ShopItem, alterId?: string): Promise<boolean> => {
        if (item.type === 'decoration') {
            if (!alterId) {
                console.error("PurchaseItem: alterId required for decoration");
                return false;
            }
            return DecorationService.purchaseDecoration(item.id, alterId);
        }

        const success = await CreditService.purchaseItem(item, true);
        if (success) refreshState();
        return success;
    }, [refreshState]);

    const purchaseIAP = useCallback(async (packageId: string): Promise<boolean> => {
        try {
            setLoading(true);
            const offerings = await RevenueCatService.getOfferings();

            if (!offerings || !offerings.availablePackages) {
                return false;
            }

            const pkg = offerings.availablePackages.find(p => p.identifier === packageId);
            if (!pkg) {
                return false;
            }

            const { paymentSuccessful } = await RevenueCatService.purchasePackage(pkg);

            if (paymentSuccessful) {
                if (packageId.includes('credits')) {
                    const pack = CREDIT_PACKS.find(p => p.revenueCatPackageId === packageId || p.id === packageId);
                    if (pack && pack.id.includes('credits_')) {
                        const amount = parseInt(pack.id.replace('credits_', ''), 10);
                        if (!isNaN(amount)) {
                            await CreditService.addCredits(amount, 'purchase_iap', 'Achat IAP');
                        }
                    }
                }
                await refresh();
                return true;
            }
            return false;
        } catch (error) {
            return false;
        } finally {
            setLoading(false);
        }
    }, [refresh]);

    const restorePurchases = useCallback(async (): Promise<boolean> => {
        try {
            setLoading(true);
            await RevenueCatService.restorePurchases();
            await refresh();
            return true;
        } catch (e) {
            return false;
        } finally {
            setLoading(false);
        }
    }, [refresh]);

    const presentPaywall = useCallback(async (): Promise<boolean> => {
        const result = await RevenueCatService.presentPaywall();
        if (result) await refresh();
        return result;
    }, [refresh]);

    const presentCustomerCenter = useCallback(async (): Promise<void> => {
        await RevenueCatService.presentCustomerCenter();
    }, []);

    // ==================== DECORATIONS ====================

    const purchaseDecoration = useCallback(async (decorationId: string, alterId: string): Promise<boolean> => {
        const success = await DecorationService.purchaseDecoration(decorationId, alterId);
        if (success) refreshState();
        return success;
    }, [refreshState]);

    const equipDecoration = useCallback(async (alterId: string, decorationId: string, type: 'frame' | 'theme' | 'bubble'): Promise<boolean> => {
        return DecorationService.equipDecoration(alterId, decorationId, type);
    }, []);

    const getEquippedDecorationId = useCallback((alter: any, type: 'frame' | 'theme' | 'bubble'): string | undefined => {
        return DecorationService.getEquippedDecorationId(alter, type);
    }, []);

    const getOwnedDecorations = useCallback(async (alterId: string): Promise<Decoration[]> => {
        return [];
    }, []);

    // ==================== ADS ====================

    const getNativeAd = useCallback((): NativeAdData | null => {
        if (isAdFree) return null;
        return AdMediationService.getPreloadedNativeAd();
    }, [isAdFree]);

    // ==================== CONTEXT VALUE ====================

    const value: MonetizationContextType = {
        loading,
        tier,
        credits,

        isPremium,
        isTrialActive,
        trialDaysRemaining,
        premiumDaysRemaining,
        canUseFreeMont,

        activateFreeMonth,
        isSilentTrialActive,
        shouldShowConversionModal,
        markConversionModalSeen,

        isAdFree,
        adFreeDaysRemaining,

        canWatchRewardAd,
        rewardAdsRemaining,
        adFreeProgress,
        premiumProgress,
        watchRewardAd,
        claimRewardAd,

        checkDailyLogin: canClaimDaily,
        currentStreak,
        claimDailyLogin,

        shopItems: [...COSMETIC_ITEMS, ...CREDIT_ITEMS],
        creditPacks: CREDIT_PACKS,
        purchaseItem,
        purchaseIAP,
        restorePurchases,
        presentPaywall,
        presentCustomerCenter,

        purchaseDecoration,
        equipDecoration,
        getEquippedDecorationId,

        getNativeAd,
        refresh,
        addCredits,
        offerings,
    };

    return (
        <MonetizationContext.Provider value={value}>
            {children}
            <PremiumConversionModal
                visible={isConversionModalVisible || shouldShowConversionModal}
                onClose={markConversionModalSeen}
            />
        </MonetizationContext.Provider>
    );
}

export function useMonetization() {
    const context = useContext(MonetizationContext);
    if (context === undefined) {
        throw new Error('useMonetization must be used within a MonetizationProvider');
    }
    return context;
}

export default MonetizationContext;

