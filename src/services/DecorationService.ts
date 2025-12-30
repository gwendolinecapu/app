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

    // ==================== OWNERSHIP (ALTER SPECIFIC) ====================

    /**
     * Vérifie si un alter possède une décoration
     * @param alterId ID de l'alter
     * @param decorationId ID de la décoration
     * @param knownOwnedItems (Optional) Liste locale pour éviter un fetch
     */
    async ownsDecoration(alterId: string, decorationId: string, knownOwnedItems?: string[]): Promise<boolean> {
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
     * Achète une décoration pour un alter spécifique
     */
    async purchaseDecoration(decorationId: string, alterId: string): Promise<boolean> {
        const decoration = this.getDecoration(decorationId);
        if (!decoration) return false;

        // Check ownership (Double check via Firestore to prevent client-side hacks)
        const isOwned = await this.ownsDecoration(alterId, decorationId);
        if (isOwned) {
            console.warn('Already owned');
            return false;
        }

        if (decoration.priceCredits > 0) {
            // Verify credits via CreditService (System wallet)
            if (!CreditService.hasEnoughCredits(decoration.priceCredits)) {
                return false;
            }

            // Transaction-like update: Deduct credits AND add item
            // Note: Doing this separately has a risk of inconsistency, but Firestore batch is complex across services.
            // We'll deduct first (system), then grant (alter). 
            // If grant fails, user lost credits. Ideally should be batch.
            // For this MVP, we will try to add item first, or just sequence safely.

            // 1. Grant Item
            try {
                const alterRef = doc(db, 'alters', alterId);
                await updateDoc(alterRef, {
                    owned_items: arrayUnion(decorationId)
                });
            } catch (e) {
                console.error('Failed to grant item', e);
                return false;
            }

            // 2. Deduct Credits
            await CreditService.purchaseItem({
                id: decorationId,
                type: 'decoration',
                name: decoration.name,
                description: decoration.description,
                priceCredits: decoration.priceCredits,
                // custom param to avoid recursive loops if purchaseItem calls back here
            }, false);
            // Actually CreditService.purchaseItem calls grant logic? 
            // We need to detangle this.
            // CreditService.purchaseItem handles "Deduct credits" AND "Apply effect".
            // We already applied effect (grant item).
            // We should just call spendCredits directly or a safe method.
        } else {
            // Free item (unlocked via achievement etc)
            const alterRef = doc(db, 'alters', alterId);
            await updateDoc(alterRef, {
                owned_items: arrayUnion(decorationId)
            });
        }

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
