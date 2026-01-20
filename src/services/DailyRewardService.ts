import { DailyReward, LootBoxTier } from './MonetizationTypes';

export const DailyRewardService = {
    /**
     * Calcule la récompense pour un jour donné de la série
     */
    getRewardConfig(day: number, isPremium: boolean): DailyReward {
        // --- 1. Calcul des Crédits ---
        // Base : 10 crédits
        // Augmentation : +5 crédits tous les 7 jours de série (max +50)
        // Bonus : Gros bonus aux paliers 30, 60...

        let baseCredits = 10;

        // Progression linéaire douce (reward fidelity)
        // Bonus +2 tous les 10 jours
        baseCredits += Math.floor((day - 1) / 10) * 2;

        // Bonus hebdomadaire (Day 7, 14, ...)
        if (day % 7 === 0) {
            baseCredits += 25;
        }

        // Bonus Mensuel (Day 30, 60...)
        if (day % 30 === 0) {
            baseCredits += 100;
        }

        // Premium Multiplier : x2 sur les crédits
        let credits = isPremium ? baseCredits * 2 : baseCredits;

        // --- 2. Packs & Items ---
        let packTier: LootBoxTier | undefined;

        // Paliers de Packs
        if (day % 30 === 0) {
            // Mensuel : Super Pack
            packTier = isPremium ? 'elite' : 'standard';
        }
        else if (day % 7 === 0) {
            // Hebdo : Pack Standard/Basic
            packTier = isPremium ? 'standard' : 'basic';
        }

        // Catch-up 180 days (Demi-année)
        if (day === 180) {
            credits += 500; // Bonus massif
            packTier = 'elite';
        }

        return {
            day,
            credits,
            packTier,
            isPremium
        };
    },

    /**
     * Vérifie si l'utilisateur peut réclamer sa récompense aujourd'hui
     */
    canClaim(lastClaimDate: number | null): boolean {
        if (!lastClaimDate) return true;

        const last = new Date(lastClaimDate);
        const now = new Date();

        return (
            last.getUTCDate() !== now.getUTCDate() ||
            last.getUTCMonth() !== now.getUTCMonth() ||
            last.getUTCFullYear() !== now.getUTCFullYear()
        );
    },

    /**
     * Calcule la nouvelle série en fonction de la dernière date de claim
     * Si c'était hier (UTC) -> +1
     * Si c'était avant-hier (UTC) -> Reset à 1
     * Si c'est aujourd'hui (UTC) -> Reste pareil (ne devrait pas être appelé si canClaim est false)
     */
    calculateStreak(lastClaimDate: number | null, currentStreak: number): number {
        if (!lastClaimDate) return 1;

        const last = new Date(lastClaimDate);
        const now = new Date();

        // Comparaison basée sur les jours UTC pour matcher toISOString() stocké en DB
        const lastDayStr = last.toISOString().split('T')[0];
        const todayStr = now.toISOString().split('T')[0];

        // Convert back to timestamps for day diff
        const lastDayTs = new Date(lastDayStr).getTime();
        const todayTs = new Date(todayStr).getTime();

        const diffTime = Math.abs(todayTs - lastDayTs);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // C'était hier
            return currentStreak + 1;
        } else if (diffDays === 0) {
            // C'est aujourd'hui
            return currentStreak;
        } else {
            // Coupure de série
            return 1;
        }
    },

    /**
     * Génère une liste de récompenses futures pour l'affichage (Preview)
     */
    getUpcomingRewards(currentStreak: number, isPremium: boolean, count: number = 5): DailyReward[] {
        const rewards: DailyReward[] = [];
        // On commence au jour actuel (si pas encore claim) ou jour + 1 ?
        // On affiche les 5 prochains jours
        for (let i = 0; i < count; i++) {
            rewards.push(this.getRewardConfig(currentStreak + i, isPremium));
        }
        return rewards;
    }
};
