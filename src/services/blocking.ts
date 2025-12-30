import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    documentId
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { System } from '../types';

export const BlockingService = {
    /**
     * Block a user
     */
    blockUser: async (currentUserId: string, targetUserId: string) => {
        try {
            const userRef = doc(db, 'systems', currentUserId);
            await updateDoc(userRef, {
                blockedUsers: arrayUnion(targetUserId)
            });
            // Optional: Unfollow them if we are following
            // Optional: Remove them from our followers?
        } catch (error) {
            console.error('Error blocking user:', error);
            throw error;
        }
    },

    /**
     * Unblock a user
     */
    unblockUser: async (currentUserId: string, targetUserId: string) => {
        try {
            const userRef = doc(db, 'systems', currentUserId);
            await updateDoc(userRef, {
                blockedUsers: arrayRemove(targetUserId)
            });
        } catch (error) {
            console.error('Error unblocking user:', error);
            throw error;
        }
    },

    /**
     * Get list of blocked users with their details
     */
    getBlockedUsers: async (currentUserId: string): Promise<System[]> => {
        try {
            const userRef = doc(db, 'systems', currentUserId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) return [];

            const userData = userSnap.data();
            const blockedIds: string[] = userData.blockedUsers || [];

            if (blockedIds.length === 0) return [];

            // Firestore 'in' query is limited to 10
            // For now, let's fetch in batches or just use documentId() if possible
            // Or simplified: fetch individual docs if list is small, or 'in' if < 10.
            // If list is large, we might need a better strategy, but for V1 let's assume < 10 for safety or chunk it.

            const users: System[] = [];

            // Batched fetching 10 by 10
            for (let i = 0; i < blockedIds.length; i += 10) {
                const chunk = blockedIds.slice(i, i + 10);
                const q = query(
                    collection(db, 'systems'),
                    where(documentId(), 'in', chunk)
                );
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    users.push({ id: doc.id, ...doc.data() } as System);
                });
            }

            return users;

        } catch (error) {
            console.error('Error fetching blocked users:', error);
            throw error;
        }
    }
};
