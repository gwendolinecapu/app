import { ShopItem } from './MonetizationTypes';

export const SHOP_ITEMS: { [key: string]: ShopItem[] } = {
    themes: [
        { id: 'theme_midnight', name: 'Minuit', priceCredits: 0, preview: '#1a1a2e', type: 'theme', description: 'Un thème sombre et reposant.' },
        { id: 'theme_dark_matter', name: 'Matière Noire', priceCredits: 50, preview: '#000000', type: 'theme', description: 'Le noir absolu pour les écrans OLED.' },
        { id: 'theme_nebula', name: 'Nébuleuse', priceCredits: 100, preview: '#4b0082', type: 'theme', description: 'Des teintes violettes et cosmiques.' },
        { id: 'theme_forest', name: 'Forêt Enchantée', priceCredits: 100, preview: '#2d5a27', type: 'theme', description: 'Le calme de la nature.' },
        { id: 'theme_ocean', name: 'Abysses', priceCredits: 100, preview: '#001f3f', type: 'theme', description: 'Plongez dans les profondeurs.' },
        { id: 'theme_sunset', name: 'Coucher de Soleil', priceCredits: 150, preview: '#ff4500', type: 'theme', description: 'Chaleur et dégradés oranges.' },
        { id: 'theme_lavender', name: 'Lavande', priceCredits: 150, preview: '#e6e6fa', type: 'theme', description: 'Douceur et sérénité.' },
        { id: 'theme_cyberpunk', name: 'Cyberpunk', priceCredits: 200, preview: '#ff00ff', type: 'theme', isPremium: true, description: 'Néons et haute technologie.' },
        { id: 'theme_gold', name: 'Luxe', priceCredits: 300, preview: '#ffd700', type: 'theme', isPremium: true, description: 'L\'élégance ultime.' },
        { id: 'theme_unicorn', name: 'Licorne', priceCredits: 250, preview: '#ff69b4', type: 'theme', description: 'Magique et coloré.' },
    ],
    frames: [
        { id: 'frame_basic', name: 'Simple', priceCredits: 0, preview: '⭕', type: 'frame', description: 'Un cadre discret.' },
        { id: 'frame_double', name: 'Double Trait', priceCredits: 50, preview: '◎', type: 'frame', description: 'Un peu plus de style.' },
        { id: 'frame_dashed', name: 'Pointillés', priceCredits: 50, preview: '◌', type: 'frame', description: 'Léger et aéré.' },
        { id: 'frame_square', name: 'Carré Arrondi', priceCredits: 75, preview: '▢', type: 'frame', description: 'Changez de forme.' },
        { id: 'frame_rainbow', name: 'Arc-en-ciel', priceCredits: 100, preview: '🌈', type: 'frame', description: 'Toutes les couleurs.' },
        { id: 'frame_leaves', name: 'Feuillage', priceCredits: 100, preview: '🍃', type: 'frame', description: 'Naturel.' },
        { id: 'frame_flames', name: 'Flammes', priceCredits: 150, preview: '🔥', type: 'frame', description: 'Ardent.' },
        { id: 'frame_neon', name: 'Néon', priceCredits: 200, preview: '🔆', type: 'frame', isPremium: true, description: 'Brille dans le noir.' },
        { id: 'frame_glitch', name: 'Glitch', priceCredits: 250, preview: '👾', type: 'frame', isPremium: true, description: 'Erreur système.' },
        { id: 'frame_crown', name: 'Royal', priceCredits: 300, preview: '👑', type: 'frame', isPremium: true, description: 'Pour le Roi/Reine du système.' },
    ],
    bubbles: [
        { id: 'bubble_classic', name: 'Classique', priceCredits: 0, preview: '💬', type: 'bubble', description: 'La bulle standard.' },
        { id: 'bubble_round', name: 'Ronde', priceCredits: 25, preview: '⚪', type: 'bubble', description: 'Plus de courbes.' },
        { id: 'bubble_square', name: 'Carrée', priceCredits: 25, preview: '⬜', type: 'bubble', description: 'Plus stricte.' },
        { id: 'bubble_minimal', name: 'Minimaliste', priceCredits: 50, preview: '➖', type: 'bubble', description: 'Juste le texte.' },
        { id: 'bubble_cloud', name: 'Nuage', priceCredits: 75, preview: '☁️', type: 'bubble', description: 'Comme dans un rêve.' },
        { id: 'bubble_comic', name: 'Comics', priceCredits: 100, preview: '💥', type: 'bubble', description: 'Style BD.' },
        { id: 'bubble_pixel', name: 'Pixel Art', priceCredits: 125, preview: '👾', type: 'bubble', description: 'Rétro gaming.' },
        { id: 'bubble_paper', name: 'Papier Froissé', priceCredits: 150, preview: '📄', type: 'bubble', description: 'Texture organique.' },
        { id: 'bubble_gradient', name: 'Dégradé', priceCredits: 200, preview: '🎨', type: 'bubble', isPremium: true, description: 'Couleurs dynamiques.' },
        { id: 'bubble_glass', name: 'Verre', priceCredits: 250, preview: '💎', type: 'bubble', isPremium: true, description: 'Transparence moderne.' },
    ]
};
