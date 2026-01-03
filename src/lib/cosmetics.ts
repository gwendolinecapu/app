import { StyleSheet, ViewStyle, TextStyle, ImageSourcePropType } from 'react-native';
import { COSMETIC_ITEMS, ShopItem } from '../services/MonetizationTypes';
import { colors, borderRadius } from './theme';

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
    text: string;
    textSecondary: string;
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
                primary: '#98FB98',        // Pale Green (Darker than MintCream)
                text: '#004D40',
                textSecondary: '#2E7D32',
                border: '#C8E6C9'
            };
        case 'theme_cute_sky':
            return {
                background: '#E3F2FD',     // Deeper Alice Blue
                backgroundCard: '#FFFFFF',
                primary: '#81D4FA',        // Light Blue (Darker than #A0E7E5)
                text: '#01579B',
                textSecondary: '#0277BD',
                border: '#BBDEFB'
            };
        case 'theme_cute_lavender':
            return {
                background: '#EDE7F6',     // Deeper Purple Mist
                backgroundCard: '#FFFFFF',
                primary: '#D1C4E9',        // Deep Lavender
                text: '#311B92',
                textSecondary: '#512DA8',
                border: '#E1BEE7'
            };
        case 'theme_cute_peach':
            return {
                background: '#fff9e7ff',
                backgroundCard: '#FFFFFF',
                primary: '#FFCCBC',        // Deep Peach
                text: '#BF360C',
                textSecondary: '#E64A19',
                border: '#FFE0B2'
            };
        case 'theme_cute_lemon':
            return {
                background: '#fffddbff',
                backgroundCard: '#FFFFFF',
                primary: '#FFF59D',        // Deeper Lemon
                text: '#F57F17',
                textSecondary: '#F9A825',
                border: '#FFF9C4'
            };
        case 'theme_cute_aqua':
            return {
                background: '#E0F7FA',
                backgroundCard: '#FFFFFF',
                primary: '#80DEEA',        // Deeper Cyan
                text: '#004D40',
                textSecondary: '#00838F',
                border: '#B2EBF2'
            };
        case 'theme_cute_cream':
            return {
                background: '#FFF8E1',     // Amber-ish Cream
                backgroundCard: '#FFFFFF',
                primary: '#FFE0B2',        // Biscotti
                text: '#3E2723',
                textSecondary: '#5D4037',
                border: '#D7CCC8'
            };
        case 'theme_cute_coral':
            return {
                background: '#FFEBEE',
                backgroundCard: '#FFFFFF',
                primary: '#FFAB91',        // Deep Coral
                text: '#B71C1C',
                textSecondary: '#C62828',
                border: '#FFCDD2'
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

    const item = getCosmeticItem(frameId);

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
                    borderColor: '#3b82f6',
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
                    borderWidth: 3,
                    borderColor: '#ff4500',
                    padding: 2,
                    borderRadius: size / 2,
                    shadowColor: '#ff4500',
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                }
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
        case 'frame_desert_oasis':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_tropical.png'),
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
        case 'frame_steampunk_castaway':
            return {
                containerStyle: {
                    borderWidth: 0,
                    borderColor: 'transparent',
                    padding: 0,
                    borderRadius: size / 2,
                    overflow: 'visible',
                },
                imageSource: require('../../assets/frames/frame_tropical.png'),
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
        default:
            return null;
    }
};
