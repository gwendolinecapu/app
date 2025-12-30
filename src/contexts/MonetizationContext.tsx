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
    // ... (existing code up to purchaseDecoration)

    // ==================== HELPERS ====================

    const addCredits = useCallback(async (amount: number, reason: string): Promise<boolean> => {
        const success = await CreditService.addCredits(amount, 'gift', reason);
        if (success) refreshState();
        return success;
    }, [refreshState]);

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
        addCredits,
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
