import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Emotion, EmotionType } from '../types';

export const EmotionService = {
    /**
     * Add a new emotion entry for an alter
     */
    addEmotion: async (alterId: string, emotion: EmotionType, intensity: 1 | 2 | 3 | 4 | 5 = 3, note?: string) => {
        if (!auth.currentUser) throw new Error("Not authenticated");

        await addDoc(collection(db, 'emotions'), {
            alter_id: alterId, // Match generic consistent naming snake_case in db usually or matches types? 
            // Types uses: alter_id. Rules uses: match /emotions/{emotionId} allow read: if isOwner(resource);
            // We need system_id for easier querying? Or we query by alter_id.
            // Let's add system_id too for global queries.
            system_id: auth.currentUser.uid,
            emotion,
            intensity,
            note: note || '',
            created_at: serverTimestamp()
        });
    },

    /**
     * Get the latest emotion for a specific alter
     */
    getLatestEmotion: async (alterId: string): Promise<Emotion | null> => {
        // Ensure we check system_id to satisfy security rules
        if (!auth.currentUser) return null;

        const q = query(
            collection(db, 'emotions'),
            where('alter_id', '==', alterId),
            where('system_id', '==', auth.currentUser.uid),
            orderBy('created_at', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Emotion;
    },

    /**
     * Get latest emotions for all alters in the system
     * Note: Firestore doesn't support "distinct on" easily.
     * We might need to fetch recent emotions for the system and filter client side,
     * or fetch for each alter.
     * For < 20 alters, fetching per alter is okay. For optimized, we fetch last 100 system emotions and dedup.
     */
    getSystemRecentEmotions: async (systemId: string): Promise<Record<string, Emotion>> => {
        // Fetch last 50 emotions for the system
        const q = query(
            collection(db, 'emotions'),
            where('system_id', '==', systemId),
            orderBy('created_at', 'desc'),
            limit(50)
        );

        const snapshot = await getDocs(q);
        const latestEmotions: Record<string, Emotion> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const alterId = data.alter_id;
            // Only keep the first (latest) one we encounter for each alter
            if (!latestEmotions[alterId]) {
                latestEmotions[alterId] = { id: doc.id, ...data } as Emotion;
            }
        });

        return latestEmotions;
    },

    /**
     * Subscribe to latest system emotions (for realtime updates)
     */
    subscribeToSystemEmotions: (systemId: string, callback: (emotions: Record<string, Emotion>) => void) => {
        const q = query(
            collection(db, 'emotions'),
            where('system_id', '==', systemId)
            // orderBy('created_at', 'desc'), // Removed to avoid missing index issue
            // limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const allEmotions: Emotion[] = [];
            snapshot.forEach(doc => {
                allEmotions.push({ id: doc.id, ...doc.data() } as Emotion);
            });

            // Sort client-side
            allEmotions.sort((a, b) => {
                const timeA = (a.created_at as any)?.seconds || new Date(a.created_at).getTime() / 1000;
                const timeB = (b.created_at as any)?.seconds || new Date(b.created_at).getTime() / 1000;
                return timeB - timeA;
            });

            // Dedup by alter_id (keep latest)
            const latestEmotions: Record<string, Emotion> = {};
            for (const emotion of allEmotions) {
                if (!latestEmotions[emotion.alter_id]) {
                    latestEmotions[emotion.alter_id] = emotion;
                }
            }
            callback(latestEmotions);
        });
    }
};
