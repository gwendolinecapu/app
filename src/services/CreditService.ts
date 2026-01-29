/**
 * CreditService.ts
 * Gestion des crédits virtuels (gains, dépenses, historique)
 */


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
    onSnapshot,
    increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    CreditTransaction,
    CreditTransactionType,
    CREDIT_REWARDS,
    ShopItem,
 DailyReward } from './MonetizationTypes';
import PremiumService from './PremiumService';
import { AlterService } from './alters';
import { DailyRewardService } from './DailyRewardService';

const FIRESTORE_COLLECTION = 'user_monetization';
const TRANSACTIONS_SUBCOLLECTION = 'credit_transactions';

class CreditService {
    private static instance: CreditService;
    private userId: string | null = null;
    private currentAlterId: string | null = null;
    private unsubscribeBalance: (() => void) | null = null;

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
    /**
     * Initialise le service (User Context)
     */
    async initialize(userId: string): Promise<void> {
        this.userId = userId;
    }

    /**
     * Subscribe to a specific Alter's credit balance
     */
    subscribeToAlterBalance(alterId: string, onUpdate: (balance: number) => void): () => void {
        this.currentAlterId = alterId;

        // Unsubscribe previous if exists
        if (this.unsubscribeBalance) {
            this.unsubscribeBalance();
        }

        const docRef = doc(db, 'alters', alterId);
        this.unsubscribeBalance = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                onUpdate(data.credits || 0);
            } else {
                onUpdate(0);
            }
        }, (error) => {
            console.error('[CreditService] Balance sync error:', error);
        });

        return this.unsubscribeBalance;
    }

    // ==================== BALANCE ====================

    /**
     * Retourne le solde actuel (synchronous if subscribed, else 0)
     * Warning: prefer subscription or fetching fresh
     */
    getBalance(): number {
        // This is now legacy/unsafe as it depends on active subscription
        // MonetizationContext will hold the state
        return 0;
    }

    async getAlterBalance(alterId: string): Promise<number> {
        try {
            const snap = await getDoc(doc(db, 'alters', alterId));
            return snap.exists() ? (snap.data().credits || 0) : 0;
        } catch {
            return 0;
        }
    }

    /**
     * Vérifie si l'utilisateur a assez de crédits (Async)
     */
    async hasEnoughCredits(alterId: string, amount: number): Promise<boolean> {
        const bal = await this.getAlterBalance(alterId);
        return bal >= amount;
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
            if (!snap.exists()) return true;

            const data = snap.data();
            const lastClaim = data.last_daily_reward; // String YYYY-MM-DD

            // Convert string date (UTC) to timestamp for service check
            const lastClaimTimestamp = lastClaim ? new Date(lastClaim).getTime() : null;

            return DailyRewardService.canClaim(lastClaimTimestamp);
        } catch (e) {
            console.error('Error checking daily login:', e);
            return false;
        }
    }

    /**
     * Réclame le bonus de connexion quotidienne pour un alter
     */
    async claimDailyLogin(alterId: string): Promise<DailyReward> {
        if (!this.userId) throw new Error("User not initialized");

        const canClaim = await this.canClaimDailyLogin(alterId);
        if (!canClaim) {
            // Should not happen if UI checks. Return empty/dummy.
            return { day: 0, credits: 0, isPremium: false };
        }

        const today = new Date().toISOString().split('T')[0];
        const alterRef = doc(db, 'alters', alterId);
        const alterSnap = await getDoc(alterRef);
        const alterData = alterSnap.data() || {};

        const lastClaim = alterData.last_daily_reward; // Date string
        const currentStreak = alterData.daily_reward_streak || 0;

        // Use Service for Streak Logic
        // Convert YYYY-MM-DD string to timestamp for service? 
        // Service expects timestamp number.
        const lastClaimTimestamp = lastClaim ? new Date(lastClaim).getTime() : null;
        const newStreak = DailyRewardService.calculateStreak(lastClaimTimestamp, currentStreak);

        const isPremium = PremiumService.isPremium();

        // Calculate Reward
        const reward = DailyRewardService.getRewardConfig(newStreak, isPremium);

        // Add Credits
        await this.addCredits(
            alterId,
            reward.credits,
            isPremium ? 'daily_login_premium' : 'daily_login',
            `Connexion jour ${newStreak} (${alterData.name || 'Alter'})`
        );

        // Update Alter Data
        await updateDoc(alterRef, {
            last_daily_reward: today,
            daily_reward_streak: newStreak
        });

        // Return full reward object (including packTier if any)
        return reward;
    }

    /**
     * Ajoute des crédits pour une reward ad (Alter specific tracking?)
     * User said: "Daily rewards... tracking should be per Alter... allowing each to claim/watch independently"
     */
    async claimRewardAd(alterId: string): Promise<number> {
        const amount = CREDIT_REWARDS.REWARD_AD;

        const alterRef = doc(db, 'alters', alterId);
        await updateDoc(alterRef, {
            last_reward_ad: Date.now()
        });

        await this.addCredits(alterId, amount, 'reward_ad', 'Video publicitaire');
        return amount;
    }

    /**
     * Reclame une recompense de la roulette (montant variable)
     */
    async claimWheelReward(alterId: string, amount: number, rewardType: 'credits' | 'dust'): Promise<void> {
        const alterRef = doc(db, 'alters', alterId);
        await updateDoc(alterRef, {
            last_reward_ad: Date.now()
        });

        if (rewardType === 'dust') {
            await updateDoc(alterRef, { dust: increment(amount) });
            await this.recordTransaction(alterId, amount, 'reward_wheel', `Roulette: +${amount} Poussiere`);
        } else {
            await this.addCredits(alterId, amount, 'reward_wheel', `Roulette: +${amount} Credits`);
        }
    }

    /**
     * Ajoute des crédits (achat IAP)
     */
    /**
     * Ajoute des crédits (achat IAP)
     */
    async addPurchasedCredits(alterId: string, amount: number, productId: string): Promise<void> {
        await this.addCredits(alterId, amount, 'purchase_iap', `Achat: ${productId}`);
    }

    // ==================== DÉPENSES ====================

    /**
     * Deducts credits if balance is sufficient.
     */
    public async deductCredits(alterId: string, amount: number, type: CreditTransactionType, description?: string): Promise<boolean> {
        const currentBalance = await this.getAlterBalance(alterId);
        if (currentBalance < amount) return false;

        await this.spendCredits(alterId, amount, type, description);
        return true;
    }

    /**
     * Achète un item de la boutique
     * @param applyEffect If true, triggers business logic (granting rights). If false, just deducts money.
     */
    async purchaseItem(alterId: string, item: ShopItem, applyEffect: boolean = true): Promise<boolean> {
        if (!item.priceCredits) {
            if (applyEffect) {
                return this.applyItemEffect(item);
            }
            return true;
        }

        const currentBalance = await this.getAlterBalance(alterId);
        if (currentBalance < item.priceCredits) {
            console.warn('[CreditService] Not enough credits for:', item.id);
            return false;
        }

        // 1. DEDUCT CREDITS
        const deductSuccess = await this.spendCredits(
            alterId,
            item.priceCredits,
            this.getTransactionType(item.type),
            item.name,
            item.id
        );

        if (!deductSuccess) return false;

        // 2. APPLY EFFECT
        if (applyEffect) {
            try {
                const effectSuccess = await this.applyItemEffect(item);
                if (!effectSuccess) {
                    throw new Error("Failed to apply item effect");
                }
                return true;
            } catch (error) {
                console.error('[CreditService] Effect failed, refunding...', error);

                // 3. REFUND ON FAILURE
                await this.addCredits(
                    alterId,
                    item.priceCredits,
                    'refund',
                    `Remboursement (Erreur): ${item.name}`
                );
                return false;
            }
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
        alterId: string,
        amount: number,
        type: CreditTransactionType,
        description?: string
    ): Promise<void> {
        try {
            // Update Alter Doc
            const alterRef = doc(db, 'alters', alterId);
            await updateDoc(alterRef, { credits: increment(amount) });

            // Record Transaction
            await this.recordTransaction(alterId, amount, type, description);
        } catch (e) {
            console.error('[CreditService] Add credits failed', e);
        }
    }

    /**
     * ADMIN: Ajoute des crédits à n'importe quel utilisateur (via son alter principal)
     */
    async addCreditsToUser(targetUserId: string, amount: number, type: CreditTransactionType, description?: string): Promise<void> {
        try {
            await this.addCreditsForUser(targetUserId, amount, type, description);
        } catch (error) {
            console.error('[CreditService] Failed to add credits to user:', error);
            throw error;
        }
    }

    async addCreditsForUser(userId: string, amount: number, type: CreditTransactionType, description?: string): Promise<void> {
        const alterId = await AlterService.findPrimaryAlterId(userId);

        if (!alterId) {
            throw new Error(`[CreditService] No primary alter found for user ${userId}.`);
        }

        try {
            // Update Alter Doc
            const alterRef = doc(db, 'alters', alterId);
            await updateDoc(alterRef, { credits: increment(amount) });

            // Record Transaction
            await this.recordTransaction(alterId, amount, type, description);
        } catch (e) {
            console.error('[CreditService] Add credits for user failed', e);
            throw e;
        }
    }

    /**
     * Retire des crédits avec transaction
     */
    private async spendCredits(
        alterId: string,
        amount: number,
        type: CreditTransactionType,
        description?: string,
        itemId?: string
    ): Promise<boolean> {
        try {
            // Update Alter Doc
            const alterRef = doc(db, 'alters', alterId);
            await updateDoc(alterRef, { credits: increment(-amount) });

            // Record Transaction
            await this.recordTransaction(alterId, -amount, type, description, itemId);
            return true;
        } catch (e) {
            console.error('[CreditService] Spend credits failed', e);
            return false;
        }
    }

    /**
     * Enregistre une transaction
     */
    private async recordTransaction(
        alterId: string,
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
                description: description || '',
                ...(itemId ? { itemId } : {}),
                timestamp: Date.now(),
            };

            // Store in subcollection of the ALTER now, to keep it organized per alter?
            // User said "inventory is unique per alter", implied credits too.
            // Let's store transactions in `alters/{alterId}/credit_transactions`
            const transactionsRef = collection(
                db,
                'alters',
                alterId,
                TRANSACTIONS_SUBCOLLECTION
            );

            await addDoc(transactionsRef, transaction);

        } catch (error) {
            console.error('[CreditService] Failed to record transaction:', error);
        }
    }

    /**
     * Récupère l'historique des transactions pour un alter
     */
    async getTransactionHistory(alterId: string, count: number = 20): Promise<CreditTransaction[]> {
        if (!this.userId) return [];

        try {
            const transactionsRef = collection(
                db,
                'alters',
                alterId,
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
        // Deprecated: No more local caching of unified balance since we use live listener
        // But we could cache per alter balance? For now, remove to avoid errors.

        // Firestore
        // Deprecated: No more unified user balance storage
        if (!this.userId) return;
        // Logic moved to addCredits/spendCredits direct updates
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
     * Retourne le streak actuel (Stub - requires alter context)
     */
    getCurrentStreak(alterId?: string): number {
        // Since this is sync and we don't hold alter state here (MonetizationContext does),
        // we can't return accurate streak synchronously without subscription.
        // Returning 0 for safety. UI should rely on MonetizationContext.currentStreak
        return 0;
    }

    /**
     * Retourne les jours jusqu'au prochain bonus streak
     */
    getDaysToNextStreakBonus(currentStreak: number = 0): number {
        if (currentStreak < 7) return 7 - currentStreak;
        if (currentStreak < 30) return 30 - currentStreak;
        return 30 - (currentStreak % 30);
    }
}

export default CreditService.getInstance();
