import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
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

// =====================================================
// COMMENTS SERVICE
// Gère les commentaires sur les posts
// Collection: posts/{postId}/comments (sous-collection)
// =====================================================

export interface Comment {
    id: string;
    post_id: string;
    author_id: string;       // Alter ID ou System ID
    author_name: string;     // Dénormalisé pour affichage rapide
    author_avatar?: string;
    content: string;
    created_at: string;
    // Future: likes, replies
}

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

    return snapshot.docs.map(doc => {
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
