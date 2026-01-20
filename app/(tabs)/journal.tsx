/**
 * Écran principal du Journal
 * Liste les entrées de journal avec option de création
 */
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { JournalEntry, EmotionType, EMOTION_EMOJIS } from '../../src/types';
import { formatDistanceToNow, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SecureContainer } from '../../src/components/security/SecureContainer';

import { SummaryModal } from '../../src/components/journal/SummaryModal';

type SummaryPeriod = 'day' | 'week' | 'month';

type JournalTab = 'private' | 'public';

export default function JournalScreen() {
    const { currentAlter, user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<JournalTab>('private');
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);

    // Rafraîchir quand l'écran reprend le focus ou quand l'onglet change
    useFocusEffect(
        useCallback(() => {
            if (currentAlter) {
                fetchEntries();
            }
        }, [currentAlter, activeTab])
    );

    const fetchEntries = async () => {
        if (!currentAlter || !user) return;
        setLoading(true);

        try {
            // Base query filters
            let baseConstraints = [
                where('system_id', '==', user.uid),
                where('alter_id', '==', currentAlter.id),
                orderBy('created_at', 'desc')
            ];

            // Filter specific to Public/Private
            // Note: If you have existing data without 'visibility', you might need to backfill or handle missing field
            // Here we assume new entries have it, old entries default to 'private' logic (or we filter client side if index issue)

            // For now, let's filter client-side if your Firestore indexes aren't ready for 'visibility' yet
            // Or better, add the 'where' clause if you added the index.
            // Let's assume we filter client-side to avoid "Index needed" errors immediately for the user
            // UNTIL the user manually adds the index or runs a migration script.

            const q = query(
                collection(db, 'journal_entries'),
                ...baseConstraints
            );

            const querySnapshot = await getDocs(q);
            const data: JournalEntry[] = [];
            querySnapshot.forEach((doc) => {
                const entry = { id: doc.id, ...doc.data() } as JournalEntry;

                // Client-side filtering for visibility compatibility
                const entryVisibility = entry.visibility || 'private'; // Default to private for legacy
                if (entryVisibility === activeTab) {
                    data.push(entry);
                }
            });

            setEntries(data);
        } catch (error) {
            console.error('Error fetching journal entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
        } catch (e) {
            return 'Récemment';
        }
    };

    const handleDeleteEntry = (entryId: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous vraiment supprimer cette entrée ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'journal_entries', entryId));
                            fetchEntries();
                        } catch (error) {
                            console.error('Error deleting entry:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer');
                        }
                    }
                },
            ]
        );
    };

    const renderEntry = ({ item }: { item: JournalEntry }) => (
        <TouchableOpacity
            style={styles.entryCard}
            onPress={() => router.push(`/journal/${item.id}`)}
            onLongPress={() => handleDeleteEntry(item.id)}
        >
            <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                    {item.mood && (
                        <Text style={styles.moodEmoji}>
                            {EMOTION_EMOJIS[item.mood as EmotionType]}
                        </Text>
                    )}
                    <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
                </View>
                {item.is_locked && (
                    <Text style={styles.lockIcon}>🔒</Text>
                )}
            </View>

            {item.title && (
                <Text style={styles.entryTitle}>{item.title}</Text>
            )}

            <Text
                style={[styles.entryContent, item.is_locked && styles.lockedContent]}
                numberOfLines={item.is_locked ? 1 : 3}
            >
                {item.is_locked ? '••••••••••••••••••••' : item.content}
            </Text>

            {item.is_audio && (
                <View style={styles.audioBadge}>
                    <Text style={styles.audioBadgeText}>🎙️ Audio</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    /**
     * Get entries filtered by period for AI summarization.
     * Only includes PUBLIC entries (Journal de Bord).
     */
    const getEntriesForPeriod = (period: SummaryPeriod): string => {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'day':
                startDate = startOfDay(now);
                break;
            case 'week':
                startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
                break;
            case 'month':
                startDate = startOfMonth(now);
                break;
        }

        // Filter PUBLIC entries within the period
        const filtered = entries.filter(e => {
            const entryDate = new Date(e.created_at);
            const visibility = e.visibility || 'private';
            return visibility === 'public' && isAfter(entryDate, startDate);
        });

        return filtered
            .map(e => `[${formatDate(e.created_at)}] ${e.content}`)
            .join('\n\n');
    };

    if (!currentAlter) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📓</Text>
                    <Text style={styles.emptyTitle}>Sélectionne un alter</Text>
                </View>
            </View>
        );
    }

    return (
        <SecureContainer
            // Only require strict auth for the Private tab, effectively
            // But SecureContainer wraps the whole screen usually. 
            // We can customize the 'title' based on tab.
            title={activeTab === 'private' ? "Journal Intime" : "Journal de Bord"}
            subtitle={activeTab === 'private' ? "Accès sécurisé" : "Journal d'activité partagé (IA)"}
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/crisis/index' as any)}>
                            <Ionicons name="warning-outline" size={28} color={colors.error || '#FF4444'} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Journal</Text>
                        <Text style={styles.subtitle}>
                            Espace de {currentAlter.name}
                        </Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'private' && styles.activeTab]}
                        onPress={() => setActiveTab('private')}
                    >
                        <Text style={[styles.tabText, activeTab === 'private' && styles.activeTabText]}>
                            🔒 Privé
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'public' && styles.activeTab]}
                        onPress={() => setActiveTab('public')}
                    >
                        <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
                            🌍 Journal de Bord
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Liste des entrées */}
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderEntry}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>
                                {activeTab === 'private' ? '🤫' : '📢'}
                            </Text>
                            <Text style={styles.emptyTitle}>
                                {loading ? 'Chargement...' : 'Aucune entrée'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'private'
                                    ? "Tes secrets sont en sécurité ici."
                                    : "Raconte ta journée pour que l'IA puisse en faire un résumé."}
                            </Text>
                        </View>
                    }
                />

                {/* FABs */}
                <View style={styles.fabContainer}>
                    {activeTab === 'public' && entries.length > 0 && (
                        <TouchableOpacity
                            style={styles.aiFab}
                            onPress={() => setSummaryModalVisible(true)}
                        >
                            <Ionicons name="sparkles" size={24} color="white" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => router.push({
                            pathname: '/journal/create',
                            params: { defaultVisibility: activeTab }
                        })}
                    >
                        <Text style={styles.fabIcon}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* AI Summary Modal */}
                <SummaryModal
                    visible={summaryModalVisible}
                    onClose={() => setSummaryModalVisible(false)}
                    getEntriesForPeriod={getEntriesForPeriod}
                />
            </SafeAreaView>
        </SecureContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.sm,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
        marginLeft: -spacing.xs,
    },
    headerContent: {
        marginTop: spacing.xs,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    activeTab: {
        backgroundColor: colors.backgroundCard,
    },
    tabText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.text,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    entryCard: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    entryMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    moodEmoji: {
        fontSize: 18,
    },
    entryDate: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    lockIcon: {
        fontSize: 16,
    },
    entryTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    entryContent: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    lockedContent: {
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    audioBadge: {
        marginTop: spacing.sm,
        backgroundColor: colors.backgroundLight,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    audioBadgeText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: spacing.xxl * 2,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    fabContainer: {
        position: 'absolute',
        right: spacing.lg,
        bottom: 100, // Above tab bar
        gap: spacing.md,
        alignItems: 'center',
    },
    aiFab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.secondary || '#6B40E2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 32,
        color: colors.text,
        fontWeight: 'bold',
    },
});
