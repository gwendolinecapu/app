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
    textSecondary: '#94A3B8', // Texte secondaire/labels (slate-400)
    textMuted: '#64748B',     // Texte très atténué (placeholders) (slate-500)

    // Couleurs de fond - NOUVEAU THÈME BLEU FONCÉ (style Canva)
    background: '#0A1628',           // Fond principal de l'app (bleu très foncé)
    backgroundCard: '#122240',       // Fond des cartes et modales (bleu foncé)
    backgroundLight: '#1A3050',      // Fond des inputs et éléments surélevés

    // Bordures et séparateurs
    border: '#1E3A5F',               // Bordure par défaut (bleu)
    borderLight: '#2A4A70',          // Bordure plus visible

    // États et feedback
    success: '#22C55E',       // Vert - succès, validation
    error: '#EF4444',         // Rouge - erreurs
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
export const alterColors = [
    '#FF6B6B',  // Rouge corail
    '#4ECDC4',  // Turquoise
    '#45B7D1',  // Bleu ciel
    '#96CEB4',  // Vert menthe
    '#FFEAA7',  // Jaune pâle
    '#DDA0DD',  // Violet plum
    '#98D8C8',  // Vert d'eau
    '#F7DC6F',  // Jaune doré
    '#BB8FCE',  // Lavande
    '#85C1E9',  // Bleu pastel
    '#F8B500',  // Orange
    '#E74C3C',  // Rouge vif
];

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
    button: {
        fontSize: 16,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
};
