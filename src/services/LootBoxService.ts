/**
 * LootBoxService.ts
 * 
 * Système de "Chain Upgrade" (Style Clash Royale / Brawl Stars)
 * 
 * Flow:
 * 1. Le joueur achète le coffre (prix fixe)
 * 2. Le coffre commence en rareté COMMUNE
 * 3. À chaque tap, probabilité d'UPGRADE le coffre vers la rareté supérieure
 * 4. Si l'upgrade échoue, le coffre s'ouvre avec la rareté actuelle
 */

import { ShopItem, Rarity, COSMETIC_ITEMS } from './MonetizationTypes';

// ==================== CONFIGURATION ====================

export const LOOT_BOX = {
    id: 'chain_chest',
    name: 'Coffre Évolutif',
    price: 150, // Prix un peu plus bas car on commence souvent en commun
    description: 'Une chance d\'améliorer la rareté à chaque coup !',
    color: '#9CA3AF', // Gris (Commun) au départ
};

/**
 * Probabilités d'upgrade vers la rareté SUIVANTE
 */
const UPGRADE_CHANCES: Record<Rarity, number> = {
    common: 0.30,   // 30% chance to pass Common -> Rare
    rare: 0.30,     // 30% chance to pass Rare -> Epic
    epic: 0.30,     // 30% chance to pass Epic -> Legendary
    legendary: 0.30,// 30% chance to pass Legendary -> Mythic
    mythic: 0,      // Max level
};

export const REFUND_VALUES: Record<Rarity, number> = {
    common: 20,
    rare: 50,
    epic: 150,
    legendary: 300,
    mythic: 500
};

/**
 * Classification des items par rareté (basée sur le prix)
 */
const getRarityFromPrice = (price: number): Rarity => {
    if (price <= 50) return 'common';
    if (price <= 150) return 'rare';
    if (price <= 350) return 'epic';
    if (price <= 600) return 'legendary';
    return 'mythic'; // Prix > 600 = Mythic (ex: cadre sakura)
};

/**
 * Items groupés par rareté
 */
const ITEMS_BY_RARITY: Record<Rarity, ShopItem[]> = {
    common: COSMETIC_ITEMS.filter(item => getRarityFromPrice(item.priceCredits || 0) === 'common'),
    rare: COSMETIC_ITEMS.filter(item => getRarityFromPrice(item.priceCredits || 0) === 'rare'),
    epic: COSMETIC_ITEMS.filter(item => getRarityFromPrice(item.priceCredits || 0) === 'epic'),
    legendary: COSMETIC_ITEMS.filter(item => getRarityFromPrice(item.priceCredits || 0) === 'legendary'),
    mythic: COSMETIC_ITEMS.filter(item => getRarityFromPrice(item.priceCredits || 0) === 'mythic'),
};

export const LootBoxService = {
    /**
     * Tente d'améliorer le coffre
     * Retourne la nouvelle rareté si succès, ou null si échec (doit ouvrir)
     */
    tryUpgrade(currentRarity: Rarity): Rarity | null {
        // Empêcher upgrade si déjà au max
        if (currentRarity === 'mythic') return null;

        const chance = UPGRADE_CHANCES[currentRarity];
        const attempt = Math.random();

        if (attempt <= chance) {
            // Success! Return next rarity
            if (currentRarity === 'common') return 'rare';
            if (currentRarity === 'rare') return 'epic';
            if (currentRarity === 'epic') return 'legendary';
            if (currentRarity === 'legendary') return 'mythic';
        }

        // Failed upgrade
        return null;
    },

    /**
     * Obtient une récompense pour une rareté donnée
     * (Un seul item)
     */
    getReward(rarity: Rarity, ownedItemIds: string[] = []): { item: ShopItem, isNew: boolean } {
        // Filtrer les items de cette rareté
        const pool = ITEMS_BY_RARITY[rarity];

        // Essayer de trouver un item non possédé
        const unowned = pool.filter(item => !ownedItemIds.includes(item.id));

        let selectedItem: ShopItem;
        let isNew = false;

        if (unowned.length > 0) {
            // Priorité aux nouveaux items
            selectedItem = unowned[Math.floor(Math.random() * unowned.length)];
            isNew = true;
        } else {
            // Fallback: item déjà possédé (sera converti en crédits visuellement ou juste "doublon")
            selectedItem = pool[Math.floor(Math.random() * pool.length)];
            isNew = false;
        }

        return { item: selectedItem, isNew };
    },

    /**
     * Couleur associée à une rareté
     */
    getRarityColor(rarity: Rarity): string {
        switch (rarity) {
            case 'common': return '#9CA3AF';    // Gris
            case 'rare': return '#3B82F6';       // Bleu
            case 'epic': return '#A855F7';       // Violet
            case 'legendary': return '#F59E0B';  // Or
            case 'mythic': return '#EF4444';     // Rouge (Mythic)
            default: return '#9CA3AF';
        }
    },

    getRarityName(rarity: Rarity): string {
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
     * (Rotation quotidienne stable)
     */
    getDailyItems(): ShopItem[] {
        const dateStr = new Date().toISOString().split('T')[0]; // "2023-10-27"
        const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Pseudo-random generator seeded by date
        const prng = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        const dailyItems: ShopItem[] = [];
        const pool = [...COSMETIC_ITEMS]; // Copy

        // Pick 3 unique items
        for (let i = 0; i < 3; i++) {
            if (pool.length === 0) break;
            const index = Math.floor(prng(i) * pool.length);
            dailyItems.push(pool[index]);
            pool.splice(index, 1); // Avoid duplicates
        }

        return dailyItems;
    }
};

export default LootBoxService;
