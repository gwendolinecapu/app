// Types pour PluralConnect

export interface System {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    headspace?: string; // 'sunny', 'cloudy', 'rainy', 'stormy', 'night', etc.
    created_at: string;
    alter_count?: number; // Pre-filled from onboarding
    isAdmin?: boolean; // Admin privilege
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
    createdAt: any; // Timestamp Firestore | string | number
    userId: string; // ID de l'utilisateur principal (système)
    systemId?: string; // Alias for userId (consistency)
    system_id?: string; // Alias for userId (database consistency)
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

    // Monetization & Inventory (Alter-specific)
    owned_items?: string[]; // IDs of items owned by this alter
    credits?: number; // Current credit balance
    last_daily_reward?: string; // Date (YYYY-MM-DD) of last claim
    last_reward_ad?: number; // Timestamp of last ad watch

    // Customize Identity
    birthDate?: string; // YYYY-MM-DD
    arrivalDate?: string; // YYYY-MM-DD

    // Equipped Cosmetics
    equipped_items?: {
        frame?: string;
        theme?: string;
        bubble?: string;
    };

    // Advanced Tools (Phase 11)
    relationships?: Relationship[];

    // Social Integration (Phase 12)
    social_sessions?: {
        platform: 'tiktok' | 'instagram' | 'twitter' | 'youtube';
        cookies: Record<string, any>;
        last_active: string;
    }[];

    // Primers / Notes
    primers?: Primer[];

    // AI Features
    visual_dna?: VisualDNA;
}

export interface VisualDNA {
    description: string;
    reference_sheet_url?: string; // New: Turn-around view
    reference_sheet: string;
    generated_at: any; // Firestore Timestamp
    is_ready: boolean;
}

export interface Primer {
    id: string;
    label: string; // e.g. "Triggers", "Fronting Tips"
    content: string;
    color?: string;
}

export interface Relationship {
    target_alter_id: string;
    type: RelationshipType;
    description?: string;
}

export type RelationshipType = 'friend' | 'partner' | 'family' | 'enemy' | 'work' | 'other';

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
    mentioned_alter_ids?: string[];
    mentioned_system_ids?: string[];
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

export interface Comment {
    id: string;
    post_id: string;
    author_id: string;       // Alter ID or System ID
    author_name: string;     // Denormalized for fast display
    author_avatar?: string;
    system_id?: string; // Opt-in for system profile navigation
    content: string;
    created_at: string;
    // Replies
    parent_id?: string; // ID of the parent comment
    reply_to_author_name?: string; // Name of the author being replied to (snapshot)
    reply_to_author_id?: string; // ID of the author being replied to
    // Future: likes
}

export interface Message {
    id: string;
    system_id: string; // ID du système propriétaire
    sender_alter_id: string;
    receiver_alter_id?: string; // Optionnel si c'est un message de groupe
    group_id?: string; // ID du groupe si c'est un message de groupe
    conversation_id?: string; // ID conversation privée
    content: string;
    type: 'text' | 'image' | 'poll' | 'note' | 'post';
    is_internal: boolean;
    is_read: boolean;
    created_at: string;
    system_tag?: string; // Tag optionnel (ex: "[Leo]")
    media_url?: string; // URL de l'image/média si type === 'image'
    imageUrl?: string; // Alias for media_url or specific for photos
    post_id?: string; // ID du post partagé

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
    emotions?: EmotionType[]; // Support for multiple emotions
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
    | 'excited'   // 🤩
    | 'fear'      // 😨
    | 'shame'     // 😳
    | 'bored'     // 😐
    | 'proud'     // 🦁
    | 'love'      // 🥰
    | 'sick'      // 🤢
    | 'guilt'     // 😔
    | 'hurt';     // 🤕

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
    fear: '😨',
    shame: '😳',
    bored: '😐',
    proud: '🦁',
    love: '🥰',
    sick: '🤢',
    guilt: '😔',
    hurt: '🤕',
};

/**
 * Mapping émotion -> label en français
 */
export const EMOTION_LABELS: Record<EmotionType, string> = {
    happy: 'Joyeux',
    sad: 'Triste',
    anxious: 'Anxieux',
    angry: 'En colère',
    tired: 'Fatigué',
    calm: 'Calme',
    confused: 'Confus',
    excited: 'Excité',
    fear: 'Peur',
    shame: 'Honte',
    bored: 'Ennuyé',
    proud: 'Fier',
    love: 'Amoureux',
    sick: 'Malade',
    guilt: 'Coupable',
    hurt: 'Blessé',
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
    credits?: number;
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
    // New fields for Alter Task System
    category?: 'general' | 'care' | 'admin' | 'fun' | 'work';
    recurrence?: 'none' | 'daily' | 'weekly';
    visibility?: 'private' | 'public';
    reward_claimed?: boolean; // If +5 credits have been claimed
    xp_reward?: number; // Potential XP reward
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
    email?: string;          // Email pour la recherche (optionnel pour la vie privée)
    bio?: string;
    avatar_url?: string;
    is_public: boolean;      // Profil visible dans découverte (false par défaut)
    follower_count: number;  // Dénormalisé pour performance
    following_count: number;
    created_at: string;
    updated_at: string;
}

// ============================================
// Sprint 5: Stories (Instagram-like)
// ============================================

export interface Story {
    id: string;
    author_id: string;        // Alter ID
    author_name: string;      // Denormalized
    author_avatar?: string;
    author_frame?: string;    // Frame ID (e.g., 'frame_tropical')
    system_id: string;        // System ID owner
    media_url: string;
    media_type: 'image' | 'video';
    created_at: string;
    expires_at: string;       // 24h after created_at
    viewers: string[];        // IDs of users who viewed
}

export interface StoryGroup {
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    authorFrame?: string;
    stories: Story[];
    hasUnviewed: boolean;
}


// ============================================
// Inner World (Phase 13)
// ============================================

export interface InnerWorld {
    id: string;
    system_id: string;
    alter_id: string;
    name: string;
    description?: string;
    background_color?: string;
    created_at: string;
    updated_at: string;
}

export type ShapeType = 'rectangle' | 'l-shape' | 'irregular' | 'organic' | 'custom' | 'building' | 'nature' | 'transport' | 'furniture' | 'text';

export interface InnerWorldShape {
    id: string;
    world_id: string;
    type: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    name: string;
    image_url?: string;
    icon?: string | null; // Icon name (Ionicons) or sticker ID
    emotion?: EmotionType;
    intention?: string;
    color?: string;
    border_radius?: number;
    fontSize?: number;
    linked_world_id?: string; // ID of the inner world contained in this shape
    created_at: string;
}

// ============================================
// AI Job System
// ============================================

export interface AIJob {
    id: string;
    userId: string;
    type: 'ritual' | 'magic_post' | 'chat';
    status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
    progress?: {
        percent: number;
        stage: string;
    };
    result?: any;
    error?: {
        code: string;
        message: string;
        details?: string;
    };
    params: any;
    metadata?: {
        costEstimate?: number;
        provider?: string;
        model?: string;
        attempts?: number;
        maxAttempts?: number;
        providerUsed?: any;
        fallbackUsed?: boolean;
    };
    createdAt: any;
    updatedAt: any;
}
