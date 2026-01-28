/**
 * Page: Liste des feedbacks/signalements de l'utilisateur
 * Affiche bugs et suggestions avec statut, votes, et navigation vers détails
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import FeedbackService from '../../../src/services/FeedbackService';
import { Feedback } from '../../../src/types/Feedback';

export default function FeedbackListScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { user } = useAuth();

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFeedbacks = async (isRefresh = false) => {
        if (!user) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await FeedbackService.getUserFeedbacks(user.uid);
            setFeedbacks(data);
        } catch (error) {
            console.error('Error loading feedbacks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadFeedbacks();
    }, [user]);

    const getStatusConfig = (status: string) => {
        // Mapping des anciens statuts vers les nouveaux pour rétrocompatibilité
        let mappedStatus = status;
        if (status === 'NEW') mappedStatus = 'open';
        if (status === 'CONFIRMED_BUG' || status === 'PLANNED') mappedStatus = 'in_progress';
        if (status === 'DONE') mappedStatus = 'resolved';
        if (status === 'NEED_INFO') mappedStatus = 'need_info';

        switch (mappedStatus) {
            case 'open':
                return {
                    label: 'Ouvert',
                    icon: 'time-outline' as const,
                    color: '#F59E0B',
                    bgColor: 'rgba(245, 158, 11, 0.1)'
                };
            case 'in_progress':
                return {
                    label: 'En cours',
                    icon: 'construct-outline' as const,
                    color: '#3B82F6',
                    bgColor: 'rgba(59, 130, 246, 0.1)'
                };
            case 'resolved':
                return {
                    label: 'Résolu',
                    icon: 'checkmark-circle-outline' as const,
                    color: '#10B981',
                    bgColor: 'rgba(16, 185, 129, 0.1)'
                };
            case 'need_info':
                return {
                    label: 'Infos demandées',
                    icon: 'help-circle-outline' as const,
                    color: '#8B5CF6',
                    bgColor: 'rgba(139, 92, 246, 0.1)'
                };
            default:
                return {
                    label: 'Ouvert',
                    icon: 'time-outline' as const,
                    color: '#F59E0B',
                    bgColor: 'rgba(245, 158, 11, 0.1)'
                };
        }
    };

    const renderFeedbackCard = (feedback: Feedback) => {
        const isBug = feedback.type === 'BUG';
        const statusConfig = getStatusConfig(feedback.status || 'open');
        const voteCount = feedback.voteCount || 0;

        return (
            <TouchableOpacity
                key={feedback.id}
                style={[styles.card, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/settings/feedback/${feedback.id}` as any)}
                activeOpacity={0.7}
            >
                {/* Header avec type et statut */}
                <View style={styles.cardHeader}>
                    <View style={[
                        styles.typeBadge,
                        { backgroundColor: isBug ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
                    ]}>
                        <Ionicons
                            name={isBug ? 'bug' : 'bulb'}
                            size={14}
                            color={isBug ? '#EF4444' : '#F59E0B'}
                        />
                        <Text style={[
                            styles.typeBadgeText,
                            { color: isBug ? '#EF4444' : '#F59E0B' }
                        ]}>
                            {isBug ? 'Bug' : 'Suggestion'}
                        </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <Ionicons
                            name={statusConfig.icon}
                            size={14}
                            color={statusConfig.color}
                        />
                        <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Titre */}
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {feedback.title}
                </Text>

                {/* Description preview */}
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {feedback.description}
                </Text>

                {/* Footer avec votes et date */}
                <View style={styles.cardFooter}>
                    <View style={styles.voteContainer}>
                        <Ionicons name="arrow-up-circle" size={18} color={colors.primary} />
                        <Text style={[styles.voteText, { color: colors.text }]}>
                            {voteCount} vote{voteCount !== 1 ? 's' : ''}
                        </Text>
                    </View>

                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {new Date(feedback.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                        })}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Mes signalements' }} />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Mes signalements' }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadFeedbacks(true)}
                        tintColor={colors.primary}
                    />
                }
            >
                {feedbacks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <LinearGradient
                            colors={['#8B5CF6', '#6366F1']}
                            style={styles.emptyIcon}
                        >
                            <Ionicons name="document-text-outline" size={48} color="#FFF" />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            Aucun signalement
                        </Text>
                        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                            Vous n'avez pas encore signalé de bug ou proposé de suggestion.
                        </Text>
                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.createButtonText}>Créer un signalement</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {feedbacks.map(renderFeedbackCard)}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        gap: 16,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        gap: 6,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        gap: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    voteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    voteText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    createButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
