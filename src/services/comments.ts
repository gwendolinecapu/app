import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    updateDoc,
    increment
} from 'firebase/firestore';
import { Comment } from '../types';

// =====================================================
// COMMENTS SERVICE
// Gère les commentaires sur les posts
// Collection: posts/{postId}/comments (sous-collection)
// =====================================================

export interface CreateCommentInput {
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
}

/**
 * Ajoute un commentaire à un post
 * Met à jour le compteur comments_count du post parent
 */
export async function addComment(input: CreateCommentInput): Promise<Comment> {
    const { postId, authorId, authorName, authorAvatar, content } = input;

    // 1. Ajouter le commentaire dans la sous-collection
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const docRef = await addDoc(commentsRef, {
        author_id: authorId,
        author_name: authorName,
        author_avatar: authorAvatar || null,
        content: content.trim(),
        created_at: serverTimestamp(),
    });

    // 2. Incrémenter le compteur sur le post parent
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
        comments_count: increment(1)
    });

    return {
        id: docRef.id,
        post_id: postId,
        author_id: authorId,
        author_name: authorName,
        author_avatar: authorAvatar,
        content: content.trim(),
        created_at: new Date().toISOString(),
    };
}

/**
 * Récupère les commentaires d'un post (les plus récents)
 */
export async function fetchComments(postId: string, limitCount: number = 20): Promise<Comment[]> {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(
        commentsRef,
        orderBy('created_at', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);

    const comments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            post_id: postId,
            author_id: data.author_id,
            author_name: data.author_name,
            author_avatar: data.author_avatar,
            content: data.content,
            created_at: data.created_at instanceof Timestamp
                ? data.created_at.toDate().toISOString()
                : data.created_at,
        };
    });

    return await _enrichCommentsWithAuthors(comments);
}

/**
 * Enrichit les commentaires avec les données d'auteur les plus récentes
 */
async function _enrichCommentsWithAuthors(comments: Comment[]): Promise<Comment[]> {
    if (comments.length === 0) return comments;

    const authorIds = new Set(comments.map(c => c.author_id));
    const authorsMap = new Map<string, any>();

    await Promise.all(Array.from(authorIds).map(async (id) => {
        try {
            // Check if it's an alter
            const alterDoc = await getDoc(doc(db, 'alters', id));
            if (alterDoc.exists()) {
                authorsMap.set(id, { ...alterDoc.data(), type: 'alter' });
                return;
            }
            // Check if it's a system
            const systemDoc = await getDoc(doc(db, 'systems', id));
            if (systemDoc.exists()) {
                authorsMap.set(id, { ...systemDoc.data(), type: 'system' });
            }
        } catch (e) {
            console.warn(`Failed to fetch author ${id}`, e);
        }
    }));

    return comments.map(comment => {
        const author = authorsMap.get(comment.author_id);
        if (author) {
            return {
                ...comment,
                author_name: (author.type === 'alter' ? author.name : author.username) || comment.author_name,
                author_avatar: (author.type === 'alter' ? (author.avatar || author.avatar_url) : author.avatar_url) || comment.author_avatar,
                system_id: author.type === 'system' ? author.id : (author.system_id || author.userId || author.systemId),
            };
        }
        return comment;
    });
}

/**
 * Supprime un commentaire (si l'utilisateur est l'auteur)
 * Décrémente le compteur comments_count du post parent
 */
export async function deleteComment(postId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    await deleteDoc(commentRef);

    // Décrémenter le compteur
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
        comments_count: increment(-1)
    });
}

export const CommentsService = {
    addComment,
    fetchComments,
    deleteComment,
};

// Alias for backward compatibility and easier imports
export const CommentService = CommentsService;

// Re-export Comment type for convenience
export { Comment } from '../types';
