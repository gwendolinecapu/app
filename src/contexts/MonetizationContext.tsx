/**
 * MonetizationContext.tsx
 * Context global pour accéder à tout le système de monétisation
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import AdMediationService from '../services/AdMediationService';
import PremiumService from '../services/PremiumService';
import CreditService from '../services/CreditService';
import DecorationService from '../services/DecorationService';
import RevenueCatService from '../services/RevenueCatService';
import {
    UserTier,
    MonetizationStatus,
    RewardResult,
    NativeAdData,
    Decoration,
    ShopItem,
    CREDIT_ITEMS,
    CREDIT_PACKS,
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

    // Sans pub
    isAdFree: boolean;
    adFreeDaysRemaining: number;

    // Reward Ads
    canWatchRewardAd: boolean;
    rewardAdsRemaining: number;
    adFreeProgress: { current: number; needed: number };
    premiumProgress: { current: number; needed: number };
    watchRewardAd: () => Promise<RewardResult>;

    // Crédits
    canClaimDaily: boolean;
    currentStreak: number;
    claimDailyLogin: () => Promise<{ amount: number; streak: number; streakBonus: number }>;

    // Boutique
    shopItems: ShopItem[];
    creditPacks: ShopItem[];
    purchaseItem: (item: ShopItem) => Promise<boolean>;
    purchaseIAP: (packageId: string) => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    presentPaywall: () => Promise<boolean>;
    presentCustomerCenter: () => Promise<void>;

    // Décorations
    ownedDecorations: Decoration[];
    purchaseDecoration: (decorationId: string) => Promise<boolean>;
    equipDecoration: (alterId: string, decorationId: string) => Promise<boolean>;
    getEquippedDecoration: (alterId: string) => Decoration | null;

    // Pubs
    getNativeAd: () => NativeAdData | null;


    // Refresh
    refresh: () => Promise<void>;
    addCredits: (amount: number, reason: string) => Promise<boolean>;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // États dérivés des services
    const [tier, setTier] = useState<UserTier>('free');
    const [credits, setCredits] = useState(0);
    const [ownedDecorations, setOwnedDecorations] = useState<Decoration[]>([]);

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
        setOwnedDecorations(DecorationService.getOwnedDecorations());
    }, []);

    const refresh = useCallback(async () => {
        if (user?.uid) {
            const isPremiumRC = await RevenueCatService.isPro();
            if (isPremiumRC && !PremiumService.isPremium()) {
                // Sync logic
            }
            await PremiumService.refreshStatus();
            refreshState();
        }
    }, [user?.uid, refreshState]);

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

    const watchRewardAd = useCallback(async (): Promise<RewardResult> => {
        const result = await AdMediationService.showRewardedAd();

        if (result.completed) {
            await CreditService.claimRewardAd();
            await PremiumService.recordRewardAdWatch();
            refreshState();
        }
        return result;
    }, [refreshState]);

    // ==================== CREDITS ====================

    const canClaimDaily = CreditService.canClaimDailyLogin();
    const currentStreak = CreditService.getCurrentStreak();

    const claimDailyLogin = useCallback(async () => {
        const result = await CreditService.claimDailyLogin();
        refreshState();
        return result;
    }, [refreshState]);

    // ==================== BOUTIQUE ====================

    const purchaseItem = useCallback(async (item: ShopItem): Promise<boolean> => {
        const success = await CreditService.purchaseItem(item);
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

    const purchaseDecoration = useCallback(async (decorationId: string): Promise<boolean> => {
        const success = await DecorationService.purchaseDecoration(decorationId);
        if (success) refreshState();
        return success;
    }, [refreshState]);

    const equipDecoration = useCallback(async (alterId: string, decorationId: string): Promise<boolean> => {
        return DecorationService.equipDecoration(alterId, decorationId);
    }, []);

    const getEquippedDecoration = useCallback((alterId: string): Decoration | null => {
        return DecorationService.getEquippedDecoration(alterId);
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

        isAdFree,
        adFreeDaysRemaining,

        canWatchRewardAd,
        rewardAdsRemaining,
        adFreeProgress,
        premiumProgress,
        watchRewardAd,

        canClaimDaily,
        currentStreak,
        claimDailyLogin,

        shopItems: CREDIT_ITEMS,
        creditPacks: CREDIT_PACKS,
        purchaseItem,
        purchaseIAP,
        restorePurchases,
        presentPaywall,
        presentCustomerCenter,

        ownedDecorations,
        purchaseDecoration,
        equipDecoration,
        getEquippedDecoration,

        getNativeAd,
        refresh,
        addCredits
    };

    return (
        <MonetizationContext.Provider value={value}>
            {children}
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

