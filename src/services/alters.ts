import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs, updateDoc } from 'firebase/firestore';
import { Alter } from '../types';

export const AlterService = {
    /**
     * Get a single alter by ID
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
            console.error('Error fetching alter:', error);
            return null;
        }
    },

    /**
     * Get multiple alters by IDs
     * Firestore 'in' query supports up to 10 items. For more, we might need to batch or loop.
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
            console.error('Error fetching alters batch:', error);
            return [];
        }
    },

    /**
     * Update an existing alter
     */
    updateAlter: async (alterId: string, updates: Partial<Alter>): Promise<boolean> => {
        try {
            const docRef = doc(db, 'alters', alterId);
            await updateDoc(docRef, updates);
            return true;
        } catch (error) {
            console.error('Error updating alter:', error);
            return false;
        }
    },

    /**
     * Get an alter by name (approximate, usually intended for mention lookup)
     * Note: Names are not unique, so this returns the first match or could return list.
     * For mention navigation, we'll try to find a best match.
     */
    getAlterByName: async (name: string): Promise<Alter | null> => {
        try {
            // Remove @ if present
            const cleanName = name.startsWith('@') ? name.substring(1) : name;
            console.log(`[AlterService] Looking up alter for: '${cleanName}'`);

            const q = query(
                collection(db, 'alters'),
                where('name', '==', cleanName),
                // We might want to limit to public alters or friends depending on visibility rules
                // For now, simple name match
            );

            const snapshot = await getDocs(q);
            console.log(`[AlterService] Found ${snapshot.size} matches for '${cleanName}'`);
            if (!snapshot.empty) {
                // Determine the best match? (e.g. from same system > friends > public)
                // For now, return the first one found.
                const docSnap = snapshot.docs[0];
                return { id: docSnap.id, ...docSnap.data() } as Alter;
            }
            return null;
        } catch (error) {
            console.error('Error fetching alter by name:', error);
            return null;
        }
    }
};
