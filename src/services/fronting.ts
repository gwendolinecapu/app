import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FrontingEntry } from '../types';

export const FrontingService = {
    /**
     * Termine la session de fronting active (si elle existe) et en démarre une nouvelle.
     */
    async switchAlter(systemId: string, newAlterId: string): Promise<void> {
        try {
            // 1. Chercher la session active
            const q = query(
                collection(db, 'fronting_history'),
                where('system_id', '==', systemId),
                where('end_time', '==', null),
                limit(1)
            );

            const snapshot = await getDocs(q);
            const now = new Date();

            if (!snapshot.empty) {
                const currentSessionDoc = snapshot.docs[0];
                const data = currentSessionDoc.data();

                // Si c'est déjà le même alter, ne rien faire
                if (data.alter_id === newAlterId) {
                    return;
                }

                // Clôturer la session
                const startTime = data.start_time.toDate();
                const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000); // en secondes

                await updateDoc(doc(db, 'fronting_history', currentSessionDoc.id), {
                    end_time: now,
                    duration: duration
                });
            }

            // 2. Créer la nouvelle session
            await addDoc(collection(db, 'fronting_history'), {
                system_id: systemId,
                alter_id: newAlterId,
                start_time: now, // Sera stocké comme Timestamp Firestore mais typé string dans l'app
                end_time: null,
                duration: 0
            });

        } catch (error) {
            console.error("Error switching alter fronting:", error);
            throw error;
        }
    },

    /**
     * Récupère l'historique de fronting
     */
    async getHistory(systemId: string, limitCount = 50): Promise<FrontingEntry[]> {
        const q = query(
            collection(db, 'fronting_history'),
            where('system_id', '==', systemId),
            orderBy('start_time', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                system_id: data.system_id,
                alter_id: data.alter_id,
                start_time: data.start_time?.toDate ? data.start_time.toDate().toISOString() : new Date().toISOString(),
                end_time: data.end_time?.toDate ? data.end_time.toDate().toISOString() : null,
                duration: data.duration
            } as FrontingEntry;
        });
    },

    /**
     * Récupère les stats de fronting sur les 7 derniers jours
     * Retourne une map { alter_id: seconds }
     */
    async getWeeklyStats(systemId: string): Promise<Record<string, number>> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const q = query(
            collection(db, 'fronting_history'),
            where('system_id', '==', systemId),
            where('start_time', '>=', sevenDaysAgo),
            orderBy('start_time', 'desc')
        );

        const snapshot = await getDocs(q);
        const stats: Record<string, number> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const alterId = data.alter_id;
            let duration = data.duration || 0;

            // Si session en cours, durée approximative
            if (!data.end_time) {
                const startTime = data.start_time.toDate();
                duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
            }

            stats[alterId] = (stats[alterId] || 0) + duration;
        });

        return stats;
    },

    /**
     * Stats par jour pour le graphe (7 derniers jours)
     */
    async getWeeklyBreakdown(systemId: string): Promise<{ label: string, value: number }[]> {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'fronting_history'),
            where('system_id', '==', systemId),
            where('start_time', '>=', sevenDaysAgo),
            orderBy('start_time', 'asc')
        );

        const snapshot = await getDocs(q);
        const dailyMap = new Map<string, number>();
        const orderedLabels: string[] = [];

        // Init map avec les 7 derniers jours dans l'ordre
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = days[d.getDay()];
            dailyMap.set(key, 0);
            orderedLabels.push(key);
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.start_time.toDate();
            const key = days[date.getDay()];

            let duration = data.duration || 0;
            if (!data.end_time) {
                const start = data.start_time.toDate();
                duration = Math.floor((Date.now() - start.getTime()) / 1000);
            }

            if (dailyMap.has(key)) {
                const current = dailyMap.get(key) || 0;
                dailyMap.set(key, current + duration);
            }
        });

        return orderedLabels.map(label => ({
            label,
            value: parseFloat(((dailyMap.get(label) || 0) / 3600).toFixed(1))
        }));
    }
};
