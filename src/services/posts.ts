import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    limit,
    startAfter,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    arrayRemove,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { Post } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const POSTS_COLLECTION = 'posts';

export const PostService = {
    /**
     * Create a new post
     */
    createPost: async (postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'likes' | 'comments_count' | 'alter' | 'co_front_alters'>) => {
        try {
            const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
                ...postData,
                likes: [],
                comments_count: 0,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },

    /**
     * Fetch posts for a specific system (or global feed if we implemented that)
     * currently fetching all posts for the system to show in their feed
     */
    fetchPosts: async (systemId: string, lastVisible: QueryDocumentSnapshot | null = null, pageSize: number = 20) => {
        try {
            let q = query(
                collection(db, POSTS_COLLECTION),
                where('system_id', '==', systemId),
                orderBy('created_at', 'desc'),
                limit(pageSize)
            );

            if (lastVisible) {
                q = query(q, startAfter(lastVisible));
            }

            const querySnapshot = await getDocs(q);
            const posts: Post[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                posts.push({
                    id: doc.id,
                    ...data,
                    created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
                    updated_at: data.updated_at?.toDate().toISOString() || new Date().toISOString(),
                } as Post);
            });

            return {
                posts,
                lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
            };
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    },

    /**
     * Upload an image for a post
     */
    uploadImage: async (uri: string, systemId: string): Promise<string> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `posts/${systemId}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    /**
     * Like or unlike a post
     */
    toggleLike: async (postId: string, userId: string, alterId?: string) => {
        // This is a simplified like toggle. 
        // In a real app, you might want a separate subcollection for likes to scale.
        try {
            const postRef = doc(db, POSTS_COLLECTION, postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const post = postSnap.data() as Post;
                const likes = post.likes || [];
                const hasLiked = likes.includes(userId); // Simplified: check by userId for now, or composed ID

                if (hasLiked) {
                    await updateDoc(postRef, {
                        likes: arrayRemove(userId)
                    });
                } else {
                    await updateDoc(postRef, {
                        likes: arrayUnion(userId)
                    });
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }
};
