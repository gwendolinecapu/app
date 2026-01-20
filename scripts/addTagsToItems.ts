/**
 * addTagsToItems.ts
 * 
 * Script pour ajouter automatiquement des tags intelligents à tous les items cosmétiques
 * Analyse le nom, la description et la couleur preview pour générer des tags pertinents
 */

import { COSMETIC_ITEMS } from '../src/services/MonetizationTypes';

// Dictionnaire de mots-clés → tags
const KEYWORD_TO_TAGS: Record<string, string[]> = {
    // Colors
    'dark': ['dark', 'noir'],
    'black': ['dark', 'noir'],
    'noir': ['dark', 'noir'],
    'minuit': ['dark', 'noir'],
    'midnight': ['dark', 'noir'],

    'light': ['light', 'clair'],
    'blanc': ['light', 'clair'],
    'white': ['light', 'clair'],

    'pink': ['pink', 'rose'],
    'rose': ['pink', 'rose'],
    'cherry': ['pink', 'rose'],
    'cerisier': ['pink', 'rose'],

    'blue': ['blue', 'bleu'],
    'bleu': ['blue', 'bleu'],
    'ocean': ['blue', 'bleu', 'nature'],
    'océan': ['blue', 'bleu', 'nature'],

    'green': ['green', 'vert'],
    'vert': ['green', 'vert'],
    'forest': ['green', 'vert', 'nature'],
    'forêt': ['green', 'vert', 'nature'],

    'purple': ['purple', 'violet'],
    'violet': ['purple', 'violet'],
    'lavande': ['purple', 'violet'],
    'lavender': ['purple', 'violet'],

    'gold': ['gold', 'or', 'luxury'],
    'or': ['gold', 'or', 'luxury'],
    'royal': ['gold', 'or', 'luxury'],

    'red': ['red', 'rouge'],
    'rouge': ['red', 'rouge'],

    'orange': ['orange'],

    'yellow': ['yellow', 'jaune'],
    'jaune': ['yellow', 'jaune'],

    // Moods & Styles
    'cute': ['cute', 'kawaii'],
    'kawaii': ['cute', 'kawaii'],
    'mignon': ['cute', 'kawaii'],

    'gothic': ['gothic', 'dark'],
    'goth': ['gothic', 'dark'],
    'gothique': ['gothic', 'dark'],

    'retro': ['retro', 'vintage'],
    'vintage': ['retro', 'vintage'],
    '80s': ['retro', 'vintage'],
    'disco': ['retro', 'vintage'],

    'cyber': ['tech', 'neon', 'modern'],
    'cyberpunk': ['tech', 'neon', 'modern'],
    'neon': ['neon', 'bright'],

    'nature': ['nature', 'natural'],
    'natural': ['nature', 'natural'],

    'mystical': ['mystical', 'magic'],
    'magic': ['mystical', 'magic'],
    'mystique': ['mystical', 'magic'],

    'minimal': ['minimal', 'simple'],
    'minimalist': ['minimal', 'simple'],

    'luxury': ['luxury', 'premium'],
    'luxe': ['luxury', 'premium'],
    'premium': ['luxury', 'premium'],

    'pastel': ['pastel', 'soft'],
    'doux': ['pastel', 'soft'],
    'soft': ['pastel', 'soft'],

    'space': ['cosmic', 'space'],
    'cosmos': ['cosmic', 'space'],
    'cosmic': ['cosmic', 'space'],
    'galaxy': ['cosmic', 'space'],
    'aurora': ['cosmic', 'space'],

    'food': ['food'],
    'café': ['food', 'brown'],
    'coffee': ['food', 'brown'],
    'chocolate': ['food', 'brown'],
    'lemonade': ['food', 'yellow'],
    'strawberry': ['food', 'pink'],
    'fraise': ['food', 'pink'],

    'animal': ['animal', 'nature'],
    'cat': ['animal', 'cute'],
    'dog': ['animal', 'cute'],
    'rabbit': ['animal', 'cute'],
    'fox': ['animal', 'cute'],
    'bear': ['animal', 'cute'],
    'wolf': ['animal'],
    'mouse': ['animal', 'cute'],
    'panda': ['animal', 'cute'],
    'tiger': ['animal'],
    'cow': ['animal', 'cute'],
};

// Analyse couleur hex pour extraire des tags de couleur
function getColorTags(hexColor?: string): string[] {
    if (!hexColor) return [];

    const color = hexColor.toLowerCase();
    const tags: string[] = [];

    // Analyse basique RGB
    const rgb = parseInt(color.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;

    // Luminosité
    const brightness = (r + g + b) / 3;
    if (brightness < 50) tags.push('dark');
    if (brightness > 200) tags.push('light');

    // Couleurs dominantes
    if (r > g && r > b && r > 100) tags.push('red', 'warm');
    if (g > r && g > b && g > 100) tags.push('green', 'natural');
    if (b > r && b > g && b > 100) tags.push('blue', 'cool');
    if (r > 200 && g < 100 && b > 200) tags.push('purple', 'mystical');
    if (r > 200 && g > 150 && b < 100) tags.push('orange', 'warm');
    if (r > 200 && g > 200 && b < 100) tags.push('yellow', 'bright');

    return tags;
}

// Génère des tags pour un item
function generateTags(item: any): string[] {
    const tags = new Set<string>();

    // Tags basés sur le nom et la description
    const text = `${item.name} ${item.description || ''}`.toLowerCase();

    for (const [keyword, keywordTags] of Object.entries(KEYWORD_TO_TAGS)) {
        if (text.includes(keyword.toLowerCase())) {
            keywordTags.forEach(tag => tags.add(tag));
        }
    }

    // Tags basés sur la couleur preview
    if (item.preview) {
        const colorTags = getColorTags(item.preview);
        colorTags.forEach(tag => tags.add(tag));
    }

    // Tags basés sur le type
    if (item.type === 'theme') tags.add('theme');
    if (item.type === 'frame') {
        tags.add('frame');
        tags.add('decoration');
    }
    if (item.type === 'bubble') {
        tags.add('bubble');
        tags.add('chat');
    }

    // Tags basés sur la rareté
    if (item.rarity === 'epic' || item.rarity === 'legendary') {
        tags.add('premium');
    }

    return Array.from(tags);
}

// Traite tous les items
console.log('🏷️  Analyse des items cosmétiques...\n');

const itemsWithTags = COSMETIC_ITEMS.map((item) => {
    const tags = generateTags(item);

    console.log(`✅ ${item.name} (${item.id})`);
    console.log(`   Tags: ${tags.join(', ')}`);
    console.log('');

    return {
        ...item,
        metadata: {
            ...item.metadata,
            tags,
        }
    };
});

console.log(`\n✨ Total: ${itemsWithTags.length} items taggés!`);
console.log('\nCOPY-PASTE ce résultat dans COSMETIC_ITEMS pour l\'appliquer.');
