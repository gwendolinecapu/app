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
    arrayRemove,
    documentId,
} from 'firebase/firestore';

import { Story, StoryHighlight } from '../types';

// =====================================================
// STORIES SERVICE
// Gère les stories éphémères (type Instagram)
// - Expiration après 24h
// - Marquage comme vu
// - Support image/vidéo
// =====================================================

export interface CreateStoryInput {
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    authorFrame?: string;
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
    const { authorId, authorName, authorAvatar, authorFrame, systemId, mediaUrl, mediaType } = input;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STORY_DURATION_MS);

    const docRef = await addDoc(collection(db, 'stories'), {
        author_id: authorId,
        author_name: authorName,
        author_avatar: authorAvatar || null,
        author_frame: authorFrame || null,
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
        author_frame: authorFrame,
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
            author_frame: data.author_frame,
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
 * Récupère les stories actives d'un auteur spécifique
 */
export async function fetchAuthorStories(authorId: string): Promise<Story[]> {
    const now = new Date();
    const storiesRef = collection(db, 'stories');
    const q = query(
        storiesRef,
        where('author_id', '==', authorId),
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
            author_frame: data.author_frame,
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
    authorFrame?: string;
    stories: Story[];
    hasUnviewed: boolean;
}[] {
    const authors: Map<string, {
        authorId: string;
        authorName: string;
        authorAvatar?: string;
        authorFrame?: string;
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
                authorFrame: story.author_frame,
                stories: [story],
            });
        }
    }

    return Array.from(authors.values()).map(author => ({
        ...author,
        hasUnviewed: author.stories.some(s => !s.viewers || s.viewers.length === 0),
    }));
}

/**
 * Récupère les décorations actuelles pour une liste d'auteurs.
 */
export const fetchAuthorsDecorations = async (authorIds: string[]): Promise<Record<string, string>> => {
    if (!authorIds.length) return {};

    try {
        const uniqueIds = [...new Set(authorIds)].slice(0, 10);
        const q = query(
            collection(db, 'alters'),
            where(documentId(), 'in', uniqueIds)
        );

        const snapshot = await getDocs(q);
        const decorations: Record<string, string> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.equipped_items?.frame) {
                decorations[doc.id] = data.equipped_items.frame;
            }
        });

        return decorations;
    } catch (error) {
        console.error('Error fetching author decorations:', error);
        return {};
    }
};

// =====================================================
// HIGHLIGHTS (STORIES À LA UNE)
// =====================================================

/**
 * Crée une nouvelle collection à la une (Highlight)
 */
export async function createHighlight(
    systemId: string,
    title: string,
    coverImageUrl: string,
    storyIds: string[],
    alterId?: string
): Promise<StoryHighlight> {
    const highlightsRef = collection(db, 'story_highlights');
    const now = new Date().toISOString();

    const docData = {
        system_id: systemId,
        alter_id: alterId || null,
        title,
        cover_image_url: coverImageUrl,
        story_ids: storyIds,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(highlightsRef, docData);

    return {
        id: docRef.id,
        system_id: systemId,
        alter_id: alterId,
        title,
        cover_image_url: coverImageUrl,
        story_ids: storyIds,
        created_at: now,
        updated_at: now,
    };
}

/**
 * Récupère les highlights d'un auteur (alter)
 */
export async function fetchHighlights(authorId: string): Promise<StoryHighlight[]> {
    const highlightsRef = collection(db, 'story_highlights');
    const q = query(
        highlightsRef,
        where('alter_id', '==', authorId),
        orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as StoryHighlight;
    });
}

/**
 * Ajoute une story à un highlight
 */
export async function addStoryToHighlight(highlightId: string, storyId: string): Promise<void> {
    const ref = doc(db, 'story_highlights', highlightId);
    await updateDoc(ref, {
        story_ids: arrayUnion(storyId),
        updated_at: serverTimestamp()
    });
}

/**
 * Retire une story d'un highlight
 */
export async function removeStoryFromHighlight(highlightId: string, storyId: string): Promise<void> {
    const ref = doc(db, 'story_highlights', highlightId);
    await updateDoc(ref, {
        story_ids: arrayRemove(storyId),
        updated_at: serverTimestamp()
    });
}

/**
 * Met à jour l'image de couverture d'un highlight
 */
export async function updateHighlightCover(highlightId: string, newCoverUrl: string): Promise<void> {
    const highlightRef = doc(db, 'story_highlights', highlightId);
    await updateDoc(highlightRef, {
        cover_image_url: newCoverUrl,
        updated_at: serverTimestamp(),
    });
}

/**
 * Supprime un highlight complet
 */
export async function deleteHighlight(highlightId: string): Promise<void> {
    await deleteDoc(doc(db, 'story_highlights', highlightId));
}

export const StoriesService = {
    createStory,
    fetchActiveStories,
    fetchAuthorStories,
    markStoryAsViewed,
    deleteStory,
    groupStoriesByAuthor,
    fetchAuthorsDecorations,
    // Highlights
    createHighlight,
    fetchHighlights,
    addStoryToHighlight,
    removeStoryFromHighlight,
    updateHighlightCover,
    deleteHighlight,
    deleteAllHighlights,
};

/**
 * Supprime TOUS les highlights (pour nettoyage)
 */
export async function deleteAllHighlights(): Promise<number> {
    const highlightsRef = collection(db, 'story_highlights');
    const snapshot = await getDocs(highlightsRef);

    let count = 0;
    for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'story_highlights', docSnap.id));
        count++;
    }

    return count;
}
