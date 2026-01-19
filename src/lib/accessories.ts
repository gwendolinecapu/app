/**
 * accessories.ts
 * Système de gestion des accessoires d'avatar (overlay sur la photo de profil)
 * 
 * Chaque accessoire a une position définie pour s'afficher correctement sur l'avatar.
 */

import { ImageSourcePropType, ViewStyle } from 'react-native';

// ==================== TYPES ====================

export type AccessoryPosition =
    | 'top'      // Au-dessus de la tête (couronne, halo)
    | 'head'     // Sur la tête (cornes, chapeau)
    | 'eyes'     // Au niveau des yeux (lunettes, flammes)
    | 'face'     // Sur le visage (masque, tatouage)
    | 'mouth'    // Bouche (cigarette, sucette)
    | 'ear'      // Oreilles (boucles d'oreilles)
    | 'neck'     // Cou (collier)
    | 'overlay'; // Superposition complète (aura, effet)

export type AccessoryCategory =
    | 'headwear'    // Couronnes, halos, chapeaux
    | 'horns'       // Cornes
    | 'glasses'     // Lunettes
    | 'mask'        // Masques
    | 'effect'      // Effets (flammes, aura, sparkles)
    | 'accessory'   // Divers (boucles, tattoos)
    | 'pet';        // Compagnons

export interface AccessoryStyle {
    position: AccessoryPosition;
    offsetX: number;      // Décalage horizontal en % (-50 à 50)
    offsetY: number;      // Décalage vertical en % (-50 à 50)
    scale: number;        // Échelle (1 = 100% de la taille avatar)
    zIndex: number;       // Ordre d'affichage (1 = derrière, 10 = devant)
    imageSource: ImageSourcePropType;
}

export interface AccessoryItem {
    id: string;
    name: string;
    description: string;
    category: AccessoryCategory;
    priceCredits: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    style: AccessoryStyle;
    preview?: string;     // Couleur hex pour la preview
    isPremium?: boolean;
    isAnimated?: boolean;
}

// ==================== CATALOGUE ====================

export const ACCESSORIES_CATALOG: AccessoryItem[] = [
    // ===== COURONNES & HALOS =====
    {
        id: 'accessory_crown_gold',
        name: 'Couronne Dorée',
        description: 'Royauté absolue.',
        category: 'headwear',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#FFD700',
        style: {
            position: 'top',
            offsetX: 0,
            offsetY: -35,  // Au-dessus de la tête
            scale: 0.7,
            zIndex: 10,
            imageSource: require('../../assets/accessories/accessory_crown_gold.png'),
        },
    },
    {
        id: 'accessory_halo_angel',
        name: 'Auréole',
        description: 'Pureté divine.',
        category: 'headwear',
        priceCredits: 150,
        rarity: 'epic',
        preview: '#FFE066',
        style: {
            position: 'top',
            offsetX: 0,
            offsetY: -40,  // Juste au-dessus de la tête
            scale: 0.5,
            zIndex: 10,
            imageSource: require('../../assets/accessories/accessory_halo_angel.png'),
        },
    },

    // ===== CORNES =====
    {
        id: 'accessory_horns_demon',
        name: 'Cornes Démon',
        description: 'Embrasse ton côté sombre.',
        category: 'horns',
        priceCredits: 200,
        rarity: 'epic',
        preview: '#8B0000',
        style: {
            position: 'head',
            offsetX: 0,
            offsetY: -25,  // Sur le haut de la tête
            scale: 0.6,
            zIndex: 10,
            imageSource: require('../../assets/accessories/accessory_horns_demon.png'),
        },
    },

    // ===== LUNETTES =====
    {
        id: 'accessory_glasses_heart',
        name: 'Lunettes Cœur',
        description: 'Kawaii vibes.',
        category: 'glasses',
        priceCredits: 75,
        rarity: 'rare',
        preview: '#FF69B4',
        style: {
            position: 'eyes',
            offsetX: 0,
            offsetY: -5,   // Au niveau des yeux
            scale: 0.55,
            zIndex: 10,
            imageSource: require('../../assets/accessories/accessory_glasses_heart.png'),
        },
    },

    // ===== EFFETS =====
    {
        id: 'accessory_flames_eyes',
        name: 'Flammes DBZ',
        description: 'Power level over 9000.',
        category: 'effect',
        priceCredits: 300,
        rarity: 'legendary',
        preview: '#00BFFF',
        isAnimated: true,
        style: {
            position: 'eyes',
            offsetX: 0,
            offsetY: -5,
            scale: 0.6,
            zIndex: 10,
            imageSource: require('../../assets/accessories/accessory_flames_eyes.png'),
        },
    },
];

// ==================== HELPERS ====================

/**
 * Récupère un accessoire par son ID
 */
export const getAccessory = (accessoryId: string): AccessoryItem | undefined => {
    return ACCESSORIES_CATALOG.find(a => a.id === accessoryId);
};

/**
 * Récupère tous les accessoires d'une catégorie
 */
export const getAccessoriesByCategory = (category: AccessoryCategory): AccessoryItem[] => {
    return ACCESSORIES_CATALOG.filter(a => a.category === category);
};

/**
 * Calcule le style de positionnement pour un accessoire sur un avatar de taille donnée
 */
export const getAccessoryPositionStyle = (
    accessory: AccessoryItem,
    avatarSize: number
): ViewStyle => {
    const { offsetX, offsetY, scale } = accessory.style;

    // Calcul de la taille de l'accessoire
    const accessorySize = avatarSize * scale;

    // Calcul du positionnement
    const left = (avatarSize / 2) - (accessorySize / 2) + (avatarSize * offsetX / 100);
    const top = (avatarSize / 2) - (accessorySize / 2) + (avatarSize * offsetY / 100);

    return {
        position: 'absolute',
        width: accessorySize,
        height: accessorySize,
        left,
        top,
        zIndex: accessory.style.zIndex,
    };
};

export default {
    ACCESSORIES_CATALOG,
    getAccessory,
    getAccessoriesByCategory,
    getAccessoryPositionStyle,
};
