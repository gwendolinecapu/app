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
import { ImageCarousel } from './ui/ImageCarousel';
import { FrontIndicator } from './ui/ActiveFrontBadge';
import { ShareService } from '../services/share';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { ReportModal } from './ReportModal';
import { ReportingService, ReportReason } from '../services/reporting';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

// =====================================================
// POST CARD V2
// Composant de post complet avec:
// - Double tap to like
// - Navigation vers profil auteur
// - Support vidéo/audio/image/carousel
// - Lightbox pour les images
// - Badge "En Front" pour auteur actif
// - Partage natif
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
    const [lightboxImageUrl, setLightboxImageUrl] = useState('');

    // Report Modal specific state
    const [reportModalVisible, setReportModalVisible] = useState(false);

    const isLiked = currentUserId && post.likes?.includes(currentUserId);

    // Check if post has multiple images
    const hasMultipleImages = post.media_urls && post.media_urls.length > 1;
    const allImages = hasMultipleImages
        ? post.media_urls
        : post.media_url
            ? [post.media_url]
            : [];

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

    // Handle share with native sharing
    const handleShare = async () => {
        triggerHaptic.selection();
        if (onShare) {
            onShare(post.id);
        } else {
            // Use native share if no custom handler
            await ShareService.sharePost(post.id, post.content, post.author_name || 'Utilisateur');
        }
    };

    // Handle image press from carousel
    const handleImagePress = (index: number, imageUrl: string) => {
        setLightboxImageUrl(imageUrl);
        setLightboxVisible(true);
    };

    // Determine media type from URL extension
    const getMediaType = (url: string) => {
        if (!url) return 'none';
        const ext = url.split('.').pop()?.toLowerCase();
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) return 'video';
        if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) return 'audio';
        return 'image';
    };

    const handleOptions = () => {
        const options = ['Signaler', 'Annuler'];
        const destructiveButtonIndex = 0;
        const cancelButtonIndex = 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex,
                    cancelButtonIndex,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        setReportModalVisible(true);
                    }
                }
            );
        } else {
            // Android fallback
            Alert.alert(
                'Options',
                '',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Signaler', style: 'destructive', onPress: () => setReportModalVisible(true) },
                ]
            );
        }
    };

    const handleReportSubmit = async (reason: ReportReason, details: string) => {
        if (!currentUserId) {
            Alert.alert('Erreur', 'Vous devez être connecté pour signaler un contenu.');
            return;
        }
        try {
            await ReportingService.submitReport(
                currentUserId,
                post.id,
                'post',
                reason,
                details
            );
            Alert.alert('Merci', 'Votre signalement a été reçu et sera examiné.');
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Impossible d'envoyer le signalement.");
        }
    };

    const mediaType = getMediaType(post.media_url || '');

    return (
        <View style={styles.card}>
            {/* Header - Clickable for profile navigation */}
            {showAuthor && (
                <View style={styles.header}>
                    <AnimatedPressable style={styles.authorInfo} onPress={handleAuthorPress}>
                        {/* Avatar with Front Indicator */}
                        <FrontIndicator isFronting={post.is_author_fronting || false}>
                            {post.author_avatar ? (
                                <Image source={{ uri: post.author_avatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.avatarInitial}>{post.author_name?.charAt(0)}</Text>
                                </View>
                            )}
                        </FrontIndicator>
                        <View>
                            <View style={styles.authorNameRow}>
                                <Text style={styles.authorName}>{post.author_name || 'Système'}</Text>
                                {post.is_author_fronting && (
                                    <View style={styles.frontBadge}>
                                        <Text style={styles.frontBadgeText}>En front</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
                        </View>
                    </AnimatedPressable >
                    <TouchableOpacity onPress={handleOptions} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View >
            )}

            {/* Content Text */}
            {
                post.content && (
                    <Text style={styles.content}>{post.content}</Text>
                )
            }

            {/* Media Section with Double Tap to Like */}
            {
                (post.media_url || hasMultipleImages) && (
                    <TapGestureHandler
                        ref={doubleTapRef}
                        numberOfTaps={2}
                        onHandlerStateChange={onDoubleTap}
                    >
                        <View style={styles.mediaContainer}>
                            {/* Multi-Image Carousel */}
                            {hasMultipleImages ? (
                                <ImageCarousel
                                    images={post.media_urls!}
                                    onImagePress={handleImagePress}
                                />
                            ) : (
                                <>
                                    {/* Single Image */}
                                    {mediaType === 'image' && (
                                        <TouchableOpacity
                                            activeOpacity={0.95}
                                            onPress={() => {
                                                setLightboxImageUrl(post.media_url || '');
                                                setLightboxVisible(true);
                                            }}
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
                                        <VideoPlayer uri={post.media_url!} autoPlay={false} />
                                    )}

                                    {/* Audio Player */}
                                    {mediaType === 'audio' && (
                                        <View style={styles.audioWrapper}>
                                            <AudioPlayer uri={post.media_url!} />
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Animated Heart Overlay (shown on double tap) */}
                            <Animated.View style={[styles.heartOverlay, { transform: [{ scale: likeScale }] }]}>
                                <Ionicons name="heart" size={80} color="white" style={styles.heartShadow} />
                            </Animated.View>
                        </View>
                    </TapGestureHandler>
                )
            }

            {/* Action Buttons */}
            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    {/* Like Button */}
                    <AnimatedPressable style={styles.actionButton} onPress={handleHeartPress}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={26}
                            color={isLiked ? colors.error : colors.textSecondary}
                        />
                        {(post.likes?.length || 0) > 0 && (
                            <Text style={styles.actionText}>{post.likes?.length}</Text>
                        )}
                    </AnimatedPressable>

                    {/* Comment Button */}
                    <AnimatedPressable style={styles.actionButton} onPress={() => onComment && onComment(post.id)}>
                        <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
                        {(post.comments_count || 0) > 0 && (
                            <Text style={styles.actionText}>{post.comments_count}</Text>
                        )}
                    </AnimatedPressable>

                    {/* Share Button - Now functional */}
                    <AnimatedPressable style={styles.actionButton} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={24} color={colors.textSecondary} />
                    </AnimatedPressable>
                </View>
            </View>

            {/* Image Lightbox Modal */}
            <ImageLightbox
                visible={lightboxVisible}
                imageUrl={lightboxImageUrl || post.media_url || ''}
                onClose={() => setLightboxVisible(false)}
            />

            {/* Report Modal */}
            <ReportModal
                isVisible={reportModalVisible}
                onClose={() => setReportModalVisible(false)}
                onSubmit={handleReportSubmit}
            />
        </View >
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
        ...typography.h3,
        fontSize: 16, // Override to fit circle
    },
    authorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    authorName: {
        ...typography.body,
        fontWeight: '600',
    },
    frontBadge: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    frontBadgeText: {
        ...typography.tiny,
        color: 'white',
        textTransform: 'uppercase',
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
