import { column, Schema, Table } from '@powersync/react-native';

// Schéma SQLite local pour PowerSync
export const SystemsTable = new Table({
    id: column.text,
    email: column.text,
    username: column.text,
    created_at: column.text,
});

export const AltersTable = new Table({
    id: column.text,
    system_id: column.text,
    name: column.text,
    avatar_url: column.text,
    bio: column.text,
    pronouns: column.text,
    color: column.text,
    is_host: column.integer, // 0 ou 1
    is_active: column.integer, // 0 ou 1
    created_at: column.text,
});

export const PostsTable = new Table({
    id: column.text,
    system_id: column.text,
    alter_id: column.text,
    content: column.text,
    media_url: column.text,
    visibility: column.text, // 'private' | 'system' | 'friends' | 'public'
    created_at: column.text,
    updated_at: column.text,
});

export const MessagesTable = new Table({
    id: column.text,
    sender_alter_id: column.text,
    receiver_alter_id: column.text,
    conversation_id: column.text,
    content: column.text,
    is_internal: column.integer,
    is_read: column.integer,
    created_at: column.text,
});

export const ConversationsTable = new Table({
    id: column.text,
    is_internal: column.integer,
    created_at: column.text,
    updated_at: column.text,
});

export const ConversationParticipantsTable = new Table({
    id: column.text,
    conversation_id: column.text,
    alter_id: column.text,
    joined_at: column.text,
});

export const AppSchema = new Schema({
    systems: SystemsTable,
    alters: AltersTable,
    posts: PostsTable,
    messages: MessagesTable,
    conversations: ConversationsTable,
    conversation_participants: ConversationParticipantsTable,
});

export type AppDatabase = (typeof AppSchema)['types'];
