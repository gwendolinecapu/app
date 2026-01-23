import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { System } from '../types';

export const SystemService = {
    /**
     * Get a single system by ID
     */
    getSystem: async (systemId: string): Promise<System | null> => {
        try {
            const docRef = doc(db, 'systems', systemId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as System;
            }
            return null;
        } catch (error) {
            console.error('Error fetching system:', error);
            return null;
        }
    },

    /**
     * Get a system by username
     */
    getSystemByUsername: async (username: string): Promise<System | null> => {
        try {
            // Remove @ if present
            const cleanUsername = username.startsWith('@') ? username.substring(1) : username;

            const q = query(
                collection(db, 'systems'),
                where('username', '==', cleanUsername)
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                return { id: docSnap.id, ...docSnap.data() } as System;
            }
            return null;
        } catch (error) {
            console.error('Error fetching system by username:', error);
            return null;
        }
    }
};
