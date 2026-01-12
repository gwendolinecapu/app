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
    addEmotion: async (alterId: string, emotionOrEmotions: EmotionType | EmotionType[], intensity: 1 | 2 | 3 | 4 | 5 = 3, note?: string) => {
        if (!auth.currentUser) throw new Error("Not authenticated");

        const isArray = Array.isArray(emotionOrEmotions);
        const mainEmotion = isArray ? emotionOrEmotions[0] : emotionOrEmotions;
        const emotions = isArray ? emotionOrEmotions : [emotionOrEmotions];

        await addDoc(collection(db, 'emotions'), {
            alter_id: alterId,
            system_id: auth.currentUser.uid,
            emotion: mainEmotion, // Primary, legacy support
            emotions: emotions, // Full list
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
            where('system_id', '==', auth.currentUser.uid)
            // orderBy removed to avoid index error
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        // Sort client-side
        const emotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Emotion));
        emotions.sort((a, b) => {
            const timeA = (a.created_at as any)?.seconds || new Date(a.created_at).getTime() / 1000;
            const timeB = (b.created_at as any)?.seconds || new Date(b.created_at).getTime() / 1000;
            return timeB - timeA;
        });

        return emotions[0];
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
     * Only returns emotions from the last 24h (story-like behavior)
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
            const now = Date.now();
            const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

            snapshot.forEach(doc => {
                const emotion = { id: doc.id, ...doc.data() } as Emotion;

                // Filter: Only include emotions from the last 24h
                let emotionTime: number;
                if ((emotion.created_at as any)?.seconds) {
                    emotionTime = (emotion.created_at as any).seconds * 1000;
                } else {
                    emotionTime = new Date(emotion.created_at).getTime();
                }

                // Only add if within 24h
                if (emotionTime >= twentyFourHoursAgo) {
                    allEmotions.push(emotion);
                }
            });

            // Sort client-side
            allEmotions.sort((a, b) => {
                const timeA = (a.created_at as any)?.seconds || new Date(a.created_at).getTime() / 1000;
                const timeB = (b.created_at as any)?.seconds || new Date(b.created_at).getTime() / 1000;
                return timeB - timeA;
            });

            // Dedup by alter_id (keep latest within 24h)
            const latestEmotions: Record<string, Emotion> = {};
            for (const emotion of allEmotions) {
                if (!latestEmotions[emotion.alter_id]) {
                    latestEmotions[emotion.alter_id] = emotion;
                }
            }
            callback(latestEmotions);
        });
    },

    // ============================================
    // STATISTIQUES AVANCÉES (ajoutées pour l'écran History)
    // ============================================

    /**
     * Mapping des émotions vers une valeur numérique pour les calculs de tendance
     * Plus la valeur est haute, plus l'émotion est "positive"
     */
    _emotionValence: {
        happy: 5,
        excited: 5,
        proud: 5,
        love: 5,
        calm: 4,
        neutral: 3,
        confused: 2,
        tired: 2,
        bored: 2,
        anxious: 1,
        sad: 1,
        angry: 1,
        fear: 1,
        shame: 1,
        guilt: 1,
        sick: 1,
        hurt: 1,
    } as Record<EmotionType, number>,

    /**
     * Récupère l'historique des émotions avec filtre de période
     */
    getEmotionsHistory: async (alterId: string, daysOrStartDate: number | Date = 30, endDate?: Date): Promise<Emotion[]> => {
        if (!auth.currentUser) return [];

        let startDate: Date;
        let finalEndDate = endDate || new Date();

        if (daysOrStartDate instanceof Date) {
            startDate = daysOrStartDate;
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - daysOrStartDate);
        }
        startDate.setHours(0, 0, 0, 0);
        finalEndDate.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, 'emotions'),
            where('alter_id', '==', alterId),
            where('system_id', '==', auth.currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const emotions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Emotion));

        // Filtrer par date côté client (évite les index composites complexes)
        return emotions.filter(e => {
            const createdAt = (e.created_at as any)?.seconds
                ? new Date((e.created_at as any).seconds * 1000)
                : new Date(e.created_at);
            return createdAt >= startDate && createdAt <= finalEndDate;
        }).sort((a, b) => {
            const timeA = (a.created_at as any)?.seconds || new Date(a.created_at).getTime() / 1000;
            const timeB = (b.created_at as any)?.seconds || new Date(b.created_at).getTime() / 1000;
            return timeB - timeA;
        });
    },

    /**
     * Calcule la tendance émotionnelle (points par jour pour LineChart)
     * Retourne une liste de { date, value, count } où value = intensité moyenne pondérée par valence
     */
    getEmotionsTrend: async function (alterId: string, daysOrStartDate: number | Date = 7, endDate?: Date): Promise<{ date: string; value: number; count: number }[]> {
        const emotions = await this.getEmotionsHistory(alterId, daysOrStartDate, endDate);

        let startDate: Date;
        let finalEndDate = endDate || new Date();

        if (daysOrStartDate instanceof Date) {
            startDate = daysOrStartDate;
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - (daysOrStartDate - 1));
        }
        startDate.setHours(0, 0, 0, 0);
        finalEndDate.setHours(23, 59, 59, 999);

        const days = Math.ceil((finalEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Grouper par jour
        const dailyMap = new Map<string, { total: number; count: number }>();

        // Initialiser tous les jours
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
            dailyMap.set(key, { total: 0, count: 0 });
        }

        // Agréger les émotions par jour
        emotions.forEach(emotion => {
            const createdAt = (emotion.created_at as any)?.seconds
                ? new Date((emotion.created_at as any).seconds * 1000)
                : new Date(emotion.created_at);
            const dateKey = createdAt.toISOString().split('T')[0];
            if (dailyMap.has(dateKey)) {
                const current = dailyMap.get(dateKey)!;
                // Score = valence moyenne de l'émotion * intensité
                const entryEmotions = emotion.emotions || [emotion.emotion];
                const totalValence = entryEmotions.reduce((sum, e) => sum + (this._emotionValence[e] || 3), 0);
                const avgValence = totalValence / entryEmotions.length;

                const score = avgValence * emotion.intensity;
                dailyMap.set(dateKey, {
                    total: current.total + score,
                    count: current.count + 1
                });
            }
        });

        // Convertir en array pour le graphique
        const result: { date: string; value: number; count: number }[] = [];
        dailyMap.forEach((data, date) => {
            result.push({
                date,
                value: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
                count: data.count
            });
        });

        return result.sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Distribution des émotions par type (pour PieChart)
     */
    getEmotionsDistribution: async function (alterId: string, daysOrStartDate: number | Date = 30, endDate?: Date): Promise<{ type: EmotionType; label: string; count: number; percentage: number }[]> {
        const emotions = await this.getEmotionsHistory(alterId, daysOrStartDate, endDate);



        // Use the map or fallback. Note: imported map is better.
        // Actually, best to just use the one from types if available globally or import it at top of file.
        // Let's just hardcode the extended list here if importing is tricky or just rely on the new types.
        // For simplicity in this replace, I'll update the list.
        const EMOTION_LABELS: Record<EmotionType, string> = {
            happy: 'Joyeux', sad: 'Triste', anxious: 'Anxieux', angry: 'En colère',
            tired: 'Fatigué', calm: 'Calme', confused: 'Confus', excited: 'Excité',
            fear: 'Peur', shame: 'Honte', bored: 'Ennuyé', proud: 'Fier',
            love: 'Amoureux', sick: 'Malade', guilt: 'Coupable', hurt: 'Blessé',
        };

        // Compter par type
        const counts: Record<string, number> = {};
        let total = 0;

        emotions.forEach(e => {
            const entryEmotions = e.emotions || [e.emotion];
            entryEmotions.forEach(emType => {
                counts[emType] = (counts[emType] || 0) + 1;
                total++;
            });
        });
        if (total === 0) total = 1; // Éviter division par 0

        // Convertir et trier par count décroissant
        return Object.entries(counts)
            .map(([type, count]) => ({
                type: type as EmotionType,
                label: EMOTION_LABELS[type as EmotionType] || type,
                count,
                percentage: Math.round((count / total) * 100)
            }))
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Calcule l'intensité moyenne sur une période avec comparaison période précédente
     */
    getMoodAverage: async function (alterId: string, daysOrStartDate: number | Date = 7, endDate?: Date): Promise<{ average: number; trend: 'up' | 'down' | 'stable'; previousAverage: number }> {
        // Période actuelle
        const currentEmotions = await this.getEmotionsHistory(alterId, daysOrStartDate, endDate);

        let startDate: Date;
        let finalEndDate = endDate || new Date();

        if (daysOrStartDate instanceof Date) {
            startDate = daysOrStartDate;
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - daysOrStartDate);
        }

        const days = Math.ceil((finalEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Période précédente
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - days);

        const totalDays = days * 2;
        const fetchedAllEmotions = await this.getEmotionsHistory(alterId, totalDays, finalEndDate);

        const cutoffDate = startDate;

        const previousEmotions = fetchedAllEmotions.filter(e => {
            const createdAt = (e.created_at as any)?.seconds
                ? new Date((e.created_at as any).seconds * 1000)
                : new Date(e.created_at);
            return createdAt < cutoffDate && createdAt >= prevStartDate;
        });

        // Calcul moyennes
        const currentAvg = currentEmotions.length > 0
            ? currentEmotions.reduce((sum, e) => sum + e.intensity, 0) / currentEmotions.length
            : 0;

        const previousAvg = previousEmotions.length > 0
            ? previousEmotions.reduce((sum, e) => sum + e.intensity, 0) / previousEmotions.length
            : 0;

        // Déterminer la tendance
        let trend: 'up' | 'down' | 'stable' = 'stable';
        const diff = currentAvg - previousAvg;
        if (diff > 0.3) trend = 'up';
        else if (diff < -0.3) trend = 'down';

        return {
            average: Math.round(currentAvg * 10) / 10,
            previousAverage: Math.round(previousAvg * 10) / 10,
            trend
        };
    },

    /**
     * Détecte des patterns dans les émotions (ex: "Plus anxieux le lundi")
     */
    detectPatterns: async function (alterId: string): Promise<string[]> {
        const emotions = await this.getEmotionsHistory(alterId, 30);
        const insights: string[] = [];

        if (emotions.length < 5) {
            return ["Continue à enregistrer tes émotions pour découvrir des patterns !"];
        }

        const EMOTION_LABELS: Record<EmotionType, string> = {
            happy: 'Joyeux', sad: 'Triste', anxious: 'Anxieux', angry: 'En colère',
            tired: 'Fatigué', calm: 'Calme', confused: 'Confus', excited: 'Excité',
            fear: 'Peur', shame: 'Honte', bored: 'Ennuyé', proud: 'Fier',
            love: 'Amoureux', sick: 'Malade', guilt: 'Coupable', hurt: 'Blessé',
        };

        // Pattern 1: Émotion dominante
        const counts: Record<string, number> = {};
        emotions.forEach(e => {
            counts[e.emotion] = (counts[e.emotion] || 0) + 1;
        });
        const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (dominant) {
            const pct = Math.round((dominant[1] / emotions.length) * 100);
            if (pct > 40) {
                insights.push(`Tu ressens souvent "${EMOTION_LABELS[dominant[0] as EmotionType]}" (${pct}% du temps)`);
            }
        }

        // Pattern 2: Jour de la semaine avec plus d'émotions négatives
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const negativeEmotions: EmotionType[] = ['anxious', 'sad', 'angry'];
        const dayNegativeCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
        const dayTotalCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

        emotions.forEach(e => {
            const createdAt = (e.created_at as any)?.seconds
                ? new Date((e.created_at as any).seconds * 1000)
                : new Date(e.created_at);
            const dayOfWeek = createdAt.getDay();
            dayTotalCounts[dayOfWeek]++;
            if (negativeEmotions.includes(e.emotion)) {
                dayNegativeCounts[dayOfWeek]++;
            }
        });

        // Trouver le jour le plus difficile
        let maxNegativeRatio = 0;
        let hardestDay = -1;
        dayNegativeCounts.forEach((count, i) => {
            if (dayTotalCounts[i] >= 3) {
                const ratio = count / dayTotalCounts[i];
                if (ratio > maxNegativeRatio && ratio > 0.5) {
                    maxNegativeRatio = ratio;
                    hardestDay = i;
                }
            }
        });

        if (hardestDay >= 0) {
            insights.push(`Les ${days[hardestDay]}s semblent plus difficiles pour toi`);
        }

        // Pattern 3: Intensité moyenne
        const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;
        if (avgIntensity >= 4) {
            insights.push("Tes émotions sont souvent intenses - pense à pratiquer des techniques de régulation");
        } else if (avgIntensity <= 2) {
            insights.push("Tes émotions restent douces - c'est une période calme pour toi");
        }

        return insights.length > 0 ? insights : ["Continue d'enregistrer tes émotions !"];
    },

    /**
     * Statistiques récapitulatives pour l'onglet Résumé
     */
    getSummaryStats: async function (alterId: string, daysOrStartDate: number | Date = 7, endDate?: Date): Promise<{
        totalEntries: number;
        avgIntensity: number;
        dominantEmotion: EmotionType | null;
        moodScore: number;
    }> {
        const emotions = await this.getEmotionsHistory(alterId, daysOrStartDate, endDate);

        if (emotions.length === 0) {
            return { totalEntries: 0, avgIntensity: 0, dominantEmotion: null, moodScore: 50 };
        }

        // Compter les émotions
        const counts: Record<string, number> = {};
        let totalIntensity = 0;
        let totalValenceScore = 0;

        emotions.forEach(e => {
            counts[e.emotion] = (counts[e.emotion] || 0) + 1;
            totalIntensity += e.intensity;
            totalValenceScore += this._emotionValence[e.emotion] || 3;
        });

        const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        const avgValence = totalValenceScore / emotions.length;
        const moodScore = Math.round(((avgValence - 1) / 4) * 100);

        return {
            totalEntries: emotions.length,
            avgIntensity: Math.round((totalIntensity / emotions.length) * 10) / 10,
            dominantEmotion: dominant ? dominant[0] as EmotionType : null,
            moodScore: Math.max(0, Math.min(100, moodScore))
        };
    }
};
