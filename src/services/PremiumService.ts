/**
 * PremiumService.ts
 * Gestion du statut premium, trial et périodes sans pub
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    UserTier,
    MonetizationStatus,
    DEFAULT_MONETIZATION_STATUS,
    AD_CONFIG,
} from './MonetizationTypes';

const STORAGE_KEY = '@premium_status';
const FIRESTORE_COLLECTION = 'user_monetization';

class PremiumService {
    private static instance: PremiumService;
    private status: MonetizationStatus = { ...DEFAULT_MONETIZATION_STATUS };
    private userId: string | null = null;
    private initialized: boolean = false;

    private constructor() { }

    static getInstance(): PremiumService {
        if (!PremiumService.instance) {
            PremiumService.instance = new PremiumService();
        }
        return PremiumService.instance;
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initialise le service pour un utilisateur
     */
    async initialize(userId: string): Promise<void> {
        this.userId = userId;

        try {
            // Verify auth matches or proceed with caution
            if (!userId) return;

            // Charger depuis Firestore
            const docRef = doc(db, FIRESTORE_COLLECTION, userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.status = { ...DEFAULT_MONETIZATION_STATUS, ...docSnap.data() } as MonetizationStatus;

                // Silent Trial initialization for existing users if missing (and free/no sub)
                if (!this.status.silentTrialStartDate && this.status.tier === 'free' && !this.status.premiumEndDate) {
                    this.status.silentTrialStartDate = Date.now();
                }
            } else {
                // Nouvel utilisateur - démarrer le trial silencieux + trial explicite si besoin
                // Note: 'startTrial' used to start "Visual Trial". Now we prefer "Silent Trial" ?
                // User asked for "14 days free immediately (silent)".
                // Let's keep startTrial behavior for legacy or rename it?
                // The prompt says "Silent trial 14 days".

                this.status = {
                    ...DEFAULT_MONETIZATION_STATUS,
                    silentTrialStartDate: Date.now(),
                };

                // We do NOT call startTrial() anymore which set 'trial' tier visible to user.
                // Silent trial implies user thinks they are free (or premium?), prompt says "from 14 days he enjoyed".
                // Usually silent trial means they HAVE features but don't know it's limited?
                // Or simply "Free tier" HAS features for 14 days?
                // "No credit card required".
                // Let's assume user GETS premium features logic checks "isPremium" -> returns true if silent trial.
            }

            // Mettre à jour le tier basé sur les dates
            this.updateTierFromDates();

            // Cache local
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.status));

            this.initialized = true;

        } catch (error) {
            console.error('[PremiumService] Initialization failed:', error);

            // Fallback sur le cache local
            const cached = await AsyncStorage.getItem(STORAGE_KEY);
            if (cached) {
                this.status = JSON.parse(cached);
            }
        }
    }

    // ==================== TRIAL ====================

    /**
     * Démarre le trial de 14 jours (appelé automatiquement à l'inscription)
     */
    async startTrial(): Promise<void> {
        const trialEndDate = Date.now() + (AD_CONFIG.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

        this.status = {
            ...DEFAULT_MONETIZATION_STATUS,
            tier: 'trial',
            trialEndDate,
        };

        await this.saveStatus();
    }

    /**
     * Retourne le nombre de jours restants du trial
     */
    getTrialDaysRemaining(): number {
        if (!this.status.trialEndDate) return 0;

        const remaining = this.status.trialEndDate - Date.now();
        return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
    }

    /**
     * Vérifie si le trial est toujours actif
     */
    isTrialActive(): boolean {
        if (!this.status.trialEndDate) return false;
        return Date.now() < this.status.trialEndDate;
    }

    // ==================== PREMIUM ====================

    /**
     * Retourne le tier actuel de l'utilisateur
     */
    getCurrentTier(): UserTier {
        this.updateTierFromDates();
        return this.status.tier;
    }

    /**
     * Vérifie si l'utilisateur est premium (inclut trial)
     */
    isPremium(): boolean {
        // 1. Check valid paid/granted premium
        if (this.status.premiumEndDate && this.status.premiumEndDate > Date.now()) {
            return true;
        }

        // 2. Check Silent Trial (Active for 14 days)
        if (this.isSilentTrialActive()) {
            return true; // Grants premium access quietly
        }

        const tier = this.getCurrentTier();
        return tier === 'premium' || tier === 'trial';
    }

    /**
     * Vérifie si le Silent Trial est en cours
     */
    isSilentTrialActive(): boolean {
        if (!this.status.silentTrialStartDate) return false;
        const now = Date.now();
        const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
        return (now - this.status.silentTrialStartDate) < fourteenDaysMs;
    }

    /**
     * Vérifie si on doit montrer la popup de conversion (Après 14j)
     */
    shouldShowConversionModal(): boolean {
        // Only if NOT currently premium (paid)
        if (this.status.premiumEndDate && this.status.premiumEndDate > Date.now()) return false;

        // And Silent Trial JUST finished (we don't want to show it forever every time?)
        // Or show it if they are using the app and trial expired?
        // User request: "popup comme quoi depuis 14j il profitais que si il veut il continue"

        if (!this.status.silentTrialStartDate) return false;
        if (this.status.hasSeenConversionModal) return false;

        // If 14 days passed
        const now = Date.now();
        const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
        const isExpired = (now - this.status.silentTrialStartDate) >= fourteenDaysMs;

        return isExpired;
    }

    /**
     * Marque la popup de conversion comme vue
     */
    async markConversionModalSeen(): Promise<void> {
        this.status.hasSeenConversionModal = true;
        await this.saveStatus();
    }

    /**
     * Vérifie si l'utilisateur peut utiliser les 30 jours offerts
     */
    canUseFreeMont(): boolean {
        return !this.status.hasUsedFreeMonth && !this.isTrialActive();
    }

    /**
     * Active les 30 jours offerts (une seule fois après le trial)
     */
    async activateFreeMonth(): Promise<boolean> {
        if (!this.canUseFreeMont()) {
            return false;
        }

        const currentEnd = this.status.premiumEndDate || Date.now();
        const newEnd = Math.max(currentEnd, Date.now()) + (AD_CONFIG.FREE_MONTH_DAYS * 24 * 60 * 60 * 1000);

        this.status.premiumEndDate = newEnd;
        this.status.hasUsedFreeMonth = true;
        this.status.tier = 'premium'; // Update tier immediately

        await this.saveStatus();

        return true;
    }

    /**
     * Accorde X jours de premium (via reward ads ou achat crédits)
     */
    async grantPremiumDays(days: number): Promise<void> {
        const currentEnd = this.status.premiumEndDate || Date.now();
        const newEnd = Math.max(currentEnd, Date.now()) + (days * 24 * 60 * 60 * 1000);

        this.status.premiumEndDate = newEnd;
        this.updateTierFromDates();

        await this.saveStatus();
    }

    /**
     * Jours de premium restants
     */
    getPremiumDaysRemaining(): number {
        if (!this.status.premiumEndDate) return 0;

        const remaining = this.status.premiumEndDate - Date.now();
        return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
    }

    // ==================== AD-FREE ====================

    /**
     * Vérifie si l'utilisateur est sans pub
     */
    isAdFree(): boolean {
        // Premium = toujours sans pub
        if (this.isPremium()) return true;

        // Période sans pub active
        if (this.status.adFreeUntil && Date.now() < this.status.adFreeUntil) {
            return true;
        }

        return false;
    }

    /**
     * Accorde X jours sans pub (via reward ads ou achat crédits)
     */
    async grantAdFreeDays(days: number): Promise<void> {
        const currentEnd = this.status.adFreeUntil || Date.now();
        const newEnd = Math.max(currentEnd, Date.now()) + (days * 24 * 60 * 60 * 1000);

        this.status.adFreeUntil = newEnd;

        await this.saveStatus();

    }

    /**
     * Jours sans pub restants
     */
    getAdFreeDaysRemaining(): number {
        if (this.isPremium()) return 999; // Illimité

        if (!this.status.adFreeUntil) return 0;

        const remaining = this.status.adFreeUntil - Date.now();
        return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
    }

    // ==================== REWARD ADS PROGRESS ====================

    /**
     * Progression vers les 7 jours sans pub (3 vidéos)
     */
    getAdFreeProgress(): { current: number; needed: number } {
        return {
            current: this.status.rewardAdsForAdFree,
            needed: AD_CONFIG.REWARD_ADS_FOR_AD_FREE,
        };
    }

    /**
     * Progression vers les 7 jours premium (15 vidéos)
     */
    getPremiumProgress(): { current: number; needed: number } {
        return {
            current: this.status.rewardAdsForPremium,
            needed: AD_CONFIG.REWARD_ADS_FOR_PREMIUM,
        };
    }

    /**
     * Enregistre un visionnage de reward ad et vérifie les seuils
     */
    async recordRewardAdWatch(): Promise<{ adFreeUnlocked: boolean; premiumUnlocked: boolean }> {
        this.status.rewardAdsForAdFree++;
        this.status.rewardAdsForPremium++;
        this.status.rewardAdsToday++;

        let adFreeUnlocked = false;
        let premiumUnlocked = false;

        // Vérifier seuil sans pub (3 vidéos = 7 jours)
        if (this.status.rewardAdsForAdFree >= AD_CONFIG.REWARD_ADS_FOR_AD_FREE) {
            await this.grantAdFreeDays(7);
            this.status.rewardAdsForAdFree = 0;
            adFreeUnlocked = true;
        }

        // Vérifier seuil premium (15 vidéos = 7 jours)
        if (this.status.rewardAdsForPremium >= AD_CONFIG.REWARD_ADS_FOR_PREMIUM) {
            await this.grantPremiumDays(7);
            this.status.rewardAdsForPremium = 0;
            premiumUnlocked = true;
        }

        await this.saveStatus();
        return { adFreeUnlocked, premiumUnlocked };
    }

    // ==================== HELPERS ====================

    /**
     * Met à jour le tier basé sur les dates d'expiration
     */
    private updateTierFromDates(): void {
        const now = Date.now();

        // Vérifier premium payant
        if (this.status.premiumEndDate && now < this.status.premiumEndDate) {
            this.status.tier = 'premium';
            return;
        }

        // Vérifier trial
        if (this.status.trialEndDate && now < this.status.trialEndDate) {
            this.status.tier = 'trial';
            return;
        }

        // Sinon free
        this.status.tier = 'free';
    }

    /**
     * Sauvegarde le statut dans Firestore et le cache
     */
    private async saveStatus(): Promise<void> {
        try {
            // Cache local
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.status));

            // Firestore
            if (this.userId) {
                const docRef = doc(db, FIRESTORE_COLLECTION, this.userId);
                await setDoc(docRef, this.status, { merge: true });
            }
        } catch (error) {
            console.error('[PremiumService] Failed to save status:', error);
        }
    }

    /**
     * Retourne le statut complet
     */
    getStatus(): MonetizationStatus {
        return { ...this.status };
    }

    /**
     * Force la mise à jour du statut (pour sync)
     */
    async refreshStatus(): Promise<void> {
        if (this.userId) {
            await this.initialize(this.userId);
        }
    }
}

export default PremiumService.getInstance();
