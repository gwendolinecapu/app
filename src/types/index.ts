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
