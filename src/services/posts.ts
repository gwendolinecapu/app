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
     * Fetch a single post by its ID
     */
    getPostById: async (postId: string): Promise<Post | null> => {
        try {
            const docRef = doc(db, POSTS_COLLECTION, postId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
                    updated_at: data.updated_at?.toDate().toISOString() || new Date().toISOString(),
                } as Post;
            }
            return null;
        } catch (error) {
            console.error('Error fetching post by ID:', error);
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
     * Fetch global feed (all public posts)
     */
    fetchGlobalFeed: async (lastVisible: QueryDocumentSnapshot | null = null, pageSize: number = 20) => {
        try {
            // For now, fetch all posts ordered by date.
            let q = query(
                collection(db, POSTS_COLLECTION),
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
            console.error('Error fetching global feed:', error);
            throw error;
        }
    },

    /**
     * Fetch feed including friends
     * @param friendIds - Array of friend alter/system IDs to include in the feed
     */
    fetchFeed: async (friendIds: string[], lastVisible: QueryDocumentSnapshot | null = null, pageSize: number = 20) => {
        try {
            // Firestore 'in' query supports max 10 values.
            // If friendIds is empty, show empty feed (or suggestions in UI).

            if (friendIds.length === 0) {
                return {
                    posts: [],
                    lastVisible: null
                };
            }

            // Limit to 10 for 'in' query constraint
            const targetIds = friendIds.slice(0, 10);

            let q = query(
                collection(db, POSTS_COLLECTION),
                where('system_id', 'in', targetIds),
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
            console.error('Error fetching friend feed:', error);
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
     * Upload an audio file for a post (voice note)
     */
    uploadAudio: async (uri: string, systemId: string): Promise<string> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            // Extension depends on platform/recording settings, usually m4a or caf on iOS, 3gp/mp4 on Android
            // expo-av high quality preset uses .m4a usually
            const filename = `posts/${systemId}/audio/${Date.now()}.m4a`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob, {
                contentType: 'audio/m4a', // Best guess for high quality preset
            });
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading audio:', error);
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
