import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { Post } from '../types';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { timeAgo } from '../lib/date';
import { triggerHaptic } from '../lib/haptics';
import { VideoPlayer } from './ui/VideoPlayer';
import { AudioPlayer } from './ui/AudioPlayer';
import { ImageLightbox } from './ui/ImageLightbox';

// =====================================================
// POST CARD
// Composant de post réutilisable avec:
// - Double tap to like
// - Navigation vers profil auteur
// - Support vidéo/audio/image
// - Lightbox pour les images
// =====================================================

interface PostCardProps {
    post: Post;
    onLike: (postId: string) => void;
    onComment?: (postId: string) => void;
    onShare?: (postId: string) => void;
    onAuthorPress?: (authorId: string, systemId?: string) => void;
    currentUserId?: string;
    showAuthor?: boolean;
}

const { width } = Dimensions.get('window');

export const PostCard = React.memo(({ post, onLike, onComment, onShare, onAuthorPress, currentUserId, showAuthor = true }: PostCardProps) => {
    const doubleTapRef = useRef(null);
    const likeScale = useRef(new Animated.Value(0)).current;

    // Lightbox state for image zoom
    const [lightboxVisible, setLightboxVisible] = useState(false);

    const isLiked = currentUserId && post.likes?.includes(currentUserId);

    const onDoubleTap = (event: any) => {
        if (event.nativeEvent.state === State.ACTIVE) {
            triggerHaptic.success();

            Animated.sequence([
                Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 10 }),
                Animated.delay(500),
                Animated.timing(likeScale, { toValue: 0, duration: 200, useNativeDriver: true })
            ]).start();

            if (!isLiked) {
                onLike(post.id);
            }
        }
    };

    const handleHeartPress = () => {
        triggerHaptic.selection();
        onLike(post.id);
    };

    const handleAuthorPress = () => {
        if (onAuthorPress && (post.author_id || post.alter_id)) {
            triggerHaptic.selection();
            onAuthorPress(post.author_id || post.alter_id || '', post.system_id);
        }
    };

    // Determine media type from URL extension
    const getMediaType = (url: string) => {
        if (!url) return 'none';
        const ext = url.split('.').pop()?.toLowerCase();
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) return 'video';
        if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) return 'audio';
        return 'image';
    };

    const mediaType = getMediaType(post.media_url || '');

    return (
        <View style={styles.card}>
            {/* Header - Clickable for profile navigation */}
            {showAuthor && (
                <View style={styles.header}>
                    <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress} activeOpacity={0.7}>
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
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Content Text */}
            {post.content && (
                <Text style={styles.content}>{post.content}</Text>
            )}

            {/* Media Section with Double Tap to Like */}
            {post.media_url && (
                <TapGestureHandler
                    ref={doubleTapRef}
                    numberOfTaps={2}
                    onHandlerStateChange={onDoubleTap}
                >
                    <View style={styles.mediaContainer}>
                        {/* Image - Tap to open lightbox */}
                        {mediaType === 'image' && (
                            <TouchableOpacity
                                activeOpacity={0.95}
                                onPress={() => setLightboxVisible(true)}
                                style={styles.mediaWrapper}
                            >
                                <Image
                                    source={{ uri: post.media_url }}
                                    style={styles.media}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        )}

                        {/* Video Player */}
                        {mediaType === 'video' && (
                            <VideoPlayer uri={post.media_url} autoPlay={false} />
                        )}

                        {/* Audio Player */}
                        {mediaType === 'audio' && (
                            <View style={styles.audioWrapper}>
                                <AudioPlayer uri={post.media_url} />
                            </View>
                        )}

                        {/* Animated Heart Overlay (shown on double tap) */}
                        <Animated.View style={[styles.heartOverlay, { transform: [{ scale: likeScale }] }]}>
                            <Ionicons name="heart" size={80} color="white" style={styles.heartShadow} />
                        </Animated.View>
                    </View>
                </TapGestureHandler>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    {/* Like Button */}
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

                    {/* Comment Button */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => onComment && onComment(post.id)}>
                        <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
                        {(post.comments_count || 0) > 0 && (
                            <Text style={styles.actionText}>{post.comments_count}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => onShare && onShare(post.id)}>
                        <Ionicons name="share-social-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Image Lightbox Modal */}
            <ImageLightbox
                visible={lightboxVisible}
                imageUrl={post.media_url || ''}
                onClose={() => setLightboxVisible(false)}
            />
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
        aspectRatio: 1,
        position: 'relative',
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaWrapper: {
        width: '100%',
        height: '100%',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    audioWrapper: {
        width: '100%',
        padding: spacing.md,
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
