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
    arrayUnion,
    arrayRemove,
    QueryDocumentSnapshot,
    deleteDoc,
    documentId,
    runTransaction
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { Post } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const POSTS_COLLECTION = 'posts';

// ============================================
// CACHE LAYER - Optimise _enrichPostsWithAuthors
// ============================================
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const altersCache = new Map<string, CacheEntry<any>>();
const systemsCache = new Map<string, CacheEntry<any>>();

/**
 * Get cached item or return undefined
 */
const getCached = <T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined => {
    const entry = cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return undefined;
    }

    return entry.data;
};

/**
 * Set cache entry with timestamp
 */
const setCached = <T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Clear cache (useful for testing or manual refresh)
 */
export const clearPostsCache = () => {
    altersCache.clear();
    systemsCache.clear();
    inFlightRequests.clear();
};

// ============================================
// REQUEST DEDUPLICATION - Évite requêtes simultanées identiques
// ============================================
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate identical requests
 * Returns existing promise if same request is already in flight
 */
const dedupe = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    // Check if request already in flight
    if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key) as Promise<T>;
    }

    // Execute request and store promise
    const promise = fn().finally(() => {
        // Clean up after completion
        inFlightRequests.delete(key);
    });

    inFlightRequests.set(key, promise);
    return promise;
};

// ============================================
// UPLOAD RETRY LOGIC - Backoff exponentiel
// ============================================

/**
 * Retry une fonction async avec backoff exponentiel
 * ✅ FIABILITÉ: Réessaie automatiquement en cas d'erreur réseau
 */
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error | unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on last attempt
            if (attempt === maxRetries) {
                break;
            }

            // Exponential backoff: 1s, 2s, 4s...
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

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
            console.error('[PostService.createPost] Error:', error);
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
            console.error('[PostService.getPostById] Error:', error);
            throw error;
        }
    },

    /**
     * Fetch posts for a specific system (or global feed if we implemented that)
     * currently fetching all posts for the system to show in their feed
     */
    /**
     * Enrich posts with author details (alter name/avatar)
     * ✅ OPTIMISÉ: Cache les alters/public_profiles pour éviter requêtes répétées
     * ✅ SÉCURISÉ: Utilise public_profiles au lieu de systems pour éviter exposition des emails
     */
    _enrichPostsWithAuthors: async (posts: Post[]): Promise<Post[]> => {
        const alterIds = new Set(posts.map(p => p.alter_id).filter((id): id is string => !!id));
        const systemIds = new Set(posts.map(p => p.system_id).filter((id): id is string => !!id));

        const altersMap = new Map<string, any>();
        const profilesMap = new Map<string, any>();

        // ✅ Check cache first
        const uncachedAlterIds: string[] = [];
        alterIds.forEach(id => {
            const cached = getCached(altersCache, id);
            if (cached) {
                altersMap.set(id, cached);
            } else {
                uncachedAlterIds.push(id);
            }
        });

        const uncachedSystemIds: string[] = [];
        systemIds.forEach(id => {
            const cached = getCached(systemsCache, id);
            if (cached) {
                profilesMap.set(id, cached);
            } else {
                uncachedSystemIds.push(id);
            }
        });

        // ✅ Fetch only uncached items
        const fetchByIds = async (
            collectionName: string,
            ids: string[],
            map: Map<string, any>,
            cache: Map<string, CacheEntry<any>>
        ) => {
            if (ids.length === 0) return;

            const chunks = [];
            for (let i = 0; i < ids.length; i += 10) {
                chunks.push(ids.slice(i, i + 10));
            }

            await Promise.all(chunks.map(async (chunk) => {
                try {
                    const q = query(collection(db, collectionName), where(documentId(), 'in', chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        map.set(doc.id, data);
                        // ✅ Store in cache
                        setCached(cache, doc.id, data);
                    });
                } catch (e) {
                    console.warn(`Failed to fetch ${collectionName} chunk`, e);
                }
            }));
        };

        // ✅ Fetch in parallel, only uncached items
        // ✅ SECURITY FIX: Use public_profiles instead of systems
        await Promise.all([
            fetchByIds('alters', uncachedAlterIds, altersMap, altersCache),
            fetchByIds('public_profiles', uncachedSystemIds, profilesMap, systemsCache)
        ]);

        return posts.map(post => {
            const profile = profilesMap.get(post.system_id);

            if (post.alter_id && altersMap.has(post.alter_id)) {
                const alter = altersMap.get(post.alter_id);
                return {
                    ...post,
                    author_name: alter.name,
                    author_avatar: alter.avatar_url || alter.avatar,
                    alter: { id: post.alter_id, ...alter } as any
                };
            }

            // Fallback to public profile info (no email exposure)
            const resolvedName = profile?.display_name || 'Utilisateur';
            const finalName = resolvedName === 'Système' && profile?.display_name ? profile.display_name : resolvedName;

            return {
                ...post,
                // Prioritize the snapshot author_name if available, otherwise fallback to profile name
                author_name: post.author_name || finalName || 'Utilisateur',
                author_avatar: post.author_avatar || profile?.avatar_url || post.author_avatar,
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
            console.error('[PostService.fetchPostsByAlter] Error:', error);
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
            console.error('[PostService.fetchPosts] Error:', error);
            throw error;
        }
    },

    /**
     * Fetch global feed (all public posts)
     */
    fetchGlobalFeed: async (lastVisible: QueryDocumentSnapshot | null = null, pageSize: number = 20) => {
        try {
            // Fetch only public posts to comply with Firestore rules
            let q = query(
                collection(db, POSTS_COLLECTION),
                where('visibility', '==', 'public'),
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
            console.error('[PostService.fetchGlobalFeed] Error:', error);
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

            // 1. Query by Alter IDs (only PUBLIC posts to comply with Firestore rules)
            // ✅ FIX: Added visibility filter to prevent permission errors
            if (friendIds.length > 0) {
                const targetAlterIds = friendIds.slice(0, 30);
                let q1 = query(
                    collection(db, POSTS_COLLECTION),
                    where('alter_id', 'in', targetAlterIds),
                    where('visibility', '==', 'public'),
                    orderBy('created_at', 'desc'),
                    limit(pageSize)
                );
                if (cursors.alters) q1 = query(q1, startAfter(cursors.alters));
                // Tag the result with source
                promises.push(getDocs(q1).then(snap => ({ source: 'alters', docs: snap.docs })));
            }

            // 2. Query by System IDs (only PUBLIC posts to comply with Firestore rules)
            // ✅ FIX: Added visibility filter to prevent permission errors
            if (friendSystemIds.length > 0) {
                const targetSystemIds = friendSystemIds.slice(0, 30);
                let q2 = query(
                    collection(db, POSTS_COLLECTION),
                    where('system_id', 'in', targetSystemIds),
                    where('visibility', '==', 'public'),
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
            console.error('[PostService.fetchFeed] Error:', error);
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
            console.error('[PostService.fetchVideoFeed] Error:', error);
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
            console.error('[PostService.fetchTaggedPosts] Error:', error);
            throw error;
        }
    },

    /**
     * Upload an image for a post
     * ✅ FIABILITÉ: Retry automatique avec backoff exponentiel
     */
    uploadImage: async (uri: string, systemId: string): Promise<string> => {
        return retryWithBackoff(async () => {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `posts/${systemId}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        }, 3, 1000); // 3 retries, 1s base delay
    },

    /**
     * Upload an audio file for a post (voice note)
     * ✅ FIABILITÉ: Retry automatique avec backoff exponentiel
     */
    uploadAudio: async (uri: string, systemId: string): Promise<string> => {
        return retryWithBackoff(async () => {
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
        }, 3, 1000); // 3 retries, 1s base delay
    },

    /**
     * Upload a video for a post
     * ✅ FIABILITÉ: Retry automatique avec backoff exponentiel
     */
    uploadVideo: async (uri: string, systemId: string): Promise<string> => {
        return retryWithBackoff(async () => {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `posts/${systemId}/video/${Date.now()}.mp4`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob, {
                contentType: 'video/mp4',
            });
            return await getDownloadURL(storageRef);
        }, 3, 1500); // 3 retries, 1.5s base delay (videos are larger)
    },

    /**
     * Like or unlike a post
     * ✅ Uses Firestore transaction to prevent race conditions
     */
    toggleLike: async (postId: string, userId: string, alterId?: string) => {
        try {
            const postRef = doc(db, POSTS_COLLECTION, postId);

            // ✅ TRANSACTION: Ensures atomic read-modify-write
            // Prevents race conditions when multiple users like simultaneously
            const result = await runTransaction(db, async (transaction) => {
                const postSnap = await transaction.get(postRef);

                if (!postSnap.exists()) {
                    throw new Error('Post not found');
                }

                const post = postSnap.data() as Post;
                const likes = post.likes || [];
                const actorId = alterId || userId;
                const hasLiked = likes.includes(actorId);

                if (hasLiked) {
                    transaction.update(postRef, {
                        likes: arrayRemove(actorId)
                    });
                } else {
                    transaction.update(postRef, {
                        likes: arrayUnion(actorId)
                    });
                }

                // Return data for notification creation (outside transaction)
                return { post, hasLiked, actorId };
            });

            // Create notification AFTER transaction (not critical path)
            // If notification fails, the like is still recorded
            if (!result.hasLiked) {
                const { post, actorId } = result;
                const recipientId = post.alter_id || post.system_id;
                const senderIdentifier = actorId;

                if (recipientId !== senderIdentifier) {
                    try {
                        // Fetch sender details for notification
                        // ✅ SECURITY FIX: Use public_profiles instead of systems
                        let senderName = 'Quelqu\'un';
                        try {
                            const profileDoc = await getDoc(doc(db, 'public_profiles', userId));
                            if (profileDoc.exists()) {
                                const profileData = profileDoc.data();
                                senderName = profileData.display_name || 'Utilisateur';
                            }

                            if (alterId) {
                                const alterDoc = await getDoc(doc(db, 'alters', alterId));
                                if (alterDoc.exists()) {
                                    const alterData = alterDoc.data();
                                    senderName = alterData.name;
                                }
                            }
                        } catch (fetchError) {
                            console.warn('[PostService] Error fetching sender details for notification:', fetchError);
                        }

                        const notificationRef = collection(db, 'notifications');

                        const notificationPayload = {
                            type: 'like',
                            recipientId: post.alter_id || post.system_id,
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

                        await addDoc(notificationRef, notificationPayload);

                        // Send Push Notification
                        const { default: PushService } = await import('./PushNotificationService');
                        await PushService.sendPostReactionNotification(
                            post.system_id,
                            senderName,
                            '❤️'
                        );
                    } catch (notifError) {
                        console.error('[PostService] Error creating notification:', notifError);
                        // Don't fail the like action if notification fails
                    }
                }
            }
        } catch (error) {
            console.error('[PostService.toggleLike] Error:', error);
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
            console.error('[PostService.deletePost] Error:', error);
            throw error;
        }
    }
};
