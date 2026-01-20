/**
 * LootBoxService.ts
 * 
 * Système de Loot Box 2.0 (Type TCG / Booster Packs)
 * 
 * Features:
 * - 3 Tiers de packs (Basic, Standard, Elite)
 * - Quantité de cartes variable (RNG)
 * - Garanties de rareté
 * - Système de Dust pour les doublons
 */

import {
    ShopItem,
    Rarity,
    COSMETIC_ITEMS,
    LootBoxTier,
    PACK_TIERS,
    DUST_CONVERSION_RATES
} from './MonetizationTypes';

/** Résultat d'une carte tirée */
export interface CardResult {
    item: ShopItem;
    isNew: boolean;
    dustValue?: number; // Si doublon, valeur en dust
    isGuaranteed?: boolean; // Si obtenue via garantie
}

/** Résultat de l'ouverture d'un pack */
export interface PackResult {
    tier: LootBoxTier;
    cards: CardResult[];
    totalDust: number;
}

/** Items groupés par rareté (Cached) */
const ITEMS_BY_RARITY: Record<Rarity, ShopItem[]> = {
    common: COSMETIC_ITEMS.filter(item => (item.rarity || 'common') === 'common'),
    rare: COSMETIC_ITEMS.filter(item => item.rarity === 'rare'),
    epic: COSMETIC_ITEMS.filter(item => item.rarity === 'epic'),
    legendary: COSMETIC_ITEMS.filter(item => item.rarity === 'legendary'),
    mythic: COSMETIC_ITEMS.filter(item => item.rarity === 'mythic'),
};

export const LootBoxService = {
    /**
     * Ouvre un Booster Pack
     */
    openPack(tier: LootBoxTier, ownedItemIds: string[] = []): PackResult {
        const config = PACK_TIERS[tier];

        // 1. Déterminer le nombre de cartes (Weighted RNG)
        const cardCount = this.rollCardCount(config.cardCount.probabilities);

        // 2. Générer les raretés initiales
        let rarities: Rarity[] = [];
        for (let i = 0; i < cardCount; i++) {
            rarities.push(this.rollRarity(config.dropRates));
        }

        // 3. Appliquer les garanties de rareté
        if (config.rarityGuarantees.minRarity) {
            rarities = this.applyGuarantees(
                rarities,
                config.rarityGuarantees.minRarity,
                config.rarityGuarantees.count || 1
            );
        }

        // 4. Sélectionner les items spécifiques
        const results: CardResult[] = [];
        const currentSessionIds = new Set<string>(); // Pour éviter doublons dans le MEME pack

        let totalDust = 0;

        for (const rarity of rarities) {
            const pool = ITEMS_BY_RARITY[rarity];

            // Fallback si pool vide (ex: pas encore de Mythic) -> Common
            const actualPool = (pool && pool.length > 0) ? pool : ITEMS_BY_RARITY['common'];

            // Sélection item aléatoire
            const item = actualPool[Math.floor(Math.random() * actualPool.length)];

            // Check doublon (Possédé AVANT ou tiré DANS CE PACK)
            const isDuplicate = ownedItemIds.includes(item.id) || currentSessionIds.has(item.id);

            let dustValue = 0;
            if (isDuplicate) {
                dustValue = DUST_CONVERSION_RATES[item.rarity || 'common'];
                totalDust += dustValue;
            }

            currentSessionIds.add(item.id);

            results.push({
                item,
                isNew: !isDuplicate,
                dustValue: isDuplicate ? dustValue : undefined
            });
        }

        // Trier par rareté pour le reveal (Communs d'abord, Légendaires à la fin)
        const rarityOrder: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        results.sort((a, b) => rarityOrder[a.item.rarity || 'common'] - rarityOrder[b.item.rarity || 'common']);

        return {
            tier,
            cards: results,
            totalDust
        };
    },

    /**
     * Détermine le nombre de cartes selon les probabilités
     */
    rollCardCount(probabilities: { [count: number]: number }): number {
        const rand = Math.random();
        let cumulative = 0;

        for (const [countStr, probability] of Object.entries(probabilities)) {
            cumulative += probability;
            if (rand < cumulative) {
                return parseInt(countStr);
            }
        }

        // Fallback (devrait pas arriver si probas s'additionnent à 1)
        return parseInt(Object.keys(probabilities)[0]);
    },

    /**
     * Détermine une rareté selon les taux de drop
     */
    rollRarity(rates: { [key in Rarity]: number }): Rarity {
        const rand = Math.random();
        let cumulative = 0;

        const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

        for (const rarity of rarities) {
            const val = rates[rarity] || 0;
            cumulative += val;
            if (rand < cumulative) {
                return rarity;
            }
        }

        return 'common';
    },

    /**
     * Assure qu'au moins N cartes sont de rareté X ou supérieure
     */
    applyGuarantees(currentRarities: Rarity[], minRarity: Rarity, count: number): Rarity[] {
        const rarityValue: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        const minVal = rarityValue[minRarity];

        let qualifiedCount = currentRarities.filter(r => rarityValue[r] >= minVal).length;

        if (qualifiedCount >= count) return currentRarities;

        // Upgrade nécessaire
        const sortedIndices = currentRarities
            .map((r, i) => ({ r, i, val: rarityValue[r] }))
            .sort((a, b) => a.val - b.val); // Trier du plus faible au plus fort

        const newRarities = [...currentRarities];

        // Upgrade les N pires cartes
        for (let k = 0; k < (count - qualifiedCount); k++) {
            const targetIndex = sortedIndices[k].i;
            newRarities[targetIndex] = minRarity;
        }

        return newRarities;
    },

    /**
     * Couleur associée à une rareté
     */
    getRarityColor(rarity?: Rarity): string {
        switch (rarity) {
            case 'common': return '#9CA3AF'; // Gray 400
            case 'rare': return '#3B82F6';   // Blue 500
            case 'epic': return '#A855F7';   // Purple 500
            case 'legendary': return '#EAB308'; // Yellow 500
            case 'mythic': return '#EC4899'; // Pink 500
            default: return '#9CA3AF';
        }
    },

    getRarityLabel(rarity?: Rarity): string {
        switch (rarity) {
            case 'common': return 'Commun';
            case 'rare': return 'Rare';
            case 'epic': return 'Épique';
            case 'legendary': return 'Légendaire';
            case 'mythic': return 'Mythique';
            default: return 'Commun';
        }
    },

    /**
     * Retourne 3 items aléatoires basés sur la date du jour
     * (Legacy mais utilisé pour la boutique quotidienne)
     */
    getDailyItems(): ShopItem[] {
        const dateStr = new Date().toISOString().split('T')[0];
        const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const prng = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        const dailyItems: ShopItem[] = [];
        const pool = [...COSMETIC_ITEMS];

        for (let i = 0; i < 3; i++) {
            if (pool.length === 0) break;
            const index = Math.floor(prng(i) * pool.length);
            dailyItems.push(pool[index]);
            pool.splice(index, 1);
        }

        return dailyItems;
    }
};

export default LootBoxService;
