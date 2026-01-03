/**
 * MonetizationTypes.ts
 * Types pour le système de monétisation
 * 
 * Inclut: publicités, premium, crédits, décorations
 */

// ==================== PUBLICITÉS ====================

// ==================== LOOT BOXES ====================

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface DropRate {
    rarity: Rarity;
    chance: number;
}

export interface LootBoxType {
    id: string;
    name: string;
    price: number;
    description: string;
    color: string;
    dropRates: DropRate[];
}

/** Types de publicités disponibles */
export type AdType = 'banner' | 'native' | 'interstitial' | 'rewarded';

/** Réseaux publicitaires pour la médiation */
export type AdNetwork = 'admob' | 'unity' | 'applovin';

/** Placement des bannières */
export type BannerPlacement =
    | 'settings'      // Page settings
    | 'journal_list'  // Liste des entrées journal
    | 'alter_list'    // Liste des alters
    | 'stats';        // Page statistiques

/** Résultat d'une pub reward */
export interface RewardResult {
    completed: boolean;
    rewardType: 'credits' | 'ad_free' | 'premium';
    rewardAmount: number;
    network: AdNetwork;
}

/** Données pour pub native (style feed) */
export interface NativeAdData {
    headline: string;
    body: string;
    callToAction: string;
    imageUrl?: string;
    videoUrl?: string;
    iconUrl?: string;
    advertiser: string;
    starRating?: number;
    network: AdNetwork;
}

// ==================== PREMIUM ====================

/** Statut de l'utilisateur */
export type UserTier = 'free' | 'premium' | 'trial';

/** Durée d'abonnement premium */
export type PremiumDuration = 'monthly' | 'yearly';

/** Statut complet de monétisation */
export interface MonetizationStatus {
    tier: UserTier;
    trialEndDate: number | null;        // Timestamp fin trial
    premiumEndDate: number | null;      // Timestamp fin premium
    adFreeUntil: number | null;         // Timestamp fin sans pub
    credits: number;                     // Solde crédits
    lastDailyLogin: number | null;      // Dernier claim quotidien
    rewardAdsToday: number;             // Reward ads regardés aujourd'hui
    rewardAdsForAdFree: number;         // Progression vers 7j sans pub (0-3)
    rewardAdsForPremium: number;        // Progression vers 7j premium (0-15)
    hasUsedFreeMonth: boolean;          // A déjà utilisé les 30j offerts
    decorations: string[];              // IDs des décorations possédées
    silentTrialStartDate: number | null;// Début du trial silencieux (sans CB)
    hasSeenConversionModal: boolean;    // A vu la popup de conversion fin trial
}

/** Configuration premium par défaut */
export const DEFAULT_MONETIZATION_STATUS: MonetizationStatus = {
    tier: 'free',
    trialEndDate: null,
    premiumEndDate: null,
    adFreeUntil: null,
    credits: 100, // Adjusted default as per user feedback
    lastDailyLogin: null,
    rewardAdsToday: 0,
    rewardAdsForAdFree: 0,
    rewardAdsForPremium: 0,
    hasUsedFreeMonth: false,
    decorations: [],
    silentTrialStartDate: null,
    hasSeenConversionModal: false,
};

// ==================== CRÉDITS ====================

/** Type de transaction de crédits */
export type CreditTransactionType =
    | 'daily_login'     // Connexion quotidienne
    | 'daily_login_premium' // Connexion quotidienne premium
    | 'reward_ad'       // Pub reward
    | 'streak_bonus'    // Bonus streak 7 jours
    | 'purchase_iap'    // Achat in-app
    | 'spend_decoration' // Achat décoration
    | 'spend_ad_free'   // Achat sans pub
    | 'spend_premium'   // Achat premium temp
    | 'bug_report_reward' // Récompense pour rapport de bug
    | 'refund'          // Remboursement
    | 'gift'            // Cadeau admin
    | 'purchase_lootbox'; // Achat Loot Box

/** Transaction de crédits */
export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;           // Positif = gain, négatif = dépense
    type: CreditTransactionType;
    description?: string;
    itemId?: string;          // ID de l'item acheté si applicable
    timestamp: number;
}

/** Configuration des gains de crédits */
export const CREDIT_REWARDS = {
    DAILY_LOGIN_FREE: 10,
    DAILY_LOGIN_PREMIUM: 25,
    REWARD_AD: 50,
    STREAK_7_DAYS: 100,
    STREAK_30_DAYS: 500,
} as const;

// ==================== BOUTIQUE ====================

/** Type de produit en boutique */
export type ShopItemType =
    | 'decoration'      // Décoration cosmétique (Legacy)
    | 'ad_free'         // Sans pub temporaire
    | 'premium_days'    // Premium temporaire
    | 'credit_pack'     // Pack de crédits (IAP)
    | 'theme'           // Thème d'application
    | 'frame'           // Cadre d'avatar
    | 'bubble'          // Bulle de chat
    | 'bundle';         // Pack groupé (thème + cadre + bulle)

/** Produit en boutique */
export interface ShopItem {
    id: string;
    type: ShopItemType;
    name: string;
    description: string;
    priceCredits?: number;      // Prix en crédits (null si IAP)
    priceIAP?: string;          // ID produit IAP (legacy/placeholder)
    revenueCatPackageId?: string; // ID Package RevenueCat (e.g. 'premium_monthly', 'credits_500')
    priceFiat?: number;         // Prix en € pour affichage
    duration?: number;          // Durée en jours (pour ad_free/premium)
    decorationId?: string;      // ID décoration (pour type decoration)
    featured?: boolean;         // Mis en avant
    discount?: number;          // % de réduction
    // Visuals
    preview?: string;           // Hex color (pour thèmes)
    icon?: string;              // Nom de l'icône Ionicons
    isPremium?: boolean;        // Inclus dans le premium
    isAnimated?: boolean;       // Contient une animation (Badge Luxe)
    rarity?: Rarity;            // Rareté (common, rare, epic, legendary, mythic)
}

/** Packs de crédits IAP */
export const CREDIT_PACKS: ShopItem[] = [
    {
        id: 'credits_500',
        type: 'credit_pack',
        name: '500 Crédits',
        description: 'Pack de base',
        priceIAP: 'com.pluralconnect.credits.500',
        priceFiat: 0.99,
    },
    {
        id: 'credits_1500',
        type: 'credit_pack',
        name: '1 500 Crédits',
        description: 'Pack populaire (+50% bonus)',
        priceIAP: 'com.pluralconnect.credits.1500',
        priceFiat: 2.49,
        featured: true,
    },
    {
        id: 'credits_5000',
        type: 'credit_pack',
        name: '5 000 Crédits',
        description: 'Mega pack (+100% bonus)',
        priceIAP: 'com.pluralconnect.credits.5000',
        priceFiat: 6.99,
        discount: 30,
    },
];

/** Packs Premium IAP */
export const PREMIUM_PACKS: ShopItem[] = [
    {
        id: 'premium_monthly',
        type: 'premium_days',
        name: 'Premium Mensuel',
        description: '3.49€ / mois',
        priceIAP: 'com.pluralconnect.premium.monthly',
        revenueCatPackageId: '$rc_monthly', // RevenueCat Identifier usually maps simple names
        priceFiat: 3.49,
        duration: 30,
    },
    {
        id: 'premium_yearly',
        type: 'premium_days',
        name: 'Premium Annuel',
        description: '24.99€ / an (Economisez 40%)',
        priceIAP: 'com.pluralconnect.premium.yearly',
        revenueCatPackageId: '$rc_annual',
        priceFiat: 24.99,
        duration: 365,
        discount: 40,
        featured: true,
    },
    {
        id: 'premium_lifetime',
        type: 'premium_days',
        name: 'Premium à Vie',
        description: '49.99€ une seule fois',
        priceIAP: 'com.pluralconnect.premium.lifetime',
        revenueCatPackageId: '$rc_lifetime',
        priceFiat: 49.99,
        duration: 36500, // ~100 ans
        discount: 0,
    },
];

/** Items achetables avec crédits */
export const CREDIT_ITEMS: ShopItem[] = [
    // Sans pub
    {
        id: 'ad_free_1d',
        type: 'ad_free',
        name: '1 Jour sans pub',
        description: 'Profitez sans interruption',
        priceCredits: 50,
        duration: 1,
    },
    {
        id: 'ad_free_7d',
        type: 'ad_free',
        name: '7 Jours sans pub',
        description: 'Une semaine tranquille',
        priceCredits: 300,
        duration: 7,
        featured: true,
    },
    {
        id: 'ad_free_30d',
        type: 'ad_free',
        name: '30 Jours sans pub',
        description: 'Un mois complet',
        priceCredits: 1000,
        duration: 30,
    },
    // Premium temporaire
    {
        id: 'premium_1d',
        type: 'premium_days',
        name: '1 Jour Premium',
        description: 'Toutes les fonctionnalités',
        priceCredits: 75,
        duration: 1,
    },
    {
        id: 'premium_7d',
        type: 'premium_days',
        name: '7 Jours Premium',
        description: 'Une semaine complète',
        priceCredits: 450,
        duration: 7,
        featured: true,
    },
];

// ==================== COSMÉTIQUES (THÈMES, CADRES, BULLES) ====================

/** Items cosmétiques de la boutique */
export const COSMETIC_ITEMS: ShopItem[] = [
    // ========== THÈMES ==========
    {
        id: 'theme_default',
        type: 'theme',
        name: 'Classique',
        description: 'Le thème par défaut de l\'application.',
        priceCredits: 0,
        preview: '#1a1a2e',
    },
    {
        id: 'theme_ocean',
        type: 'theme',
        name: 'Océan',
        description: 'Bleu profond comme les abysses.',
        priceCredits: 50,
        preview: '#0077b6',
    },
    {
        id: 'theme_forest',
        type: 'theme',
        name: 'Forêt',
        description: 'Vert naturel et apaisant.',
        priceCredits: 50,
        preview: '#2d6a4f',
    },
    {
        id: 'theme_sunset',
        type: 'theme',
        name: 'Coucher de soleil',
        description: 'Tons chauds orangés.',
        priceCredits: 75,
        preview: '#e85d04',
    },
    {
        id: 'theme_lavender',
        type: 'theme',
        name: 'Lavande',
        description: 'Violet doux et relaxant.',
        priceCredits: 75,
        preview: '#9d4edd',
    },
    {
        id: 'theme_cyberpunk',
        type: 'theme',
        name: 'Cyberpunk',
        description: 'Néons et haute technologie.',
        priceCredits: 150,
        preview: '#ff00ff',
        isPremium: true,
    },
    {
        id: 'theme_midnight',
        type: 'theme',
        name: 'Minuit',
        description: 'Noir profond étoilé.',
        priceCredits: 100,
        preview: '#0d1b2a',
    },
    {
        id: 'theme_cherry',
        type: 'theme',
        name: 'Cerisier',
        description: 'Rose délicat du printemps.',
        priceCredits: 100,
        preview: '#ff758f',
    },
    {
        id: 'theme_anim_aurora',
        type: 'theme',
        name: 'Aurore Boréale',
        description: 'Lueurs nordiques vivantes.',
        priceCredits: 300,
        preview: '#00ff9d',
        isPremium: true,
        featured: true,
        isAnimated: true,
    },
    {
        id: 'theme_anim_cosmos',
        type: 'theme',
        name: 'Cosmos',
        description: 'Voyage interstellaire animé.',
        priceCredits: 350,
        preview: '#4b0082',
        isPremium: true,
        isAnimated: true,
    },
    {
        id: 'theme_winter',
        type: 'theme',
        name: 'Hiver Éternel',
        description: 'Ambiance hivernale avec chutes de neige animées.',
        priceCredits: 500,
        preview: '#a5f3fc',
        isPremium: true,
        featured: true,
        isAnimated: true,
    },
    {
        id: 'theme_cafe_cosy',
        type: 'theme',
        name: 'Café Cosy',
        description: 'Tons bruns chaleureux, ambiance café réconfortante.',
        priceCredits: 200,
        preview: '#8D6E63',
        isPremium: false,
    },
    {
        id: 'theme_pink_cute',
        type: 'theme',
        name: 'Pink Cute',
        description: 'Douceur pastel et ambiance kawaii.',
        priceCredits: 2000,
        preview: '#FFB7C5',
        isPremium: false,
    },
    {
        id: 'theme_cute_mint',
        type: 'theme',
        name: 'Mint Cute',
        description: 'Fraîcheur menthe douce.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#B4F8C8',
        isPremium: false,
    },
    {
        id: 'theme_cute_sky',
        type: 'theme',
        name: 'Sky Cute',
        description: 'Douceur céleste.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#A0E7E5',
        isPremium: false,
    },
    {
        id: 'theme_cute_lavender',
        type: 'theme',
        name: 'Lavender Cute',
        description: 'Sérénité lavande.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#E6E6FA',
        isPremium: false,
    },
    {
        id: 'theme_cute_peach',
        type: 'theme',
        name: 'Peach Cute',
        description: 'Pêche sucrée.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#FFDAB9',
        isPremium: false,
    },
    {
        id: 'theme_cute_lemon',
        type: 'theme',
        name: 'Lemon Cute',
        description: 'Zeste de citron doux.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#FFFACD',
        isPremium: false,
    },
    {
        id: 'theme_cute_aqua',
        type: 'theme',
        name: 'Aqua Cute',
        description: 'Lagon pastel.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#E0FFFF',
        isPremium: false,
    },
    {
        id: 'theme_cute_cream',
        type: 'theme',
        name: 'Cream Cute',
        description: 'Douceur crème.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#FDF5E6',
        isPremium: false,
    },
    {
        id: 'theme_cute_coral',
        type: 'theme',
        name: 'Coral Cute',
        description: 'Récif pastel.',
        priceCredits: 5000,
        rarity: 'mythic',
        preview: '#FFB7B2',
        isPremium: false,
    },

    // ========== CADRES ==========
    {
        id: 'frame_default',
        type: 'frame',
        name: 'Simple',
        description: 'Cadre basique et élégant.',
        priceCredits: 0,
        preview: '#6b7280',
        icon: 'ellipse-outline',
    },
    {
        id: 'frame_double',
        type: 'frame',
        name: 'Double',
        description: 'Double bordure raffinée.',
        priceCredits: 75,
        preview: '#8b5cf6',
        icon: 'radio-button-off-outline',
    },
    {
        id: 'frame_square',
        type: 'frame',
        name: 'Carré',
        description: 'Forme carrée moderne.',
        priceCredits: 50,
        preview: '#3b82f6',
        icon: 'square-outline',
    },
    {
        id: 'frame_neon',
        type: 'frame',
        name: 'Néon',
        description: 'Lueur fluorescente.',
        priceCredits: 150,
        preview: '#00ff00',
        icon: 'sunny-outline',
        isPremium: true,
    },
    {
        id: 'frame_gold',
        type: 'frame',
        name: 'Or',
        description: 'Bordure dorée prestigieuse.',
        priceCredits: 200,
        preview: '#ffd700',
        icon: 'star-outline',
        isPremium: true,
    },
    {
        id: 'frame_rainbow',
        type: 'frame',
        name: 'Arc-en-ciel',
        description: 'Toutes les couleurs réunies.',
        priceCredits: 175,
        preview: '#ff6b6b',
        icon: 'color-palette-outline',
        isPremium: true,
    },
    {
        id: 'frame_anim_galaxy',
        type: 'frame',
        name: 'Galaxie',
        description: 'Rotation cosmique animée.',
        priceCredits: 400,
        preview: '#8b5cf6',
        icon: 'planet-outline',
        isPremium: true,
        featured: true,
    },
    {
        id: 'frame_flames',
        type: 'frame',
        name: 'Flammes',
        description: 'Bordure enflammée.',
        priceCredits: 250,
        preview: '#ff4500',
        icon: 'flame-outline',
        isPremium: true,
    },
    {
        id: 'frame_anim_sakura',
        type: 'frame',
        name: 'Pétales de Cerisier',
        description: 'Un cadre élégant avec des pétales de sakura qui tombent gracieusement.',
        priceCredits: 800,
        preview: '#FFB7C5',
        icon: 'flower-outline',
        isPremium: true,
        isAnimated: true,
        featured: true,
    },
    {
        id: 'frame_mystic_forest',
        type: 'frame',
        name: 'Forêt Enchantée',
        description: 'Un cadre mystique aux champignons lumineux.',
        priceCredits: 5000,
        preview: '#2d6a4f',
        icon: 'leaf-outline',
        rarity: 'mythic',
    },
    {
        id: 'frame_mystic_beach',
        type: 'frame',
        name: 'Lagon Tropical',
        description: 'Un cadre paradisiaque aux palmiers et coquillages.',
        priceCredits: 5000,
        preview: '#00b4d8',
        icon: 'water-outline',
        rarity: 'mythic',
    },

    // ========== BULLES ==========
    {
        id: 'bubble_default',
        type: 'bubble',
        name: 'Classique',
        description: 'Bulle de chat standard.',
        priceCredits: 0,
        preview: '#6366f1',
        icon: 'chatbubble-outline',
    },
    {
        id: 'bubble_round',
        type: 'bubble',
        name: 'Ronde',
        description: 'Formes arrondies douces.',
        priceCredits: 50,
        preview: '#22c55e',
        icon: 'chatbubble-ellipses-outline',
    },
    {
        id: 'bubble_square',
        type: 'bubble',
        name: 'Carrée',
        description: 'Angles nets et modernes.',
        priceCredits: 50,
        preview: '#ef4444',
        icon: 'chatbox-outline',
    },
    {
        id: 'bubble_cloud',
        type: 'bubble',
        name: 'Nuage',
        description: 'Comme dans les BD.',
        priceCredits: 75,
        preview: '#f59e0b',
        icon: 'cloud-outline',
    },
    {
        id: 'bubble_gradient',
        type: 'bubble',
        name: 'Dégradé',
        description: 'Couleurs qui se fondent.',
        priceCredits: 125,
        preview: '#ec4899',
        icon: 'color-wand-outline',
        isPremium: true,
    },
    {
        id: 'bubble_glass',
        type: 'bubble',
        name: 'Verre',
        description: 'Effet glassmorphism.',
        priceCredits: 150,
        preview: '#06b6d4',
        icon: 'cube-outline',
        isPremium: true,
    },
    {
        id: 'bubble_pixel',
        type: 'bubble',
        name: 'Pixel',
        description: 'Style rétro 8-bits.',
        priceCredits: 100,
        preview: '#84cc16',
        icon: 'grid-outline',
    },
    {
        id: 'bubble_comic',
        type: 'bubble',
        name: 'BD',
        description: 'Style bande dessinée.',
        priceCredits: 100,
        preview: '#fbbf24',
        icon: 'newspaper-outline',
    },
];

// ==================== DÉCORATIONS ====================

/** Type de décoration */
export type DecorationType =
    | 'alter_border'    // Contour bulle alter
    | 'profile_frame'   // Cadre profil
    | 'badge'           // Badge sur profil
    | 'background';     // Fond de carte alter

/** Rareté de décoration */
export type DecorationRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** Couleurs par rareté */
export const RARITY_COLORS: Record<DecorationRarity, string> = {
    common: '#9CA3AF',     // Gris
    rare: '#3B82F6',       // Bleu
    epic: '#8B5CF6',       // Violet
    legendary: '#F59E0B',  // Or
    mythic: '#FF0000',     // Rouge (si on ajoute des décos mythiques plus tard)
};

/** Décoration cosmétique */
export interface Decoration {
    id: string;
    name: string;
    description: string;
    type: DecorationType;
    rarity: DecorationRarity;
    priceCredits: number;
    asset: string;           // Chemin vers l'asset
    animatedAsset?: string;  // Animation (légendaires)
    unlockCondition?: string; // Condition de déblocage spéciale
}

/** Prix par rareté */
export const DECORATION_PRICES: Record<DecorationRarity, number> = {
    common: 100,
    rare: 250,
    epic: 500,
    legendary: 1000,
    mythic: 2000,
};

// ==================== CONFIGURATION PUBS ====================

/** Configuration de la fréquence des pubs */
export const AD_CONFIG = {
    // Fréquence pub native dans le feed (1 pub tous les X posts)
    NATIVE_AD_FREQUENCY: 5,

    // Délai minimum entre 2 interstitiels (secondes)
    INTERSTITIAL_COOLDOWN: 120,

    // Max reward ads par jour
    MAX_REWARD_ADS_PER_DAY: 10,

    // Reward ads pour 7j sans pub
    REWARD_ADS_FOR_AD_FREE: 3,

    // Reward ads pour 7j premium
    REWARD_ADS_FOR_PREMIUM: 15,

    // Durée trial en jours
    TRIAL_DURATION_DAYS: 14,

    // Durée offerte après trial (1x)
    FREE_MONTH_DAYS: 30,
} as const;

// ==================== EXPORTS ====================

export default {
    CREDIT_REWARDS,
    CREDIT_PACKS,
    CREDIT_ITEMS,
    COSMETIC_ITEMS,
    DECORATION_PRICES,
    RARITY_COLORS,
    AD_CONFIG,
    DEFAULT_MONETIZATION_STATUS,
};
