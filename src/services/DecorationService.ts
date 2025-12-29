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

class DecorationService {
    private static instance: DecorationService;
    private ownedDecorations: string[] = [];
    private equippedDecorations: Map<string, string> = new Map(); // alterId -> decorationId
    private userId: string | null = null;

    private constructor() { }

    static getInstance(): DecorationService {
        if (!DecorationService.instance) {
            DecorationService.instance = new DecorationService();
        }
        return DecorationService.instance;
    }

    // ==================== INITIALIZATION ====================

    async initialize(userId: string): Promise<void> {
        this.userId = userId;

        try {
            const docRef = doc(db, FIRESTORE_COLLECTION, userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                this.ownedDecorations = data.decorations || [];
                this.equippedDecorations = new Map(
                    Object.entries(data.equippedDecorations || {})
                );
            }

            console.log('[DecorationService] Initialized with', this.ownedDecorations.length, 'decorations');

        } catch (error) {
            console.error('[DecorationService] Initialization failed:', error);
        }
    }

    // ==================== CATALOG ====================

    /**
     * Retourne toutes les décorations disponibles
     */
    getCatalog(): Decoration[] {
        return DECORATIONS_CATALOG;
    }

    /**
     * Retourne les décorations par type
     */
    getCatalogByType(type: DecorationType): Decoration[] {
        return DECORATIONS_CATALOG.filter(d => d.type === type);
    }

    /**
     * Retourne les décorations par rareté
     */
    getCatalogByRarity(rarity: DecorationRarity): Decoration[] {
        return DECORATIONS_CATALOG.filter(d => d.rarity === rarity);
    }

    /**
     * Retourne une décoration par ID
     */
    getDecoration(decorationId: string): Decoration | undefined {
        return DECORATIONS_CATALOG.find(d => d.id === decorationId);
    }

    // ==================== OWNERSHIP ====================

    /**
     * Vérifie si l'utilisateur possède une décoration
     */
    ownsDecoration(decorationId: string): boolean {
        return this.ownedDecorations.includes(decorationId);
    }

    /**
     * Retourne toutes les décorations possédées
     */
    getOwnedDecorations(): Decoration[] {
        return DECORATIONS_CATALOG.filter(d => this.ownedDecorations.includes(d.id));
    }

    /**
     * Achète une décoration
     */
    async purchaseDecoration(decorationId: string): Promise<boolean> {
        const decoration = this.getDecoration(decorationId);
        if (!decoration) {
            console.error('[DecorationService] Decoration not found:', decorationId);
            return false;
        }

        if (this.ownsDecoration(decorationId)) {
            console.warn('[DecorationService] Already owns:', decorationId);
            return false;
        }

        if (decoration.priceCredits === 0 && decoration.unlockCondition) {
            console.warn('[DecorationService] Cannot purchase, has unlock condition:', decorationId);
            return false;
        }

        // Vérifier et dépenser les crédits
        if (!CreditService.hasEnoughCredits(decoration.priceCredits)) {
            console.warn('[DecorationService] Not enough credits');
            return false;
        }

        await CreditService.purchaseItem({
            id: decorationId,
            type: 'decoration',
            name: decoration.name,
            description: decoration.description,
            priceCredits: decoration.priceCredits,
            decorationId,
        });

        // Ajouter à la collection
        this.ownedDecorations.push(decorationId);
        await this.saveToFirestore();

        console.log('[DecorationService] Purchased:', decorationId);
        return true;
    }

    /**
     * Débloque une décoration (condition spéciale, pas d'achat)
     */
    async unlockDecoration(decorationId: string): Promise<boolean> {
        if (this.ownsDecoration(decorationId)) {
            return false;
        }

        this.ownedDecorations.push(decorationId);
        await this.saveToFirestore();

        console.log('[DecorationService] Unlocked:', decorationId);
        return true;
    }

    // ==================== EQUIPMENT ====================

    /**
     * Équipe une décoration sur un alter
     */
    async equipDecoration(alterId: string, decorationId: string): Promise<boolean> {
        if (!this.ownsDecoration(decorationId)) {
            console.warn('[DecorationService] Does not own:', decorationId);
            return false;
        }

        this.equippedDecorations.set(alterId, decorationId);
        await this.saveToFirestore();

        console.log('[DecorationService] Equipped', decorationId, 'on alter', alterId);
        return true;
    }

    /**
     * Retire la décoration d'un alter
     */
    async unequipDecoration(alterId: string): Promise<void> {
        this.equippedDecorations.delete(alterId);
        await this.saveToFirestore();
    }

    /**
     * Retourne la décoration équipée sur un alter
     */
    getEquippedDecoration(alterId: string): Decoration | null {
        const decorationId = this.equippedDecorations.get(alterId);
        if (!decorationId) return null;
        return this.getDecoration(decorationId) || null;
    }

    /**
     * Retourne l'ID de décoration équipée pour un alter
     */
    getEquippedDecorationId(alterId: string): string | null {
        return this.equippedDecorations.get(alterId) || null;
    }

    // ==================== HELPERS ====================

    /**
     * Retourne la couleur de rareté
     */
    getRarityColor(rarity: DecorationRarity): string {
        return RARITY_COLORS[rarity];
    }

    /**
     * Groupe les décorations par rareté
     */
    groupByRarity(decorations: Decoration[]): Record<DecorationRarity, Decoration[]> {
        return {
            common: decorations.filter(d => d.rarity === 'common'),
            rare: decorations.filter(d => d.rarity === 'rare'),
            epic: decorations.filter(d => d.rarity === 'epic'),
            legendary: decorations.filter(d => d.rarity === 'legendary'),
        };
    }

    // ==================== PERSISTENCE ====================

    private async saveToFirestore(): Promise<void> {
        if (!this.userId) return;

        try {
            const docRef = doc(db, FIRESTORE_COLLECTION, this.userId);
            await setDoc(docRef, {
                decorations: this.ownedDecorations,
                equippedDecorations: Object.fromEntries(this.equippedDecorations),
            }, { merge: true });
        } catch (error) {
            console.error('[DecorationService] Failed to save:', error);
        }
    }
}

export default DecorationService.getInstance();
