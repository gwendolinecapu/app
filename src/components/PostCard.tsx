import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { Post, EmotionType } from '../types';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { timeAgo } from '../lib/date';
import { triggerHaptic } from '../lib/haptics';

interface PostCardProps {
    post: Post;
    onLike: (postId: string) => void;
    onComment?: (postId: string) => void;
    onShare?: (postId: string) => void;
    currentUserId?: string;
    showAuthor?: boolean;
}

const { width } = Dimensions.get('window');

// Optimized for feed performance
export const PostCard = React.memo(({ post, onLike, onComment, onShare, currentUserId, showAuthor = true }: PostCardProps) => {
    const doubleTapRef = useRef(null);
    const likeScale = useRef(new Animated.Value(0)).current;

    const isLiked = currentUserId && post.likes?.includes(currentUserId);

    const onDoubleTap = (event: any) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            // Animate heart
            triggerHaptic.notification('success');

            // Show heart animation
            Animated.sequence([
                Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 10 }),
                Animated.delay(500),
                Animated.timing(likeScale, { toValue: 0, duration: 200, useNativeDriver: true })
            ]).start();

            // Trigger like logic
            if (!isLiked) {
                onLike(post.id);
            }
        }
    };

    const handleHeartPress = () => {
        triggerHaptic.selection();
        onLike(post.id);
    };

    // Helper for media type (basic check from ext)
    const getMediaType = (url: string) => {
        if (!url) return 'none';
        const ext = url.split('.').pop()?.toLowerCase();
        if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'video';
        if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) return 'audio';
        return 'image';
    };

    const mediaType = getMediaType(post.media_url || '');

    return (
        <View style={styles.card}>
            {/* Header */}
            {showAuthor && (
                <View style={styles.header}>
                    <View style={styles.authorInfo}>
                        {post.author_avatar ? (
                            <Image source={{ uri: post.author_avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarInitial}>{post.author_name?.charAt(0)}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.authorName}>{post.author_name || 'Système'}</Text>
                            <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Content Text */}
            {post.content && (
                <Text style={styles.content}>{post.content}</Text>
            )}

            {/* Media with Double Tap */}
            {post.media_url && (
                <TapGestureHandler
                    ref={doubleTapRef}
                    numberOfTaps={2}
                    onHandlerStateChange={onDoubleTap}
                >
                    <View style={styles.mediaContainer}>
                        {mediaType === 'image' && (
                            <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
                        )}

                        {/* Video / Audio Placeholders */}
                        {mediaType === 'video' && (
                            <View style={styles.placeholderMedia}>
                                <Ionicons name="play-circle" size={48} color="white" />
                                <Text style={styles.placeholderText}>Vidéo</Text>
                            </View>
                        )}
                        {mediaType === 'audio' && (
                            <View style={styles.audioContainer}>
                                <Ionicons name="musical-note" size={24} color={colors.primary} />
                                <Text style={styles.audioText}>Audio (Message vocal)</Text>
                            </View>
                        )}

                        {/* Animated Heart Overlay */}
                        <Animated.View style={[styles.heartOverlay, { transform: [{ scale: likeScale }] }]}>
                            <Ionicons name="heart" size={80} color="white" style={styles.heartShadow} />
                        </Animated.View>
                    </View>
                </TapGestureHandler>
            )}

            {/* Actions */}
            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleHeartPress}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={26}
                            color={isLiked ? colors.error : colors.textSecondary}
                        />
                        {(post.likes?.length || 0) > 0 && (
                            <Text style={styles.actionText}>{post.likes?.length}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => onComment && onComment(post.id)}>
                        <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
                        {(post.comments_count || 0) > 0 && (
                            <Text style={styles.actionText}>{post.comments_count}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => onShare && onShare(post.id)}>
                        <Ionicons name="share-social-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Bookmark currently hidden or optional */}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.backgroundCard,
        marginBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    authorName: {
        ...typography.body,
        fontWeight: '600',
    },
    timestamp: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    content: {
        ...typography.body,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        lineHeight: 22,
    },
    mediaContainer: {
        width: '100%',
        aspectRatio: 1, // Instagram style square/portrait support could be added
        position: 'relative',
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    placeholderMedia: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    placeholderText: {
        color: 'white',
        marginTop: spacing.sm,
        fontWeight: '600',
    },
    audioContainer: {
        width: '100%',
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.backgroundLight,
    },
    audioText: {
        color: colors.text,
    },
    heartOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    heartShadow: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    leftActions: {
        flexDirection: 'row',
        gap: spacing.lg,
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.text,
    },
});
