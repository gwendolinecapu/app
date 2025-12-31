/**
 * Theme Configuration - Système de design centralisé pour l'application
 * Contient toutes les couleurs, espacements, typographies et rayons de bordure
 */

// Palette de couleurs principales de l'application - Style Canva (Bleu foncé)
export const colors = {
    // Couleurs de base
    primary: '#8B5CF6',       // Violet principal - utilisé pour les actions et accents
    primaryDark: '#7C3AED',   // Violet foncé - pour les états hover/pressed
    primaryLight: '#A78BFA',  // Violet clair - pour les backgrounds subtils
    textOnPrimary: '#FFFFFF', // Texte sur fond primary

    // Couleurs de texte
    text: '#FFFFFF',          // Texte principal sur fond sombre
    textSecondary: '#A3BFDB', // Texte secondaire/labels
    textMuted: '#6B8DB5',     // Texte très atténué (placeholders)

    // Couleurs de fond - THÈME BLEU FONCÉ CANVA
    background: '#0F2847',           // Fond principal - bleu foncé Canva
    backgroundCard: '#163560',       // Fond des cartes - bleu moyen
    surface: '#163560',              // Alias pour backgroundCard, utilisé dans certains composants
    backgroundLight: '#1E4275',      // Fond des inputs - bleu clair

    // Bordures et séparateurs
    border: '#2A5A8F',               // Bordure par défaut (bleu)
    borderLight: '#3A6AA0',          // Bordure plus visible

    // États et feedback
    success: '#22C55E',       // Vert - succès, validation
    error: '#EF4444',         // Rouge - erreurs
    errorBackground: '#391818', // Rouge foncé - fond erreurs / SOS
    warning: '#F59E0B',       // Orange - avertissements
    info: '#3B82F6',          // Bleu - informations

    // Couleur secondaire (utilisée pour les badges Premium, indicateurs host)
    secondary: '#F59E0B',     // Orange/doré - pour éléments premium et indicateurs

    // Couleurs de gradient (utilisées pour les LinearGradient)
    gradientStart: '#8B5CF6', // Violet - début du gradient
    gradientEnd: '#6366F1',   // Indigo - fin du gradient
};

export type ThemeColors = typeof colors;

// Couleurs disponibles pour les profils (alters)
// Ces couleurs sont proposées lors de la création/édition d'un alter

// Couleurs GRATUITES - basiques (blanc, noir, bleu)
export const freeAlterColors = [
    '#FFFFFF',  // Blanc
    '#1A1A2E',  // Noir/Bleu très foncé
    '#3B82F6',  // Bleu vif
    '#6366F1',  // Indigo
    '#0EA5E9',  // Bleu ciel
];

// Couleurs PREMIUM - toutes les autres couleurs
export const premiumAlterColors = [
    '#EC4899',  // Rose vif ⭐
    '#F472B6',  // Rose clair ⭐
    '#8B5CF6',  // Violet ⭐
    '#A855F7',  // Violet clair ⭐
    '#FF6B6B',  // Rouge corail
    '#EF4444',  // Rouge vif
    '#F97316',  // Orange
    '#F59E0B',  // Jaune doré
    '#FBBF24',  // Jaune
    '#22C55E',  // Vert émeraude
    '#10B981',  // Vert menthe
    '#14B8A6',  // Turquoise
    '#4ECDC4',  // Turquoise clair
    '#06B6D4',  // Cyan
];

// Toutes les couleurs combinées (pour affichage)
export const alterColors = [...freeAlterColors, ...premiumAlterColors];

// Système d'espacement cohérent (basé sur 4px)
export const spacing = {
    xs: 4,    // Espacement minimal
    sm: 8,    // Petit espacement (entre éléments proches)
    md: 16,   // Espacement moyen (padding standard)
    lg: 24,   // Grand espacement (sections)
    xl: 32,   // Très grand espacement
    xxl: 48,  // Espacement maximum
};

// Rayons de bordure pour les coins arrondis
export const borderRadius = {
    sm: 4,    // Coins légèrement arrondis
    md: 8,    // Coins arrondis standard
    lg: 12,   // Coins plus arrondis
    xl: 16,   // Coins très arrondis
    full: 9999, // Cercle parfait
};

// Système typographique
export const typography = {
    // Titres
    h1: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
    h2: {
        fontSize: 22,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: colors.text,
    },
    // Corps de texte
    body: {
        fontSize: 16,
        fontWeight: 'normal' as const,
        color: colors.text,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: 'normal' as const,
        color: colors.textSecondary,
    },
    // Légendes et petits textes
    caption: {
        fontSize: 12,
        fontWeight: 'normal' as const,
        color: colors.textMuted,
    },
    tiny: {
        fontSize: 10,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
    button: {
        fontSize: 16,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
};
