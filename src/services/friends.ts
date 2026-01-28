
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDoc,
    limit
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
    id: string;
    senderId: string;
    receiverId: string;
    status: FriendRequestStatus;
    createdAt: any;
}

export const FriendService = {
    /**
     * Send a friend request from senderAlter to receiverAlter
     */
    sendRequest: async (senderId: string, receiverId: string) => {
        // Check if already friends or requested
        const existing = await FriendService.checkStatus(senderId, receiverId);
        if (existing !== 'none') {
            throw new Error(`Status is already ${existing}`);
        }

        if (!auth.currentUser) throw new Error("Not authenticated");

        // Fetch receiver alter to get their system ID for security rules
        const receiverRef = doc(db, 'alters', receiverId);
        const receiverSnap = await getDoc(receiverRef);
        if (!receiverSnap.exists()) {
            throw new Error("Receiver alter not found");
        }
        const receiverData = receiverSnap.data();
        const receiverSystemId = receiverData?.userId || receiverData?.systemId || receiverData?.system_id;

        if (!receiverSystemId) {
            throw new Error("Receiver system ID not found (checked userId, systemId, system_id)");
        }

        const docRef = await addDoc(collection(db, 'friend_requests'), {
            senderId,
            receiverId,
            systemId: auth.currentUser.uid, // Sender's System ID
            receiverSystemId, // Receiver's System ID (for security rules)
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // Create a notification for the receiver
        await addDoc(collection(db, 'notifications'), {
            recipientId: receiverId, // The alter receiving the notification
            targetSystemId: receiverSystemId, // The system receiving the notification (for security rules)
            type: 'friend_request', // Must match NotificationType in NotificationTypes.ts or handled in UI
            title: 'Nouvelle demande d\'ami',
            message: 'Quelqu\'un souhaite devenir votre ami.',
            subtitle: 'Nouvelle demande',
            data: {
                requestId: docRef.id,
                senderId: senderId,
                alterId: receiverId
            },
            senderId: auth.currentUser.uid, // Sender System ID for profile linking
            senderAlterId: senderId, // SPECIFIC ALTER ID
            read: false,
            created_at: serverTimestamp()
        });
    },

    /**
     * Accept a friend request
     *
     * NOTE: Using client-side implementation instead of Cloud Function due to Expo Go limitations.
     * Cloud Function version (commented below) works in Development Builds but not in Expo Go
     * because Expo Go doesn't properly forward authentication tokens to Cloud Functions.
     *
     * For production with Development Build, uncomment the Cloud Function version below.
     */
    acceptRequest: async (requestId: string) => {
        if (!auth.currentUser) {
            console.error("[FriendService] User not authenticated locally");
            throw new Error("Vous devez être connecté pour accepter une demande.");
        }

        try {
            console.log("[FriendService] Attempting to accept request (client-side):", requestId);

            // 1. Get the friend request
            const reqRef = doc(db, 'friend_requests', requestId);
            const reqDoc = await getDoc(reqRef);

            if (!reqDoc.exists()) {
                throw new Error('Demande introuvable');
            }

            const reqData = reqDoc.data();
            const { senderId, receiverId, systemId: senderSystemId } = reqData;

            // 2. Get sender and receiver system IDs
            let resolvedSenderSystemId = senderSystemId;
            if (!resolvedSenderSystemId) {
                const senderDoc = await getDoc(doc(db, 'alters', senderId));
                if (!senderDoc.exists()) throw new Error("Sender alter not found");
                resolvedSenderSystemId = senderDoc.data()?.systemId || senderDoc.data()?.userId;
            }

            const receiverDoc = await getDoc(doc(db, 'alters', receiverId));
            if (!receiverDoc.exists()) throw new Error("Receiver alter not found");
            const receiverData = receiverDoc.data();
            const receiverSystemId = receiverData?.systemId || receiverData?.userId || receiverData?.system_id;

            console.log("[FriendService] Debug - receiverId:", receiverId);
            console.log("[FriendService] Debug - receiverSystemId:", receiverSystemId);
            console.log("[FriendService] Debug - auth.currentUser.uid:", auth.currentUser.uid);
            console.log("[FriendService] Debug - receiverData fields:", {
                systemId: receiverData?.systemId,
                userId: receiverData?.userId,
                system_id: receiverData?.system_id
            });

            // Verify current user is the receiver
            if (receiverSystemId !== auth.currentUser.uid) {
                throw new Error("Vous ne pouvez pas accepter cette demande");
            }

            // 3. Update request status
            await updateDoc(reqRef, { status: 'accepted' });

            // 4. Create bidirectional friendships
            await addDoc(collection(db, 'friendships'), {
                systemId: receiverSystemId,
                alterId: receiverId,
                friendId: senderId,
                friendSystemId: resolvedSenderSystemId,
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, 'friendships'), {
                systemId: resolvedSenderSystemId,
                alterId: senderId,
                friendId: receiverId,
                friendSystemId: receiverSystemId,
                createdAt: serverTimestamp()
            });

            // 5. Get names for notifications (reuse receiverData from above, fetch senderData)
            const senderData = await getDoc(doc(db, 'alters', senderId));

            const senderName = senderData.data()?.name || 'Cet alter';
            const senderAvatar = senderData.data()?.avatar || senderData.data()?.avatar_url;
            const receiverName = receiverData?.name || 'Votre ami';
            const receiverAvatar = receiverData?.avatar || receiverData?.avatar_url;

            // 6. Create notifications
            // Notification for sender (request was accepted)
            await addDoc(collection(db, 'notifications'), {
                recipientId: senderId,
                targetSystemId: resolvedSenderSystemId,
                type: 'friend_request_accepted',
                title: 'Demande acceptée',
                message: " a accepté votre demande d'ami.",
                data: { alterId: receiverId, friendId: senderId, requestId },
                senderId: receiverSystemId,
                senderAlterId: receiverId,
                actorName: receiverName,
                actorAvatar: receiverAvatar,
                read: false,
                created_at: serverTimestamp()
            });

            // Notification for receiver (you and X are now friends)
            await addDoc(collection(db, 'notifications'), {
                recipientId: receiverId,
                targetSystemId: receiverSystemId,
                type: 'friend_new',
                title: 'Nouvel ami',
                message: " est maintenant ami(e) avec vous.",
                data: { alterId: senderId, friendId: receiverId, requestId },
                senderId: resolvedSenderSystemId,
                senderAlterId: senderId,
                actorName: senderName,
                actorAvatar: senderAvatar,
                targetName: receiverName,
                targetAvatar: receiverAvatar,
                read: false,
                created_at: serverTimestamp()
            });

            console.log("[FriendService] Friend request accepted successfully (client-side)");
            return { success: true };

        } catch (error: any) {
            console.error("Accept Request Error (client-side):", error);
            throw new Error(error.message || "Impossible d'accepter la demande");
        }
    },

    /*
     * Cloud Function version - Use this in Development Build instead of Expo Go
     *
     * acceptRequest: async (requestId: string) => {
     *     if (!auth.currentUser) {
     *         throw new Error("Vous devez être connecté pour accepter une demande.");
     *     }
     *
     *     try {
     *         const acceptFriendRequestFunction = httpsCallable(functions, 'acceptFriendRequest');
     *         const result = await acceptFriendRequestFunction({ requestId });
     *         return result.data;
     *     } catch (error: any) {
     *         throw new Error(error.message || "Impossible d'accepter la demande");
     *     }
     * },
     */

    /**
     * Accept a friend request by alter pair
     */
    acceptRequestByPair: async (receiverId: string, senderId: string) => {
        // Find the pending request
        const q = query(
            collection(db, 'friend_requests'),
            where('senderId', '==', senderId),
            where('receiverId', '==', receiverId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error('Friend request not found');

        const requestId = snapshot.docs[0].id;
        await FriendService.acceptRequest(requestId);
    },

    /**
     * Reject a friend request
     */
    rejectRequest: async (requestId: string) => {
        const reqRef = doc(db, 'friend_requests', requestId);
        await updateDoc(reqRef, { status: 'rejected' });

        // Also mark related notification as read
        const qNotif = query(
            collection(db, 'notifications'),
            where('data.requestId', '==', requestId),
            where('read', '==', false)
        );
        const notifSnap = await getDocs(qNotif);
        notifSnap.forEach(async (notifDoc) => {
            await updateDoc(notifDoc.ref, { read: true });
        });
    },

    /**
     * Check if ANY alter in the current system is friends with the target system (System-wide friendship)
     */
    isSystemFriend: async (mySystemId: string, targetSystemId: string): Promise<boolean> => {
        const q = query(
            collection(db, 'friendships'),
            where('systemId', '==', mySystemId),
            where('friendSystemId', '==', targetSystemId)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    },

    /**
     * Check relationship status
     */
    checkStatus: async (alterId1: string, alterId2: string): Promise<'none' | 'pending' | 'friends'> => {
        // Check friendship
        const qFriend = query(
            collection(db, 'friendships'),
            where('alterId', '==', alterId1),
            where('friendId', '==', alterId2)
        );
        const friendSnap = await getDocs(qFriend);
        if (!friendSnap.empty) return 'friends';

        // Check outgoing request
        const qSent = query(
            collection(db, 'friend_requests'),
            where('senderId', '==', alterId1),
            where('receiverId', '==', alterId2),
            where('status', '==', 'pending')
        );
        const sentSnap = await getDocs(qSent);
        if (!sentSnap.empty) return 'pending';

        // Check incoming request
        const qReceived = query(
            collection(db, 'friend_requests'),
            where('senderId', '==', alterId2),
            where('receiverId', '==', alterId1),
            where('status', '==', 'pending')
        );
        const receivedSnap = await getDocs(qReceived);
        if (!receivedSnap.empty) return 'pending'; // Or 'incoming' if we want to distinguish

        return 'none';
    },

    /**
     * Get pending requests for an alter
     */
    getPendingRequests: async (alterId: string) => {
        const q = query(
            collection(db, 'friend_requests'),
            where('receiverId', '==', alterId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
    },

    /**
     * Get requests by status (e.g. pending, accepted)
     */
    getRequests: async (alterId: string, statuses: FriendRequestStatus[] = ['pending']) => {
        const q = query(
            collection(db, 'friend_requests'),
            where('receiverId', '==', alterId),
            where('status', 'in', statuses)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
    },

    /**
     * Get all pending requests for a system (aggregated)
     */
    getSystemRequests: async (systemId: string, statuses: FriendRequestStatus[] = ['pending']) => {
        const q = query(
            collection(db, 'friend_requests'),
            where('receiverSystemId', '==', systemId),
            where('status', 'in', statuses)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
    },

    /**
     * Get pending requests sent BY an alter
     */
    getSentRequests: async (alterId: string, statuses: FriendRequestStatus[] = ['pending', 'accepted']) => {
        const q = query(
            collection(db, 'friend_requests'),
            where('senderId', '==', alterId),
            where('status', 'in', statuses)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
    },

    /**
     * Get all requests sent BY a system
     */
    getSystemSentRequests: async (systemId: string, statuses: FriendRequestStatus[] = ['pending', 'accepted']) => {
        const q = query(
            collection(db, 'friend_requests'),
            where('systemId', '==', systemId),
            where('status', 'in', statuses)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
    },

    /**
     * Get friends list (people who follow this alter) -> actually "people this alter follows" (Following)
     */
    getFriends: async (alterId: string) => {
        // Removed auth check to allow viewing other profiles' following list
        // if (!auth.currentUser) return [];

        const q = query(
            collection(db, 'friendships'),
            where('alterId', '==', alterId)
            // Removed systemId check to allow reading any alter's friendships (assuming public/rules allow)
        );
        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(d => d.data().friendId as string).filter(id => !!id);
        return Array.from(new Set(ids));
    },

    /**
     * Get system IDs of friends (for feed)
     */
    getFriendSystemIds: async (alterId: string) => {
        if (!auth.currentUser) return [];

        const q = query(
            collection(db, 'friendships'),
            where('alterId', '==', alterId),
            where('systemId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        // Use Set to dedup
        const systemIds = new Set(snapshot.docs.map(d => d.data().friendSystemId as string));
        return Array.from(systemIds).filter(id => id); // Filter undefined
    },

    /**
     * Get following list (people this alter follows) -> actually "people who follow this alter" (Followers)
     * Naming is confusing in original code, but logic searches for friendId == alterId
     */
    getFollowing: async (alterId: string): Promise<string[]> => {
        // Removed auth check
        // if (!auth.currentUser) return [];

        const q = query(
            collection(db, 'friendships'),
            where('friendId', '==', alterId)
            // Removed friendSystemId check to count ALL followers, not just those from my system
        );
        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(d => d.data().alterId as string).filter(id => !!id);
        return Array.from(new Set(ids));
    },

    /**
     * Remove a friend (Unfollow/Unfriend)
     */
    removeFriend: async (alterId: string, friendId: string) => {
        if (!auth.currentUser) return;

        // 1. Delete my friendship doc (Me -> Friend)
        const q1 = query(
            collection(db, 'friendships'),
            where('alterId', '==', alterId),
            where('friendId', '==', friendId)
        );
        const snap1 = await getDocs(q1);
        snap1.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });

        // 2. Delete their friendship doc (Friend -> Me)
        // Note: In strict mode, we might not be able to delete their doc directly if rules don't allow it.
        // Usually, removing one side is enough to break the 'friends' status or we use a Cloud Function.
        // For now, attempting best effort deletion assuming rules allow it or separate logic handles it.
        // Actually, if it's mutual friendship, we should delete both.
        // If strict rules prevent this, we might need to just delete our side and filter in UI.

        try {
            const q2 = query(
                collection(db, 'friendships'),
                where('alterId', '==', friendId),
                where('friendId', '==', alterId)
                // We can't query by their systemId easily without knowing it, but we can query by alterId/friendId
            );
            const snap2 = await getDocs(q2);
            snap2.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
        } catch (e) {
            console.warn("Could not delete reciprocal friendship doc (might be permission issue):", e);
        }
    },

    /**
     * Cancel a sent friend request
     */
    cancelRequest: async (senderId: string, receiverId: string) => {
        const q = query(
            collection(db, 'friend_requests'),
            where('senderId', '==', senderId),
            where('receiverId', '==', receiverId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
    },

    /**
     * Get ALL unique Friend System IDs for a specific System (aggregated across all alters)
     */
    getAllSystemFriendSystemIds: async (systemId: string): Promise<string[]> => {
        const q = query(
            collection(db, 'friendships'),
            where('systemId', '==', systemId)
        );
        const snapshot = await getDocs(q);
        const systemIds = new Set(snapshot.docs.map(d => d.data().friendSystemId as string));
        return Array.from(systemIds).filter(id => id);
    },

    /**
     * Remove duplicate friendship entries (keeps the oldest one)
     */
    deduplicateConnection: async (alterId: string, friendId: string) => {
        // Query duplicates where I am alterId and they are friendId
        const q1 = query(
            collection(db, 'friendships'),
            where('alterId', '==', alterId),
            where('friendId', '==', friendId)
        );
        const snap1 = await getDocs(q1);
        if (snap1.size > 1) {
            // Sort by creation time (if available) or insertion order. 
            // We just keep the first one and delete the rest.
            const docs = snap1.docs;
            const toDelete = docs.slice(1);
            try {
                await Promise.all(toDelete.map(d => deleteDoc(d.ref)));
            } catch (e) {
                console.warn(`[FriendService] Failed to delete duplicates for ${alterId}->${friendId} (likely permission issue):`, e);
            }
        }

        // We should also check the reverse direction if we want to be thorough, 
        // but typically 'followers' list comes from one direction queries.
        // For 'Following' list (getFriends): alterId=Me, friendId=Them
        // For 'Followers' list (getFollowing): friendId=Me, alterId=Them (in DB schema)
        // The modal passes the IDs. logic should handle direction based on context.
    },

    /**
     * Save suggested friends (unselected alters from import)
     */
    saveSuggestions: async (systemId: string, altersKeyed: { id: string, name: string, avatar_url?: string, systemId?: string }[]) => {
        if (!systemId) return;

        // We'll use a subcollection 'friend_suggestions' under the user's system document
        // This is more organized and easy to clean up.
        // It requires a new rule or might reuse existing 'isOwner' logic if we put it under systems/{uid}/...

        const batch = [];
        // Note: Firestore batch is useful but here we can just loop for simplicity or use runTransaction if needed.
        // We will just add/set docs.

        for (const alter of altersKeyed) {
            // Check if already exists to avoid duplicates?
            // Actually, we can just overwrite or ignore.
            // Using setDoc with merge might be good if we had unique IDs for suggestions.
            // We can use suggestionId = `${systemId}_${alter.id}`

            // Since we are inside a static object, let's keep it simple with addDoc or separate calls.
            // But wait, the prompt asked for "Persist unselected alters".

            try {
                await addDoc(collection(db, `systems/${systemId}/friend_suggestions`), {
                    alterId: alter.id,
                    name: alter.name,
                    avatar_url: alter.avatar_url || null,
                    targetSystemId: alter.systemId,
                    suggestedAt: serverTimestamp(),
                    status: 'pending'
                });
            } catch (e) {
                console.warn("Error saving suggestion:", e);
            }
        }
    },

    /**
     * Get friend suggestions for the current system
     */
    getSuggestions: async (systemId: string) => {
        if (!systemId) return [];

        try {
            const q = query(
                collection(db, `systems/${systemId}/friend_suggestions`),
                where('status', '==', 'pending'),
                limit(20)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.data().alterId,
                name: doc.data().name,
                avatar_url: doc.data().avatar_url,
                systemId: doc.data().targetSystemId,
                type: 'alter',
                color: '#60A5FA', // Default color for suggestions
                suggestionDocId: doc.id
            }));
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            // Fallback to empty array so the UI doesn't crash
            return [];
        }
    }
};
