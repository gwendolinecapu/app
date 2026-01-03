import React, { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput, Image } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../../src/components/PostCard';
import { Skeleton, SkeletonFeed } from '../../src/components/ui/Skeleton';
import { PostService } from '../../src/services/posts';
import { CommentService } from '../../src/services/comments';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { Post, Comment } from '../../src/types';
import { triggerHaptic } from '../../src/lib/haptics';
import { timeAgo } from '../../src/lib/date';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';
import { getThemeColors } from '../../src/lib/cosmetics';

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user, system, loading: authLoading, currentAlter } = useAuth();
    const insets = useSafeAreaInsets();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const headerHeight = 60 + (insets.top || 0);

    useEffect(() => {
        if (authLoading) return;

        if (id && user) {
            fetchPostData();
        } else if (!user && !authLoading) {
            // User not authenticated
            setLoading(false);
            // Optionally redirect or show error
        }
    }, [id, user, authLoading]);

    const fetchPostData = async () => {
        try {
            setLoading(true);
            const postData = await PostService.getPostById(id!);
            if (postData) {
                setPost(postData);
                const commentsData = await CommentService.fetchComments(id!);
                setComments(commentsData);
            } else {
                console.error(`Post with ID ${id} not found.`);
                Alert.alert('Erreur', 'Publication non trouvée');
                router.back();
            }
        } catch (error: any) {
            console.error('Error fetching post data:', error);
            console.error('DEBUG: Post ID:', id);
            console.error('DEBUG: Error code:', error.code);
            console.error('DEBUG: Error message:', error.message);
            Alert.alert('Erreur', 'Impossible de charger la publication: ' + (error.message || 'Erreur inconnue'));
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!post || !user) return;
        try {
            await PostService.toggleLike(post.id, user.uid, currentAlter?.id);
            // Local update for immediate feedback
            const isLiked = post.likes?.includes(user.uid);
            const newLikes = isLiked
                ? post.likes.filter(l => l !== user.uid)
                : [...(post.likes || []), user.uid];

            setPost({ ...post, likes: newLikes });
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !user || !post) return;

        try {
            setSubmittingComment(true);
            const authorName = currentAlter?.name || system?.username || 'Utilisateur';
            const authorAvatar = currentAlter?.avatar || currentAlter?.avatar_url || system?.avatar_url || undefined;
            const authorId = currentAlter?.id || user.uid;

            await CommentService.addComment({
                postId: post.id,
                authorId: authorId,
                authorName: authorName,
                authorAvatar: authorAvatar,
                content: commentText.trim()
            });
            setCommentText('');
            // Refresh comments
            const commentsData = await CommentService.fetchComments(post.id);
            setComments(commentsData);
            setPost({ ...post, comments_count: (post.comments_count || 0) + 1 });
            triggerHaptic.success();
        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            if (!post) return;
            // Optimistic update prevention or loading state?
            // Deletion is critical, so we wait.
            await PostService.deletePost(postId);
            triggerHaptic.success();
            router.back();
            Alert.alert('Succès', 'Publication supprimée');
        } catch (error) {
            console.error('Error deleting post:', error);
            Alert.alert('Erreur', 'Impossible de supprimer la publication');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.header, { paddingTop: 16 }]}>
                    <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </AnimatedPressable>
                    <Text style={styles.headerTitle}>Publications</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={styles.content}>
                    <SkeletonFeed />
                    <View style={{ padding: 16 }}>
                        <Skeleton shape="text" width={100} height={20} style={{ marginBottom: 16 }} />
                        <SkeletonFeed />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!post) return null;


    // Derive theme colors from post author
    const themeColors = post?.alter?.equipped_items?.theme
        ? getThemeColors(post.alter.equipped_items.theme)
        : post?.alter?.color
            ? {
                background: colors.background,
                backgroundCard: colors.backgroundCard,
                primary: post.alter.color,
                text: colors.text,
                textSecondary: colors.textSecondary,
                border: post.alter.color
            }
            : null;

    const handleAuthorPress = (item: any) => {
        if (item.author_id.includes('-') || item.author_id.length > 20) {
            router.push(`/alter-space/${item.author_id}`);
        } else {
            const targetId = item.system_id || item.author_id;
            router.push(`/system-profile/${targetId}`);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, themeColors && { backgroundColor: themeColors.background }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <BlurView
                intensity={80}
                tint="dark"
                style={[
                    styles.headerAbsolute,
                    { paddingTop: insets.top || 16, height: headerHeight },
                    themeColors && { borderBottomColor: themeColors.border }
                ]}
            >
                <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={themeColors?.text || colors.text} />
                </AnimatedPressable>
                <Text style={[styles.headerTitle, themeColors && { color: themeColors.text }]}>Publications</Text>
                <View style={{ width: 40 }} />
            </BlurView>

            <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
                <PostCard
                    post={post}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    currentUserId={user?.uid}
                    showAuthor={true}
                    themeColors={themeColors}
                />

                {/* Comments Section */}
                <View style={styles.commentsContainer}>
                    <Text style={styles.commentsTitle}>Commentaires</Text>
                    {comments.length === 0 ? (
                        <Text style={styles.noComments}>Aucun commentaire pour le moment.</Text>
                    ) : (
                        comments.map((comment) => (
                            <View key={comment.id} style={styles.commentItem}>
                                <View style={styles.commentHeader}>
                                    <TouchableOpacity onPress={() => handleAuthorPress(comment)}>
                                        <Text style={styles.commentAuthor}>{comment.author_name || 'Anonyme'}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.commentDate}>
                                        {timeAgo(comment.created_at)}
                                    </Text>
                                </View>
                                <Text style={styles.commentContent}>{comment.content}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Post a Comment Bar */}
            <View style={[
                styles.inputContainer,
                { paddingBottom: Math.max(insets.bottom, 12) },
                themeColors && { backgroundColor: themeColors.backgroundCard, borderTopColor: themeColors.border }
            ]}>
                <TextInput
                    style={[
                        styles.input,
                        themeColors && { backgroundColor: themeColors.background, color: themeColors.text }
                    ]}
                    placeholder="Ajouter un commentaire..."
                    placeholderTextColor={themeColors ? themeColors.textSecondary : colors.textMuted}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                />
                <AnimatedPressable
                    onPress={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    style={styles.sendButton}
                >
                    {submittingComment ? (
                        <ActivityIndicator size="small" color={themeColors?.primary || colors.primary} />
                    ) : (
                        <Text style={[
                            styles.sendText,
                            (!commentText.trim() || submittingComment) ?
                                { color: themeColors ? themeColors.textSecondary : colors.textMuted } :
                                { color: themeColors ? themeColors.primary : colors.primary }
                        ]}>
                            Publier
                        </Text>
                    )}
                </AnimatedPressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    headerAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    content: {
        paddingBottom: 150,
    },
    commentsContainer: {
        padding: 16,
    },
    commentsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 16,
    },
    noComments: {
        fontSize: 14,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    commentItem: {
        marginBottom: 16,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    commentDate: {
        fontSize: 11,
        color: colors.textMuted,
    },
    commentContent: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 18,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.backgroundCard,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        color: colors.text,
        maxHeight: 100,
    },
    sendButton: {
        paddingVertical: 8,
    },
    sendText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});
