import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import FeedbackService from '../../../src/services/FeedbackService';
import { Feedback } from '../../../src/types/Feedback';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useToast } from '../../../src/components/ui/Toast';

import { spacing, typography, borderRadius } from '../../../src/lib/theme';

export default function RoadmapScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const toast = useToast();

    const [features, setFeatures] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<'POPULAR' | 'RECENT'>('POPULAR');
    const [votingIds, setVotingIds] = useState<string[]>([]); // To track optimistic updates or loading states per item

    const loadFeatures = useCallback(async () => {
        try {
            const data = await FeedbackService.getPublicFeatures(50);

            // Client-side sorting because Firestore composite indexes can be annoying for dynamic sort switching
            // although getPublicFeatures does fetch by voteCount desc properly.
            // We'll re-sort here just to be responsive to the tab switch without re-fetching if possible,
            // but for simplicity let's just re-fetch or sort the array.

            let sorted = [...data];
            if (sortBy === 'POPULAR') {
                sorted.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
                sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            }

            setFeatures(sorted);
        } catch (error) {
            console.error("Failed to load roadmap:", error);
            // safe check for toast
            if (toast?.showToast) toast.showToast("Impossible de charger la roadmap", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sortBy, toast]);

    useEffect(() => {
        loadFeatures();
    }, [loadFeatures]);

    const handleVote = async (item: Feedback) => {
        if (!user) return;
        if (votingIds.includes(item.id)) return;

        // Optimistic update
        const hasVoted = item.votes?.includes(user.uid);
        const newVotes = hasVoted
            ? (item.votes || []).filter(id => id !== user.uid)
            : [...(item.votes || []), user.uid];
        const newCount = hasVoted
            ? Math.max(0, (item.voteCount || 0) - 1)
            : (item.voteCount || 0) + 1;

        setFeatures(prev => prev.map(f => f.id === item.id ? { ...f, votes: newVotes, voteCount: newCount } : f));

        setVotingIds(prev => [...prev, item.id]);

        try {
            await FeedbackService.voteFeedback(item.id, user.uid);
            // Success, no need to reload unless we want perfect sync
        } catch (error) {
            console.error("Vote failed:", error);
            if (toast?.showToast) toast.showToast("Erreur lors du vote", "error");
            // Revert optimistic update
            loadFeatures();
        } finally {
            setVotingIds(prev => prev.filter(id => id !== item.id));
        }
    };

    const renderItem = ({ item }: { item: Feedback }) => {
        const hasVoted = item.votes?.includes(user?.uid || '');
        const isProcesssing = votingIds.includes(item.id);

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
                <View style={styles.voteContainer}>
                    <TouchableOpacity
                        style={[
                            styles.voteButton,
                            {
                                borderColor: hasVoted ? colors.primary : colors.textMuted + '40',
                                backgroundColor: hasVoted ? colors.primary + '10' : 'transparent'
                            }
                        ]}
                        onPress={() => handleVote(item)}
                        disabled={isProcesssing}
                    >
                        <Ionicons
                            name={hasVoted ? "caret-up" : "caret-up-outline"}
                            size={24}
                            color={hasVoted ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.voteCount, { color: hasVoted ? colors.primary : colors.textMuted }]}>
                            {item.voteCount || 0}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                        {item.description}
                    </Text>
                    <View style={styles.metaRow}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PLANNED': return '#3B82F6'; // Blue
            case 'DONE': return '#10B981'; // Green
            case 'NEW': return '#6B7280'; // Gray
            case 'REJECTED': return '#EF4444'; // Red
            default: return '#8B5CF6'; // Purple
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PLANNED': return 'Prévu';
            case 'DONE': return 'Fait';
            case 'NEW': return 'Nouveau';
            case 'REJECTED': return 'Refusé';
            case 'NEED_INFO': return 'En attente d\'info';
            case 'DUPLICATE': return 'Doublon';
            default: return 'En revue';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.surface, colors.background]}
                style={[styles.headerGradient, { borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Roadmap Publique</Text>
                    <TouchableOpacity
                        style={[styles.proposeButton, { backgroundColor: colors.primary, borderRadius: borderRadius.full }]}
                        onPress={() => router.push({ pathname: '/settings/feedback/create', params: { type: 'FEATURE' } })}
                    >
                        <Ionicons name="add" size={20} color={colors.textOnPrimary} />
                        <Text style={[styles.proposeButtonText, { color: colors.textOnPrimary }]}>Idée</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, sortBy === 'POPULAR' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                        onPress={() => setSortBy('POPULAR')}
                    >
                        <Text style={[styles.tabText, { color: sortBy === 'POPULAR' ? colors.primary : colors.textMuted }]}>Populaires</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, sortBy === 'RECENT' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                        onPress={() => setSortBy('RECENT')}
                    >
                        <Text style={[styles.tabText, { color: sortBy === 'RECENT' ? colors.primary : colors.textMuted }]}>Récents</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={features}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, { padding: spacing.md }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeatures(); }} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="bulb-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune idée pour le moment. Soyez le premier !</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 0,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    proposeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    proposeButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    tabs: {
        flexDirection: 'row',
        gap: 20,
    },
    tab: {
        paddingBottom: 12,
        paddingHorizontal: 4,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        gap: 12,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
    },
    voteContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 2,
    },
    voteButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
        width: 44,
        height: 54,
        gap: 2,
    },
    voteCount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        gap: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
