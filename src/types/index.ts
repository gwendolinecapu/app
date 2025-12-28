// Types pour PluralConnect

export interface System {
    id: string;
    email: string;
    username: string;
    created_at: string;
}

export interface Alter {
    id: string;
    system_id: string;
    name: string;
    avatar_url?: string;
    bio?: string;
    pronouns?: string;
    color: string;
    is_host: boolean;
    is_active: boolean;
    created_at: string;
}

export interface Post {
    id: string;
    system_id: string;
    alter_id: string;
    content: string;
    media_url?: string;
    visibility: 'private' | 'system' | 'friends' | 'public';
    created_at: string;
    updated_at: string;
    // Relations
    alter?: Alter;
}

export interface Message {
    id: string;
    sender_alter_id: string;
    receiver_alter_id: string;
    conversation_id: string;
    content: string;
    is_internal: boolean; // true = entre alters du même système
    is_read: boolean;
    created_at: string;
    // Relations
    sender?: Alter;
    receiver?: Alter;
}

export interface Conversation {
    id: string;
    is_internal: boolean;
    created_at: string;
    updated_at: string;
    // Relations
    participants?: Alter[];
    last_message?: Message;
}

export interface ConversationParticipant {
    id: string;
    conversation_id: string;
    alter_id: string;
    joined_at: string;
}

// ============================================
// Sprint 1: Émotions & Journal
// ============================================

/**
 * Emotion - Enregistrement d'une émotion
 * Permet de suivre l'état émotionnel d'un alter au fil du temps
 */
export interface Emotion {
    id: string;
    alter_id: string;
    emotion: EmotionType;
    intensity: 1 | 2 | 3 | 4 | 5; // 1 = faible, 5 = très forte
    note?: string;
    created_at: string;
    // Relations
    alter?: Alter;
}

/**
 * Types d'émotions disponibles avec leurs emojis associés
 */
export type EmotionType =
    | 'happy'     // 😊
    | 'sad'       // 😢
    | 'anxious'   // 😰
    | 'angry'     // 😡
    | 'tired'     // 😴
    | 'calm'      // 😌
    | 'confused'  // 😕
    | 'excited';  // 🤩

/**
 * Mapping émotion -> emoji pour l'affichage
 */
export const EMOTION_EMOJIS: Record<EmotionType, string> = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    angry: '😡',
    tired: '😴',
    calm: '😌',
    confused: '😕',
    excited: '🤩',
};

/**
 * Mapping émotion -> label en français
 */
export const EMOTION_LABELS: Record<EmotionType, string> = {
    happy: 'Heureux·se',
    sad: 'Triste',
    anxious: 'Anxieux·se',
    angry: 'En colère',
    tired: 'Fatigué·e',
    calm: 'Calme',
    confused: 'Confus·e',
    excited: 'Excité·e',
};

/**
 * JournalEntry - Entrée de journal personnel
 * Avec option de verrouillage pour les entrées privées
 */
export interface JournalEntry {
    id: string;
    alter_id: string;
    title?: string;
    content: string;
    mood?: EmotionType; // Lien avec l'émotion
    is_audio: boolean;
    audio_url?: string;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
    // Relations
    alter?: Alter;
}
