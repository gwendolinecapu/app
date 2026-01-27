/**
 * LootBoxService.ts
 *
 * Système de Loot Box 3.0 (Type TCG / Booster Packs)
 *
 * Features:
 * - 3 Tiers de packs (Basic, Standard, Elite)
 * - Slots par catégorie (Thème/Cadre/Bulle)
 * - Pity System (Epic garanti /20, Legendary garanti /60)
 * - Soft Pity (chance augmente après 45 cartes)
 * - Système de Dust pour les doublons
 * - Bonus Elite (+10% dust, chance shiny)
 */
import * as Crypto from 'expo-crypto';

import {
    ShopItem,
    Rarity,
    COSMETIC_ITEMS,
    LootBoxTier,
    PACK_TIERS,
    DUST_CONVERSION_RATES,
    PityProgress,
    PITY_CONFIG,
    DEFAULT_PITY_PROGRESS,
    SlotCategory,
    PackSlot,
} from './MonetizationTypes';

/** Résultat d'une carte tirée */
export interface CardResult {
    item: ShopItem;
    isNew: boolean;
    dustValue?: number;      // Si doublon, valeur en dust
    isGuaranteed?: boolean;  // Si obtenue via garantie pity
    isPityEpic?: boolean;    // Obtenue via pity Epic
    isPityLegendary?: boolean; // Obtenue via pity Legendary
    isShiny?: boolean;       // Version animée bonus (Elite)
    slotCategory?: SlotCategory; // Catégorie du slot
}

/** Résultat de l'ouverture d'un pack */
export interface PackResult {
    tier: LootBoxTier;
    cards: CardResult[];
    totalDust: number;
    pityProgress: PityProgress; // Nouveau pity après ouverture
    nextEpicIn: number;         // Cartes jusqu'au prochain Epic garanti
    nextLegendaryIn: number;    // Cartes jusqu'au prochain Legendary garanti
}

/** Items groupés par type ET par rareté */
const ITEMS_BY_CATEGORY: Record<SlotCategory, Record<Rarity, ShopItem[]>> = {
    theme: {
        common: COSMETIC_ITEMS.filter(i => i.type === 'theme' && (i.rarity || 'common') === 'common'),
        rare: COSMETIC_ITEMS.filter(i => i.type === 'theme' && i.rarity === 'rare'),
        epic: COSMETIC_ITEMS.filter(i => i.type === 'theme' && i.rarity === 'epic'),
        legendary: COSMETIC_ITEMS.filter(i => i.type === 'theme' && i.rarity === 'legendary'),
        mythic: COSMETIC_ITEMS.filter(i => i.type === 'theme' && i.rarity === 'mythic'),
    },
    frame: {
        common: COSMETIC_ITEMS.filter(i => i.type === 'frame' && (i.rarity || 'common') === 'common'),
        rare: COSMETIC_ITEMS.filter(i => i.type === 'frame' && i.rarity === 'rare'),
        epic: COSMETIC_ITEMS.filter(i => i.type === 'frame' && i.rarity === 'epic'),
        legendary: COSMETIC_ITEMS.filter(i => i.type === 'frame' && i.rarity === 'legendary'),
        mythic: COSMETIC_ITEMS.filter(i => i.type === 'frame' && i.rarity === 'mythic'),
    },
    bubble: {
        common: COSMETIC_ITEMS.filter(i => i.type === 'bubble' && (i.rarity || 'common') === 'common'),
        rare: COSMETIC_ITEMS.filter(i => i.type === 'bubble' && i.rarity === 'rare'),
        epic: COSMETIC_ITEMS.filter(i => i.type === 'bubble' && i.rarity === 'epic'),
        legendary: COSMETIC_ITEMS.filter(i => i.type === 'bubble' && i.rarity === 'legendary'),
        mythic: COSMETIC_ITEMS.filter(i => i.type === 'bubble' && i.rarity === 'mythic'),
    },
    any: {
        common: COSMETIC_ITEMS.filter(i => (i.rarity || 'common') === 'common'),
        rare: COSMETIC_ITEMS.filter(i => i.rarity === 'rare'),
        epic: COSMETIC_ITEMS.filter(i => i.rarity === 'epic'),
        legendary: COSMETIC_ITEMS.filter(i => i.rarity === 'legendary'),
        mythic: COSMETIC_ITEMS.filter(i => i.rarity === 'mythic'),
    },
};

/** Items groupés par rareté (legacy, pour compatibilité) */
const ITEMS_BY_RARITY: Record<Rarity, ShopItem[]> = {
    common: COSMETIC_ITEMS.filter(item => (item.rarity || 'common') === 'common'),
    rare: COSMETIC_ITEMS.filter(item => item.rarity === 'rare'),
    epic: COSMETIC_ITEMS.filter(item => item.rarity === 'epic'),
    legendary: COSMETIC_ITEMS.filter(item => item.rarity === 'legendary'),
    mythic: COSMETIC_ITEMS.filter(item => item.rarity === 'mythic'),
};


/**
 * Générateur de nombres aléatoires sécurisé
 */
const secureRandom = (): number => {
    try {
        const array = new Uint32Array(1);
        Crypto.getRandomValues(array);
        return array[0] / 0xFFFFFFFF;
    } catch (e) {
        console.warn('[LootBox] Crypto error, falling back to Math.random:', e);
        return Math.random();
    }
};

export const LootBoxService = {
    /**
     * Ouvre un Booster Pack avec Pity System
     */
    openPack(
        tier: LootBoxTier,
        ownedItemIds: string[] = [],
        currentPity: PityProgress = DEFAULT_PITY_PROGRESS
    ): PackResult {
        const config = PACK_TIERS[tier];
        const pity = { ...currentPity };

        // 1. Déterminer le nombre de cartes
        const cardCount = this.rollCardCount(config.cardCount.probabilities);

        // 2. Préparer les slots (prendre les N premiers selon cardCount)
        const activeSlots = config.slots.slice(0, cardCount);

        // 3. Générer les cartes
        const results: CardResult[] = [];
        const currentSessionIds = new Set<string>();
        let totalDust = 0;

        for (let i = 0; i < activeSlots.length; i++) {
            const slot = activeSlots[i];

            // Vérifier pity AVANT le tirage
            let forcedRarity: Rarity | null = null;
            let isPityEpic = false;
            let isPityLegendary = false;

            // Pity Legendary (prioritaire)
            if (pity.legendaryCounter >= PITY_CONFIG.legendaryGuarantee - 1) {
                forcedRarity = 'legendary';
                isPityLegendary = true;
            }
            // Soft Pity Legendary (après 45 cartes, chance augmente)
            else if (pity.legendaryCounter >= PITY_CONFIG.softPityStart) {
                const bonusChance = (pity.legendaryCounter - PITY_CONFIG.softPityStart + 1) * PITY_CONFIG.softPityBonus;
                if (secureRandom() < bonusChance) {
                    forcedRarity = 'legendary';
                    isPityLegendary = true;
                }
            }
            // Pity Epic
            else if (pity.epicCounter >= PITY_CONFIG.epicGuarantee - 1) {
                forcedRarity = 'epic';
                isPityEpic = true;
            }

            // Déterminer la rareté
            let rarity: Rarity;
            if (forcedRarity) {
                rarity = forcedRarity;
            } else if (slot.guaranteedRarity) {
                // Slot avec rareté garantie (ex: Elite premier slot = Rare+)
                rarity = this.rollRarityWithMinimum(config.dropRates, slot.guaranteedRarity);
            } else {
                rarity = this.rollRarity(config.dropRates);
            }

            // Sélectionner l'item selon la catégorie du slot
            const pool = this.getPoolForSlot(slot.category, rarity);
            const item = pool[Math.floor(secureRandom() * pool.length)];

            // Check doublon
            const isDuplicate = ownedItemIds.includes(item.id) || currentSessionIds.has(item.id);

            // Calcul dust (avec bonus Elite)
            let dustValue = 0;
            if (isDuplicate) {
                dustValue = DUST_CONVERSION_RATES[item.rarity || 'common'];
                if (config.bonuses?.dustBonus) {
                    dustValue = Math.floor(dustValue * (1 + config.bonuses.dustBonus / 100));
                }
                totalDust += dustValue;
            }

            // Chance Shiny (Elite uniquement)
            const isShiny = config.bonuses?.shinyChance
                ? secureRandom() < config.bonuses.shinyChance
                : false;

            currentSessionIds.add(item.id);

            // Mettre à jour les compteurs pity
            pity.totalCards++;
            const rarityValue = this.getRarityValue(rarity);

            if (rarityValue >= this.getRarityValue('legendary')) {
                pity.legendaryCounter = 0;
                pity.epicCounter = 0;
            } else if (rarityValue >= this.getRarityValue('epic')) {
                pity.epicCounter = 0;
                pity.legendaryCounter++;
            } else {
                pity.epicCounter++;
                pity.legendaryCounter++;
            }

            results.push({
                item,
                isNew: !isDuplicate,
                dustValue: isDuplicate ? dustValue : undefined,
                isPityEpic,
                isPityLegendary,
                isShiny,
                slotCategory: slot.category,
            });
        }

        // Appliquer les garanties de rareté du pack
        this.applyPackGuarantees(results, config);

        // Trier par rareté (communs d'abord, légendaires à la fin)
        const rarityOrder: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        results.sort((a, b) => rarityOrder[a.item.rarity || 'common'] - rarityOrder[b.item.rarity || 'common']);

        return {
            tier,
            cards: results,
            totalDust,
            pityProgress: pity,
            nextEpicIn: PITY_CONFIG.epicGuarantee - pity.epicCounter,
            nextLegendaryIn: PITY_CONFIG.legendaryGuarantee - pity.legendaryCounter,
        };
    },

    /**
     * Obtenir le pool d'items pour un slot
     */
    getPoolForSlot(category: SlotCategory, rarity: Rarity): ShopItem[] {
        const categoryPool = ITEMS_BY_CATEGORY[category][rarity];

        // Fallback si pool vide
        if (!categoryPool || categoryPool.length === 0) {
            // Essayer une rareté inférieure
            const fallbackRarity = this.getFallbackRarity(rarity);
            const fallbackPool = ITEMS_BY_CATEGORY[category][fallbackRarity];

            if (fallbackPool && fallbackPool.length > 0) {
                return fallbackPool;
            }

            // Dernier recours: any pool
            return ITEMS_BY_RARITY[rarity].length > 0
                ? ITEMS_BY_RARITY[rarity]
                : ITEMS_BY_RARITY['common'];
        }

        return categoryPool;
    },

    /**
     * Rareté de fallback si pool vide
     */
    getFallbackRarity(rarity: Rarity): Rarity {
        const order: Rarity[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];
        const idx = order.indexOf(rarity);
        return idx < order.length - 1 ? order[idx + 1] : 'common';
    },

    /**
     * Valeur numérique d'une rareté
     */
    getRarityValue(rarity: Rarity): number {
        const values: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        return values[rarity];
    },

    /**
     * Détermine le nombre de cartes selon les probabilités
     */
    rollCardCount(probabilities: { [count: number]: number }): number {
        const rand = secureRandom();
        let cumulative = 0;

        for (const [countStr, probability] of Object.entries(probabilities)) {
            cumulative += probability;
            if (rand < cumulative) {
                return parseInt(countStr);
            }
        }

        return parseInt(Object.keys(probabilities)[0]);
    },

    /**
     * Détermine une rareté selon les taux de drop
     */
    rollRarity(rates: { [key in Rarity]: number }): Rarity {
        const rand = secureRandom();
        let cumulative = 0;

        const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

        for (const rarity of rarities) {
            cumulative += rates[rarity] || 0;
            if (rand < cumulative) {
                return rarity;
            }
        }

        return 'common';
    },

    /**
     * Tire une rareté avec un minimum garanti
     */
    rollRarityWithMinimum(rates: { [key in Rarity]: number }, minRarity: Rarity): Rarity {
        const rarity = this.rollRarity(rates);
        const minValue = this.getRarityValue(minRarity);
        const rolledValue = this.getRarityValue(rarity);

        return rolledValue >= minValue ? rarity : minRarity;
    },

    /**
     * Applique les garanties du pack si nécessaire
     */
    applyPackGuarantees(results: CardResult[], config: typeof PACK_TIERS.basic): void {
        if (!config.rarityGuarantees.minRarity || !config.rarityGuarantees.count) return;

        const minRarity = config.rarityGuarantees.minRarity;
        const requiredCount = config.rarityGuarantees.count;
        const minValue = this.getRarityValue(minRarity);

        // Compter les cartes qui respectent la garantie
        const qualifiedCount = results.filter(
            r => this.getRarityValue(r.item.rarity || 'common') >= minValue
        ).length;

        if (qualifiedCount >= requiredCount) return;

        // Upgrade les pires cartes
        const toUpgrade = results
            .map((r, i) => ({ r, i, val: this.getRarityValue(r.item.rarity || 'common') }))
            .filter(x => x.val < minValue)
            .sort((a, b) => a.val - b.val)
            .slice(0, requiredCount - qualifiedCount);

        for (const { r, i } of toUpgrade) {
            const slot = results[i];
            const newPool = this.getPoolForSlot(slot.slotCategory || 'any', minRarity);
            if (newPool.length > 0) {
                const newItem = newPool[Math.floor(secureRandom() * newPool.length)];
                results[i] = {
                    ...results[i],
                    item: newItem,
                    isGuaranteed: true,
                };
            }
        }
    },

    /**
     * Couleur associée à une rareté
     */
    getRarityColor(rarity?: Rarity): string {
        switch (rarity) {
            case 'common': return '#9CA3AF';
            case 'rare': return '#3B82F6';
            case 'epic': return '#A855F7';
            case 'legendary': return '#EAB308';
            case 'mythic': return '#EC4899';
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
     * Calcule les prochains garantis
     */
    getNextGuarantees(pity: PityProgress): { epic: number; legendary: number } {
        return {
            epic: Math.max(0, PITY_CONFIG.epicGuarantee - pity.epicCounter),
            legendary: Math.max(0, PITY_CONFIG.legendaryGuarantee - pity.legendaryCounter),
        };
    },

    /**
     * Retourne 3 items aléatoires basés sur la date du jour
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
    },

    /**
     * Ouvre plusieurs packs (Open x10)
     */
    openMultiplePacks(
        tier: LootBoxTier,
        count: number,
        ownedItemIds: string[] = [],
        currentPity: PityProgress = DEFAULT_PITY_PROGRESS
    ): {
        allCards: CardResult[];
        highlights: CardResult[];
        totalDust: number;
        pityProgress: PityProgress;
        bonusCard?: CardResult; // Carte bonus pour x10
    } {
        let pity = { ...currentPity };
        const allCards: CardResult[] = [];
        let totalDust = 0;
        const ownedIds = new Set(ownedItemIds);

        for (let i = 0; i < count; i++) {
            const result = this.openPack(tier, Array.from(ownedIds), pity);
            allCards.push(...result.cards);
            totalDust += result.totalDust;
            pity = result.pityProgress;

            // Ajouter les nouveaux items aux possédés
            result.cards.forEach(c => {
                if (c.isNew) ownedIds.add(c.item.id);
            });
        }

        // Highlights = Epic+
        const highlights = allCards.filter(c =>
            ['epic', 'legendary', 'mythic'].includes(c.item.rarity || 'common')
        );

        // Bonus x10 : 1 Epic+ garanti si aucun trouvé
        let bonusCard: CardResult | undefined;
        if (count >= 10 && highlights.length === 0) {
            const epicPool = ITEMS_BY_RARITY['epic'];
            if (epicPool.length > 0) {
                const bonusItem = epicPool[Math.floor(secureRandom() * epicPool.length)];
                bonusCard = {
                    item: bonusItem,
                    isNew: !ownedIds.has(bonusItem.id),
                    isGuaranteed: true,
                };
                allCards.push(bonusCard);
            }
        }

        return {
            allCards,
            highlights,
            totalDust,
            pityProgress: pity,
            bonusCard,
        };
    },
};

export default LootBoxService;
