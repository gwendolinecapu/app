/**
 * CreditService.ts
 * Gestion des crédits virtuels (gains, dépenses, historique)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    doc,
    getDoc,
    updateDoc,
    setDoc,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    CreditTransaction,
    CreditTransactionType,
    CREDIT_REWARDS,
    CREDIT_ITEMS,
    ShopItem,
} from './MonetizationTypes';
import PremiumService from './PremiumService';

const STORAGE_KEY = '@credit_balance';
const FIRESTORE_COLLECTION = 'user_monetization';
const TRANSACTIONS_SUBCOLLECTION = 'credit_transactions';

class CreditService {
    private static instance: CreditService;
    private balance: number = 0;
    private userId: string | null = null;
    private lastDailyClaimDate: string | null = null;
    private currentStreak: number = 0;
    private initialized: boolean = false;

    private constructor() { }

    static getInstance(): CreditService {
        if (!CreditService.instance) {
            CreditService.instance = new CreditService();
        }
        return CreditService.instance;
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initialise le service pour un utilisateur
     */
    async initialize(userId: string): Promise<void> {
        if (!userId) {
            console.warn('[CreditService] No userId provided, skipping initialization');
            return;
        }

        this.userId = userId;

        try {
            const docRef = doc(db, FIRESTORE_COLLECTION, userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                this.balance = data.credits || 0;
                this.lastDailyClaimDate = data.lastDailyLogin
                    ? new Date(data.lastDailyLogin).toISOString().split('T')[0]
                    : null;
                this.currentStreak = data.loginStreak || 0;
            }

            // Cache local
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                balance: this.balance,
                lastDailyClaimDate: this.lastDailyClaimDate,
                currentStreak: this.currentStreak,
            }));

            this.initialized = true;

        } catch (error) {
            console.error('[CreditService] Initialization failed:', error);

            // Fallback cache local
            const cached = await AsyncStorage.getItem(STORAGE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                this.balance = data.balance || 0;
                this.lastDailyClaimDate = data.lastDailyClaimDate;
                this.currentStreak = data.currentStreak || 0;
            }
        }
    }

    // ==================== BALANCE ====================

    /**
     * Retourne le solde actuel
     */
    getBalance(): number {
        // TODO: Remove this for production - TEST MODE
        return 10000;
        // return this.balance;
    }

    /**
     * Vérifie si l'utilisateur a assez de crédits
     */
    hasEnoughCredits(amount: number): boolean {
        // TODO: Remove this for production - TEST MODE
        return true;
        // return this.balance >= amount;
    }

    // ==================== GAINS ====================

    // ==================== GAINS ====================

    /**
     * Vérifie si le bonus quotidien est disponible pour un alter
     */
    async canClaimDailyLogin(alterId: string): Promise<boolean> {
        try {
            const alterRef = doc(db, 'alters', alterId);
            const snap = await getDoc(alterRef);
            if (!snap.exists()) return true; // New alter can claim? Or verify system policy. Assuming yes.

            const data = snap.data();
            const lastClaim = data.last_daily_reward;
            if (!lastClaim) return true;

            const today = new Date().toISOString().split('T')[0];
            return lastClaim !== today;
        } catch (e) {
            console.error('Error checking daily login:', e);
            return false;
        }
    }

    /**
     * Réclame le bonus de connexion quotidienne pour un alter
     */
    async claimDailyLogin(alterId: string): Promise<{ amount: number; streak: number; streakBonus: number }> {
        if (!this.userId) throw new Error("User not initialized");

        const canClaim = await this.canClaimDailyLogin(alterId);
        if (!canClaim) {
            // Retrieve current streak from alter to return it? 
            // For now return 0s
            return { amount: 0, streak: 0, streakBonus: 0 };
        }

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const alterRef = doc(db, 'alters', alterId);
        const alterSnap = await getDoc(alterRef);
        const alterData = alterSnap.data() || {};

        const lastClaim = alterData.last_daily_reward;
        let currentStreak = alterData.daily_reward_streak || 0;

        // Calculer le streak
        if (lastClaim === yesterday) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }

        // Bonus quotidien (premium system-wide influence)
        const isPremium = PremiumService.isPremium();
        const dailyAmount = isPremium
            ? CREDIT_REWARDS.DAILY_LOGIN_PREMIUM
            : CREDIT_REWARDS.DAILY_LOGIN_FREE;

        // Bonus streak
        let streakBonus = 0;
        if (currentStreak === 7) {
            streakBonus = CREDIT_REWARDS.STREAK_7_DAYS;
        } else if (currentStreak === 30) {
            streakBonus = CREDIT_REWARDS.STREAK_30_DAYS;
        }

        const totalAmount = dailyAmount + streakBonus;

        // Ajouter les crédits (Wallet Système)
        await this.addCredits(
            totalAmount,
            isPremium ? 'daily_login_premium' : 'daily_login',
            `Connexion jour ${currentStreak} (${alterData.name || 'Alter'})`
        );

        // Mettre à jour l'alter
        await updateDoc(alterRef, {
            last_daily_reward: today,
            daily_reward_streak: currentStreak
        });

        // We don't update System lastDailyClaimDate anymore, as it is per-alter.

        return {
            amount: dailyAmount,
            streak: currentStreak,
            streakBonus,
        };
    }

    /**
     * Ajoute des crédits pour une reward ad (Alter specific tracking?)
     * User said: "Daily rewards... tracking should be per Alter... allowing each to claim/watch independently"
     */
    async claimRewardAd(alterId: string): Promise<number> {
        // We could track "last_reward_ad" on alter to implement cooldowns if needed.
        // For now, just grant the credits.
        const amount = CREDIT_REWARDS.REWARD_AD;

        const alterRef = doc(db, 'alters', alterId);
        await updateDoc(alterRef, {
            last_reward_ad: Date.now()
        });

        await this.addCredits(amount, 'reward_ad', 'Vidéo publicitaire');
        return amount;
    }

    /**
     * Ajoute des crédits (achat IAP)
     */
    async addPurchasedCredits(amount: number, productId: string): Promise<void> {
        await this.addCredits(amount, 'purchase_iap', `Achat: ${productId}`);
    }

    // ==================== DÉPENSES ====================

    /**
     * Achète un item de la boutique
     * @param applyEffect If true, triggers business logic (granting rights). If false, just deducts money.
     */
    async purchaseItem(item: ShopItem, applyEffect: boolean = true): Promise<boolean> {
        if (!item.priceCredits) {
            // Free items should be handled by caller usually, but if 0 cost passed here:
            if (applyEffect) {
                return this.applyItemEffect(item);
            }
            return true;
        }

        if (!this.hasEnoughCredits(item.priceCredits)) {
            console.warn('[CreditService] Not enough credits for:', item.id);
            return false;
        }

        // Retirer les crédits
        await this.spendCredits(
            item.priceCredits,
            this.getTransactionType(item.type),
            item.name,
            item.id
        );

        if (applyEffect) {
            return this.applyItemEffect(item);
        }

        return true;
    }

    private async applyItemEffect(item: ShopItem): Promise<boolean> {
        switch (item.type) {
            case 'ad_free':
                await PremiumService.grantAdFreeDays(item.duration || 1);
                break;
            case 'premium_days':
                await PremiumService.grantPremiumDays(item.duration || 1);
                break;
            case 'decoration':
                // If called with applyEffect=true, it means we want to grant it.
                // But decoration granting requires an Alter ID!
                // Shop usually supplies the context.
                // If this is called without alter context, we can't grant to an alter.
                console.warn("Cannot grant decoration without Alter context. Use DeviceService.purchaseDecoration instead.");
                return false;
        }
        return true;
    }

    private getTransactionType(itemType: string): CreditTransactionType {
        switch (itemType) {
            case 'decoration': return 'spend_decoration';
            case 'ad_free': return 'spend_ad_free';
            case 'premium_days': return 'spend_premium';
            default: return 'spend_decoration';
        }
    }

    // ==================== TRANSACTIONS ====================

    /**
     * Ajoute des crédits avec transaction
     */
    public async addCredits(
        amount: number,
        type: CreditTransactionType,
        description?: string
    ): Promise<void> {
        this.balance += amount;
        await this.recordTransaction(amount, type, description);
        await this.saveBalance();
    }

    /**
     * ADMIN: Ajoute des crédits à n'importe quel utilisateur
     */
    async addCreditsToUser(targetUserId: string, amount: number, type: CreditTransactionType, description?: string): Promise<void> {
        try {
            // Transaction Firestore
            const transaction: Omit<CreditTransaction, 'id'> = {
                userId: targetUserId,
                amount,
                type,
                description,
                timestamp: Date.now(),
            };

            const transactionsRef = collection(db, FIRESTORE_COLLECTION, targetUserId, TRANSACTIONS_SUBCOLLECTION);
            await addDoc(transactionsRef, transaction);

            // Update User Balance
            const userRef = doc(db, FIRESTORE_COLLECTION, targetUserId);
            // Use increment for safety
            await setDoc(userRef, { credits: increment(amount) }, { merge: true });


        } catch (error) {
            console.error('[CreditService] Failed to add credits to user:', error);
            throw error;
        }
    }

    /**
     * Retire des crédits avec transaction
     */
    private async spendCredits(
        amount: number,
        type: CreditTransactionType,
        description?: string,
        itemId?: string
    ): Promise<void> {
        this.balance -= amount;
        await this.recordTransaction(-amount, type, description, itemId);
        await this.saveBalance();
    }

    /**
     * Enregistre une transaction
     */
    private async recordTransaction(
        amount: number,
        type: CreditTransactionType,
        description?: string,
        itemId?: string
    ): Promise<void> {
        if (!this.userId) return;

        try {
            const transaction: Omit<CreditTransaction, 'id'> = {
                userId: this.userId,
                amount,
                type,
                description,
                ...(itemId ? { itemId } : {}),
                timestamp: Date.now(),
            };

            const transactionsRef = collection(
                db,
                FIRESTORE_COLLECTION,
                this.userId,
                TRANSACTIONS_SUBCOLLECTION
            );

            await addDoc(transactionsRef, transaction);

        } catch (error) {
            console.error('[CreditService] Failed to record transaction:', error);
        }
    }

    /**
     * Récupère l'historique des transactions
     */
    async getTransactionHistory(count: number = 20): Promise<CreditTransaction[]> {
        if (!this.userId) return [];

        try {
            const transactionsRef = collection(
                db,
                FIRESTORE_COLLECTION,
                this.userId,
                TRANSACTIONS_SUBCOLLECTION
            );

            const q = query(
                transactionsRef,
                orderBy('timestamp', 'desc'),
                limit(count)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as CreditTransaction));

        } catch (error) {
            console.error('[CreditService] Failed to get history:', error);
            return [];
        }
    }

    // ==================== PERSISTENCE ====================

    private async saveBalance(): Promise<void> {
        // Cache local
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            balance: this.balance,
            lastDailyClaimDate: this.lastDailyClaimDate,
            currentStreak: this.currentStreak,
        }));

        // Firestore
        await this.saveToFirestore({ credits: this.balance });
    }

    private async saveToFirestore(data: Record<string, any>): Promise<void> {
        if (!this.userId) return;

        try {
            const docRef = doc(db, FIRESTORE_COLLECTION, this.userId);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error('[CreditService] Failed to save to Firestore:', error);
        }
    }

    // ==================== STREAK ====================

    /**
     * Retourne le streak actuel
     */
    getCurrentStreak(): number {
        return this.currentStreak;
    }

    /**
     * Retourne les jours jusqu'au prochain bonus streak
     */
    getDaysToNextStreakBonus(): number {
        if (this.currentStreak < 7) return 7 - this.currentStreak;
        if (this.currentStreak < 30) return 30 - this.currentStreak;
        return 30 - (this.currentStreak % 30); // Cycle tous les 30 jours après
    }
}

export default CreditService.getInstance();
