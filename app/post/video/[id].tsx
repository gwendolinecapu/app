import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Dimensions, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { PostService } from '../../../src/services/posts';
import { Post } from '../../../src/types';
import { colors, spacing, typography } from '../../../src/lib/theme';
import { useAuth } from '../../../src/contexts/AuthContext';
import { FrontIndicator } from '../../../src/components/ui/ActiveFrontBadge';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function FullPageVideoScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        loadPost();
    }, [id]);

    const loadPost = async () => {
        if (!id) return;
        try {
            const data = await PostService.getPostById(id as string);
            setPost(data);
        } catch (error) {
            console.error('Error loading video post:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!post || !user) return;
        // Optimistic update
        const isLiked = post.likes?.includes(user.id);
        const newLikes = isLiked
            ? post.likes?.filter(uid => uid !== user.id)
            : [...(post.likes || []), user.id];

        setPost({ ...post, likes: newLikes });

        try {
            await PostService.toggleLike(post.id, user.uid);
        } catch (error) {
            console.error(error);
            // Revert on error would go here
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'white' }}>Chargement...</Text>
            </View>
        );
    }

    if (!post || !post.media_url) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'white' }}>Vidéo introuvable</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={32} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    const isLiked = user && post.likes?.includes(user.id);

    return (
        <View style={styles.container}>
            <Video
                source={{ uri: post.media_url }}
                style={styles.video}
                resizeMode={ResizeMode.COVER} // Full screen vertical feel
                shouldPlay={isPlaying}
                isMuted={isMuted}
                isLooping
            />

            {/* Overlay Gradient for readability */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
            />

            {/* Top Bar */}
            <SafeAreaView style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={32} color="white" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Right Side Actions */}
            <View style={styles.rightActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={35} color={isLiked ? colors.error : "white"} />
                    <Text style={styles.actionText}>{post.likes?.length || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/post/${post.id}`)}>
                    <Ionicons name="chatbubble-outline" size={32} color="white" />
                    <Text style={styles.actionText}>{post.comments_count || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => setIsMuted(!isMuted)}>
                    <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={32} color="white" />
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
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        zIndex: 10,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 10,
    },
    closeButton: {
        marginTop: 20,
    },
    rightActions: {
        position: 'absolute',
        right: 16,
        bottom: 100,
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
        bottom: 0,
        left: 0,
        right: 80, // Leave space for right actions
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
