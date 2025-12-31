
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
        await addDoc(collection(db, 'friend_requests'), {
            senderId,
            receiverId,
            systemId: auth.currentUser.uid, // Add systemId for security rules
            status: 'pending',
            createdAt: serverTimestamp()
        });
    },

    /**
     * Accept a friend request
     */
    acceptRequest: async (requestId: string) => {
        const reqRef = doc(db, 'friend_requests', requestId);
        const reqSnap = await getDoc(reqRef);

        if (!reqSnap.exists()) throw new Error('Request not found');
        const data = reqSnap.data() as any;
        const { senderId, receiverId, systemId: senderSystemId } = data as { senderId: string, receiverId: string, systemId: string };
        const currentSystemId = auth.currentUser?.uid;

        if (!currentSystemId) throw new Error('Not authenticated');

        // 1. Update request status
        await updateDoc(reqRef, { status: 'accepted' });

        // 2. Create bilateral friendship
        // Doc for Receiver (US) - linked to logic: "My friend X"
        await addDoc(collection(db, 'friendships'), {
            systemId: currentSystemId, // Owned by us
            alterId: receiverId, // Me (receiver)
            friendId: senderId, // Them (sender)
            friendSystemId: senderSystemId, // Their system
            createdAt: serverTimestamp()
        });

        // Doc for Sender (THEM) - linked to logic: "Your friend Y"
        // We create it on their behalf (allowed by relaxed rules)
        await addDoc(collection(db, 'friendships'), {
            systemId: senderSystemId, // Owned by them
            alterId: senderId, // Them (sender)
            friendId: receiverId, // Me (receiver)
            friendSystemId: currentSystemId, // My system
            createdAt: serverTimestamp()
        });
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
     * Get friends list (people who follow this alter)
     */
    getFriends: async (alterId: string) => {
        if (!auth.currentUser) return [];

        const q = query(
            collection(db, 'friendships'),
            where('alterId', '==', alterId),
            where('systemId', '==', auth.currentUser.uid) // Add systemId check
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data().friendId as string);
    },

    /**
     * Get following list (people this alter follows)
     */
    getFollowing: async (alterId: string): Promise<string[]> => {
        if (!auth.currentUser) return [];

        const q = query(
            collection(db, 'friendships'),
            where('friendId', '==', alterId),
            where('friendSystemId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data().alterId as string);
    }
};
