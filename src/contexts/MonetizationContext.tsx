/**
 * MonetizationContext.tsx
 * Context global pour accéder à tout le système de monétisation
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PurchasesOffering } from 'react-native-purchases';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
    // checkDailyLogin is likely not used directly in UI as much as claim button
    checkDailyLogin: (alterId: string) => Promise<boolean>;

    currentStreak: number;
    claimDailyLogin: (alterId: string) => Promise<{ amount: number; streak: number; streakBonus: number }>;

    shopItems: ShopItem[];
    ownedItems: string[]; // IDs only
    equippedItems: Record<string, string>; // type -> itemId
    creditPacks: ShopItem[];
    purchaseItem: (item: ShopItem, alterId?: string) => Promise<boolean>;
    equipItem: (itemId: string, type: any) => Promise<boolean>;
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
    addToInventory: (itemId: string) => Promise<boolean>; // Add item without spending credits (for loot box)
    offerings: PurchasesOffering | null;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
    const { user, alters, currentAlter, refreshAlters } = useAuth();
    const [loading, setLoading] = useState(true);

    // États dérivés des services
    const [tier, setTier] = useState<UserTier>('free');
    const [credits, setCredits] = useState(0);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
    const [isConversionModalVisible, setConversionModalVisible] = useState(false);

    // Nouveaux états pour ShopUI
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [equippedItems, setEquippedItems] = useState<Record<string, string>>({});

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

        // Fetch owned items and credits for CURRENT ALTER only
        if (currentAlter) {
            // Sync Credits
            setCredits(currentAlter.credits || 0);

            // Sync Inventory
            const defaults = ['theme_default', 'frame_simple', 'bubble_default', 'border_none'];
            const alterOwned = currentAlter.owned_items || [];
            console.log('[MonetizationContext] refreshState - CurrentAlter:', currentAlter.id);
            console.log('[MonetizationContext] refreshState - Credits:', currentAlter.credits);
            const merged = [...new Set([...defaults, ...alterOwned])];
            setOwnedItems(merged);
        } else {
            console.log('[MonetizationContext] refreshState - No CurrentAlter');
            setCredits(0);
        }

        refreshAlters();
    }, [refreshAlters, currentAlter]);

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
        if (!currentAlter) return false;
        try {
            await CreditService.addCredits(currentAlter.id, amount, 'gift', reason);
            // State updates via subscription
            return true;
        } catch (error) {
            return false;
        }
    }, [currentAlter]);

    /**
     * Ajoute un item à l'inventaire de l'alter sans dépenser de crédits
     * Utilisé pour les récompenses de loot box
     */
    const addToInventory = useCallback(async (itemId: string): Promise<boolean> => {
        if (!currentAlter) {
            console.error('[MonetizationContext] Cannot add to inventory: no current alter');
            return false;
        }

        try {
            const alterRef = doc(db, 'alters', currentAlter.id);
            console.log('[MonetizationContext] Adding to inventory:', itemId, 'for alter:', currentAlter.id);

            // Use setDoc with merge to ensure the field is created if it doesn't exist
            await setDoc(alterRef, {
                owned_items: arrayUnion(itemId)
            }, { merge: true });

            // Update local state immediately
            setOwnedItems(prev => [...new Set([...prev, itemId])]);

            // Refresh alters to sync
            refreshAlters();
            return true;
        } catch (error) {
            console.error('[MonetizationContext] Failed to add item to inventory:', error);
            return false;
        }
    }, [currentAlter, refreshAlters]);

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
        // For cosmetic items (theme, frame, bubble), use DecorationService
        if (item.type === 'theme' || item.type === 'frame' || item.type === 'bubble' || item.type === 'decoration') {
            if (!alterId) {
                console.error("[MonetizationContext] purchaseItem: alterId required for cosmetic");
                return false;
            }
            const success = await DecorationService.purchaseDecoration(item.id, alterId);
            if (success) refreshState();
            return success;
        }

        if (!currentAlter) {
            console.error("Cannot purchase non-cosmetic item without active alter context");
            return false;
        }

        // For other items (ad_free, premium_days, etc.)
        // Note: CreditService.purchaseItem now expects (alterId, item, ...)
        const success = await CreditService.purchaseItem(currentAlter.id, item, true);
        if (success) refreshState();
        return success;
    }, [refreshState, currentAlter]);

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
                        if (!isNaN(amount) && currentAlter) {
                            await CreditService.addCredits(currentAlter.id, amount, 'purchase_iap', 'Achat IAP');
                        }
                    }
                }
                await refresh();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Purchase IAP error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    }, [refresh, currentAlter]);

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

        const success = await DecorationService.equipDecoration(alterId, decorationId, type);

        if (success) {
            // Update local state for immediate UI feedback
            setEquippedItems(prev => ({ ...prev, [type]: decorationId }));
            // Refresh alters to sync Firestore changes back to UI
            refreshAlters();
        }
        return success;
    }, [refreshAlters]);

    // Alias for ShopUI
    const equipItem = useCallback(async (itemId: string, type: any) => {
        if (!currentAlter) {
            console.warn("equipItem: No current alter selected");
            return false;
        }

        // Map Shop types to Decoration types
        let decoType: 'theme' | 'frame' | 'bubble' | undefined;
        if (type === 'theme') decoType = 'theme';
        if (type === 'frame') decoType = 'frame';
        if (type === 'bubble') decoType = 'bubble';

        if (decoType) {
            return equipDecoration(currentAlter.id, itemId, decoType);
        }

        return false;
    }, [currentAlter, equipDecoration]);

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

        checkDailyLogin: canClaimDaily, // Keeping compatible signature
        currentStreak,
        claimDailyLogin,

        shopItems: [...COSMETIC_ITEMS, ...CREDIT_ITEMS],
        ownedItems,
        equippedItems,
        creditPacks: CREDIT_PACKS,
        purchaseItem,
        equipItem,
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
        addToInventory,
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

