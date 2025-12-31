import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
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
    }
};
