/**
 * colorBlind.ts
 * Utilitaires de transformation de couleurs pour les différents types de daltonisme.
 * Matrices basées sur les recherches de Brettel, Viénot & Mollon (1997).
 */

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export const COLOR_BLIND_LABELS: Record<ColorBlindMode, string> = {
    none: 'Aucun',
    protanopia: 'Protanopie (rouge)',
    deuteranopia: 'Deutéranopie (vert)',
    tritanopia: 'Tritanopie (bleu)',
    achromatopsia: 'Achromatopsie (N&B)',
};

// 3x3 transformation matrices (row-major) for simulating color blindness
// These shift colors so that information lost to the deficiency is represented via other channels
type Matrix3x3 = [number, number, number, number, number, number, number, number, number];

const MATRICES: Record<Exclude<ColorBlindMode, 'none'>, Matrix3x3> = {
    // Protanopia: no L-cones (red)
    protanopia: [
        0.567, 0.433, 0.000,
        0.558, 0.442, 0.000,
        0.000, 0.242, 0.758,
    ],
    // Deuteranopia: no M-cones (green)
    deuteranopia: [
        0.625, 0.375, 0.000,
        0.700, 0.300, 0.000,
        0.000, 0.300, 0.700,
    ],
    // Tritanopia: no S-cones (blue)
    tritanopia: [
        0.950, 0.050, 0.000,
        0.000, 0.433, 0.567,
        0.000, 0.475, 0.525,
    ],
    // Achromatopsia: total color blindness → luminance only
    achromatopsia: [
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114,
    ],
};

function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [clamp(r), clamp(g), clamp(b)]
        .map(v => v.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Transforme une couleur hex selon un mode de daltonisme.
 */
export function transformColor(hex: string, mode: ColorBlindMode): string {
    if (mode === 'none') return hex;

    try {
        const [r, g, b] = hexToRgb(hex);
        const m = MATRICES[mode];

        const nr = m[0] * r + m[1] * g + m[2] * b;
        const ng = m[3] * r + m[4] * g + m[5] * b;
        const nb = m[6] * r + m[7] * g + m[8] * b;

        return rgbToHex(nr, ng, nb);
    } catch {
        return hex;
    }
}

/**
 * Couleurs de preview pour tester les transformations dans les réglages.
 */
export const PREVIEW_COLORS = ['#EF4444', '#22C55E', '#3B82F6', '#F59E0B'];
