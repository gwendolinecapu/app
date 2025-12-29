/**
 * Écran d'historique des émotions
 * Affiche l'historique complet avec possibilité de filtrer par période
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import {
    Emotion,
    EmotionType,
    EMOTION_EMOJIS,
    EMOTION_LABELS
} from '../../src/types';

type Period = '7d' | '30d' | 'all';

export default function EmotionsHistoryScreen() {
    const { currentAlter } = useAuth();
    const [emotions, setEmotions] = useState<Emotion[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('7d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentAlter) {
            fetchEmotions();
        }
    }, [currentAlter, selectedPeriod]);

    const fetchEmotions = async () => {
        if (!currentAlter) return;
        setLoading(true);

        try {
            let q = query(
                collection(db, 'emotions'),
                where('alter_id', '==', currentAlter.id),
                orderBy('created_at', 'desc')
            );

            // Filtrer par période
            if (selectedPeriod !== 'all') {
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - (selectedPeriod === '7d' ? 7 : 30));
                q = query(
                    collection(db, 'emotions'),
                    where('alter_id', '==', currentAlter.id),
                    where('created_at', '>=', daysAgo.toISOString()),
                    orderBy('created_at', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);
            const data: Emotion[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Emotion);
            });

            setEmotions(data);
        } catch (error) {
            console.error('Error fetching emotions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculer les statistiques
    const getStats = () => {
        if (emotions.length === 0) return null;

        // Émotion la plus fréquente
        const emotionCounts = emotions.reduce((acc, e) => {
            acc[e.emotion] = (acc[e.emotion] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostFrequent = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0];

        // Intensité moyenne
        const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;

        return {
            mostFrequent: mostFrequent[0] as EmotionType,
            avgIntensity: avgIntensity.toFixed(1),
            total: emotions.length,
        };
    };

    const stats = getStats();

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const renderEmotionItem = ({ item }: { item: Emotion }) => (
        <View style={styles.emotionItem}>
            <View style={styles.emotionLeft}>
                <Text style={styles.emotionEmoji}>
                    {EMOTION_EMOJIS[item.emotion as EmotionType]}
                </Text>
                <View style={styles.emotionInfo}>
                    <Text style={styles.emotionLabel}>
                        {EMOTION_LABELS[item.emotion as EmotionType]}
                    </Text>
                    <Text style={styles.emotionDate}>
                        {formatDate(item.created_at)}
                    </Text>
                    {item.note && (
                        <Text style={styles.emotionNote} numberOfLines={2}>
                            "{item.note}"
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.intensityBadge}>
                <Text style={styles.intensityText}>{item.intensity}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Historique</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Filtres de période */}
            <View style={styles.filters}>
                {(['7d', '30d', 'all'] as Period[]).map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.filterButton,
                            selectedPeriod === period && styles.filterButtonActive,
                        ]}
                        onPress={() => setSelectedPeriod(period)}
                    >
                        <Text style={[
                            styles.filterText,
                            selectedPeriod === period && styles.filterTextActive,
                        ]}>
                            {period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : 'Tout'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Statistiques */}
            {stats && (
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>
                            {EMOTION_EMOJIS[stats.mostFrequent]}
                        </Text>
                        <Text style={styles.statLabel}>Plus fréquente</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.avgIntensity}</Text>
                        <Text style={styles.statLabel}>Intensité moy.</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Entrées</Text>
                    </View>
                </View>
            )}

            {/* Liste des émotions */}
            <FlatList
                data={emotions}
                keyExtractor={(item) => item.id}
                renderItem={renderEmotionItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📊</Text>
                        <Text style={styles.emptyText}>
                            {loading ? 'Chargement...' : 'Aucune émotion enregistrée'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    backButton: {
        ...typography.body,
        color: colors.primary,
    },
    title: {
        ...typography.h2,
    },
    filters: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    filterButton: {
        flex: 1,
        padding: spacing.sm,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: colors.primary,
    },
    filterText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: colors.text,
        fontWeight: 'bold',
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
    },
    statEmoji: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    statValue: {
        ...typography.h2,
        color: colors.text,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    emotionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    emotionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    emotionEmoji: {
        fontSize: 36,
        marginRight: spacing.md,
    },
    emotionInfo: {
        flex: 1,
    },
    emotionLabel: {
        ...typography.body,
        fontWeight: '600',
    },
    emotionDate: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emotionNote: {
        ...typography.caption,
        color: colors.textMuted,
        fontStyle: 'italic',
        marginTop: spacing.xs,
    },
    intensityBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight + '40',
        justifyContent: 'center',
        alignItems: 'center',
    },
    intensityText: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
    },
});
