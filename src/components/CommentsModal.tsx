import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { CommentsService, Comment } from '../services/comments';
import { timeAgo } from '../lib/date';
import { triggerHaptic } from '../lib/haptics';
import { useAuth } from '../contexts/AuthContext';

// =====================================================
// COMMENTS MODAL
// Modal bottom-sheet pour afficher et ajouter des commentaires
// =====================================================

interface CommentsModalProps {
    visible: boolean;
    postId: string | null;
    onClose: () => void;
}

export const CommentsModal = ({ visible, postId, onClose }: CommentsModalProps) => {
    const { currentAlter, user, system } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [newComment, setNewComment] = useState('');
    const inputRef = useRef<TextInput>(null);
    const insets = useSafeAreaInsets();

    // Charger les commentaires quand le modal s'ouvre
    useEffect(() => {
        if (visible && postId) {
            loadComments();
        } else {
            setComments([]);
            setNewComment('');
        }
    }, [visible, postId]);

    const loadComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const result = await CommentsService.fetchComments(postId, 50);
            setComments(result);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!postId || !newComment.trim() || !user) return;

        setSending(true);
        triggerHaptic.medium();

        try {
            const authorName = currentAlter?.name || system?.username || 'Utilisateur';
            const authorAvatar = currentAlter?.avatar || currentAlter?.avatar_url || system?.avatar_url || undefined;
            const authorId = currentAlter?.id || user.uid;

            const comment = await CommentsService.addComment({
                postId,
                authorId: authorId,
                authorName: authorName,
                authorAvatar: authorAvatar,
                content: newComment.trim(),
            });

            // Ajouter en haut de la liste (optimistic update)
            setComments(prev => [comment, ...prev]);
            setNewComment('');
            triggerHaptic.success();
        } catch (error) {
            console.error('Failed to send comment:', error);
            triggerHaptic.error();
        } finally {
            setSending(false);
        }
    };

    const handleAuthorPress = (item: Comment) => {
        if (item.author_id.includes('-') || item.author_id.length > 20) {
            // Likely an alter ID (UUID)
            router.push(`/alter-space/${item.author_id}`);
        } else {
            // Likely a system ID (shorter or different format, but safer to check system_id if we added it)
            const targetId = item.system_id || item.author_id;
            router.push(`/system-profile/${targetId}`);
        }
        onClose();
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentItem}>
            <TouchableOpacity onPress={() => handleAuthorPress(item)}>
                {item.author_avatar ? (
                    <Image source={{ uri: item.author_avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarInitial}>{item.author_name?.charAt(0)}</Text>
                    </View>
                )}
            </TouchableOpacity>
            <View style={styles.commentContent}>
                <TouchableOpacity style={styles.commentHeader} onPress={() => handleAuthorPress(item)}>
                    <Text style={styles.authorName}>{item.author_name}</Text>
                    <Text style={styles.timestamp}>{timeAgo(item.created_at)}</Text>
                </TouchableOpacity>
                <Text style={styles.commentText}>{item.content}</Text>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    onPress={onClose}
                    activeOpacity={1}
                    accessibilityLabel="Fermer la fenêtre de commentaires"
                    accessibilityRole="button"
                />

                {/* Content */}
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.handle} />
                        <Text style={styles.title} accessibilityRole="header">Commentaires</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            accessibilityLabel="Fermer"
                            accessibilityRole="button"
                        >
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : comments.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Aucun commentaire pour le moment</Text>
                            <Text style={styles.emptySubtext}>Sois le premier à commenter !</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={comments}
                            renderItem={renderComment}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* Input */}
                    <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'android' ? 50 : Math.max(insets.bottom, 20) + spacing.md }]}>
                        {currentAlter?.avatar || currentAlter?.avatar_url ? (
                            <Image
                                source={{ uri: currentAlter.avatar || currentAlter.avatar_url }}
                                style={styles.inputAvatar}
                            />
                        ) : (
                            <View style={[styles.inputAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.inputAvatarInitial}>{currentAlter?.name?.charAt(0) || '?'}</Text>
                            </View>
                        )}
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Ajouter un commentaire..."
                            placeholderTextColor={colors.textMuted}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!newComment.trim() || sending) && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!newComment.trim() || sending}
                            accessibilityLabel="Envoyer le commentaire"
                            accessibilityRole="button"
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons name="send" size={20} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: 300,
    },
    header: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.h3,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        right: spacing.md,
        top: spacing.md,
        padding: spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        minHeight: 200,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    listContent: {
        padding: spacing.md,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentContent: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    authorName: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
    timestamp: {
        ...typography.caption,
        color: colors.textMuted,
    },
    commentText: {
        ...typography.body,
        marginTop: 2,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.sm,
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    inputAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputAvatarInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    input: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typography.body,
        color: colors.text,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
