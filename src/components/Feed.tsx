import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { PostService } from '../services/posts';
import { Post } from '../types';
import { PostCard } from './PostCard';
import { NativeAdCard } from './ads/NativeAdCard';
import { Skeleton } from './ui/Skeleton';
import { colors, spacing, typography } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { SYSTEM_TIPS } from '../data/tips';

interface FeedProps {
    type?: 'global' | 'friends' | 'system'; // Future proofing
    systemId?: string; // If 'system' type
}

export const Feed = ({ type = 'global', systemId }: FeedProps) => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<(Post | { type: 'ad' } | { type: 'tip', data: any })[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadPosts = useCallback(async (refresh = false) => {
        if (loadingMore && !refresh) return;

        try {
            if (refresh) {
                setRefreshing(true);
                setHasMore(true);
            } else {
                setLoadingMore(true);
            }

            const result = await PostService.fetchGlobalFeed(
                refresh ? null : lastVisible,
                10
            );

            const newPosts = result.posts;
            const updatedLastVisible = result.lastVisible;

            if (newPosts.length < 10) {
                setHasMore(false);
            }

            setLastVisible(updatedLastVisible);

            // Inject Ads and Tips
            const postsWithExtras = [...newPosts];

            // Logic to inject ads/tips could be here, but for now we just append posts
            // We can inject "Ad" items later in the rendering list

            if (refresh) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [lastVisible, loadingMore]);

    useEffect(() => {
        loadPosts(true);
    }, []);

    const handleLike = async (postId: string) => {
        if (!user) return;
        try {
            // Optimistic update
            setPosts(prev => prev.map(item => {
                if ('id' in item && item.id === postId) { // Check if it's a post
                    const post = item as Post;
                    const likes = post.likes || [];
                    const isLiked = likes.includes(user.uid);

                    return {
                        ...post,
                        likes: isLiked
                            ? likes.filter(id => id !== user.uid)
                            : [...likes, user.uid]
                    };
                }
                return item;
            }));

            await PostService.toggleLike(postId, user.uid);
        } catch (error) {
            console.error('Like failed', error);
            // Revert on error? For now simple log.
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        // Inject Native Ad every 5 posts
        const showAd = index > 0 && index % 5 === 0;

        if (item.type === 'ad') {
            return <NativeAdCard />;
        }

        // Render Post
        const content = (
            <PostCard
                post={item}
                onLike={handleLike}
                currentUserId={user?.uid}
            />
        );

        if (showAd) {
            return (
                <View>
                    <NativeAdCard />
                    {content}
                </View>
            );
        }

        return content;
    };

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 100 }} />; // Spacer
        return (
            <View style={{ padding: spacing.md, alignItems: 'center', marginBottom: 50 }}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                {[1, 2, 3].map(i => (
                    <View key={i} style={{ marginBottom: spacing.md }}>
                        <Skeleton height={300} borderRadius={12} />
                    </View>
                ))}
            </View>
        );
    }

    return (
        <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item: any) => item.id || `ad-${Math.random()}`} // Fallback for ad key
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} tintColor={colors.primary} />
            }
            onEndReached={() => {
                if (hasMore && !loadingMore) {
                    loadPosts();
                }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucun post pour le moment.</Text>
                </View>
            }
            contentContainerStyle={styles.listContent}
        />
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        padding: spacing.md,
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
    },
});
