/**
 * Feed Component V2
 * 
 * Features:
 * - Tri par Récent / Ancien / Populaire
 * - Publicités intercalées entre les posts (pas à la fin)
 * - Pagination infinie
 * - Pull to refresh
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FriendService } from '../services/friends';
import { PostService } from '../services/posts';
import { Post } from '../types';
import { PostCard } from './PostCard';
import { NativeAdCard } from './ads/NativeAdCard';
import { CommentsModal } from './CommentsModal';
import { Skeleton } from './ui/Skeleton';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { triggerHaptic } from '../lib/haptics';

// Types de tri disponibles
type SortOption = 'recent' | 'oldest' | 'popular';

interface FeedProps {
    type?: 'global' | 'friends' | 'system';
    systemId?: string;
    alterId?: string;
    ListHeaderComponent?: React.ReactElement;
}

// Constante pour l'intervalle d'injection des publicités
const AD_INTERVAL = 5; // Une pub tous les 5 posts

export const Feed = ({ type = 'global', systemId, alterId, ListHeaderComponent }: FeedProps) => {
    const { user } = useAuth();
    const [rawPosts, setRawPosts] = useState<Post[]>([]); // Posts bruts sans ads
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Tri
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Comments Modal State
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    // Trier les posts selon l'option sélectionnée
    const sortedPosts = useMemo(() => {
        const posts = [...rawPosts];

        switch (sortBy) {
            case 'recent':
                return posts.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            case 'oldest':
                return posts.sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
            case 'popular':
                return posts.sort((a, b) =>
                    (b.likes?.length || 0) - (a.likes?.length || 0)
                );
            default:
                return posts;
        }
    }, [rawPosts, sortBy]);

    // Injecter les publicités dans les posts triés
    const postsWithAds = useMemo(() => {
        const result: (Post | { type: 'ad'; id: string })[] = [];

        sortedPosts.forEach((post, index) => {
            result.push(post);

            // Injecter une pub après chaque AD_INTERVAL posts (mais pas à la fin)
            if ((index + 1) % AD_INTERVAL === 0 && index < sortedPosts.length - 1) {
                result.push({ type: 'ad', id: `ad-${index}` });
            }
        });

        return result;
    }, [sortedPosts]);

    const loadPosts = useCallback(async (refresh = false) => {
        if (loadingMore && !refresh) return;

        try {
            if (refresh) {
                setRefreshing(true);
                setHasMore(true);
            } else {
                setLoadingMore(true);
            }

            let response;

            if (type === 'friends' && alterId) {
                // Fetch friends first to get their IDs
                const friends = await FriendService.getFriends(alterId);
                // Fetch feed based on friends IDs
                response = await PostService.fetchFeed(friends, refresh ? null : lastVisible);
            } else if (type === 'global') {
                response = await PostService.fetchGlobalFeed(refresh ? null : lastVisible);
            } else {
                // Fallback to global
                response = await PostService.fetchGlobalFeed(refresh ? null : lastVisible);
            }

            if (refresh) {
                setRawPosts(response.posts);
            } else {
                setRawPosts(prev => [...prev, ...response.posts]);
            }

            setLastVisible(response.lastVisible);
            setHasMore(response.posts.length > 0);

        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [lastVisible, loadingMore, type, alterId]);

    useEffect(() => {
        loadPosts(true);
    }, []);

    const handleLike = async (postId: string) => {
        if (!user) return;
        try {
            // Optimistic update
            setRawPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    const likes = post.likes || [];
                    const isLiked = likes.includes(user.uid);

                    return {
                        ...post,
                        likes: isLiked
                            ? likes.filter(id => id !== user.uid)
                            : [...likes, user.uid]
                    };
                }
                return post;
            }));

            await PostService.toggleLike(postId, user.uid);
        } catch (error) {
            console.error('Like failed', error);
        }
    };

    const handleComment = (postId: string) => {
        setSelectedPostId(postId);
        setCommentsModalVisible(true);
    };

    const handleAuthorPress = (authorId: string, authorSystemId?: string) => {
        if (authorSystemId) {
            router.push(`/alter-space/${authorId}` as any);
        } else {
            router.push(`/profile/${authorId}` as any);
        }
    };

    const handleSortChange = (option: SortOption) => {
        triggerHaptic.selection();
        setSortBy(option);
        setShowSortMenu(false);
    };

    const getSortLabel = (option: SortOption): string => {
        switch (option) {
            case 'recent': return '📅 Plus récent';
            case 'oldest': return '📆 Plus ancien';
            case 'popular': return '🔥 Populaire';
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        // Render publicité
        if (item.type === 'ad') {
            return <NativeAdCard />;
        }

        // Render Post
        return (
            <PostCard
                post={item}
                onLike={handleLike}
                onComment={handleComment}
                onAuthorPress={handleAuthorPress}
                currentUserId={user?.uid}
            />
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Bouton de tri */}
            <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                    triggerHaptic.selection();
                    setShowSortMenu(!showSortMenu);
                }}
            >
                <Ionicons name="filter" size={18} color={colors.text} />
                <Text style={styles.sortButtonText}>{getSortLabel(sortBy)}</Text>
                <Ionicons
                    name={showSortMenu ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>

            {/* Menu de tri */}
            {showSortMenu && (
                <View style={styles.sortMenu}>
                    {(['recent', 'oldest', 'popular'] as SortOption[]).map(option => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.sortMenuItem,
                                sortBy === option && styles.sortMenuItemActive
                            ]}
                            onPress={() => handleSortChange(option)}
                        >
                            <Text style={[
                                styles.sortMenuItemText,
                                sortBy === option && styles.sortMenuItemTextActive
                            ]}>
                                {getSortLabel(option)}
                            </Text>
                            {sortBy === option && (
                                <Ionicons name="checkmark" size={18} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 100 }} />;
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
        <>
            <FlatList
                data={postsWithAds}
                renderItem={renderItem}
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                keyExtractor={(item: any) => item.id || `item-${Math.random()}`}
                ListHeaderComponent={renderHeader}
                stickyHeaderIndices={[0]}
=======
                keyExtractor={(item: any, index: number) => item.id || `item-${index}`}
>>>>>>> Stashed changes
=======
                keyExtractor={(item: any, index: number) => item.id || `item-${index}`}
>>>>>>> Stashed changes
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadPosts(true)}
                        tintColor={colors.primary}
                    />
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
                        <Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Aucun post pour le moment</Text>
                        <Text style={styles.emptySubtext}>Suivez des personnes pour voir leurs posts</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            {/* Comments Modal */}
            <CommentsModal
                visible={commentsModalVisible}
                postId={selectedPostId}
                onClose={() => {
                    setCommentsModalVisible(false);
                    setSelectedPostId(null);
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        padding: spacing.md,
    },
    listContent: {
        paddingBottom: 20,
    },
    // Header avec tri
    headerContainer: {
        backgroundColor: colors.background,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        zIndex: 10,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.backgroundCard,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        alignSelf: 'flex-start',
    },
    sortButtonText: {
        ...typography.bodySmall,
        color: colors.text,
        fontWeight: '600',
    },
    sortMenu: {
        position: 'absolute',
        top: 50,
        left: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 100,
        minWidth: 180,
    },
    sortMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sortMenuItemActive: {
        backgroundColor: colors.primary + '20',
    },
    sortMenuItemText: {
        ...typography.body,
        color: colors.text,
    },
    sortMenuItemTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    // Empty state
    emptyContainer: {
        padding: spacing.xxl,
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtext: {
        ...typography.bodySmall,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
});
