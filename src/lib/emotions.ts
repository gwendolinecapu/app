import { Ionicons } from '@expo/vector-icons';
import { EmotionType } from '../types';

export interface EmotionConfig {
    type: EmotionType;
    icon: keyof typeof Ionicons.glyphMap;
    emoji: string;
    label: string;
    color: string;
}

export const EMOTION_CONFIG: EmotionConfig[] = [
    { type: 'happy', icon: 'happy-outline', emoji: '😊', label: 'Joyeux', color: '#FFD93D' },
    { type: 'love', icon: 'heart-outline', emoji: '🥰', label: 'Amoureux', color: '#FF6B81' },
    { type: 'excited', icon: 'star-outline', emoji: '🤩', label: 'Excité', color: '#FF9F43' },
    { type: 'proud', icon: 'trophy-outline', emoji: '🦁', label: 'Fier', color: '#FDCB6E' },
    { type: 'calm', icon: 'leaf-outline', emoji: '😌', label: 'Calme', color: '#2ECC71' },
    { type: 'bored', icon: 'ellipsis-horizontal-circle-outline', emoji: '😐', label: 'Ennuyé', color: '#D1D8D9' },
    { type: 'tired', icon: 'battery-dead-outline', emoji: '😴', label: 'Fatigué', color: '#BDC3C7' },
    { type: 'sad', icon: 'sad-outline', emoji: '😢', label: 'Triste', color: '#3498DB' },
    { type: 'anxious', icon: 'alert-circle-outline', emoji: '😰', label: 'Anxieux', color: '#E67E22' },
    { type: 'fear', icon: 'skull-outline', emoji: '😨', label: 'Peur', color: '#8E44AD' },
    { type: 'confused', icon: 'help-circle-outline', emoji: '😕', label: 'Confus', color: '#9B59B6' },
    { type: 'angry', icon: 'flame-outline', emoji: '😡', label: 'En colère', color: '#E74C3C' },
    { type: 'shame', icon: 'eye-off-outline', emoji: '😳', label: 'Honte', color: '#D63031' },
    { type: 'guilt', icon: 'cloud-outline', emoji: '😔', label: 'Coupable', color: '#B2BEC3' },
    { type: 'hurt', icon: 'bandage-outline', emoji: '🤕', label: 'Blessé', color: '#FD79A8' },
    { type: 'sick', icon: 'medkit-outline', emoji: '🤢', label: 'Malade', color: '#00B894' },
    { type: 'fuzzy', icon: 'help-outline', emoji: '❓', label: 'Flou', color: '#A0A0A0' },
    { type: 'numb', icon: 'remove-circle-outline', emoji: '🫥', label: 'Détaché', color: '#95A5A6' },
    { type: 'overwhelmed', icon: 'thunderstorm-outline', emoji: '🤯', label: 'Submergé', color: '#E056FD' },
    { type: 'hopeful', icon: 'sunny-outline', emoji: '🌟', label: 'Optimiste', color: '#F9CA24' },
];

export const getEmotionConfig = (type: EmotionType) => EMOTION_CONFIG.find(e => e.type === type);
