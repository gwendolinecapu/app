/**
 * ForgeService.ts
 *
 * Système de Forge (Craft Shop)
 * Permet d'acheter des items spécifiques avec du Dust
 *
 * Features:
 * - Rotation hebdomadaire d'items craftables
 * - Prix par rareté
 * - Limite d'achat par semaine
 */

import {
    ShopItem,
    Rarity,
    COSMETIC_ITEMS,
    CRAFT_PRICES,
} from './MonetizationTypes';

/** Item disponible dans la Forge */
export interface ForgeItem {
    item: ShopItem;
    craftPrice: number;
    availableUntil: Date;
    maxPerWeek: number;
}

/** Configuration de la Forge */
const FORGE_CONFIG = {
    itemsPerRotation: 8,       // Nombre d'items par rotation
    rotationDays: 7,           // Durée en jours
    maxCraftPerItemPerWeek: 1, // Limite d'achat par item par semaine
    guaranteedRarities: {
        rare: 3,      // 3 items rares garantis
        epic: 2,      // 2 items épiques garantis
        legendary: 1, // 1 item légendaire garanti
    },
} as const;

/**
 * Génère un seed basé sur la semaine
 */
const getWeeklySeed = (): number => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    return now.getFullYear() * 100 + weekNumber;
};

/**
 * Pseudo-random basé sur un seed
 */
const seededRandom = (seed: number, offset: number): number => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
};

/**
 * Calcule le prochain reset (dimanche minuit)
 */
const getNextReset = (): Date => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday;
};

export const ForgeService = {
    /**
     * Récupère les items de la Forge pour cette semaine
     */
    getForgeItems(): ForgeItem[] {
        const seed = getWeeklySeed();
        const availableUntil = getNextReset();

        // Grouper les items par rareté (exclure common et mythic)
        const itemsByRarity: Record<string, ShopItem[]> = {
            rare: COSMETIC_ITEMS.filter(i => i.rarity === 'rare'),
            epic: COSMETIC_ITEMS.filter(i => i.rarity === 'epic'),
            legendary: COSMETIC_ITEMS.filter(i => i.rarity === 'legendary'),
        };

        const selectedItems: ShopItem[] = [];
        let offset = 0;

        // Sélectionner les items garantis par rareté
        for (const [rarity, count] of Object.entries(FORGE_CONFIG.guaranteedRarities)) {
            const pool = [...itemsByRarity[rarity]];
            for (let i = 0; i < count && pool.length > 0; i++) {
                const index = Math.floor(seededRandom(seed, offset++) * pool.length);
                selectedItems.push(pool[index]);
                pool.splice(index, 1);
            }
        }

        // Compléter avec des items aléatoires si nécessaire
        const remainingSlots = FORGE_CONFIG.itemsPerRotation - selectedItems.length;
        const allEligible = COSMETIC_ITEMS.filter(
            i => ['rare', 'epic', 'legendary'].includes(i.rarity || '') &&
                !selectedItems.includes(i)
        );

        for (let i = 0; i < remainingSlots && allEligible.length > 0; i++) {
            const index = Math.floor(seededRandom(seed, offset++) * allEligible.length);
            selectedItems.push(allEligible[index]);
            allEligible.splice(index, 1);
        }

        // Convertir en ForgeItems
        return selectedItems.map(item => ({
            item,
            craftPrice: CRAFT_PRICES[item.rarity as Rarity] || CRAFT_PRICES.rare,
            availableUntil,
            maxPerWeek: FORGE_CONFIG.maxCraftPerItemPerWeek,
        }));
    },

    /**
     * Temps restant avant le prochain reset
     */
    getTimeUntilReset(): { days: number; hours: number; minutes: number } {
        const now = new Date();
        const reset = getNextReset();
        const diff = reset.getTime() - now.getTime();

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    },

    /**
     * Formate le temps restant
     */
    formatTimeUntilReset(): string {
        const { days, hours, minutes } = this.getTimeUntilReset();

        if (days > 0) {
            return `${days}j ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    },

    /**
     * Vérifie si un item peut être crafté
     */
    canCraft(
        itemId: string,
        userDust: number,
        weeklyPurchases: Record<string, number> = {}
    ): { canCraft: boolean; reason?: string } {
        const forgeItems = this.getForgeItems();
        const forgeItem = forgeItems.find(fi => fi.item.id === itemId);

        if (!forgeItem) {
            return { canCraft: false, reason: 'Item non disponible dans la Forge' };
        }

        if (userDust < forgeItem.craftPrice) {
            return {
                canCraft: false,
                reason: `Dust insuffisant (${userDust}/${forgeItem.craftPrice})`,
            };
        }

        const purchases = weeklyPurchases[itemId] || 0;
        if (purchases >= forgeItem.maxPerWeek) {
            return { canCraft: false, reason: 'Limite hebdomadaire atteinte' };
        }

        return { canCraft: true };
    },

    /**
     * Prix de craft pour un item
     */
    getCraftPrice(item: ShopItem): number {
        return CRAFT_PRICES[item.rarity as Rarity] || CRAFT_PRICES.rare;
    },

    /**
     * Semaine actuelle (pour tracking des achats)
     */
    getCurrentWeekId(): string {
        const seed = getWeeklySeed();
        return `week_${seed}`;
    },
};

export default ForgeService;
