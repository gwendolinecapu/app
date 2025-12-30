import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput, Image } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../../src/components/PostCard';
import { PostService } from '../../src/services/posts';
import { CommentService } from '../../src/services/comments';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { Post, Comment } from '../../src/types';
import { triggerHaptic } from '../../src/lib/haptics';

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPostData();
        }
    }, [id]);

    const fetchPostData = async () => {
        try {
            setLoading(true);
            const postData = await PostService.getPostById(id!);
            if (postData) {
                setPost(postData);
                const commentsData = await CommentService.fetchComments(id!);
                setComments(commentsData);
            } else {
                Alert.alert('Erreur', 'Publication non trouvée');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching post data:', error);
            Alert.alert('Erreur', 'Impossible de charger la publication');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!post || !user) return;
        try {
            await PostService.toggleLike(post.id, user.uid);
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
            await CommentService.addComment({
                postId: post.id,
                authorId: user.uid,
                authorName: user.displayName || 'Système',
                authorAvatar: user.photoURL || undefined,
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!post) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Publications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <PostCard
                    post={post}
                    onLike={handleLike}
                    currentUserId={user?.uid}
                    showAuthor={true}
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
                                    <Text style={styles.commentAuthor}>{comment.author_name || 'Anonyme'}</Text>
                                    <Text style={styles.commentDate}>
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={styles.commentContent}>{comment.content}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Post a Comment Bar */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ajouter un commentaire..."
                    placeholderTextColor={colors.textMuted}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    style={styles.sendButton}
                >
                    {submittingComment ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={[
                            styles.sendText,
                            (!commentText.trim() || submittingComment) && { color: colors.textMuted }
                        ]}>
                            Publier
                        </Text>
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
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
        paddingBottom: 100,
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
