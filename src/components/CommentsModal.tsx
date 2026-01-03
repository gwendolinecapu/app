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
    LayoutAnimation
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { CommentsService, Comment } from '../services/comments';
import { timeAgo } from '../lib/date';
import { triggerHaptic } from '../lib/haptics';
import { useAuth } from '../contexts/AuthContext';
import { ThemeColors } from '../lib/cosmetics';

// =====================================================
// COMMENTS MODAL
// Modal bottom-sheet pour afficher et ajouter des commentaires
// =====================================================

interface CommentsModalProps {
    visible: boolean;
    postId: string | null;
    onClose: () => void;
    themeColors?: ThemeColors | null;
}

interface CommentWithReplies extends Comment {
    replies: Comment[];
}

const CommentItem = ({
    item,
    onReply,
    onAuthorPress,
    currentUserId,
    themeColors
}: {
    item: CommentWithReplies,
    onReply: (c: Comment) => void,
    onAuthorPress: (c: Comment) => void,
    currentUserId?: string,
    themeColors?: ThemeColors | null
}) => {
    const [showReplies, setShowReplies] = useState(false);

    // Dynamic colors
    const textColor = themeColors?.text || colors.text;
    const textSecondary = themeColors?.textSecondary || colors.textSecondary;
    const primary = themeColors?.primary || colors.primary;

    const handleToggleReplies = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowReplies(!showReplies);
    };

    return (
        <View style={styles.commentContainer}>
            {/* Main Parent Comment */}
            <View style={styles.commentItem}>
                <TouchableOpacity onPress={() => onAuthorPress(item)}>
                    {item.author_avatar ? (
                        <Image source={{ uri: item.author_avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: primary }]}>
                            <Text style={styles.avatarInitial}>{item.author_name?.charAt(0)}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeaderRow}>
                        <TouchableOpacity style={styles.commentHeader} onPress={() => onAuthorPress(item)}>
                            <Text style={[styles.authorName, { color: textColor }]}>{item.author_name}</Text>
                            <Text style={[styles.timestamp, { color: textSecondary }]}>{timeAgo(item.created_at)}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.commentText, { color: textColor }]}>{item.content}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => onReply(item)} style={styles.replyButton}>
                            <Text style={[styles.replyButtonText, { color: textSecondary }]}>Répondre</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* View Replies Button */}
            {item.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {!showReplies && (
                        <TouchableOpacity onPress={handleToggleReplies} style={styles.viewRepliesButton}>
                            <View style={[styles.separator, themeColors && { backgroundColor: themeColors.border }]} />
                            <Text style={[styles.viewRepliesText, { color: textSecondary }]}>
                                Voir les {item.replies.length} réponses
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Replies List */}
                    {showReplies && (
                        <View>
                            {item.replies.map((reply) => (
                                <View key={reply.id} style={[styles.commentItem, styles.replyItem]}>
                                    <TouchableOpacity onPress={() => onAuthorPress(reply)}>
                                        {reply.author_avatar ? (
                                            <Image source={{ uri: reply.author_avatar }} style={[styles.avatar, styles.replyAvatar]} />
                                        ) : (
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: primary }, styles.replyAvatar]}>
                                                <Text style={styles.avatarInitial}>{reply.author_name?.charAt(0)}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <View style={styles.commentContent}>
                                        <View style={styles.commentHeaderRow}>
                                            <TouchableOpacity style={styles.commentHeader} onPress={() => onAuthorPress(reply)}>
                                                <Text style={[styles.authorName, { color: textColor }]}>{reply.author_name}</Text>
                                                <Text style={[styles.timestamp, { color: textSecondary }]}>{timeAgo(reply.created_at)}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {reply.reply_to_author_name && reply.reply_to_author_name !== item.author_name && (
                                            <Text style={[styles.replyContext, { color: primary }]}>@{reply.reply_to_author_name}</Text>
                                        )}

                                        <Text style={[styles.commentText, { color: textColor }]}>{reply.content}</Text>

                                        <View style={styles.actionRow}>
                                            <TouchableOpacity onPress={() => onReply(reply)} style={styles.replyButton}>
                                                <Text style={[styles.replyButtonText, { color: textSecondary }]}>Répondre</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity onPress={handleToggleReplies} style={styles.hideRepliesButton}>
                                <Text style={[styles.hideRepliesText, { color: themeColors?.textMuted || colors.textMuted }]}>Masquer les réponses</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export const CommentsModal = ({ visible, postId, onClose, themeColors }: CommentsModalProps) => {
    const { currentAlter, user, system } = useAuth();
    const [comments, setComments] = useState<CommentWithReplies[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [newComment, setNewComment] = useState('');
    const inputRef = useRef<TextInput>(null);
    const insets = useSafeAreaInsets();

    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

    // Dynamic colors
    const backgroundColor = themeColors?.backgroundCard || colors.backgroundCard;
    const textColor = themeColors?.text || colors.text;
    const textSecondary = themeColors?.textSecondary || colors.textSecondary;
    const primary = themeColors?.primary || colors.primary;
    const borderColor = themeColors?.border || colors.border;
    const placeholderColor = themeColors?.textSecondary ? themeColors.textSecondary + '80' : colors.textMuted;


    // Charger les commentaires quand le modal s'ouvre
    useEffect(() => {
        if (visible && postId) {
            loadComments();
        } else {
            setComments([]);
            setNewComment('');
            setReplyingTo(null);
        }
    }, [visible, postId]);

    const loadComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const result = await CommentsService.fetchComments(postId, 50);
            const structured = organizeComments(result);
            setComments(structured);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to group replies under parents
    const organizeComments = (allComments: Comment[]): CommentWithReplies[] => {
        const commentsMap = new Map<string, CommentWithReplies>();
        const parentComments: CommentWithReplies[] = [];
        const repliesMap = new Map<string, Comment[]>();

        // 1. Identify parents vs replies
        allComments.forEach(c => {
            // Assume we can check if it's a parent or reply based on parent_id
            if (c.parent_id) {
                const existing = repliesMap.get(c.parent_id) || [];
                existing.push(c);
                repliesMap.set(c.parent_id, existing);
            } else {
                // Initialize with empty replies
                const p: CommentWithReplies = { ...c, replies: [] };
                commentsMap.set(c.id, p);
                parentComments.push(p);
            }
        });

        // 2. Handle orphans - treat as top level if we can't find parent
        allComments.forEach(c => {
            if (c.parent_id && !commentsMap.has(c.parent_id)) {
                const p: CommentWithReplies = { ...c, replies: [] };
                parentComments.push(p);
                const existingReplies = repliesMap.get(c.id);
                if (existingReplies) {
                    p.replies = existingReplies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                }
            }
        });

        // 3. Attach replies to parents
        parentComments.forEach(p => {
            const replies = repliesMap.get(p.id);
            if (replies) {
                // Sort replies Oldest -> Newest
                replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                p.replies = replies;
            }
        });

        // 4. Sort parents Newest -> Oldest
        parentComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return parentComments;
    };

    const handleSend = async () => {
        if (!postId || !newComment.trim() || !user) return;

        setSending(true);
        triggerHaptic.medium();

        try {
            const authorName = currentAlter?.name || system?.username || 'Utilisateur';
            const authorAvatar = currentAlter?.avatar || currentAlter?.avatar_url || system?.avatar_url || undefined;
            const authorId = currentAlter?.id || user.uid;

            // Determine correct parent ID (ensure 1-level nesting)
            const targetParentId = replyingTo?.parent_id ? replyingTo.parent_id : replyingTo?.id;

            const comment = await CommentsService.addComment({
                postId,
                authorId: authorId,
                authorName: authorName,
                authorAvatar: authorAvatar,
                content: newComment.trim(),
                parentId: targetParentId,
                replyToAuthorName: replyingTo?.author_name,
                replyToAuthorId: replyingTo?.author_id,
            });

            // Reconstruct flat list to add new comment and re-organize
            const currentFlat = comments.flatMap(p => [p, ...p.replies]);
            const updatedFlat = [comment, ...currentFlat];
            setComments(organizeComments(updatedFlat));

            setNewComment('');
            setReplyingTo(null);
            triggerHaptic.success();
        } catch (error) {
            console.error('Failed to send comment:', error);
            triggerHaptic.error();
        } finally {
            setSending(false);
        }
    };

    const handleReply = (item: Comment) => {
        setReplyingTo(item);
        inputRef.current?.focus();
        triggerHaptic.selection();
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                <View style={[styles.content, { backgroundColor }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: borderColor }]}>
                        <View style={[styles.handle, { backgroundColor: borderColor }]} />
                        <Text style={[styles.title, { color: textColor }]} accessibilityRole="header">Commentaires</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            accessibilityLabel="Fermer"
                            accessibilityRole="button"
                        >
                            <Ionicons name="close" size={24} color={textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={primary} />
                        </View>
                    ) : comments.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-outline" size={48} color={themeColors?.textMuted || colors.textMuted} />
                            <Text style={[styles.emptyText, { color: textSecondary }]}>Aucun commentaire pour le moment</Text>
                            <Text style={[styles.emptySubtext, { color: themeColors?.textMuted || colors.textMuted }]}>Sois le premier à commenter !</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={comments}
                            renderItem={({ item }) => (
                                <CommentItem
                                    item={item}
                                    onReply={handleReply}
                                    onAuthorPress={handleAuthorPress}
                                    currentUserId={user?.uid}
                                    themeColors={themeColors}
                                />
                            )}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* Replying Banner */}
                    {replyingTo && (
                        <View style={[styles.replyBanner, { backgroundColor: themeColors?.background || colors.backgroundLight, borderTopColor: borderColor }]}>
                            <Text style={[styles.replyBannerText, { color: textColor }]}>
                                Répondre à <Text style={{ fontWeight: 'bold' }}>{replyingTo.author_name}</Text>
                            </Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <Ionicons name="close-circle" size={20} color={textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Input */}
                    <View style={[
                        styles.inputContainer,
                        {
                            borderTopColor: borderColor,
                            paddingBottom: Platform.OS === 'android' ? 20 : Math.max(insets.bottom, 20) + spacing.md
                        }
                    ]}>
                        {currentAlter?.avatar || currentAlter?.avatar_url ? (
                            <Image
                                source={{ uri: currentAlter.avatar || currentAlter.avatar_url }}
                                style={styles.inputAvatar}
                            />
                        ) : (
                            <View style={[styles.inputAvatarPlaceholder, { backgroundColor: primary }]}>
                                <Text style={styles.inputAvatarInitial}>{currentAlter?.name?.charAt(0) || '?'}</Text>
                            </View>
                        )}
                        <TextInput
                            ref={inputRef}
                            style={[
                                styles.input,
                                {
                                    backgroundColor: themeColors?.background || colors.backgroundLight,
                                    color: textColor
                                }
                            ]}
                            placeholder={replyingTo ? "Écrivez une réponse..." : "Ajouter un commentaire..."}
                            placeholderTextColor={placeholderColor}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: primary }, (!newComment.trim() || sending) && styles.sendButtonDisabled]}
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
        paddingBottom: 100,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    commentContainer: {
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
    actionRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: spacing.md,
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
    replyItem: {
        marginTop: spacing.xs,
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    commentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    replyButton: {
    },
    replyButtonText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 12,
    },
    replyContext: {
        ...typography.caption,
        color: colors.primary,
        marginBottom: 2,
        fontSize: 12,
    },
    replyBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    replyBannerText: {
        ...typography.bodySmall,
        color: colors.text,
    },
    repliesContainer: {
        marginLeft: 44, // Align with parent content (Avatar 36 + spacing.sm 8)
        marginTop: -spacing.sm,
    },
    viewRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        marginBottom: spacing.xs,
    },
    separator: {
        width: 30,
        height: 1,
        backgroundColor: colors.border,
        marginRight: spacing.sm,
    },
    viewRepliesText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    hideRepliesButton: {
        marginTop: spacing.xs,
        marginBottom: spacing.md,
    },
    hideRepliesText: {
        ...typography.caption,
        color: colors.textMuted,
    },
});
