import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BlurView } from 'expo-blur';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput, Image, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
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

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface PostItemProps {
    post: Post;
    currentUserId?: string;
    onLike: (post: Post) => void;
    onDelete: (postId: string) => void;
    onAuthorPress: (item: any) => void;
    active: boolean;
}

const PostItem = React.memo(({ post, currentUserId, onLike, onDelete, onAuthorPress, active }: PostItemProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    // Theme colors for this specific post author
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

    useEffect(() => {
        if (active) {
            loadComments();
        }
    }, [active, post.id]);

    const loadComments = async () => {
        try {
            setLoadingComments(true);
            const data = await CommentService.fetchComments(post.id);
            setComments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingComments(false);
        }
    };

    return (
        <View style={[styles.postContainer, { minHeight: SCREEN_HEIGHT * 0.7 }]}>
            <PostCard
                post={post}
                onLike={() => onLike(post)}
                onDelete={() => onDelete(post.id)}
                currentUserId={currentUserId}
                showAuthor={true}
                themeColors={themeColors}
                onAuthorPress={onAuthorPress}
            />
            {/* Comments simplified for list view */}
            <View style={styles.commentsPreview}>
                <Text style={[styles.commentsTitle, themeColors && { color: themeColors.text }]}>
                    Commentaires ({comments.length})
                </Text>
                {comments.slice(0, 3).map(c => (
                    <View key={c.id} style={styles.miniComment}>
                        <Text style={[styles.miniCommentAuthor, themeColors && { color: themeColors.text }]}>{c.author_name}: </Text>
                        <Text style={[styles.miniCommentContent, themeColors && { color: themeColors.textSecondary }]} numberOfLines={2}>{c.content}</Text>
                    </View>
                ))}
                {comments.length > 3 && (
                    <Text style={[styles.viewMore, themeColors && { color: themeColors.textSecondary }]}>
                        Voir les {comments.length - 3} autres commentaires...
                    </Text>
                )}
                {comments.length === 0 && (
                    <Text style={[styles.noComments, themeColors && { color: themeColors.textSecondary }]}>Pas encore de commentaires</Text>
                )}
            </View>
        </View>
    );
});


export default function PostDetailScreen() {
    const params = useLocalSearchParams();
    const id = typeof params.id === 'string' ? params.id : params.id?.[0];
    const context = typeof params.context === 'string' ? params.context : undefined; // alter, system
    const contextId = typeof params.contextId === 'string' ? params.contextId : undefined;

    const { user, system, currentAlter } = useAuth();
    const insets = useSafeAreaInsets();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialIndex, setInitialIndex] = useState(0);

    // Comment input state (global for the screen, attached to visible post)
    const [visiblePostIndex, setVisiblePostIndex] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const [scrolledToInitial, setScrolledToInitial] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [id, context, contextId]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            let fetchedPosts: Post[] = [];

            if (context === 'alter' && contextId) {
                const res = await PostService.fetchPostsByAlter(contextId, null, 50); // Fetch more for scrolling
                fetchedPosts = res.posts;
            } else if (context === 'system' && contextId) {
                const res = await PostService.fetchPosts(contextId, null, 50);
                fetchedPosts = res.posts.filter(p => p.system_id === contextId);
            } else {
                // Default: just fetch the single post if no context
                if (id) {
                    const singlePost = await PostService.getPostById(id);
                    if (singlePost) fetchedPosts = [singlePost];
                }
            }

            // If empty (shouldn't happen if ID exists), try fetching the specific ID at least
            if (fetchedPosts.length === 0 && id) {
                const singlePost = await PostService.getPostById(id);
                if (singlePost) fetchedPosts = [singlePost];
            }

            setPosts(fetchedPosts);

            // Find index of the clicked post
            const index = fetchedPosts.findIndex(p => p.id === id);
            if (index !== -1) {
                setInitialIndex(index);
                setVisiblePostIndex(index);
            }
        } catch (error) {
            console.error('Error fetching posts for detail:', error);
            Alert.alert('Erreur', 'Impossible de charger les publications');
        } finally {
            setLoading(false);
        }
    };

    const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) {
            setVisiblePostIndex(viewableItems[0].index || 0);
        }
    }, []);

    const handleLike = async (post: Post) => {
        if (!user) return;
        try {
            await PostService.toggleLike(post.id, user.uid, currentAlter?.id);
            // Optimistic update
            setPosts(prev => prev.map(p => {
                if (p.id === post.id) {
                    const isLiked = p.likes?.includes(user.uid);
                    return {
                        ...p,
                        likes: isLiked ? p.likes.filter(l => l !== user.uid) : [...(p.likes || []), user.uid]
                    };
                }
                return p;
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (postId: string) => {
        // Implement delete logic (remove from list)
        try {
            await PostService.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            if (posts.length <= 1) router.back();
        } catch (e) { Alert.alert('Erreur', "Suppression impossible"); }
    };

    const handleAddComment = async () => {
        const targetPost = posts[visiblePostIndex];
        if (!targetPost || !commentText.trim() || !user) return;

        try {
            setSubmitting(true);
            const authorName = currentAlter?.name || system?.username || 'Utilisateur';
            const authorAvatar = currentAlter?.avatar || currentAlter?.avatar_url || system?.avatar_url || undefined;
            const authorId = currentAlter?.id || user.uid;

            await CommentService.addComment({
                postId: targetPost.id,
                authorId: authorId,
                authorName: authorName,
                authorAvatar: authorAvatar,
                content: commentText.trim()
            });

            setCommentText('');
            triggerHaptic.success();
            // Force refresh of current item? We need to clear cache or trigger reload in child
            // For now UI feedback suffices, child fetches on mount/active
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Commentaire non envoyé");
        } finally {
            setSubmitting(false);
        }
    };

    // Dynamic styles for header based on current visible post
    const currentPost = posts[visiblePostIndex];
    const currentTheme = currentPost?.alter?.equipped_items?.theme
        ? getThemeColors(currentPost.alter.equipped_items.theme)
        : currentPost?.alter?.color
            ? { text: colors.text, border: currentPost.alter.color, background: colors.background, primary: currentPost.alter.color || colors.primary, backgroundCard: colors.backgroundCard, textSecondary: colors.textSecondary }
            : null;

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        </SafeAreaView>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, currentTheme && { backgroundColor: currentTheme.background }]}
        >
            <BlurView
                intensity={80}
                tint="dark"
                style={[
                    styles.headerAbsolute,
                    { paddingTop: insets.top || 16, height: 60 + (insets.top || 0) },
                    currentTheme && { borderBottomColor: currentTheme.border }
                ]}
            >
                <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={currentTheme?.text || colors.text} />
                </AnimatedPressable>
                <Text style={[styles.headerTitle, currentTheme && { color: currentTheme?.text }]}>Publications</Text>
            </BlurView>

            <FlatList
                ref={flatListRef}
                data={posts}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                    <View style={{ paddingTop: index === 0 ? 80 + (insets.top || 0) : 20, paddingBottom: 40 }}>
                        <PostItem
                            post={item}
                            currentUserId={user?.uid}
                            onLike={handleLike}
                            onDelete={handleDelete}
                            onAuthorPress={(a) => {
                                const targetId = a.system_id || a.author_id;
                                if (targetId && !targetId.includes('-')) router.push(`/profile/${targetId}`);
                                else if (a.author_id) router.push(`/alter-space/${a.author_id}`);
                            }}
                            active={index === visiblePostIndex}
                        />
                    </View>
                )}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                showsVerticalScrollIndicator={false}
                initialScrollIndex={initialIndex}
                onScrollToIndexFailed={info => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
                    });
                }}
            />

            {/* Sticky Comment Bar */}
            <View style={[
                styles.inputContainer,
                { paddingBottom: Math.max(insets.bottom, 12) },
                currentTheme && { backgroundColor: currentTheme.border + '20', borderTopColor: currentTheme.border }
            ]}>
                <TextInput
                    style={[styles.input, currentTheme && { color: currentTheme.text, backgroundColor: colors.background }]}
                    placeholder={`Commenter en tant que ${currentAlter?.name || system?.username}...`}
                    placeholderTextColor={colors.textMuted}
                    value={commentText}
                    onChangeText={setCommentText}
                />
                <TouchableOpacity onPress={handleAddComment} disabled={submitting}>
                    <Ionicons name="send" size={24} color={currentTheme?.primary || colors.primary} />
                </TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        ...typography.h3,
        flex: 1,
        textAlign: 'center',
        marginRight: 40,
        color: colors.text,
    },
    postContainer: {
        paddingHorizontal: 0,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
        color: colors.text,
    },
    commentsPreview: {
        paddingHorizontal: 16,
        marginTop: 10,
    },
    commentsTitle: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        marginBottom: 8,
        color: colors.textSecondary,
    },
    miniComment: {
        flexDirection: 'row',
        marginBottom: 4,
        marginRight: 10
    },
    miniCommentAuthor: {
        ...typography.caption,
        fontWeight: 'bold',
        color: colors.text,
    },
    miniCommentContent: {
        ...typography.caption,
        color: colors.textSecondary,
        flex: 1,
    },
    viewMore: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: 4,
        fontStyle: 'italic',
    },
    noComments: {
        ...typography.caption,
        color: colors.textMuted,
        fontStyle: 'italic',
    }
});
