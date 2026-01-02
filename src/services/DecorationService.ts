/**
 * DecorationService.ts
 * Gestion des décorations cosmétiques (contours d'alter, badges, etc.)
 */

import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    Decoration,
    DecorationType,
    DecorationRarity,
    DECORATION_PRICES,
    RARITY_COLORS,
    COSMETIC_ITEMS,
    ShopItem,
} from './MonetizationTypes';
import CreditService from './CreditService';

const FIRESTORE_COLLECTION = 'user_monetization';

// ==================== CATALOGUE DE DÉCORATIONS ====================

export const DECORATIONS_CATALOG: Decoration[] = [
    // === CONTOURS D'ALTER - COMMON ===
    {
        id: 'border_purple_glow',
        name: 'Lueur Violette',
        description: 'Un contour violet subtil',
        type: 'alter_border',
        rarity: 'common',
        priceCredits: DECORATION_PRICES.common,
        asset: 'border_purple_glow',
    },
    {
        id: 'border_blue_ring',
        name: 'Anneau Bleu',
        description: 'Un cercle bleu élégant',
        type: 'alter_border',
        rarity: 'common',
        priceCredits: DECORATION_PRICES.common,
        asset: 'border_blue_ring',
    },
    {
        id: 'border_green_nature',
        name: 'Nature Verte',
        description: 'Inspiré de la nature',
        type: 'alter_border',
        rarity: 'common',
        priceCredits: DECORATION_PRICES.common,
        asset: 'border_green_nature',
    },
    {
        id: 'border_pink_soft',
        name: 'Rose Doux',
        description: 'Un rose apaisant',
        type: 'alter_border',
        rarity: 'common',
        priceCredits: DECORATION_PRICES.common,
        asset: 'border_pink_soft',
    },

    // === CONTOURS D'ALTER - RARE ===
    {
        id: 'border_rainbow',
        name: 'Arc-en-ciel',
        description: 'Toutes les couleurs réunies',
        type: 'alter_border',
        rarity: 'rare',
        priceCredits: DECORATION_PRICES.rare,
        asset: 'border_rainbow',
    },
    {
        id: 'border_neon',
        name: 'Néon',
        description: 'Un effet néon brillant',
        type: 'alter_border',
        rarity: 'rare',
        priceCredits: DECORATION_PRICES.rare,
        asset: 'border_neon',
    },
    {
        id: 'border_galaxy',
        name: 'Galaxie',
        description: 'Les étoiles autour de toi',
        type: 'alter_border',
        rarity: 'rare',
        priceCredits: DECORATION_PRICES.rare,
        asset: 'border_galaxy',
    },
    {
        id: 'border_flames',
        name: 'Flammes',
        description: 'Des flammes ardentes',
        type: 'alter_border',
        rarity: 'rare',
        priceCredits: DECORATION_PRICES.rare,
        asset: 'border_flames',
    },

    // === CONTOURS D'ALTER - EPIC ===
    {
        id: 'border_aurora',
        name: 'Aurore Boréale',
        description: 'Les lumières du nord',
        type: 'alter_border',
        rarity: 'epic',
        priceCredits: DECORATION_PRICES.epic,
        asset: 'border_aurora',
    },
    {
        id: 'border_crystal',
        name: 'Cristal',
        description: 'Pure comme le cristal',
        type: 'alter_border',
        rarity: 'epic',
        priceCredits: DECORATION_PRICES.epic,
        asset: 'border_crystal',
    },
    {
        id: 'border_holographic',
        name: 'Holographique',
        description: 'Effet 3D holographique',
        type: 'alter_border',
        rarity: 'epic',
        priceCredits: DECORATION_PRICES.epic,
        asset: 'border_holographic',
    },

    // === CONTOURS D'ALTER - LEGENDARY ===
    {
        id: 'border_cosmic',
        name: 'Cosmique',
        description: 'L\'univers entier',
        type: 'alter_border',
        rarity: 'legendary',
        priceCredits: DECORATION_PRICES.legendary,
        asset: 'border_cosmic',
        animatedAsset: 'border_cosmic_animated',
    },
    {
        id: 'border_plasma',
        name: 'Plasma',
        description: 'Énergie pure animée',
        type: 'alter_border',
        rarity: 'legendary',
        priceCredits: DECORATION_PRICES.legendary,
        asset: 'border_plasma',
        animatedAsset: 'border_plasma_animated',
    },

    // === BADGES ===
    {
        id: 'badge_early_adopter',
        name: 'Early Adopter',
        description: 'Parmi les premiers utilisateurs',
        type: 'badge',
        rarity: 'rare',
        priceCredits: 0, // Non achetable
        asset: 'badge_early_adopter',
        unlockCondition: 'joined_before_2025',
    },
    {
        id: 'badge_supporter',
        name: 'Supporter',
        description: 'A soutenu l\'application',
        type: 'badge',
        rarity: 'epic',
        priceCredits: 0,
        asset: 'badge_supporter',
        unlockCondition: 'purchased_premium',
    },
    {
        id: 'badge_streak_30',
        name: 'Streak Master',
        description: '30 jours de connexion consécutifs',
        type: 'badge',
        rarity: 'epic',
        priceCredits: 0,
        asset: 'badge_streak_30',
        unlockCondition: 'streak_30_days',
    },

    // === FRAMES PROFIL ===
    {
        id: 'frame_simple',
        name: 'Cadre Simple',
        description: 'Un cadre élégant',
        type: 'profile_frame',
        rarity: 'common',
        priceCredits: DECORATION_PRICES.common,
        asset: 'frame_simple',
    },
    {
        id: 'frame_golden',
        name: 'Cadre Doré',
        description: 'Touch of gold',
        type: 'profile_frame',
        rarity: 'rare',
        priceCredits: DECORATION_PRICES.rare,
        asset: 'frame_golden',
    },
];

// ==================== SERVICE ====================

// ==================== SERVICE ====================

class DecorationService {
    private static instance: DecorationService;
    // Cache for optimization? For now, we'll rely on Firestore/AuthContext
    private userId: string | null = null;

    private constructor() { }

    static getInstance(): DecorationService {
        if (!DecorationService.instance) {
            DecorationService.instance = new DecorationService();
        }
        return DecorationService.instance;
    }

    async initialize(userId: string): Promise<void> {
        this.userId = userId;
    }

    // ==================== CATALOG ====================

    getCatalog(): Decoration[] {
        return DECORATIONS_CATALOG;
    }

    getCatalogByType(type: DecorationType): Decoration[] {
        return DECORATIONS_CATALOG.filter(d => d.type === type);
    }

    getCatalogByRarity(rarity: DecorationRarity): Decoration[] {
        return DECORATIONS_CATALOG.filter(d => d.rarity === rarity);
    }

    getDecoration(decorationId: string): Decoration | undefined {
        return DECORATIONS_CATALOG.find(d => d.id === decorationId);
    }

    // Recherche dans DECORATIONS_CATALOG et COSMETIC_ITEMS (pour thèmes, frames, bulles)
    getItem(itemId: string): ShopItem | Decoration | undefined {
        // D'abord chercher dans les décorations
        const decoration = DECORATIONS_CATALOG.find(d => d.id === itemId);
        if (decoration) return decoration;

        // Ensuite chercher dans les cosmétiques (thèmes, frames, bulles)
        const cosmetic = COSMETIC_ITEMS.find(c => c.id === itemId);
        return cosmetic;
    }

    // ==================== OWNERSHIP (ALTER SPECIFIC) ====================

    /**
     * Vérifie si un alter possède une décoration
     * @param alterId ID de l'alter
     * @param decorationId ID de la décoration
     * @param knownOwnedItems (Optional) Liste locale pour éviter un fetch
     */
    async ownsDecoration(alterId: string, decorationId: string, knownOwnedItems?: string[]): Promise<boolean> {
        // Always return true for default/free items that might not be in the database
        const DEFAULT_ITEMS = ['theme_default', 'frame_simple', 'bubble_classic', 'bubble_default', 'border_none'];
        if (DEFAULT_ITEMS.includes(decorationId)) return true;

        // Also check if it's a free item from the catalog (price === 0)
        const item = this.getItem(decorationId);
        if (item && (item.priceCredits || 0) === 0) return true;

        if (knownOwnedItems) {
            return knownOwnedItems.includes(decorationId);
        }

        try {
            const docRef = doc(db, 'alters', alterId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const owned = data.owned_items || [];
                return owned.includes(decorationId);
            }
            return false;
        } catch (e) {
            console.error('Error checking ownership:', e);
            return false;
        }
    }

    /**
     * Récupère la liste des IDs de décorations possédées par un alter
     */
    async getOwnedDecorationIds(alterId: string): Promise<string[]> {
        try {
            const docRef = doc(db, 'alters', alterId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return data.owned_items || [];
            }
            return [];
        } catch (e) {
            console.error('[DecorationService] Error fetching owned items:', e);
            return [];
        }
    }

    /**
     * Achète une décoration ou un cosmétique pour un alter spécifique
     */
    async purchaseDecoration(decorationId: string, alterId: string): Promise<boolean> {
        // Chercher dans les deux catalogues (décorations ET cosmétiques)
        const item = this.getItem(decorationId);
        if (!item) {
            console.error('[DecorationService] Item not found:', decorationId);
            return false;
        }

        // Check ownership
        const isOwned = await this.ownsDecoration(alterId, decorationId);
        if (isOwned) {
            console.warn('[DecorationService] Already owned:', decorationId);
            return false;
        }

        const price = item.priceCredits || 0;

        if (price > 0) {
            // Verify credits
            const hasCredits = await CreditService.hasEnoughCredits(alterId, price);
            if (!hasCredits) {
                console.warn('[DecorationService] Not enough credits.');
                return false;
            }

            // 1. Grant Item first
            try {
                const alterRef = doc(db, 'alters', alterId);
                await updateDoc(alterRef, {
                    owned_items: arrayUnion(decorationId)
                });
            } catch (e) {
                console.error('[DecorationService] Failed to grant item:', e);
                return false;
            }

            // 2. Deduct Credits
            // Note: purchaseItem expects valid item structure.
            await CreditService.purchaseItem(alterId, {
                id: decorationId,
                type: item.type as any,
                name: item.name,
                description: item.description,
                priceCredits: price,
            }, false);
        } else {
            // Free item
            const alterRef = doc(db, 'alters', alterId);
            await updateDoc(alterRef, {
                owned_items: arrayUnion(decorationId)
            });
        }

        console.log('[DecorationService] Purchase successful:', decorationId);
        return true;
    }

    // ==================== EQUIPMENT ====================

    async equipDecoration(alterId: string, decorationId: string, type: 'frame' | 'theme' | 'bubble'): Promise<boolean> {
        const isOwned = await this.ownsDecoration(alterId, decorationId);
        if (!isOwned) return false;

        const alterRef = doc(db, 'alters', alterId);
        await updateDoc(alterRef, {
            [`equipped_items.${type}`]: decorationId
        });
        return true;
    }

    async unequipDecoration(alterId: string, type: 'frame' | 'theme' | 'bubble'): Promise<void> {
        const alterRef = doc(db, 'alters', alterId);
        // Delete field
        // In Firestore to delete a map field:
        // updateDoc(ref, { "equipped_items.frame": deleteField() })
        // Need to import deleteField
        // For now, simpler to just set to null or remove key in client
        // Let's assume setting to null or empty string updates it.
        await updateDoc(alterRef, {
            [`equipped_items.${type}`]: null
        });
    }

    getEquippedDecorationId(alter: any, type: 'frame' | 'theme' | 'bubble'): string | undefined {
        return alter?.equipped_items?.[type];
    }
}

export default DecorationService.getInstance();
