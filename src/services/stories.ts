import { db, storage } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    updateDoc,
    arrayUnion,
} from 'firebase/firestore';

// =====================================================
// STORIES SERVICE
// Gère les stories éphémères (type Instagram)
// - Expiration après 24h
// - Marquage comme vu
// - Support image/vidéo
// =====================================================

export interface Story {
    id: string;
    author_id: string;        // Alter ID
    author_name: string;      // Dénormalisé
    author_avatar?: string;
    system_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    created_at: string;
    expires_at: string;       // 24h après created_at
    viewers: string[];        // IDs des users qui ont vu
    // Futur: text overlay, stickers, etc.
}

export interface CreateStoryInput {
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    systemId: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
}

const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Crée une nouvelle story
 * Expire automatiquement après 24h
 */
export async function createStory(input: CreateStoryInput): Promise<Story> {
    const { authorId, authorName, authorAvatar, systemId, mediaUrl, mediaType } = input;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STORY_DURATION_MS);

    const docRef = await addDoc(collection(db, 'stories'), {
        author_id: authorId,
        author_name: authorName,
        author_avatar: authorAvatar || null,
        system_id: systemId,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: serverTimestamp(),
        expires_at: Timestamp.fromDate(expiresAt),
        viewers: [],
    });

    return {
        id: docRef.id,
        author_id: authorId,
        author_name: authorName,
        author_avatar: authorAvatar,
        system_id: systemId,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        viewers: [],
    };
}

/**
 * Récupère les stories actives (non expirées) des amis + propres stories
 * @param friendIds Liste des IDs des systèmes amis
 * @param currentSystemId ID du système actuel
 */
export async function fetchActiveStories(
    friendIds: string[],
    currentSystemId: string
): Promise<Story[]> {
    const now = new Date();

    // Inclure ses propres stories + celles des amis
    const systemIds = [currentSystemId, ...friendIds].slice(0, 10); // Firestore limit

    if (systemIds.length === 0) return [];

    const storiesRef = collection(db, 'stories');
    const q = query(
        storiesRef,
        where('system_id', 'in', systemIds),
        where('expires_at', '>', Timestamp.fromDate(now)),
        orderBy('expires_at', 'asc'),
        orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            author_id: data.author_id,
            author_name: data.author_name,
            author_avatar: data.author_avatar,
            system_id: data.system_id,
            media_url: data.media_url,
            media_type: data.media_type,
            created_at: data.created_at instanceof Timestamp
                ? data.created_at.toDate().toISOString()
                : data.created_at,
            expires_at: data.expires_at instanceof Timestamp
                ? data.expires_at.toDate().toISOString()
                : data.expires_at,
            viewers: data.viewers || [],
        };
    });
}

/**
 * Marque une story comme vue par un utilisateur
 */
export async function markStoryAsViewed(storyId: string, viewerId: string): Promise<void> {
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, {
        viewers: arrayUnion(viewerId)
    });
}

/**
 * Supprime une story (par son auteur)
 */
export async function deleteStory(storyId: string): Promise<void> {
    await deleteDoc(doc(db, 'stories', storyId));
}

/**
 * Groupe les stories par auteur pour l'affichage en barre
 * Retourne un tableau d'auteurs avec leurs stories
 */
export function groupStoriesByAuthor(stories: Story[]): {
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    stories: Story[];
    hasUnviewed: boolean;
}[] {
    const authors: Map<string, {
        authorId: string;
        authorName: string;
        authorAvatar?: string;
        stories: Story[];
    }> = new Map();

    for (const story of stories) {
        const existing = authors.get(story.author_id);
        if (existing) {
            existing.stories.push(story);
        } else {
            authors.set(story.author_id, {
                authorId: story.author_id,
                authorName: story.author_name,
                authorAvatar: story.author_avatar,
                stories: [story],
            });
        }
    }

    return Array.from(authors.values()).map(author => ({
        ...author,
        hasUnviewed: author.stories.some(s => !s.viewers || s.viewers.length === 0),
    }));
}

export const StoriesService = {
    createStory,
    fetchActiveStories,
    markStoryAsViewed,
    deleteStory,
    groupStoriesByAuthor,
};
