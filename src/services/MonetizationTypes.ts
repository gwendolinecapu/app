/**
 * MonetizationTypes.ts
 * Types pour le système de monétisation
 * 
 * Inclut: publicités, premium, crédits, décorations
 */

// ==================== PUBLICITÉS ====================

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
}

/** Configuration premium par défaut */
export const DEFAULT_MONETIZATION_STATUS: MonetizationStatus = {
    tier: 'free',
    trialEndDate: null,
    premiumEndDate: null,
    adFreeUntil: null,
    credits: 0,
    lastDailyLogin: null,
    rewardAdsToday: 0,
    rewardAdsForAdFree: 0,
    rewardAdsForPremium: 0,
    hasUsedFreeMonth: false,
    decorations: [],
    silentTrialStartDate: null,
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
    | 'refund'          // Remboursement
    | 'gift';           // Cadeau admin

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
    | 'bubble';         // Bulle de chat

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
    preview?: string;           // Hex color, emoji, or preview string
    isPremium?: boolean;        // Inclus dans le premium
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

// ==================== DÉCORATIONS ====================

/** Type de décoration */
export type DecorationType =
    | 'alter_border'    // Contour bulle alter
    | 'profile_frame'   // Cadre profil
    | 'badge'           // Badge sur profil
    | 'background';     // Fond de carte alter

/** Rareté de décoration */
export type DecorationRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Couleurs par rareté */
export const RARITY_COLORS: Record<DecorationRarity, string> = {
    common: '#9CA3AF',     // Gris
    rare: '#3B82F6',       // Bleu
    epic: '#8B5CF6',       // Violet
    legendary: '#F59E0B',  // Or
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
    DECORATION_PRICES,
    RARITY_COLORS,
    AD_CONFIG,
    DEFAULT_MONETIZATION_STATUS,
};
