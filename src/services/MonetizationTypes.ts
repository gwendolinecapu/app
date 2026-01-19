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
    | 'purchase_lootbox' // Achat Loot Box
    | 'ai_generation'    // Génération IA
    | 'task_completion'; // Complétion de tâche

/** Structure d'une transaction de crédits */
export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    type: CreditTransactionType;
    description?: string;
    itemId?: string; // ID de l'item acheté si applicable
    timestamp: number;
}

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

// ==================== CREDITS & COSTS ====================

export const REWARD_AD_AMOUNT = 10; // Crédits gagnés par pub regardée (Updated)
export const LOOT_BOX_PRICE = 30; // Coût d'une Loot Box

/** Configuration des gains de crédits */
export const CREDIT_REWARDS = {
    DAILY_LOGIN_FREE: 10,
    DAILY_LOGIN_PREMIUM: 25,
    REWARD_AD: REWARD_AD_AMOUNT,
    STREAK_7_DAYS: 100,
    STREAK_30_DAYS: 500,
} as const;

/** Coûts des fonctionnalités IA */
export const AI_COSTS = {
    RITUAL: 50,    // Coût fixe pour un rituel de naissance
    MAGIC_POST: 10, // Coût par image générée (Standard High Quality)
    MAGIC_POST_BATCH: 25, // Coût pour 3 images (Discount: 5 crédits offerts !)
};

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
    | 'accessory'       // Accessoire avatar (couronne, lunettes, etc.)
    | 'bundle'          // Pack groupé (thème + cadre + bulle)
    | 'lootbox';        // Boîte mystère

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
    // Loot Box
    {
        id: 'lootbox_standard',
        type: 'lootbox',
        name: 'Coffre Mystère',
        description: 'Gagnez des items rares ou des crédits !',
        priceCredits: LOOT_BOX_PRICE,
        rarity: 'common',
        featured: true,
    },
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
        description: 'Le thème par défaut.',
        priceCredits: 0,
        rarity: 'common',
        preview: '#1a1a2e',
    },
    {
        id: 'theme_ocean',
        type: 'theme',
        name: 'Océan',
        description: 'Bleu profond.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#0077b6',
    },
    {
        id: 'theme_forest',
        type: 'theme',
        name: 'Forêt',
        description: 'Vert naturel.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#2d6a4f',
    },
    {
        id: 'theme_midnight',
        type: 'theme',
        name: 'Minuit',
        description: 'Noir profond.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#0d1b2a',
    },
    {
        id: 'theme_cherry',
        type: 'theme',
        name: 'Cerisier',
        description: 'Rose délicat.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#ff758f',
    },
    {
        id: 'theme_cyberpunk',
        type: 'theme',
        name: 'Cyberpunk',
        description: 'Néons et haute technologie.',
        priceCredits: 20,
    },
    {
        id: 'theme_cafe_cosy',
        type: 'theme',
        name: 'Café Cosy',
        description: 'Ambiance chaleureuse.',
        priceCredits: 20,
        preview: '#8D6E63',
    },
    {
        id: 'theme_anim_aurora',
        type: 'theme',
        name: 'Aurore Boréale',
        description: 'Lueurs nordiques animées.',
        priceCredits: 75,
        featured: true,
        isAnimated: true,
    },
    {
        id: 'theme_anim_cosmos',
        type: 'theme',
        name: 'Cosmos',
        description: 'Voyage interstellaire animé.',
        priceCredits: 75,
        isAnimated: true,
    },
    {
        id: 'theme_winter',
        type: 'theme',
        name: 'Hiver Éternel',
        description: 'Chutes de neige animées.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#a5f3fc',
        isPremium: true,
        featured: true,
        isAnimated: true,
    },
    {
        id: 'theme_pink_cute',
        type: 'theme',
        name: 'Pink Cute',
        description: 'Douceur pastel.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#FFB7C5',
    },
    // MYTHIC THEMES (1500)
    {
        id: 'theme_cute_mint',
        type: 'theme',
        name: 'Mint Cute',
        description: 'Fraîcheur menthe douce.',
        priceCredits: 1000,
        preview: '#B5EAD7',
    },
    {
        id: 'theme_cute_sky',
        type: 'theme',
        name: 'Sky Cute',
        description: 'Douceur céleste.',
        priceCredits: 1000,
        preview: '#A2D2FF',
    },
    {
        id: 'theme_cute_lavender',
        type: 'theme',
        name: 'Lavender Cute',
        description: 'Sérénité lavande.',
        priceCredits: 1000,
        preview: '#CDB4DB',
    },
    {
        id: 'theme_cute_peach',
        type: 'theme',
        name: 'Peach Cute',
        description: 'Pêche sucrée.',
        priceCredits: 1000,
        preview: '#FFDAC1',
    },
    {
        id: 'theme_cute_lemon',
        type: 'theme',
        name: 'Lemon Cute',
        description: 'Zeste de citron doux.',
        priceCredits: 1000,
        preview: '#FFF9C4',
    },
    {
        id: 'theme_cute_aqua',
        type: 'theme',
        name: 'Aqua Cute',
        description: 'Lagon pastel.',
        priceCredits: 1000,
        preview: '#99F6E4',
    },
    {
        id: 'theme_cute_cream',
        type: 'theme',
        name: 'Cream Cute',
        description: 'Douceur crème.',
        priceCredits: 1000,
        preview: '#FDFBF7',
    },
    {
        id: 'theme_cute_coral',
        type: 'theme',
        name: 'Coral Cute',
        description: 'Récif pastel.',
        priceCredits: 1000,
        preview: '#FF9AA2',
    },

    // ========== CADRES ==========
    {
        id: 'frame_default',
        type: 'frame',
        name: 'Simple',
        description: 'Cadre basique.',
        priceCredits: 0,
        rarity: 'common',
        preview: '#6b7280',
        icon: 'ellipse-outline',
    },
    {
        id: 'frame_square',
        type: 'frame',
        name: 'Carré',
        description: 'Forme moderne.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#3b82f6',
        icon: 'square-outline',
    },
    {
        id: 'frame_double',
        type: 'frame',
        name: 'Double',
        description: 'Double bordure.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#8b5cf6',
        icon: 'radio-button-off-outline',
    },
    {
        id: 'frame_rainbow',
        type: 'frame',
        name: 'Arc-en-ciel',
        description: 'Toutes les couleurs.',
        priceCredits: 20,
    },
    {
        id: 'frame_neon',
        type: 'frame',
        name: 'Néon',
        description: 'Lueur fluorescente.',
        priceCredits: 20,
    },
    {
        id: 'frame_bamboo_sanctuary',
        type: 'frame',
        name: 'Bambou',
        description: 'Sérénité zen.',
        priceCredits: 20,
        icon: 'leaf-outline',
    },
    {
        id: 'frame_gold',
        type: 'frame',
        name: 'Or',
        description: 'Bordure dorée.',
        priceCredits: 75,
    },
    {
        id: 'frame_pirate_wreck',
        type: 'frame',
        name: 'Pirate',
        description: 'Trésors engloutis.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#78350f',
        icon: 'skull-outline',
    },
    {
        id: 'frame_biolum_lagoon',
        type: 'frame',
        name: 'Lagon',
        description: 'Bioluminescence.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#0ea5e9',
        icon: 'water-outline',
        isPremium: true,
    },
    {
        id: 'frame_enchanted_forest',
        type: 'frame',
        name: 'Féerique',
        description: 'Style Cottagecore.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#d946ef',
        icon: 'rose-outline',
        isPremium: true,
    },
    {
        id: 'frame_arctic_winter',
        type: 'frame',
        name: 'Arctique',
        description: 'Glace éternelle.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#bae6fd',
        icon: 'snow-outline',
        isPremium: true,
    },
    {
        id: 'frame_tropical',
        type: 'frame',
        name: 'Tropical',
        description: 'Vacances animées.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#4ade80',
        icon: 'leaf-outline',
        isAnimated: true,
    },
    {
        id: 'frame_flames',
        type: 'frame',
        name: 'Flammes',
        description: 'Feu animé.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#ff4500',
        icon: 'flame-outline',
        isPremium: true,
        isAnimated: true,
    },
    {
        id: 'frame_nature_mystic',
        type: 'frame',
        name: 'Mystique',
        description: 'Forêt enchantée animée.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#2d6a4f',
        icon: 'leaf-outline',
        isAnimated: true,
        featured: true,
    },
    {
        id: 'frame_anim_galaxy',
        type: 'frame',
        name: 'Galaxie',
        description: 'Rotation cosmique.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#8b5cf6',
        icon: 'planet-outline',
        isPremium: true,
        featured: true,
    },
    {
        id: 'frame_anim_sakura',
        type: 'frame',
        name: 'Sakura',
        description: 'Pétales animés premium.',
        priceCredits: 1000,
        rarity: 'mythic',
        preview: '#FFB7C5',
        icon: 'flower-outline',
        isPremium: true,
        isAnimated: true,
        featured: true,
    },
    {
        id: 'frame_hearts_pink',
        type: 'frame',
        name: 'Cœurs Roses',
        description: 'Romantique et doux.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#E85D8C',
        icon: 'heart-outline',
    },
    {
        id: 'frame_kawaii_animals',
        type: 'frame',
        name: 'Animaux Kawaii',
        description: 'Mignon et adorable.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#FFB5BA',
        icon: 'paw-outline',
        featured: true,
    },
    {
        id: 'frame_halloween_cats',
        type: 'frame',
        name: 'Halloween',
        description: 'Chats noirs mystérieux.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#FF9800',
        icon: 'moon-outline',
    },
    {
        id: 'frame_gothic_red',
        type: 'frame',
        name: 'Gothique',
        description: 'Rouge intense et épineux.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#8B0000',
        icon: 'skull-outline',
    },
    {
        id: 'frame_tropical_hibiscus',
        type: 'frame',
        name: 'Hibiscus Tropical',
        description: 'Eau et fleurs exotiques.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#00BFFF',
        icon: 'flower-outline',
        featured: true,
    },
    {
        id: 'frame_moon_stars',
        type: 'frame',
        name: 'Lune Étoilée',
        description: 'Étoiles scintillantes.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#FFB833',
        icon: 'star-outline',
    },
    {
        id: 'frame_golden_waves',
        type: 'frame',
        name: 'Spirales Dorées',
        description: 'Élégance royale.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#D4AF37',
        icon: 'infinite-outline',
    },
    {
        id: 'frame_water_drops',
        type: 'frame',
        name: 'Gouttes d\'Eau',
        description: 'Fraîcheur aquatique.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#00CED1',
        icon: 'water-outline',
    },
    {
        id: 'frame_target_red',
        type: 'frame',
        name: 'Cible',
        description: 'Focus et précision.',
        priceCredits: 20,
        rarity: 'rare',
        preview: '#8B2500',
        icon: 'locate-outline',
    },
    {
        id: 'frame_lavender_floral',
        type: 'frame',
        name: 'Lavande Florale',
        description: 'Jardin enchanteur.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#9370DB',
        icon: 'flower-outline',
        featured: true,
    },
    {
        id: 'frame_sparkles_gold',
        type: 'frame',
        name: 'Sparkles Dorés',
        description: 'Éclat magique.',
        priceCredits: 250,
        rarity: 'legendary',
        preview: '#FFD700',
        icon: 'sparkles-outline',
        featured: true,
    },
    {
        id: 'frame_ice_crystal',
        type: 'frame',
        name: 'Glace Cristal',
        description: 'Pure et glaciale.',
        priceCredits: 75,
        rarity: 'epic',
        preview: '#87CEEB',
        icon: 'snow-outline',
    },

    // ========== BULLES ==========
    {
        id: 'bubble_default',
        type: 'bubble',
        name: 'Classique',
        description: 'Bulle standard.',
        priceCredits: 0,
        rarity: 'common',
        preview: '#6366f1',
        icon: 'chatbubble-outline',
    },
    {
        id: 'bubble_round',
        type: 'bubble',
        name: 'Ronde',
        description: 'Arrondie.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#22c55e',
        icon: 'chatbubble-ellipses-outline',
    },
    {
        id: 'bubble_cloud',
        type: 'bubble',
        name: 'Nuage',
        description: 'Style BD.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#f59e0b',
        icon: 'cloud-outline',
    },
    {
        id: 'bubble_pixel',
        type: 'bubble',
        name: 'Pixel',
        description: 'Style Rétro.',
        priceCredits: 1,
        rarity: 'common',
        preview: '#84cc16',
        icon: 'grid-outline',
    },
    {
        id: 'bubble_gradient',
        type: 'bubble',
        name: 'Dégradé',
        description: 'Couleurs fondues.',
        priceCredits: 20,
    },
    {
        id: 'bubble_glass',
        type: 'bubble',
        name: 'Verre',
        description: 'Glassmorphism.',
        priceCredits: 20,
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
