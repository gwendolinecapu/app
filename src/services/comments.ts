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
    parentId?: string;
    replyToAuthorName?: string;
    replyToAuthorId?: string;
}

/**
 * Ajoute un commentaire à un post
 * Met à jour le compteur comments_count du post parent
 */
export async function addComment(input: CreateCommentInput): Promise<Comment> {
    const { postId, authorId, authorName, authorAvatar, content, parentId, replyToAuthorName, replyToAuthorId } = input;

    // 1. Ajouter le commentaire dans la sous-collection
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const commentData: any = {
        author_id: authorId,
        author_name: authorName,
        author_avatar: authorAvatar || null,
        content: content.trim(),
        created_at: serverTimestamp(),
    };

    if (parentId) {
        commentData.parent_id = parentId;
        commentData.reply_to_author_name = replyToAuthorName || null;
        commentData.reply_to_author_id = replyToAuthorId || null;
    }

    const docRef = await addDoc(commentsRef, commentData);

    // 2. Incrémenter le compteur sur le post parent
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
        comments_count: increment(1)
    });

    // 3. Create Notification for Post Owner (if not self)
    try {
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
            const postData = postDoc.data();
            const postOwnerId = postData.system_id;

            if (postOwnerId !== authorId) {
                const notificationRef = collection(db, 'notifications');
                await addDoc(notificationRef, {
                    type: 'comment',
                    recipientId: postData.alter_id || postData.system_id, // Target the specific alter
                    targetSystemId: postData.system_id, // REQUIRED for security rules and filtering
                    senderId: authorId,
                    senderAlterId: authorId, // Set the specific author ID to ensure correct profile resolution
                    actorName: authorName,
                    actorAvatar: authorAvatar || null,
                    postId: postId,
                    read: false,
                    created_at: serverTimestamp(),
                    title: "Nouveau commentaire",
                    body: `${authorName} a commenté votre publication : "${content}"`,
                    subtitle: content,
                    mediaUrl: postData.media_url || null, // Add media URL from post data
                });

                // Send Push
                const { default: PushService } = await import('./PushNotificationService');
                await PushService.sendNewCommentNotification(
                    postOwnerId,
                    authorName,
                    content,
                    postId
                );
            }
        }
    } catch (error) {
        console.error('Error sending comment notification:', error);
        // Don't fail comment creation
    }

    return {
        id: docRef.id,
        post_id: postId,
        author_id: authorId,
        author_name: authorName,
        author_avatar: authorAvatar,
        content: content.trim(),
        created_at: new Date().toISOString(),
        parent_id: parentId,
        reply_to_author_name: replyToAuthorName,
        reply_to_author_id: replyToAuthorId,
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

    // Optimization: We rely on denormalized author data stored in the comment document
    // to avoid N+1 reads (fetching author profile for every comment).
    // This dramatically reduces Firestore reads and improves performance.
    const comments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            post_id: postId,
            author_id: data.author_id,
            author_name: data.author_name || 'Utilisateur inconnu',
            author_avatar: data.author_avatar,
            content: data.content,
            created_at: data.created_at instanceof Timestamp
                ? data.created_at.toDate().toISOString()
                : (data.created_at || new Date().toISOString()),
            parent_id: data.parent_id,
            reply_to_author_name: data.reply_to_author_name,
            reply_to_author_id: data.reply_to_author_id,
        };
    });

    return comments;
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
