// Theme et constantes de style pour PluralConnect

export const colors = {
    // Couleurs principales
    primary: '#8B5CF6', // Violet
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',

    // Couleurs secondaires
    secondary: '#EC4899', // Rose
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',

    // Accents
    accent: '#06B6D4', // Cyan
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Backgrounds - Dark Blue theme (comme Canva)
    background: '#0A1628', // Bleu très foncé
    backgroundLight: '#132039', // Bleu foncé
    backgroundCard: '#1E3A5F', // Bleu moyen

    // Texte
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',

    // Bordures
    border: '#3F3F5A',
    borderLight: '#52526A',

    // Gradient
    gradientStart: '#8B5CF6',
    gradientEnd: '#EC4899',
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
} as const;

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        color: colors.text,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: colors.text,
    },
    body: {
        fontSize: 16,
        color: colors.text,
    },
    bodySmall: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    caption: {
        fontSize: 12,
        color: colors.textMuted,
    },
} as const;

// Couleurs prédéfinies pour les alters
export const alterColors = [
    '#8B5CF6', // Violet
    '#EC4899', // Rose
    '#06B6D4', // Cyan
    '#10B981', // Vert
    '#F59E0B', // Orange
    '#EF4444', // Rouge
    '#3B82F6', // Bleu
    '#84CC16', // Lime
    '#F97316', // Orange vif
    '#14B8A6', // Teal
    '#A855F7', // Violet clair
    '#F43F5E', // Rose vif
] as const;
