import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Alter } from '../types';

export const AlterService = {
    /**
     * Get a single alter by ID
     * @throws Error if network/permission fails
     */
    getAlter: async (alterId: string): Promise<Alter | null> => {
        try {
            const docRef = doc(db, 'alters', alterId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Alter;
            }
            return null;
        } catch (error) {
            console.error('[AlterService.getAlter] Error:', error);
            throw error;
        }
    },

    /**
     * Get multiple alters by IDs
     * Firestore 'in' query supports up to 10 items. For more, we might need to batch or loop.
     * @throws Error if network/permission fails
     */
    getAlters: async (alterIds: string[]): Promise<Alter[]> => {
        if (!alterIds || alterIds.length === 0) return [];

        try {
            // Split into chunks of 10 for 'in' query limit
            const chunks: string[][] = [];
            for (let i = 0; i < alterIds.length; i += 10) {
                chunks.push(alterIds.slice(i, i + 10));
            }

            let results: Alter[] = [];

            for (const chunk of chunks) {
                const q = query(collection(db, 'alters'), where(documentId(), 'in', chunk));
                const snapshot = await getDocs(q);
                const chunkResults = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Alter));
                results = [...results, ...chunkResults];
            }

            return results;
        } catch (error) {
            console.error('[AlterService.getAlters] Error:', error);
            throw error;
        }
    },

    /**
     * Update an existing alter
     * @throws Error if update fails
     */
    updateAlter: async (alterId: string, updates: Partial<Alter>): Promise<void> => {
        try {
            const docRef = doc(db, 'alters', alterId);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error('[AlterService.updateAlter] Error:', error);
            throw error;
        }
    },

    /**
     * Get an alter by name (approximate, usually intended for mention lookup)
     * Note: Names are not unique, so this returns the first match or could return list.
     * For mention navigation, we'll try to find a best match.
     * @throws Error if query fails
     */
    getAlterByName: async (name: string): Promise<Alter | null> => {
        try {
            // Remove @ if present
            const cleanName = name.startsWith('@') ? name.substring(1) : name;

            const q = query(
                collection(db, 'alters'),
                where('name', '==', cleanName),
                // We might want to limit to public alters or friends depending on visibility rules
                // For now, simple name match
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                // Determine the best match? (e.g. from same system > friends > public)
                // For now, return the first one found.
                const docSnap = snapshot.docs[0];
                return { id: docSnap.id, ...docSnap.data() } as Alter;
            }
            return null;
        } catch (error) {
            console.error('[AlterService.getAlterByName] Error:', error);
            throw error;
        }
    },

    findPrimaryAlterId: async (userId: string): Promise<string | null> => {
        try {
            // Optimization: Try to find the host directly
            const hostQuery = query(
                collection(db, 'alters'),
                where('system_id', '==', userId),
                where('is_host', '==', true),
                limit(1)
            );
            const hostSnapshot = await getDocs(hostQuery);
            if (!hostSnapshot.empty) {
                return hostSnapshot.docs[0].id;
            }

            // Fallback: Find the oldest alter
            const oldestQuery = query(
                collection(db, 'alters'),
                where('system_id', '==', userId),
                orderBy('created_at', 'asc'),
                limit(1)
            );
            const oldestSnapshot = await getDocs(oldestQuery);

            if (!oldestSnapshot.empty) {
                return oldestSnapshot.docs[0].id;
            }

            return null;
        } catch (error) {
            console.error('[AlterService.findPrimaryAlterId] Error:', error);
            throw error;
        }
    }
};
