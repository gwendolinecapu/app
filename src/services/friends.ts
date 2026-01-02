
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
    setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Alter } from '../types';

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
            console.error("DEBUG: Receiver data missing system ID:", JSON.stringify(receiverData));
            throw new Error("Receiver system ID not found (checked userId, systemId, system_id)");
        }

        await addDoc(collection(db, 'friend_requests'), {
            senderId,
            receiverId,
            systemId: auth.currentUser.uid, // Sender's System ID
            receiverSystemId, // Receiver's System ID (for security rules)
            status: 'pending',
            createdAt: serverTimestamp()
        });
    },

    /**
     * Accept a friend request
     */
    acceptRequest: async (requestId: string) => {
        console.log(`[FriendService] Accepting request ${requestId} START`);
        const reqRef = doc(db, 'friend_requests', requestId);
        const reqSnap = await getDoc(reqRef);

        if (!reqSnap.exists()) throw new Error('Request not found');
        const data = reqSnap.data() as any;
        console.log(`[FriendService] Request Data:`, JSON.stringify(data));

        const { senderId, receiverId, systemId: senderSystemId } = data as { senderId: string, receiverId: string, systemId: string };
        const currentSystemId = auth.currentUser?.uid;
        console.log(`[FriendService] Current User: ${currentSystemId}`);

        if (!currentSystemId) throw new Error('Not authenticated');

        // 1. Update request status
        console.log('[FriendService] 1. Updating request status to accepted...');
        await updateDoc(reqRef, { status: 'accepted' });
        console.log('[FriendService] 1. Request updated.');

        // 2. Create bilateral friendship
        // Doc for Receiver (US) - linked to logic: "My friend X"
        console.log('[FriendService] 2. Creating Friendship (Receiver side)...');
        await addDoc(collection(db, 'friendships'), {
            systemId: currentSystemId, // Owned by us
            alterId: receiverId, // Me (receiver)
            friendId: senderId, // Them (sender)
            friendSystemId: senderSystemId, // Their system
            createdAt: serverTimestamp()
        });
        console.log('[FriendService] 2. Friendship (Receiver) created.');

        // Doc for Sender (THEM) - linked to logic: "Your friend Y"
        // We create it on their behalf (allowed by relaxed rules)
        console.log('[FriendService] 3. Creating Friendship (Sender side)...');
        await addDoc(collection(db, 'friendships'), {
            systemId: senderSystemId, // Owned by them
            alterId: senderId, // Them (sender)
            friendId: receiverId, // Me (receiver)
            friendSystemId: currentSystemId, // My system
            createdAt: serverTimestamp()
        });
        console.log('[FriendService] 3. Friendship (Sender) created.');

        // 3. Notify the sender (THEM) that we accepted
        console.log('[FriendService] 4. Creating Notification...');
        await addDoc(collection(db, 'notifications'), {
            recipientId: senderSystemId, // The system receiving the notification
            type: 'FRIEND_REQUEST_ACCEPTED',
            title: 'Demande acceptée',
            message: 'Votre demande d\'ami a été acceptée.',
            data: {
                alterId: receiverId, // The alter who accepted (us)
                friendId: senderId, // The alter who sent (them)
            },
            read: false,
            createdAt: serverTimestamp()
        });
        console.log('[FriendService] 4. Notification created. DONE.');
    },

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
    },

    /**
     * Check relationship status
     */
    checkStatus: async (alterId1: string, alterId2: string): Promise<'none' | 'pending' | 'friends'> => {
        // Check friendship
        const qFriend = query(
            collection(db, 'friendships'),
            where('alterId', '==', alterId1),
            where('friendId', '==', alterId2),
            where('systemId', '==', auth.currentUser?.uid) // Add systemId check
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
        return snapshot.docs.map(d => d.data().friendId as string).filter(id => !!id);
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
        return snapshot.docs.map(d => d.data().alterId as string).filter(id => !!id);
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
            where('friendId', '==', friendId),
            where('systemId', '==', auth.currentUser.uid)
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
    }
};
