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
    QueryDocumentSnapshot,
    deleteDoc
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
                mentioned_alter_ids: postData.mentioned_alter_ids || [],
                mentioned_system_ids: postData.mentioned_system_ids || [],
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
                const post = {
                    id: docSnap.id,
                    ...data,
                    created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
                    updated_at: data.updated_at?.toDate().toISOString() || new Date().toISOString(),
                } as Post;

                const enrichedPosts = await PostService._enrichPostsWithAuthors([post]);
                return enrichedPosts[0];
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
    /**
     * Enrich posts with author details (alter name/avatar)
     */
    _enrichPostsWithAuthors: async (posts: Post[]): Promise<Post[]> => {
        const alterIds = new Set(posts.map(p => p.alter_id).filter(id => id));
        const systemIds = new Set(posts.map(p => p.system_id).filter(id => id));

        const altersMap = new Map<string, any>();
        const systemsMap = new Map<string, any>();

        await Promise.all([
            // Fetch Alters
            ...Array.from(alterIds).map(async (id) => {
                try {
                    if (!id) return;
                    const alterDoc = await getDoc(doc(db, 'alters', id));
                    if (alterDoc.exists()) {
                        altersMap.set(id, alterDoc.data());
                    }
                } catch (e) {
                    console.warn(`Failed to fetch author alter ${id}`, e);
                }
            }),
            // Fetch Systems
            ...Array.from(systemIds).map(async (id) => {
                try {
                    if (!id) return;
                    const systemDoc = await getDoc(doc(db, 'systems', id));
                    if (systemDoc.exists()) {
                        systemsMap.set(id, systemDoc.data());
                    }
                } catch (e) {
                    console.warn(`Failed to fetch author system ${id}`, e);
                }
            })
        ]);

        return posts.map(post => {
            const system = systemsMap.get(post.system_id);

            if (post.alter_id && altersMap.has(post.alter_id)) {
                const alter = altersMap.get(post.alter_id);
                return {
                    ...post,
                    author_name: alter.name,
                    author_avatar: alter.avatar_url || alter.avatar,
                    alter: { id: post.alter_id, ...alter } as any
                };
            }

            // Fallback to system info
            const resolvedName = system?.username || system?.email?.split('@')[0] || 'Utilisateur';
            const finalName = resolvedName === 'Système' && system?.username ? system.username : resolvedName;

            return {
                ...post,
                author_name: finalName || post.author_name || 'Utilisateur',
                author_avatar: system?.avatar_url || post.author_avatar,
            };
        });
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

            const enrichedPosts = await PostService._enrichPostsWithAuthors(posts);

            return {
                posts: enrichedPosts,
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

            const enrichedPosts = await PostService._enrichPostsWithAuthors(posts);

            return {
                posts: enrichedPosts,
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

            // Limit to 30 for 'in' query constraint (Firestore update allows up to 30)
            const targetIds = friendIds.slice(0, 30);

            let q = query(
                collection(db, POSTS_COLLECTION),
                where('alter_id', 'in', targetIds),
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

            const enrichedPosts = await PostService._enrichPostsWithAuthors(posts);

            return {
                posts: enrichedPosts,
                lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
            };
        } catch (error) {
            console.error('Error fetching friend feed:', error);
            throw error;
        }
    },

    /**
     * Fetch posts where an alter is mentioned
     */
    fetchTaggedPosts: async (alterId: string, lastVisible: QueryDocumentSnapshot | null = null, pageSize: number = 20) => {
        try {
            let q = query(
                collection(db, POSTS_COLLECTION),
                where('mentioned_alter_ids', 'array-contains', alterId),
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

            const enrichedPosts = await PostService._enrichPostsWithAuthors(posts);

            return {
                posts: enrichedPosts,
                lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
            };
        } catch (error) {
            console.error('Error fetching tagged posts:', error);
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
     * Upload a video for a post
     */
    uploadVideo: async (uri: string, systemId: string): Promise<string> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `posts/${systemId}/video/${Date.now()}.mp4`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob, {
                contentType: 'video/mp4',
            });
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading video:', error);
            throw error;
        }
    },

    /**
     * Like or unlike a post
     */
    toggleLike: async (postId: string, userId: string, alterId?: string) => {
        try {
            const postRef = doc(db, POSTS_COLLECTION, postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const post = postSnap.data() as Post;
                const likes = post.likes || [];
                const hasLiked = likes.includes(userId);

                if (hasLiked) {
                    await updateDoc(postRef, {
                        likes: arrayRemove(userId)
                    });
                } else {
                    await updateDoc(postRef, {
                        likes: arrayUnion(userId)
                    });

                    // Create notification if the liker is not the post owner
                    // We allow same-system notifications if they are between different alters
                    const recipientId = post.alter_id || post.system_id;
                    const senderIdentifier = alterId || userId;

                    if (recipientId !== senderIdentifier) {
                        try {
                            // Fetch sender details to detail the notification
                            let senderName = 'Quelqu\'un';
                            try {
                                const systemDoc = await getDoc(doc(db, 'systems', userId));
                                if (systemDoc.exists()) {
                                    const systemData = systemDoc.data();
                                    senderName = systemData.username || 'Utilisateur'; // Fallback
                                }

                                if (alterId) {
                                    const alterDoc = await getDoc(doc(db, 'alters', alterId));
                                    if (alterDoc.exists()) {
                                        const alterData = alterDoc.data();
                                        // Format: "AlterName"
                                        senderName = alterData.name;
                                    }
                                }
                            } catch (fetchError) {
                                console.warn('Error fetching sender details for notification:', fetchError);
                            }

                            // [DEBUG] Trace notification creation
                            console.log('Creating notification for:', post.system_id);

                            const notificationRef = collection(db, 'notifications'); // Re-introduced definition

                            const notificationPayload = {
                                type: 'like',
                                recipientId: post.alter_id || post.system_id, // Target
                                targetSystemId: post.system_id,
                                senderId: userId,
                                senderAlterId: alterId || null,
                                actorName: senderName,
                                postId: postId,
                                read: false,
                                created_at: serverTimestamp(),
                                title: "Nouveau J'aime",
                                body: `${senderName} a aimé votre publication`,
                                subtitle: post.content || (post.media_url ? "Photo" : "Publication"),
                                mediaUrl: post.media_url || null,
                            };
                            console.log('Payload:', JSON.stringify(notificationPayload));

                            await addDoc(notificationRef, notificationPayload);
                            console.log('Notification created successfully!');


                            // Send Push Notification
                            // We need to import PushNotificationService at top of file, or use require/dynamic import to avoid circular dep if any
                            // For now assuming we can import it or using a decoupled way. 
                            // Ideally, move this logic to a Cloud Function.
                            // But since we are doing it client side as requested:
                            const { default: PushService } = await import('./PushNotificationService');
                            await PushService.sendPostReactionNotification(
                                post.system_id,
                                senderName,
                                '❤️'
                            );
                        } catch (notifError) {
                            console.error('Error creating notification:', notifError);
                            // Don't fail the like action if notification fails
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    },

    /**
     * Delete a post
     */
    deletePost: async (postId: string) => {
        try {
            await deleteDoc(doc(db, POSTS_COLLECTION, postId));
            // Note: Cloud functions or triggers should handle deleting subcollections (comments) and storage files (images)
            // Ideally we should delete them here too if no cloud functions are set up.
            // For now, we assume simple deletion.
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }
};
