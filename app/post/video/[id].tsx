import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Dimensions, ScrollView, Platform, FlatList, Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { PostService } from '../../../src/services/posts';
import { FriendService } from '../../../src/services/friends';
import { Post } from '../../../src/types';
import { colors, spacing, typography } from '../../../src/lib/theme';
import { useAuth } from '../../../src/contexts/AuthContext';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Helper to check if a post is a video
const isPostVideo = (post: Post) => {
    if (!post.media_url) return false;
    const url = post.media_url.toLowerCase();
    return (
        url.includes('.mp4') ||
        url.includes('.mov') ||
        url.includes('.avi') ||
        url.includes('.webm')
    );
};

interface VideoItemProps {
    post: Post;
    active: boolean;
    user: any;
    onLike: (post: Post) => void;
    onToggleMute: () => void;
    isMuted: boolean;
}

const VideoItem = React.memo(({ post, active, user, onLike, onToggleMute, isMuted }: VideoItemProps) => {
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(active);

    useEffect(() => {
        setIsPlaying(active);
        if (active) {
            videoRef.current?.playAsync();
        } else {
            videoRef.current?.pauseAsync();
        }
    }, [active]);

    const isLiked = user && post.likes?.includes(user.uid);

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                source={{ uri: post.media_url || '' }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={active} // Only play if active item
                isMuted={isMuted}
                isLooping
            />

            {/* Overlay Gradient */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
            />

            {/* Right Side Actions */}
            <View style={styles.rightActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => onLike(post)}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={35} color={isLiked ? colors.error : "white"} />
                    <Text style={styles.actionText}>{post.likes?.length || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/post/${post.id}`)}>
                    <Ionicons name="chatbubble-outline" size={32} color="white" />
                    <Text style={styles.actionText}>{post.comments_count || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={onToggleMute}>
                    <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={32} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => {
                    // Create Deep Link
                    // Scheme: pluralconnect://post/video/[id]
                    const deepLink = `pluralconnect://post/video/${post.id}`;
                    const content = `Regarde cette vidéo sur PluralConnect : ${deepLink}`;

                    // Simple ActionSheet for options
                    Alert.alert(
                        "Partager",
                        undefined,
                        [
                            {
                                text: "Copier le lien",
                                onPress: async () => {
                                    await Clipboard.setStringAsync(deepLink);
                                    Alert.alert("Succès", "Lien copié dans le presse-papier !");
                                }
                            },
                            {
                                text: "Envoyer / Partager",
                                onPress: async () => {
                                    try {
                                        await Share.share({
                                            message: content,
                                            // url: deepLink // iOS often prefers url field for links
                                            url: deepLink
                                        });
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }
                            },
                            {
                                text: "Annuler",
                                style: "cancel"
                            }
                        ]
                    );
                }}>
                    <Ionicons name="share-social-outline" size={32} color="white" />
                    <Text style={styles.actionText}>Partager</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Info */}
            <View style={styles.bottomInfo}>
                <TouchableOpacity
                    style={styles.authorRow}
                    onPress={() => router.push(post.alter_id ? `/alter-space/${post.alter_id}` : `/system-profile/${post.system_id}`)}
                >
                    <Image source={{ uri: post.author_avatar }} style={styles.avatar} />
                    <View>
                        <Text style={styles.authorName}>{post.author_name}</Text>
                        {post.is_author_fronting && (
                            <View style={styles.frontBadge}>
                                <Text style={styles.frontBadgeText}>En front</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <ScrollView style={styles.captionContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                    <Text style={styles.caption} numberOfLines={3}>{post.content}</Text>
                </ScrollView>
            </View>
        </View>
    );
});

export default function FullPageVideoScreen() {
    const params = useLocalSearchParams();
    const id = typeof params.id === 'string' ? params.id : params.id?.[0];
    const context = typeof params.context === 'string' ? params.context : undefined;
    const contextId = typeof params.contextId === 'string' ? params.contextId : undefined;

    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [id, context, contextId]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            let fetchedPosts: Post[] = [];

            if (context === 'alter' && contextId) {
                const res = await PostService.fetchPostsByAlter(contextId, null, 50);
                fetchedPosts = res.posts;
            } else if (context === 'system' && contextId) {
                const res = await PostService.fetchPosts(contextId, null, 50);
                fetchedPosts = res.posts.filter(p => p.system_id === contextId);
            } else {
                // Default: Video Feed (Reels style)
                // Fetch from friends + current user? Or just friends?
                // Usually "Feed" implies followed content.
                if (user) {
                    // Get friends
                    const friendIds = await FriendService.getAllSystemFriendSystemIds(user.uid);

                    // Add self to friends list if we want to see own videos in feed too? 
                    // Usually yes, or at least the clicked one.
                    const allSourceIds = [user.uid, ...friendIds];

                    // Find "Alter IDs" for these systems? 
                    // Use fetchFeed which handles "friendIds" (Alter IDs) and "friendSystemIds"
                    // Our fetchVideoFeed wrapper takes (friendIds, friendSystemIds)
                    // We primarily have System IDs here.
                    const res = await PostService.fetchVideoFeed([], allSourceIds, null, 20);
                    fetchedPosts = res.posts;
                }
            }

            // Filter only videos for this "Reels" view (Double check for non-feed contexts)
            let videoPosts = fetchedPosts.filter(isPostVideo);

            // Safety: if clicked post isn't in fetched list (pagination?) or was filtered out,
            // ensure it's added.
            if (id && !videoPosts.find(p => p.id === id)) {
                const singlePost = await PostService.getPostById(id);
                if (singlePost && isPostVideo(singlePost)) {
                    // Add to beginning if it's the target
                    videoPosts.unshift(singlePost);
                }
            }

            // Deduplicate just in case
            const seen = new Set();
            videoPosts = videoPosts.filter(p => {
                if (seen.has(p.id)) return false;
                seen.add(p.id);
                return true;
            });

            setPosts(videoPosts);

            const index = videoPosts.findIndex(p => p.id === id);
            if (index !== -1) {
                setActiveIndex(index);
            }
        } catch (error) {
            console.error('Error loading video posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    }, []);

    const handleLike = async (post: Post) => {
        if (!user) return;
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

        try {
            await PostService.toggleLike(post.id, user.uid);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading && posts.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'white' }}>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <FlatList
                data={posts}
                pagingEnabled
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                    <View style={{ width, height }}>
                        <VideoItem
                            post={item}
                            active={index === activeIndex}
                            user={user}
                            onLike={handleLike}
                            onToggleMute={() => setIsMuted(!isMuted)}
                            isMuted={isMuted}
                        />
                    </View>
                )}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                showsVerticalScrollIndicator={false}
                initialScrollIndex={activeIndex}
                getItemLayout={(data, index) => (
                    { length: height, offset: height * index, index }
                )}
                onScrollToIndexFailed={() => { }} // Silent fail or retry
            />

            {/* Top Bar - Fixed */}
            <SafeAreaView style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={32} color="white" />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    container: {
        width: width,
        height: height,
        backgroundColor: 'black',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: width,
        height: height,
        position: 'absolute',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        // zIndex handled by order? no, flatlist is below.
    },
    backButton: {
        padding: 10,
    },
    rightActions: {
        position: 'absolute',
        right: 16,
        bottom: 150, // Higher to avoid overlap
        alignItems: 'center',
        gap: 20,
    },
    actionButton: {
        alignItems: 'center',
        gap: 5,
    },
    actionText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 50, // Above bottom nav line
        left: 0,
        right: 80,
        padding: 20,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'white',
    },
    authorName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    frontBadge: {
        backgroundColor: colors.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    frontBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    captionContainer: {
        maxHeight: 100,
    },
    caption: {
        color: 'white',
        fontSize: 14,
        lineHeight: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
});
