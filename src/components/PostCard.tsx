import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import Animated2, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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
import { SharePostModal } from './SharePostModal';
import { ReportingService, ReportReason } from '../services/reporting';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

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
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

export const PostCard = React.memo(({ post, onLike, onComment, onShare, onAuthorPress, currentUserId, showAuthor = true }: PostCardProps) => {
    const doubleTapRef = useRef(null);
    const likeScale = useRef(new Animated.Value(0)).current;
    const heartScale = useRef(new Animated.Value(1)).current;

    const [lightboxVisible, setLightboxVisible] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState('');
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);

    const isLiked = currentUserId && post.likes?.includes(currentUserId);
    const hasMultipleImages = post.media_urls && post.media_urls.length > 1;
    const allImages = hasMultipleImages ? post.media_urls : post.media_url ? [post.media_url] : [];

    // Theme color from alter
    const themeColor = post.alter?.color;

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

        // Pop animation
        heartScale.setValue(0.8);
        Animated.spring(heartScale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const handleAuthorPress = () => {
        if (onAuthorPress && (post.author_id || post.alter_id)) {
            triggerHaptic.selection();
            onAuthorPress(post.author_id || post.alter_id || '', post.system_id);
        }
    };

    const handleShare = async () => {
        triggerHaptic.selection();
        if (onShare) onShare(post.id);
        else setShareModalVisible(true);
    };

    const handleImagePress = (index: number, imageUrl: string) => {
        setLightboxImageUrl(imageUrl);
        setLightboxVisible(true);
    };

    const getMediaType = (url: string) => {
        if (!url) return 'none';
        const ext = url.split('.').pop()?.toLowerCase();
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) return 'video';
        if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) return 'audio';
        return 'image';
    };

    const handleOptions = () => {
        const options = ['Signaler', 'Annuler'];
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 1, destructiveButtonIndex: 0 },
                (buttonIndex) => { if (buttonIndex === 0) setReportModalVisible(true); }
            );
        } else {
            Alert.alert('Options', '', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Signaler', style: 'destructive', onPress: () => setReportModalVisible(true) },
            ]);
        }
    };

    const handleReportSubmit = async (reason: ReportReason, details: string) => {
        if (!currentUserId) {
            Alert.alert('Erreur', 'Vous devez être connecté pour signaler un contenu.');
            return;
        }
        try {
            await ReportingService.submitReport(currentUserId, post.id, 'post', reason, details);
            Alert.alert('Merci', 'Votre signalement a été reçu.');
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Impossible d'envoyer le signalement.");
        }
    };

    const mediaType = getMediaType(post.media_url || '');

    return (
        <TouchableOpacity
            style={[styles.card, themeColor ? { borderLeftColor: themeColor, borderLeftWidth: 3 } : null]}
            activeOpacity={0.9}
            onPress={() => router.push(`/post/${post.id}` as any)}
        >
            {showAuthor && (
                <View style={styles.header}>
                    <AnimatedPressable style={styles.authorInfo} onPress={handleAuthorPress}>
                        <FrontIndicator isFronting={post.is_author_fronting || false}>
                            {post.author_avatar ? (
                                <Image
                                    source={{ uri: post.author_avatar }}
                                    style={[styles.avatar, themeColor ? { borderColor: themeColor, borderWidth: 2 } : null]}
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColor || colors.primary }]}>
                                    <Text style={styles.avatarInitial}>{post.author_name?.charAt(0)}</Text>
                                </View>
                            )}
                        </FrontIndicator>
                        <View>
                            <View style={styles.authorNameRow}>
                                <Text style={[styles.authorName, themeColor ? { color: themeColor } : null]}>
                                    {post.author_name || 'Système'}
                                </Text>
                                {post.is_author_fronting && (
                                    <View style={[styles.frontBadge, themeColor ? { backgroundColor: themeColor } : null]}>
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

            {post.content && <Text style={styles.content}>{post.content}</Text>}

            {(post.media_url || hasMultipleImages) && (
                <TapGestureHandler ref={doubleTapRef} numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
                    <View style={styles.mediaContainer}>
                        {hasMultipleImages ? (
                            <ImageCarousel images={post.media_urls!} onImagePress={handleImagePress} />
                        ) : (
                            <>
                                {mediaType === 'image' && (
                                    <TouchableOpacity activeOpacity={0.95} onPress={() => { setLightboxImageUrl(post.media_url || ''); setLightboxVisible(true); }} style={styles.mediaWrapper}>
                                        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
                                    </TouchableOpacity>
                                )}
                                {mediaType === 'video' && <VideoPlayer uri={post.media_url!} autoPlay={false} />}
                                {mediaType === 'audio' && <View style={styles.audioWrapper}><AudioPlayer uri={post.media_url!} /></View>}
                            </>
                        )}
                        <Animated.View style={[styles.heartOverlay, { transform: [{ scale: likeScale }] }]}>
                            <Ionicons name="heart" size={80} color="white" style={styles.heartShadow} />
                        </Animated.View>
                    </View>
                </TapGestureHandler>
            )}

            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    <AnimatedPressable style={styles.actionButton} onPress={handleHeartPress}>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={26}
                                color={isLiked ? colors.error : colors.textSecondary}
                            />
                        </Animated.View>
                        {(post.likes?.length || 0) > 0 && (
                            <Text style={styles.actionText}>{post.likes?.length}</Text>
                        )}
                    </AnimatedPressable>
                    <AnimatedPressable style={styles.actionButton} onPress={() => onComment && onComment(post.id)}>
                        <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
                        {(post.comments_count || 0) > 0 && (
                            <Text style={styles.actionText}>{post.comments_count}</Text>
                        )}
                    </AnimatedPressable>
                    <AnimatedPressable style={styles.actionButton} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={24} color={colors.textSecondary} />
                    </AnimatedPressable>
                </View>
            </View>

            <ImageLightbox visible={lightboxVisible} imageUrl={lightboxImageUrl || post.media_url || ''} onClose={() => setLightboxVisible(false)} />
            <ReportModal isVisible={reportModalVisible} onClose={() => setReportModalVisible(false)} onSubmit={handleReportSubmit} />
            <SharePostModal
                visible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                post={post}
            />
        </TouchableOpacity >
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
        fontSize: 16,
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