// Types pour PluralConnect

export interface System {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
    headspace?: string; // 'sunny', 'cloudy', 'rainy', 'stormy', 'night', etc.
    created_at: string;
}

// Rôle d'un alter dans le système (ex: Protecteur, Gatekeeper)
export interface Role {
    id: string;
    system_id: string;
    name: string;
    color: string; // Hex color code for badge
    description?: string;
    createdAt: number;
}

export interface Alter {
    id: string;
    name: string;
    pronouns?: string;
    bio?: string;
    avatar?: string;
    avatar_url?: string; // Alias for avatar (backward compatibility)
    color?: string; // Couleur préférée de l'alter (pour l'UI)
    role_ids?: string[]; // IDs des rôles attribués
    createdAt: any; // Timestamp Firestore
    userId: string; // ID de l'utilisateur principal (système)
    is_host?: boolean; // Si l'alter est l'hôte principal
    is_active: boolean; // Si l'alter est actuellement au front
    isPinned?: boolean; // Épinglé en haut de liste
    isArchived?: boolean; // Archivé (masqué par défaut)
    // ... autres champs potentiels (âge, pronoms, description, etc.)
    // Champs de sécurité / crise
    triggers?: string[];
    fronting_help?: string;
    safety_notes?: string;
    crisis_contact?: string;

    // Customization
    likes?: string[];
    dislikes?: string[];
    custom_fields?: { label: string; value: string }[];
}

export interface Post {
    id: string;
    system_id: string;
    alter_id?: string; // Optional if blurry or fully co-front (but usually we keep one as checking/primary)
    author_type: 'single' | 'co-front' | 'blurry';
    co_front_alter_ids?: string[]; // For co-front mode
    content: string;
    media_url?: string;
    media_urls?: string[]; // Support for multi-image carousel
    visibility: 'private' | 'system' | 'friends' | 'public';
    created_at: string;
    updated_at: string;
    // Denormalized author info for feed display (populated on fetch)
    author_id?: string;      // = alter_id or system_id as fallback
    author_name?: string;    // Alter name or System username
    author_avatar?: string;  // Alter avatar or System avatar
    is_author_fronting?: boolean; // True if author is currently fronting
    // Metrics
    likes: string[]; // Array of user/system IDs
    comments_count: number;
    // Relations
    alter?: Alter;
    co_front_alters?: Alter[]; // Joined data for display
}

export interface Message {
    id: string;
    sender_alter_id: string;
    receiver_alter_id?: string; // Optionnel si c'est un message de groupe
    group_id?: string; // ID du groupe si c'est un message de groupe
    conversation_id?: string; // ID conversation privée
    content: string;
    type: 'text' | 'image' | 'poll' | 'note';
    is_internal: boolean;
    is_read: boolean;
    created_at: string;
    system_tag?: string; // Tag optionnel (ex: "[Leo]")
    media_url?: string; // URL de l'image/média si type === 'image'

    // Enrichissements
    poll_options?: { label: string; id: string }[];
    poll_votes?: { option_id: string; user_id: string }[]; // votes
    reactions?: { emoji: string; user_id: string }[];

    // Relations
    sender?: Alter;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    created_by: string; // system_id
    created_at: number;
    type: 'private' | 'public';
    members?: string[]; // IDs des systèmes membres (dénormalisation pour requêtes simples)
}

export interface GroupMember {
    id: string;
    group_id: string;
    system_id: string;
    role: 'admin' | 'member';
    joined_at: number;
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

// ============================================
// Sprint 3: Fronting & Tâches
// ============================================

export interface FrontingEntry {
    id: string;
    system_id: string;
    alter_id: string;
    start_time: string; // ISO string 
    end_time: string | null; // ISO string or null if ongoing
    duration?: number; // In seconds
    alter?: Alter; // Joined data
}

export interface Task {
    id: string;
    system_id: string;
    title: string;
    description?: string;
    assigned_to: string | null; // alter_id or null for "System"
    created_by: string; // alter_id
    is_completed: boolean;
    completed_at?: string; // ISO string
    created_at: string;
    due_date?: string;
    assigned_alter?: Alter; // Joined data
    creator_alter?: Alter; // Joined data
}

export interface HelpRequest {
    id: string;
    system_id: string;
    requester_alter_id: string; // ID de l'alter qui demande de l'aide
    requester_name?: string; // Nom de l'alter (dénormalisé pour affichage facile)
    type: 'emergency' | 'support' | 'talk';
    status: 'pending' | 'resolved';
    description: string;
    is_anonymous?: boolean;
    created_at: number;
    resolved_at?: number;
}

// ============================================
// Système de Follow (Social)
// ============================================

/**
 * Follow - Relation de suivi entre deux systèmes
 * Un système peut suivre un autre système pour voir ses posts publics
 */
export interface Follow {
    id: string;
    follower_id: string;     // system_id qui suit
    following_id: string;    // system_id suivi
    created_at: string;
}

/**
 * PublicProfile - Profil public d'un système
 * Permet de contrôler ce qui est visible par les autres utilisateurs
 */
export interface PublicProfile {
    system_id: string;       // Référence vers systems
    display_name: string;    // Nom public du système
    bio?: string;
    avatar_url?: string;
    is_public: boolean;      // Profil visible dans découverte (false par défaut)
    follower_count: number;  // Dénormalisé pour performance
    following_count: number;
    created_at: string;
    updated_at: string;
}

