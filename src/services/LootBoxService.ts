import { ShopItem, Rarity, LootBoxType, COSMETIC_ITEMS } from './MonetizationTypes';

// Configuration des Box
export const LOOT_BOXES: LootBoxType[] = [
    {
        id: 'box_mystery',
        name: 'Mystery Box',
        price: 100,
        description: 'Une petite boîte pleine de surprises.',
        color: '#BDC3C7', // Gris Argent
        dropRates: [
            { rarity: 'common', chance: 0.60 },
            { rarity: 'rare', chance: 0.30 },
            { rarity: 'epic', chance: 0.09 },
            { rarity: 'legendary', chance: 0.01 },
        ]
    },
    {
        id: 'box_star',
        name: 'Star Box',
        price: 300,
        description: 'Plus de chances d\'obtenir du rare !',
        color: '#3498DB', // Bleu
        dropRates: [
            { rarity: 'common', chance: 0.20 },
            { rarity: 'rare', chance: 0.50 },
            { rarity: 'epic', chance: 0.25 },
            { rarity: 'legendary', chance: 0.05 },
        ]
    },
    {
        id: 'box_luxe',
        name: 'Luxe Box',
        price: 800,
        description: 'La crème de la crème. Garanties élevées.',
        color: '#F1C40F', // Or
        dropRates: [
            { rarity: 'common', chance: 0.0 },
            { rarity: 'rare', chance: 0.30 },
            { rarity: 'epic', chance: 0.50 },
            { rarity: 'legendary', chance: 0.20 },
        ]
    }
];

// Items fictifs par rareté (pour l'instant, on mappe sur les items existants ou on en crée des génériques)
// Dans une vraie app, chaque ShopItem aurait une propriété `rarity`.
// Ici on va simuler.

const RARITY_MAP: Record<string, Rarity> = {
    'theme_default': 'common',
    'theme_ocean': 'common',
    'theme_forest': 'common',
    'theme_sunset': 'rare',
    'theme_lavender': 'rare',
    'theme_cyberpunk': 'epic',
    'theme_midnight': 'epic',
    'theme_winter': 'epic',
    'theme_anim_aurora': 'legendary',
    'theme_anim_cosmos': 'legendary',

    'frame_simple': 'common',
    'frame_futuristic': 'rare',
    'frame_nature': 'rare',
    'frame_neon': 'epic',
    'frame_anim_sakura': 'legendary', // Notre nouveau bébé

    'bubble_classic': 'common',
    'bubble_comic': 'rare',
    'bubble_neon': 'epic',
    'bubble_gradient': 'epic',
};

export const LootBoxService = {

    openBox(boxId: string): { item: ShopItem, rarity: Rarity } | null {
        const box = LOOT_BOXES.find(b => b.id === boxId);
        if (!box) return null;

        // 1. Déterminer la rareté
        const rand = Math.random();
        let accumulatedChance = 0;
        let selectedRarity: Rarity = 'common';

        for (const rate of box.dropRates) {
            accumulatedChance += rate.chance;
            if (rand <= accumulatedChance) {
                selectedRarity = rate.rarity;
                break;
            }
        }

        // 2. Sélectionner un item de cette rareté
        // Filtrer les items éligibles
        const eligibleItems = COSMETIC_ITEMS.filter(item => {
            const itemRarity = RARITY_MAP[item.id] || 'common'; // Default to common if not mapped
            return itemRarity === selectedRarity;
        });

        // Si aucun item de cette rareté (fallback), prendre un common
        if (eligibleItems.length === 0) {
            const fallbackItems = COSMETIC_ITEMS.filter(item => (RARITY_MAP[item.id] || 'common') === 'common');
            const fallbackItem = fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
            return { item: fallbackItem, rarity: 'common' };
        }

        // Pick random elite item
        const selectedItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];

        return { item: selectedItem, rarity: selectedRarity };
    },

    getRarityColor(rarity: Rarity): string {
        switch (rarity) {
            case 'common': return '#95A5A6'; // Gris
            case 'rare': return '#3498DB';   // Bleu
            case 'epic': return '#9B59B6';   // Violet
            case 'legendary': return '#F1C40F'; // Or
            default: return '#BDC3C7';
        }
    }
};
