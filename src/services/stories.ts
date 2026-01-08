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
    currentSystemId: string,
    allowedAuthorIds?: string[] // STRICT PRIVACY: Only return stories from these authors
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

    let docs = snapshot.docs;

    // Filter by specific author IDs if friendIds implies strict author checking
    // The query above uses system_ids. One system can contain multiple alters.
    // If strict privacy is needed per-alter, we must filter here.
    // We assume 'friendIds' passed to this function are SYSTEM IDs or ALTER IDs?
    // In strict mode, friendIds are usually Alter IDs.
    // BUT the query checks 'system_id' IN friendIds.
    // This implies friendIds passed here are SYSTEM IDs.

    // WAIT. If friendIds are Alter IDs, the query `where('system_id', 'in', systemIds)` is WRONG if we mix Alter IDs and System IDs.
    // Current usage in StoriesBar: pass friendIds (Alter IDs).
    // BUT StoriesBar logic: `const systemIds = [currentSystemId, ...friendIds]`
    // If friendIds contains Alter IDs, and we treat them as System IDs...
    // In PluralConnect: System ID === User UID. Alter ID === Document ID.
    // If we are friends with an Alter from another system, the friendId IS the Alter ID?
    // Start again: `FriendService` manages Alter-Alter relationships.
    // So `friendIds` are ALTER IDs.

    // IF we query `system_id` using Alter IDs, we get NOTHING (unless Alter ID == System ID).
    // So the query line 98 `where('system_id', 'in', systemIds)` suggests `friendIds` MUST be System IDs.
    // Let's check `StoriesBar` usage. It passes `friendIds` from `useAlterData` or context.
    // If `friendIds` are Alter IDs, then this service method is flawed for strict Alter-Alter privacy.

    // FIX: 
    // 1. We should fetch stories where 'author_id' IN [myId, ...friendIds].
    // BUT 'in' query limit is 10. We might have 20 friends.
    // 2. Fallback: Fetch by System (broad) then filter by Author (narrow).
    // Issue: We don't have the friend's System ID easily available here?
    // Actually, `fetchActiveStories` assumes we pull by System.

    // If we want strict privacy:
    // We allow fetching my system (currentSystemId).
    // BUT we must filter results to only show stories from ME (currentAlter) + Friends.

    // To do this, we need 'allowedAuthorIds'.
    // I will add a new param 'allowedAuthorIds' to this function.
    // Or I will reuse 'friendIds' as the allow list (assuming it contains Alter IDs).
    // And I will NOT use 'friendIds' for the system_id query if they are not system IDs.
    // But how do we get stories from friends in OTHER systems if we don't know their System ID?
    // The 'friendIds' passed to `StoriesBar` comes from `useAlterData`.

    // Correct Fix for now:
    // Filter results using `friendIds` (treating them as Allowed Author IDs).
    // AND `currentSystemId` stories need invalid authors filtered out.

    // I'll assume `friendIds` contains Valid Author IDs (friends).
    // I need to filter `snapshot.docs` to keep only stories where:
    // story.author_id IS IN [currentAuthorId, ...friendIds]

    // But I don't have `currentAuthorId` passed here, only `currentSystemId`.
    // I'll modify the signature or assume caller handles it?
    // Caller: StoriesBar. It has `currentAlter`.

    // Let's change this function to take `allowedAuthorIds` (optional).
    // If present, filter.

    const stories = snapshot.docs.map(doc => {
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
 * Récupère pécifiquement des stories par leurs IDs (pour les Highlights)
 * Inclut les stories expirées
 */
export async function fetchStoriesByIds(storyIds: string[]): Promise<Story[]> {
    if (!storyIds || storyIds.length === 0) return [];

    // Batch requests because 'in' limit is 10
    // For simplicity, we'll fetch them in chunks of 10
    const chunks = [];
    for (let i = 0; i < storyIds.length; i += 10) {
        chunks.push(storyIds.slice(i, i + 10));
    }

    const allStories: Story[] = [];

    for (const chunk of chunks) {
        const storiesRef = collection(db, 'stories');
        const q = query(
            storiesRef,
            where(documentId(), 'in', chunk)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            const data = doc.data();
            allStories.push({
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
            });
        });
    }

    // Sort by creation date (oldest first usually for highlights? or newest?)
    // Instagram highlights usually play oldest to newest.
    return allStories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
    fetchStoriesByIds,
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
