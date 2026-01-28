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
 * Génère un seed basé sur la semaine (Epoch week)
 * Stable à travers les années et Timezones (UTC)
 * Reset le Dimanche à 00:00 UTC
 */
const getWeeklySeed = (): number => {
    // 1970-01-01 was Thursday.
    // We want reset on Sunday.
    // Thursday + 3 days = Sunday.
    // However, to align the counter to increment on Sunday, we add an offset.
    // If today is Thu (0), we want same seed until Sunday.
    // Let's align so that Week increments on Sunday 00:00 UTC.
    // 4 days offset aligns Thursday origin to Sunday boundary calculation.
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const OFFSET_MS = 4 * 24 * 60 * 60 * 1000; // 4 days
    return Math.floor((Date.now() + OFFSET_MS) / WEEK_MS);
};

/**
 * Pseudo-random basé sur un seed
 */
const seededRandom = (seed: number, offset: number): number => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
};

/**
 * Calcule le prochain reset (dimanche minuit UTC)
 */
const getNextReset = (): Date => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 (Sun) to 6 (Sat)

    // Si on est dimanche, le prochain reset est dans 7 jours (fin de la semaine actuelle)
    // Si on est samedi (6), le prochain reset est dans 1 jour
    const daysUntilSunday = 7 - dayOfWeek;

    const reset = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + daysUntilSunday,
        0, 0, 0, 0
    ));

    return reset;
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
