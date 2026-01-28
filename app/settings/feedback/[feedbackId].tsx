/**
 * Page: Détail d'un feedback avec votes et commentaires
 * Permet de voter, ajouter des précisions, voir le statut
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useToast } from '../../../src/components/ui/Toast';
import FeedbackService from '../../../src/services/FeedbackService';
import { Feedback, FeedbackComment } from '../../../src/types/Feedback';
import { triggerHaptic } from '../../../src/lib/haptics';

export default function FeedbackDetailScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { feedbackId } = useLocalSearchParams<{ feedbackId: string }>();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [comments, setComments] = useState<FeedbackComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const loadFeedback = async () => {
        if (!feedbackId || !user) return;

        try {
            setLoading(true);
            const data = await FeedbackService.getFeedback(feedbackId);

            if (!data) {
                showToast('Signalement introuvable', 'error');
                router.back();
                return;
            }

            setFeedback(data);

            // Check if user has voted
            setHasVoted(data.votes?.includes(user.uid) || false);

            // Load comments
            const commentsData = await FeedbackService.getFeedbackComments(feedbackId);
            setComments(commentsData);
        } catch (error) {
            console.error('Error loading feedback:', error);
            showToast('Erreur de chargement', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeedback();
    }, [feedbackId, user]);

    const handleVote = async () => {
        if (!feedback || !user) return;

        try {
            triggerHaptic.selection();

            // Optimistic update
            setHasVoted(!hasVoted);
            setFeedback(prev => prev ? {
                ...prev,
                voteCount: (prev.voteCount || 0) + (hasVoted ? -1 : 1)
            } : null);

            await FeedbackService.toggleVote(feedback.id!, user.uid);
            triggerHaptic.success();
        } catch (error) {
            console.error('Error voting:', error);
            // Revert optimistic update
            setHasVoted(!hasVoted);
            setFeedback(prev => prev ? {
                ...prev,
                voteCount: (prev.voteCount || 0) + (hasVoted ? 1 : -1)
            } : null);
            showToast('Erreur lors du vote', 'error');
        }
    };

    const handleSubmitComment = async () => {
        if (!feedback || !user || !commentText.trim()) return;

        try {
            setSubmittingComment(true);

            await FeedbackService.addComment(feedback.id!, {
                userId: user.uid,
                userEmail: user.email || undefined,
                text: commentText.trim(),
                createdAt: new Date().toISOString()
            });

            setCommentText('');
            triggerHaptic.success();
            showToast('Commentaire ajouté', 'success');

            // Reload comments
            await loadFeedback();
        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('Erreur lors de l\'ajout', 'error');
        } finally {
            setSubmittingComment(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'open':
                return {
                    label: 'Ouvert',
                    icon: 'time-outline' as const,
                    color: '#F59E0B',
                    bgColor: 'rgba(245, 158, 11, 0.1)'
                };
            case 'in_progress':
                return {
                    label: 'En cours de traitement',
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
                    label: 'Informations supplémentaires demandées',
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

    if (loading || !feedback) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Chargement...' }} />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    const isBug = feedback.type === 'BUG';
    const statusConfig = getStatusConfig(feedback.status || 'open');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ title: isBug ? 'Bug' : 'Suggestion' }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Type Badge */}
                <View style={[
                    styles.typeBadge,
                    { backgroundColor: isBug ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
                ]}>
                    <Ionicons
                        name={isBug ? 'bug' : 'bulb'}
                        size={20}
                        color={isBug ? '#EF4444' : '#F59E0B'}
                    />
                    <Text style={[
                        styles.typeBadgeText,
                        { color: isBug ? '#EF4444' : '#F59E0B' }
                    ]}>
                        {isBug ? 'Bug' : 'Suggestion'}
                    </Text>
                </View>

                {/* Titre */}
                <Text style={[styles.title, { color: colors.text }]}>
                    {feedback.title}
                </Text>

                {/* Statut */}
                <View style={[styles.statusCard, { backgroundColor: statusConfig.bgColor }]}>
                    <Ionicons
                        name={statusConfig.icon}
                        size={24}
                        color={statusConfig.color}
                    />
                    <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                </View>

                {/* Vote Button */}
                <TouchableOpacity
                    style={[
                        styles.voteButton,
                        hasVoted && styles.voteButtonActive,
                        { backgroundColor: hasVoted ? colors.primary : colors.surface }
                    ]}
                    onPress={handleVote}
                >
                    <Ionicons
                        name={hasVoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
                        size={24}
                        color={hasVoted ? '#FFF' : colors.text}
                    />
                    <Text style={[
                        styles.voteButtonText,
                        { color: hasVoted ? '#FFF' : colors.text }
                    ]}>
                        {hasVoted ? 'Vous avez voté' : 'Voter pour ce signalement'}
                    </Text>
                    <Text style={[
                        styles.voteCount,
                        { color: hasVoted ? '#FFF' : colors.textSecondary }
                    ]}>
                        {feedback.voteCount || 0} vote{(feedback.voteCount || 0) !== 1 ? 's' : ''}
                    </Text>
                </TouchableOpacity>

                {/* Description */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Description
                    </Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                        {feedback.description}
                    </Text>
                </View>

                {/* Bug-specific fields */}
                {isBug && feedback.stepsToReproduce && (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Étapes pour reproduire
                        </Text>
                        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                            {feedback.stepsToReproduce}
                        </Text>
                    </View>
                )}

                {isBug && feedback.expectedResult && (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Résultat attendu
                        </Text>
                        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                            {feedback.expectedResult}
                        </Text>
                    </View>
                )}

                {/* Feature-specific fields */}
                {!isBug && feedback.problemToSolve && (
                    <View style={[styles.section, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Problème que ça résout
                        </Text>
                        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                            {feedback.problemToSolve}
                        </Text>
                    </View>
                )}

                {/* Comments Section */}
                <View style={styles.commentsSection}>
                    <Text style={[styles.commentsSectionTitle, { color: colors.text }]}>
                        Précisions et commentaires ({comments.length})
                    </Text>

                    {comments.map((comment, index) => (
                        <View key={index} style={[styles.commentCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.commentHeader}>
                                <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
                                <Text style={[styles.commentAuthor, { color: colors.text }]}>
                                    {comment.userEmail?.split('@')[0] || 'Utilisateur'}
                                </Text>
                                <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
                                    {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                            <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                                {comment.text}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Add Comment Form */}
                <View style={[styles.addCommentContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.addCommentTitle, { color: colors.text }]}>
                        Ajouter une précision
                    </Text>
                    <TextInput
                        style={[
                            styles.commentInput,
                            {
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderColor: colors.border
                            }
                        ]}
                        value={commentText}
                        onChangeText={setCommentText}
                        placeholder="Ajoutez des détails, captures d'écran, ou précisions..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={4}
                    />
                    <TouchableOpacity
                        style={[
                            styles.submitCommentButton,
                            {
                                backgroundColor: commentText.trim() ? colors.primary : colors.border,
                                opacity: submittingComment ? 0.7 : 1
                            }
                        ]}
                        onPress={handleSubmitComment}
                        disabled={!commentText.trim() || submittingComment}
                    >
                        {submittingComment ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#FFF" />
                                <Text style={styles.submitCommentButtonText}>Envoyer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        gap: 8,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    typeBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        lineHeight: 36,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 20,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    voteButtonActive: {
        shadowOpacity: 0.3,
        elevation: 4,
    },
    voteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    voteCount: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    commentsSection: {
        marginTop: 8,
        marginBottom: 20,
    },
    commentsSectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    commentCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    commentDate: {
        fontSize: 12,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    addCommentContainer: {
        padding: 16,
        borderRadius: 16,
    },
    addCommentTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    commentInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    submitCommentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    submitCommentButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
