import { ViewStyle, TextStyle, ImageSourcePropType } from 'react-native';
import { COSMETIC_ITEMS, ShopItem } from '../services/MonetizationTypes';
import { colors } from './theme';

// ==================== HELPERS ====================

/**
 * Récupère un item cosmétique par son ID
 */
export const getCosmeticItem = (itemId: string): ShopItem | undefined => {
    return COSMETIC_ITEMS.find(item => item.id === itemId);
};

// ==================== THEMES ====================

export interface ThemeColors {
    background: string;
    backgroundCard: string;
    primary: string;
    surface?: string;
    text: string;
    textSecondary: string;
    textMuted?: string;
    backgroundLight?: string;
    border: string;
    isAnimated?: boolean;
}

/**
 * Récupère les couleurs d'un thème actif
 */
export const getThemeColors = (themeId?: string): ThemeColors | null => {
    if (!themeId || themeId === 'theme_default') return null;

    const item = getCosmeticItem(themeId);
    if (!item || !item.preview) return null;

    // Logique de génération de palette basée sur la couleur principale (preview)
    // Pour des thèmes plus complexes, on pourrait avoir une map hardcodée
    const mainColor = item.preview;

    // Map spécifique pour certains thèmes connus
    switch (themeId) {
        case 'theme_ocean':
            return {
                background: '#001e36',
                backgroundCard: '#00335c',
                primary: '#0077b6',
                text: '#caf0f8',
                textSecondary: '#90e0ef',
                border: '#0077b6'
            };
        case 'theme_forest':
            return {
                background: '#081c15',
                backgroundCard: '#1b4332',
                primary: '#40916c',
                text: '#d8f3dc',
                textSecondary: '#95d5b2',
                border: '#2d6a4f'
            };
        case 'theme_sunset':
            return {
                background: '#330c00',
                backgroundCard: '#611500',
                primary: '#e85d04',
                text: '#ffebd9',
                textSecondary: '#faa307',
                border: '#9d0208'
            };
        case 'theme_lavender':
            return {
                background: '#240046',
                backgroundCard: '#3c096c',
                primary: '#9d4edd',
                text: '#e0aaff',
                textSecondary: '#c77dff',
                border: '#7b2cbf'
            };
        case 'theme_cyberpunk':
            return {
                background: '#120024',     // Deep Synthwave Purple (was Black)
                backgroundCard: '#2a0a3b', // Darker Purple
                primary: '#ff00ff',        // Magenta Neon
                text: '#ead1ea',           // Pale Pink (Readable) - WAS Neon Green (Clash)
                textSecondary: '#00eaff',  // Cyan Neon (Accent)
                border: '#d900d9'          // Magenta Dark
            };
        case 'theme_midnight':
            return {
                background: '#050a14',     // Deep Night Blue (was Pure Black)
                backgroundCard: '#111b2b',
                primary: '#3a506b',
                text: '#e0e1dd',
                textSecondary: '#778da9',
                border: '#1b263b'
            };
        case 'theme_cherry':
            return {
                background: '#2d0a12',
                backgroundCard: '#590d22',
                primary: '#ff4d6d',
                text: '#fff0f3',
                textSecondary: '#ffb3c1',
                border: '#a4133c'
            };
        case 'theme_anim_aurora':
            return {
                background: '#001a14',     // Deep Aurora Green
                backgroundCard: '#00332a',
                primary: '#00ff9d',        // Neon Mint
                text: '#ccffee',
                textSecondary: '#5eead4',
                border: '#0f766e'
            };
        case 'theme_anim_cosmos':
            return {
                background: '#0b001a',     // Void Purple
                backgroundCard: '#1f0a33', // Deep Purple
                primary: '#9d4edd',        // Lavender Neon
                text: '#f3e8ff',
                textSecondary: '#c4b5fd',
                border: '#6d28d9'
            };
        case 'theme_cafe_cosy':
            return {
                background: '#3E2723',     // Espresso Brown
                backgroundCard: '#5D4037', // Coffee Brown
                primary: '#8D6E63',        // Warm Amber
                text: '#EFEBE9',           // Cream
                textSecondary: '#D7CCC8',  // Beige
                border: '#6D4C41'          // Dark Mocha
            };
        case 'theme_pink_cute':
            return {
                background: '#FFEBF0',     // Slightly deeper blush
                backgroundCard: '#FFFFFF',
                primary: '#FF99BB',        // Darker Pink
                text: '#4E342E',
                textSecondary: '#795548',
                border: '#FFCDD2'
            };
        case 'theme_cute_mint':
            return {
                background: '#E8F5E9',     // Deeper Mint Cream
                backgroundCard: '#FFFFFF',
                primary: '#66bb6a',        // Darker Green for better visibility
                text: '#1b5e20',           // Dark Green (High Contrast)
                textSecondary: '#2e7d32',  // Medium Green
                border: '#C8E6C9'
            };
        case 'theme_cute_sky':
            return {
                background: '#E3F2FD',     // Deeper Alice Blue
                backgroundCard: '#FFFFFF',
                primary: '#29b6f6',        // Darker Blue for visibility
                text: '#0d47a1',           // Dark Blue (High Contrast)
                textSecondary: '#1565c0',  // Medium Blue
                border: '#BBDEFB'
            };
        case 'theme_cute_lavender':
            return {
                background: '#EDE7F6',     // Deeper Purple Mist
                backgroundCard: '#FFFFFF',
                primary: '#9575cd',        // Darker Lavender
                text: '#311b92',           // Deep Purple (High Contrast)
                textSecondary: '#4527a0',  // Medium Purple
                border: '#E1BEE7'
            };
        case 'theme_cute_peach':
            return {
                background: '#fff3e0',     // Light Orange
                backgroundCard: '#FFFFFF',
                primary: '#ff8a65',        // Darker Peach
                text: '#bf360c',           // Deep Rust (High Contrast)
                textSecondary: '#d84315',  // Rust
                border: '#FFE0B2'
            };
        case 'theme_cute_lemon':
            return {
                background: '#fffde7',     // Light Yellow
                backgroundCard: '#FFFFFF',
                primary: '#fbc02d',        // Darker Yellow/Gold
                text: '#f57f17',           // Dark Orange/Gold (High Contrast)
                textSecondary: '#f9a825',  // Gold
                border: '#FFF9C4'
            };
        case 'theme_cute_aqua':
            return {
                background: '#E0F7FA',
                backgroundCard: '#FFFFFF',
                primary: '#26c6da',        // Darker Cyan
                text: '#006064',           // Deep Cyan (High Contrast)
                textSecondary: '#00838f',  // Medium Cyan
                border: '#B2EBF2'
            };
        case 'theme_cute_cream':
            return {
                background: '#FFF8E1',     // Amber-ish Cream
                backgroundCard: '#FFFFFF',
                primary: '#ffb74d',        // Darker Tan
                text: '#3e2723',           // Dark Brown (High Contrast)
                textSecondary: '#4e342e',  // Brown
                border: '#D7CCC8'
            };
        case 'theme_cute_coral':
            return {
                background: '#FFEBEE',
                backgroundCard: '#FFFFFF',
                primary: '#ff7043',        // Darker Coral
                text: '#b71c1c',           // Deep Red (High Contrast)
                textSecondary: '#c62828',  // Red
                border: '#FFCDD2'
            };

        // ===== NOUVEAUX THÈMES (Goth, Rétro, Luxe, Art) =====
        case 'theme_gothic':
            return {
                background: '#000000',     // Pure Black
                backgroundCard: '#1a0505', // Very dark red tint
                primary: '#8a0303',        // Blood Red
                text: '#e5e5e5',           // Off-white
                textSecondary: '#a3a3a3',
                border: '#4a0404'
            };
        case 'theme_obsidian':
            return {
                background: '#121212',     // Material Dark Bg
                backgroundCard: '#1e1e1e', // Material Dark Surface
                primary: '#ffffff',        // White Monochrome
                text: '#ffffff',
                textSecondary: '#a0a0a0',
                border: '#333333'
            };
        case 'theme_vaporwave':
            return {
                background: '#2b2146',     // Deep Violet
                backgroundCard: '#3a2e63',
                primary: '#00ffff',        // Cyan
                text: '#ff00ff',           // Magenta
                textSecondary: '#cc00cc',
                border: '#00ffff'
            };
        case 'theme_vintage_paper':
            return {
                background: '#f4e4bc',     // Parchment
                backgroundCard: '#e6d2a4',
                primary: '#4a3b2a',        // Brown Ink
                text: '#2c241b',           // Dark Brown text
                textSecondary: '#5e4b35',
                border: '#8c704f'
            };
        case 'theme_retro_console':
            return {
                background: '#0f380f',     // Darkest Green
                backgroundCard: '#306230', // Dark Green
                primary: '#9bbc0f',        // Lightest Green (Backlight)
                text: '#8bac0f',           // Light Green
                textSecondary: '#9bbc0f',
                border: '#8bac0f'
            };
        case 'theme_royal_gold':
            return {
                background: '#0f172a',     // Sapphire Dark Blue
                backgroundCard: '#1e293b',
                primary: '#d4af37',        // Metallic Gold
                text: '#f8fafc',           // Ice White
                textSecondary: '#94a3b8',
                border: '#d4af37'
            };
        case 'theme_ethereal':
            return {
                background: '#f8fafc',     // Ice White
                backgroundCard: '#ffffff',
                primary: '#38bdf8',        // Sky Blue
                text: '#0f172a',           // Dark Blue text for readability
                textSecondary: '#64748b',
                border: '#e0f2fe'
            };
        case 'theme_candy_pop':
            return {
                background: '#ffff00',     // Bright Yellow (Careful!) -> Adjusted to Pale Yellow for readability? No, POP ART!
                // Let's tone down background for usability
                backgroundCard: '#ffffff',
                primary: '#ff0055',        // Hot Pink
                text: '#000000',           // Black
                textSecondary: '#0000ff',  // Electric Blue
                border: '#000000'          // Comics style border
            };
        case 'theme_sunset':
            return {
                background: '#2d1b2e',     // Dark Purple horizon
                backgroundCard: '#432c4a',
                primary: '#ff6b6b',        // Sunset Pink/Orange
                text: '#ffdab9',           // Peach
                textSecondary: '#fca5a5',
                border: '#b04b5a'
            };
        case 'theme_toxic':
            return {
                background: '#0a0a0a',     // Black
                backgroundCard: '#1f1f1f',
                primary: '#ccff00',        // Toxic Neon Green
                text: '#ccff00',           // Terminal Green
                textSecondary: '#668000',
                border: '#334000'
            };

        // ===== NOUVEAUX THÈMES (Saisons & Ambiances) =====
        case 'theme_autumn':
            return {
                background: '#fff7ed',     // Warm Orange White
                backgroundCard: '#ffedd5', // Light Orange
                primary: '#ea580c',        // Burnt Orange
                text: '#7c2d12',           // Dark Brown
                textSecondary: '#9a3412',
                border: '#fed7aa'
            };
        case 'theme_spring':
            return {
                background: '#f0fdf4',     // Mint White
                backgroundCard: '#dcfce7', // Pale Green
                primary: '#22c55e',        // Fresh Green
                text: '#14532d',           // Forest Green
                textSecondary: '#166534',
                border: '#bbf7d0'
            };
        case 'theme_blueprint':
            return {
                background: '#1e3a8a',     // Blueprint Blue
                backgroundCard: '#172554', // Darker Blue
                primary: '#ffffff',        // White Lines
                text: '#bfdbfe',           // Light Blue Text
                textSecondary: '#60a5fa',
                border: '#3b82f6'          // Grid Lines
            };
        case 'theme_wine':
            return {
                background: '#4c0519',     // Wine Red
                backgroundCard: '#881337', // Light Wine
                primary: '#fbbf24',        // Antique Gold
                text: '#fff1f2',           // Rose White
                textSecondary: '#f43f5e',
                border: '#9f1239'
            };
        case 'theme_military':
            return {
                background: '#3f4f3a',     // Olive Green
                backgroundCard: '#2f3b2b', // Dark Camo
                primary: '#a3b18a',        // Sage Green
                text: '#dad7cd',           // Beige
                textSecondary: '#a3b18a',
                border: '#588157'
            };

        // ===== NOUVEAUX THÈMES (Lot 2: Nature, Éléments, Urbain) =====
        case 'theme_sakura':
            return {
                background: '#fff1f2',     // Rose White
                backgroundCard: '#ffe4e6', // Pale Pink
                primary: '#f472b6',        // Pink Blossom
                text: '#881337',           // Dark Rose
                textSecondary: '#9d174d',
                border: '#fbcfe8'
            };
        case 'theme_lavender':
            return {
                background: '#f5f3ff',     // Lilac White
                backgroundCard: '#ede9fe', // Pale Violet
                primary: '#8b5cf6',        // Violet
                text: '#4c1d95',           // Dark Violet
                textSecondary: '#5b21b6',
                border: '#ddd6fe'
            };
        case 'theme_honey':
            return {
                background: '#fffbeb',     // Amber White
                backgroundCard: '#fef3c7', // Pale Amber
                primary: '#f59e0b',        // Amber Gold
                text: '#78350f',           // Dark Brown
                textSecondary: '#92400e',
                border: '#fcd34d'
            };
        case 'theme_coffee':
            return {
                background: '#fef2f2',     // Very pale warm
                backgroundCard: '#f5e6d3', // Latte foam
                primary: '#78350f',        // Coffee Bean
                text: '#451a03',           // Dark Roast
                textSecondary: '#78350f',
                border: '#a8a29e'
            };
        case 'theme_ocean_depths':
            return {
                background: '#0f172a',     // Deepest Blue
                backgroundCard: '#1e3a8a', // Ocean Blue
                primary: '#38bdf8',        // Cyan Highlights
                text: '#f0f9ff',           // White Foam
                textSecondary: '#bae6fd',
                border: '#0ea5e9'
            };
        case 'theme_storm':
            return {
                background: '#334155',     // Storm Gray
                backgroundCard: '#475569',
                primary: '#facc15',        // Lightning Yellow
                text: '#f1f5f9',           // Cloud White
                textSecondary: '#cbd5e1',
                border: '#94a3b8'
            };
        case 'theme_ice_queen':
            return {
                background: '#f0f9ff',     // Ice White
                backgroundCard: '#e0f2fe',
                primary: '#0ea5e9',        // Ice Blue
                text: '#0c4a6e',           // Deep Blue Text
                textSecondary: '#0284c7',
                border: '#bae6fd'
            };
        case 'theme_dragon_fire':
            return {
                background: '#1c1917',     // Coal Black
                backgroundCard: '#292524',
                primary: '#ef4444',        // Fire Red
                text: '#fee2e2',           // Ash White
                textSecondary: '#fca5a5',
                border: '#b91c1c'
            };
        case 'theme_cyber_night':
            return {
                background: '#09090b',     // Void Black
                backgroundCard: '#18181b', // Zing Gray
                primary: '#d946ef',        // Neon Fuchsia
                text: '#e879f9',           // Neon text
                textSecondary: '#22d3ee',  // Neon Blue secondary
                border: '#22d3ee'          // Blue Border
            };
        case 'theme_newspaper':
            return {
                background: '#e5e7eb',     // Gray Paper
                backgroundCard: '#f3f4f6',
                primary: '#000000',        // Ink Black
                text: '#1f2937',           // Dark Gray Text
                textSecondary: '#374151',
                border: '#9ca3af'
            };

        // ===== NOUVEAUX THÈMES (Lot 3: Matières & Styles Uniques) =====
        case 'theme_steampunk':
            return {
                background: '#292524',     // Dark Leather
                backgroundCard: '#431407', // Bronze
                primary: '#d97706',        // Brass/Copper
                text: '#fcd34d',           // Gold text
                textSecondary: '#a8a29e',  // Silver
                border: '#78350f'
            };
        case 'theme_disco_80s':
            return {
                background: '#2e1065',     // Deep Purple
                backgroundCard: '#4c1d95',
                primary: '#e879f9',        // Neon Pink
                text: '#22d3ee',           // Cyan
                textSecondary: '#c084fc',
                border: '#a855f7'
            };
        case 'theme_pixel_os':
            return {
                background: '#c0c0c0',     // Win95 Grey
                backgroundCard: '#ffffff', // Window White
                primary: '#000080',        // Title Bar Blue
                text: '#000000',           // Black
                textSecondary: '#808080',  // Dark Grey
                border: '#000000'
            };
        case 'theme_marble':
            return {
                background: '#f5f5f5',     // Marble White
                backgroundCard: '#ffffff',
                primary: '#525252',        // Grey Veins
                text: '#262626',           // Dark Stone
                textSecondary: '#a3a3a3',
                border: '#e5e5e5'
            };
        case 'theme_denim':
            return {
                background: '#1e3a8a',     // Dark Indigo
                backgroundCard: '#1d4ed8', // Blue Jean
                primary: '#f97316',        // Orange Stitching
                text: '#eff6ff',           // White
                textSecondary: '#93c5fd',
                border: '#f97316'
            };
        case 'theme_chalkboard':
            return {
                background: '#064e3b',     // Blackboard Green
                backgroundCard: '#065f46',
                primary: '#ffffff',        // Chalk White
                text: '#f0fdf4',
                textSecondary: '#a7f3d0',
                border: '#d1fae5'
            };
        case 'theme_neon_noir':
            return {
                background: '#000000',     // Pure Black
                backgroundCard: '#171717',
                primary: '#dc2626',        // Fatal Red
                text: '#ffffff',
                textSecondary: '#525252',
                border: '#ffffff'
            };
        case 'theme_hacker':
            return {
                background: '#000000',     // Terminal Black
                backgroundCard: '#022c22', // Very dark green
                primary: '#22c55e',        // Matrix Green
                text: '#4ade80',           // Light Green
                textSecondary: '#15803d',
                border: '#166534'
            };
        case 'theme_dune':
            return {
                background: '#7c2d12',     // Spice
                backgroundCard: '#92400e',
                primary: '#fcd34d',        // Sun
                text: '#fef3c7',           // Sand
                textSecondary: '#fbbf24',
                border: '#d97706'
            };
        case 'theme_candy_cane':
            return {
                background: '#fff1f2',     // White/Pink
                backgroundCard: '#ffe4e6',
                primary: '#e11d48',        // Candy Red
                text: '#be123c',           // Dark Red
                textSecondary: '#fda4af',
                border: '#f43f5e'
            };

        // ===== NOUVEAUX THÈMES (Lot 4: Gourmandise, Voyage, Science) =====
        case 'theme_chocolate_mint':
            return {
                background: '#3e2723',     // Dark Chocolate
                backgroundCard: '#4e342e',
                primary: '#69f0ae',        // Mint Green
                text: '#e0f2f1',           // Mint White
                textSecondary: '#a5d6a7',
                border: '#004d40'
            };
        case 'theme_strawberry_milk':
            return {
                background: '#fff1f2',     // Milky Pink
                backgroundCard: '#fce7f3', // Pink
                primary: '#f43f5e',        // Strawberry Red
                text: '#881337',           // Dark Red
                textSecondary: '#be123c',
                border: '#fecdd3'
            };
        case 'theme_lemonade':
            return {
                background: '#fef9c3',     // Pale Lemon
                backgroundCard: '#fef08a', // Yellow
                primary: '#84cc16',        // Lime Green
                text: '#a16207',           // Brown Sugar
                textSecondary: '#65a30d',
                border: '#fde047'
            };
        case 'theme_blueberry':
            return {
                background: '#1e1b4b',     // Deep Indigo
                backgroundCard: '#312e81',
                primary: '#818cf8',        // Peri
                text: '#e0e7ff',           // White Indigo
                textSecondary: '#6366f1',
                border: '#4338ca'
            };
        case 'theme_egyptian_sand':
            return {
                background: '#451a03',     // Dark Sand
                backgroundCard: '#78350f',
                primary: '#fbbf24',        // Gold
                text: '#fef3c7',           // Light Sand
                textSecondary: '#d97706',
                border: '#1d4ed8'          // Lapis Blue Accent
            };
        case 'theme_cherry_blossom_night':
            return {
                background: '#020617',     // Midnight
                backgroundCard: '#1e1b4b',
                primary: '#f472b6',        // Pink Neon
                text: '#fce7f3',           // Pale Pink
                textSecondary: '#db2777',
                border: '#be185d'
            };
        case 'theme_jungle_deep':
            return {
                background: '#022c22',     // Black Green
                backgroundCard: '#064e3b',
                primary: '#4ade80',        // Parrot Green
                text: '#ecfccb',           // Lime White
                textSecondary: '#166534',
                border: '#14532d'
            };
        case 'theme_biolum':
            return {
                background: '#000000',     // Pitch Black
                backgroundCard: '#000000',
                primary: '#22d3ee',        // Cyan Glow
                text: '#ccfbf1',           // Teal White
                textSecondary: '#0f766e',
                border: '#2dd4bf'
            };
        case 'theme_mars_rover':
            return {
                background: '#431407',     // Red Dust
                backgroundCard: '#7c2d12',
                primary: '#fb923c',        // Orange Sun
                text: '#ffedd5',           // Beige
                textSecondary: '#c2410c',
                border: '#9a3412'
            };
        case 'theme_toxic_waste':
            return {
                background: '#2e1065',     // Mutated Purple
                backgroundCard: '#581c87',
                primary: '#a3e635',        // Ooze Green
                text: '#d9f99d',           // Pale Ooze
                textSecondary: '#84cc16',
                border: '#a3e635'
            };
        default:
            // Fallback générique si on a juste la couleur preview
            return {
                background: '#1a1a1a',
                backgroundCard: '#2a2a2a',
                primary: mainColor,
                text: '#ffffff',
                textSecondary: '#cccccc',
                border: mainColor
            };
    }
};

// ==================== FRAMES ====================

export interface FrameStyle {
    containerStyle: ViewStyle;
    imageStyle?: ViewStyle; // Pour des effets internes si besoin
    overlay?: React.ReactNode; // Pour des cadres complexes (images par dessus)
    isAnimated?: boolean; // Indique si le cadre utilise un composant animé
    animationComponent?: string; // Nom du composant d'animation à utiliser
    imageSource?: ImageSourcePropType; // Pour les cadres basés sur une image statique
}

/**
 * Récupère le style d'un cadre d'avatar
 */
export const getFrameStyle = (frameId?: string, size: number = 88): FrameStyle => {
    // Style par défaut
    const defaultStyle: FrameStyle = {
        containerStyle: {
            borderWidth: 2,
            borderColor: colors.primary, // ou couleur de l'alter
            padding: 3,
            borderRadius: size / 2,
        }
    };

    if (!frameId || frameId === 'frame_default') return defaultStyle;



    switch (frameId) {
        case 'frame_default':
            return {
                containerStyle: {
                    borderWidth: 2,
                    borderColor: '#6b7280',
                    padding: 2,
                    borderRadius: size / 2,
                }
            };
        case 'frame_simple':
            return {
                containerStyle: {
                    borderWidth: 3,
                    borderColor: '#6b7280',
                    padding: 2,
                    borderRadius: size / 2,
                }
            };
        case 'frame_double':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#8b5cf6',
                    borderStyle: 'solid',
                    padding: 3,
                    borderRadius: size / 2,
                }
            };
        case 'frame_square':
            return {
                containerStyle: {
                    borderWidth: 3,
                    padding: 2,
                    borderRadius: 12, // Carré arrondi
                },
                imageStyle: {
                    borderRadius: 8
                }
            };
        case 'frame_neon':
            return {
                containerStyle: {
                    borderWidth: 2,
                    borderColor: '#00ff00',
                    padding: 4,
                    borderRadius: size / 2,
                    shadowColor: '#00ff00',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 5,
                }
            };
        case 'frame_gold':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#ffd700',
                    padding: 2,
                    borderRadius: size / 2,
                    shadowColor: '#ffd700',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                }
            };
        case 'frame_rainbow':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#ff6b6b', // Fallback en attendant un vrai gradient border
                    padding: 3,
                    borderRadius: size / 2,
                }
            };
        case 'frame_flames':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                isAnimated: true,
                animationComponent: 'FlameFrame',
            };
        case 'frame_tropical':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible', // Important pour que l'image dépasse
                },
                imageSource: require('../../assets/frames/frame_tropical.png'),
            };
        case 'frame_anim_sakura':
            // Cadre Sakura animé - utilise le composant SakuraFrame
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#FFB7C5',
                    padding: 4,
                    borderRadius: size / 2,
                    backgroundColor: 'transparent',
                    shadowColor: '#FF8FAB',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 12,
                },
                // Flag pour indiquer qu'il faut utiliser le composant animé
                isAnimated: true,
                animationComponent: 'SakuraFrame',
            };
        case 'frame_nature_mystic':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                // isAnimated: true, // Désactivé pour l'instant car on a l'image statique
                // animationComponent: 'NatureMysticFrame',
                imageSource: require('../../assets/frames/frame_nature_mystic.png'),
            };

        case 'frame_biolum_lagoon':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_biolum_lagoon.png'),
            };
        case 'frame_pirate_wreck':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_pirate_wreck.png'),
            };
        case 'frame_coral_reef':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_coral_reef.png'),
            };
        case 'frame_jungle_ruins':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_jungle_ruins.png'),
            };

        case 'frame_bamboo_sanctuary':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_bamboo_sanctuary.png'),
            };
        case 'frame_enchanted_forest':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_nature_mystic.png'), // Fallback ou double usage
            };

        case 'frame_crystal_cavern':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_crystal_cavern.png'),
            };
        case 'frame_arctic_winter':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_arctic_winter.png'),
            };

        // ===== NOUVEAUX CADRES (Lot 1) =====
        case 'frame_hearts_pink':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_hearts_pink.png'),
            };
        case 'frame_kawaii_animals':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_kawaii_animals.png'),
            };
        case 'frame_halloween_cats':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_halloween_cats.png'),
            };
        case 'frame_gothic_red':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_gothic_red.png'),
            };
        case 'frame_tropical_hibiscus':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_tropical_hibiscus.png'),
            };

        // ===== NOUVEAUX CADRES (Lot 2) =====
        case 'frame_moon_stars':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_moon_stars.png'),
            };
        case 'frame_golden_waves':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_golden_waves.png'),
            };
        case 'frame_water_drops':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_water_drops.png'),
            };
        case 'frame_target_red':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_target_red.png'),
            };
        case 'frame_lavender_floral':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_lavender_floral.png'),
            };
        case 'frame_sparkles_gold':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_sparkles_gold.png'),
            };
        case 'frame_ice_crystal':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_ice_crystal.png'),
            };

        // ===== NOUVEAUX CADRES (CSS Fallbacks) =====
        case 'frame_cat_ears':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#f472b6', // Pink
                    padding: 2,
                    borderRadius: size / 2, // Circle
                    borderTopLeftRadius: 10, // Ear hint? (May look odd on circle) -> Let's stick to Circle with distinct color
                    borderTopRightRadius: 10,
                }
            };
        case 'frame_devil':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#dc2626', // Red
                    padding: 2,
                    borderRadius: size / 2,
                    borderStyle: 'dashed', // Spiky feel
                }
            };
        case 'frame_angel':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#fcd34d', // Gold
                    padding: 4,
                    borderRadius: size / 2,
                    shadowColor: '#fcd34d',
                    shadowOpacity: 0.8,
                    shadowRadius: 10, // Glow
                }
            };
        case 'frame_tech_hud':
            return {
                containerStyle: {
                    borderWidth: 2,
                    borderColor: '#0ea5e9',
                    padding: 4,
                    borderRadius: 4, // Square bracket feel
                    borderStyle: 'dotted',
                }
            };
        case 'frame_polaroid':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#ffffff',
                    borderBottomWidth: 12, // Caption area
                    padding: 0,
                    borderRadius: 2,
                    backgroundColor: '#fff',
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                }
            };

        // Fallbacks for the ones with potential image requirements from prev step if they were missing assets
        // (Just to be safe, though usage implies assets might need to be there)


        // ===== CADRES OREILLES D'ANIMAUX (Avec Images PNG) =====
        case 'frame_ears_cat':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_cat_ears.png'),
            };
        case 'frame_ears_dog':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_dog_ears.png'),
            };
        case 'frame_ears_rabbit':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_rabbit_ears.png'),
            };
        case 'frame_ears_fox':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_fox_ears.png'),
            };
        case 'frame_ears_bear':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_bear_ears.png'),
            };
        case 'frame_ears_wolf':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_wolf_ears.png'),
            };
        case 'frame_ears_mouse':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_mouse_ears.png'),
            };
        case 'frame_ears_panda':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_panda_ears.png'),
            };
        case 'frame_ears_tiger':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_tiger_ears.png'),
            };
        case 'frame_ears_cow':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_cow_ears.png'),
            };

        // ===== CADRES PRIDE (GRATUITS) =====
        case 'frame_pride_rainbow':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#E40303', // Rouge (fallback)
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_progress':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#5BCEFA', // Bleu trans
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#F5A9B8',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_trans':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#5BCEFA', // Bleu clair
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#F5A9B8', // Rose
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 5,
                }
            };
        case 'frame_pride_bi':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#D60270', // Magenta
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#0038A8', // Bleu
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_pan':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#FF218C', // Rose
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#21B1FF', // Cyan
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_lesbian':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#D52D00', // Orange foncé
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#D362A4', // Rose
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_gay':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#078D70', // Teal
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#3D1A78', // Violet
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_nb':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#FCF434', // Jaune
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#9C59D1', // Violet
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_ace':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#810081', // Violet
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#A3A3A3', // Gris
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_aro':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#3DA542', // Vert
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#A7D379', // Vert clair
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_genderfluid':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#FF75A2', // Rose
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#333EBD', // Bleu
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_genderqueer':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#B57EDC', // Lavande
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#4A8123', // Vert
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_intersex':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#FFD800', // Jaune
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#7902AA', // Violet
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 5,
                }
            };
        case 'frame_pride_poly':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#0000FF', // Bleu
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#FF0000', // Rouge
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };
        case 'frame_pride_agender':
            return {
                containerStyle: {
                    borderWidth: 4,
                    borderColor: '#B9B9B9', // Gris
                    padding: 3,
                    borderRadius: size / 2,
                    shadowColor: '#B8F483', // Vert clair
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 4,
                }
            };

        default:
            return defaultStyle;
    }
};

// ==================== BUBBLES ====================

export interface BubbleStyle {
    containerStyle: ViewStyle;
    textStyle?: TextStyle;
}

/**
 * Récupère le style d'une bulle de chat
 */
export const getBubbleStyle = (bubbleId?: string, isMine: boolean = false): BubbleStyle | null => {
    if (!bubbleId || bubbleId === 'bubble_default') return null;

    // Si pas à moi, on applique quand même le style du sender ?
    // Généralement les bulles custom ne s'appliquent qu'aux messages de l'expéditeur

    switch (bubbleId) {
        case 'bubble_round':
            return {
                containerStyle: {
                    borderRadius: 20,
                    backgroundColor: isMine ? '#22c55e' : undefined
                }
            };
        case 'bubble_square':
            return {
                containerStyle: {
                    borderRadius: 4,
                    backgroundColor: isMine ? '#ef4444' : undefined
                }
            };
        case 'bubble_cloud':
            return {
                containerStyle: {
                    borderRadius: 20,
                    borderBottomLeftRadius: 2,
                    borderBottomRightRadius: 20,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    backgroundColor: isMine ? '#f59e0b' : undefined,
                    padding: 12,
                }
            };
        case 'bubble_pixel':
            return {
                containerStyle: {
                    borderRadius: 0,
                    borderWidth: 2,
                    borderColor: isMine ? '#65a30d' : '#84cc16',
                    backgroundColor: isMine ? '#84cc16' : undefined,
                    borderStyle: 'dashed'
                },
                textStyle: {
                    fontFamily: 'monospace' // Si dispo
                }
            };
        case 'bubble_glass':
            return {
                containerStyle: {
                    backgroundColor: isMine ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.1)',
                    borderColor: isMine ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    borderRadius: 12,
                }
            };
        case 'bubble_comic':
            return {
                containerStyle: {
                    backgroundColor: isMine ? '#fbbf24' : undefined,
                    borderWidth: 2,
                    borderColor: '#000',
                    borderRadius: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                },
                textStyle: {
                    color: '#000',
                    fontWeight: 'bold'
                }
            };
        case 'bubble_gradient':
            return {
                containerStyle: {
                    backgroundColor: isMine ? '#ec4899' : undefined, // Fallback sans gradient view
                    borderRadius: 16,
                }
            };

        // ===== NOUVELLES BULLES (Expression) =====
        case 'bubble_thought':
            return {
                containerStyle: {
                    backgroundColor: isMine ? '#ffffff' : '#f3f4f6',
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    borderRadius: 20, // Cloud-ish
                    borderBottomLeftRadius: 0,
                },
                textStyle: { color: '#6b7280', fontStyle: 'italic' }
            };
        case 'bubble_shout':
            return {
                containerStyle: {
                    backgroundColor: isMine ? '#fecaca' : '#fee2e2',
                    borderWidth: 2,
                    borderColor: '#ef4444',
                    borderRadius: 4,
                    transform: [{ rotate: '-1deg' }], // Slight chaos
                },
                textStyle: { fontWeight: 'bold', textTransform: 'uppercase' }
            };
        case 'bubble_rpg':
            return {
                containerStyle: {
                    backgroundColor: '#1e3a8a', // RPG Blue
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    borderRadius: 4,
                    padding: 8,
                },
                textStyle: { color: '#ffffff', fontFamily: 'monospace' }
            };
        case 'bubble_tape':
            return {
                containerStyle: {
                    backgroundColor: '#fcd34d', // Yellow tape
                    transform: [{ rotate: '1deg' }],
                    borderRadius: 2,
                },
                textStyle: { color: '#000000' }
            };
        case 'bubble_ghost':
            return {
                containerStyle: {
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 16,
                },
                textStyle: { color: '#6b7280' }
            };

        default:
            return null;
    }
};
