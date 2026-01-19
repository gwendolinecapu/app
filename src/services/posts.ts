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
    deleteDoc,
    documentId
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

        const fetchByIds = async (ids: Set<string>, collectionName: string, map: Map<string, any>) => {
            const idList = Array.from(ids).filter(id => id);
            if (idList.length === 0) return;

            const chunks = [];
            for (let i = 0; i < idList.length; i += 10) {
                chunks.push(idList.slice(i, i + 10));
            }

            await Promise.all(chunks.map(async chunk => {
        const fetchByIds = async (collectionName: string, ids: Set<string>, map: Map<string, any>) => {
            const idArray = Array.from(ids).filter(id => !!id);
            if (idArray.length === 0) return;

            const chunks = [];
            for (let i = 0; i < idArray.length; i += 10) {
                chunks.push(idArray.slice(i, i + 10));
            }

            await Promise.all(chunks.map(async (chunk) => {
                try {
                    const q = query(collection(db, collectionName), where(documentId(), 'in', chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        map.set(doc.id, doc.data());
                    });
                } catch (e) {
                    console.warn(`Failed to fetch batch of ${collectionName}`, e);
                        if (doc.exists()) {
                            map.set(doc.id, doc.data());
                        }
                    });
                } catch (e) {
                    console.warn(`Failed to fetch ${collectionName} chunk`, e);
                }
            }));
        };

        await Promise.all([
            fetchByIds(alterIds, 'alters', altersMap),
            fetchByIds(systemIds, 'systems', systemsMap)
            fetchByIds('alters', alterIds, altersMap),
            fetchByIds('systems', systemIds, systemsMap)
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
     * Fetch posts created by a specific alter
     */
    fetchPostsByAlter: async (alterId: string, lastVisible: QueryDocumentSnapshot | null = null, pageSize: number = 20) => {
        try {
            let q = query(
                collection(db, POSTS_COLLECTION),
                where('alter_id', '==', alterId),
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
            console.error('Error fetching alter posts:', error);
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
     * Fetch feed including friends (Alters AND Systems)
     * @param friendIds - Array of friend alter IDs
     * @param friendSystemIds - Array of friend system IDs
     */
    fetchFeed: async (friendIds: string[], friendSystemIds: string[] = [], lastVisible: any = null, pageSize: number = 20) => {
        try {
            // Firestore 'in' query supports max 10-30 values depending on version.
            // We need to query both friendAlters and friendSystems.
            // Strategy: Run both queries (if IDs present) and merge.

            if (friendIds.length === 0 && friendSystemIds.length === 0) {
                return {
                    posts: [],
                    lastVisible: null
                };
            }

            // Parse cursors
            // lastVisible can be:
            // 1. null
            // 2. QueryDocumentSnapshot (legacy/single stream)
            // 3. { alters: QueryDocumentSnapshot | null, systems: QueryDocumentSnapshot | null }
            const cursors = {
                alters: (lastVisible && lastVisible.alters) ? lastVisible.alters : (lastVisible && typeof lastVisible.data === 'function' ? lastVisible : null),
                systems: (lastVisible && lastVisible.systems) ? lastVisible.systems : null
            };

            const promises = [];

            // 1. Query by Alter IDs
            if (friendIds.length > 0) {
                const targetAlterIds = friendIds.slice(0, 30);
                let q1 = query(
                    collection(db, POSTS_COLLECTION),
                    where('alter_id', 'in', targetAlterIds),
                    orderBy('created_at', 'desc'),
                    limit(pageSize)
                );
                if (cursors.alters) q1 = query(q1, startAfter(cursors.alters));
                // Tag the result with source
                promises.push(getDocs(q1).then(snap => ({ source: 'alters', docs: snap.docs })));
            }

            // 2. Query by System IDs
            if (friendSystemIds.length > 0) {
                const targetSystemIds = friendSystemIds.slice(0, 30);
                let q2 = query(
                    collection(db, POSTS_COLLECTION),
                    where('system_id', 'in', targetSystemIds),
                    orderBy('created_at', 'desc'),
                    limit(pageSize)
                );
                if (cursors.systems) q2 = query(q2, startAfter(cursors.systems));
                promises.push(getDocs(q2).then(snap => ({ source: 'systems', docs: snap.docs })));
            }

            const results = await Promise.all(promises);
            // const allDocs = results.flatMap(res => res.docs);

            // Deduplicate by ID and map to source(s)
            const uniqueDocsMap = new Map<string, QueryDocumentSnapshot>();
            const docSources = new Map<string, Set<string>>(); // docId -> Set<'alters' | 'systems'>

            results.forEach(res => {
                res.docs.forEach(doc => {
                    if (!uniqueDocsMap.has(doc.id)) {
                        uniqueDocsMap.set(doc.id, doc);
                    }
                    if (!docSources.has(doc.id)) {
                        docSources.set(doc.id, new Set());
                    }
                    docSources.get(doc.id)!.add(res.source);
                });
            });

            const uniqueDocs = Array.from(uniqueDocsMap.values());

            // Sort merged docs by date desc
            uniqueDocs.sort((a, b) => {
                const dA = a.data().created_at?.toDate()?.getTime() || 0;
                const dB = b.data().created_at?.toDate()?.getTime() || 0;
                return dB - dA;
            });

            // Apply pagination limit to merged result
            const pagedDocs = uniqueDocs.slice(0, pageSize);

            // Calculate new cursors
            let newAltersCursor = cursors.alters;
            let newSystemsCursor = cursors.systems;

            // Find the last doc from each source in pagedDocs to update cursor
            const lastAlterDoc = pagedDocs.slice().reverse().find(doc => docSources.get(doc.id)?.has('alters'));
            if (lastAlterDoc) newAltersCursor = lastAlterDoc;

            const lastSystemDoc = pagedDocs.slice().reverse().find(doc => docSources.get(doc.id)?.has('systems'));
            if (lastSystemDoc) newSystemsCursor = lastSystemDoc;

            const posts: Post[] = pagedDocs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
                    updated_at: data.updated_at?.toDate().toISOString() || new Date().toISOString(),
                } as Post;
            });

            const enrichedPosts = await PostService._enrichPostsWithAuthors(posts);

            return {
                posts: enrichedPosts,
                lastVisible: {
                    alters: newAltersCursor,
                    systems: newSystemsCursor
                }
            };
        } catch (error) {
            console.error('Error fetching friend feed:', error);
            throw error;
        }
    },

    /**
     * Fetch video feed (Reels-like) from friends
     */
    fetchVideoFeed: async (friendIds: string[], friendSystemIds: string[] = [], lastVisible: any = null, pageSize: number = 20) => {
        try {
            // We fetch a larger batch because we will filter meaningful amount of non-videos
            // Multiplier for fetching to ensure we get enough videos
            const fetchSize = pageSize * 3;

            const result = await PostService.fetchFeed(friendIds, friendSystemIds, lastVisible, fetchSize);

            // Filter only videos
            const videoPosts = result.posts.filter(post => {
                if (!post.media_url) return false;
                const url = post.media_url.toLowerCase();
                return url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm');
            });

            return {
                posts: videoPosts,
                lastVisible: result.lastVisible // This is imperfect for pagination since we might skip docs, but suffice for MVP feed
            };
        } catch (error) {
            console.error('Error fetching video feed:', error);
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
                const actorId = alterId || userId;
                const hasLiked = likes.includes(actorId);

                if (hasLiked) {
                    await updateDoc(postRef, {
                        likes: arrayRemove(actorId)
                    });
                } else {
                    await updateDoc(postRef, {
                        likes: arrayUnion(actorId)
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
