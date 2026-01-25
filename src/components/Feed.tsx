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
import { View, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FriendService } from '../services/friends';
import { PostService } from '../services/posts';
import { Post } from '../types';
import { PostCard } from './PostCard';
import { NativeAdCard } from './ads/NativeAdCard';
import { CommentsModal } from './CommentsModal';
import { Skeleton, SkeletonFeed } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { triggerHaptic } from '../lib/haptics';
import { ThemeColors } from '../lib/cosmetics';
import { SystemFriendSelector } from './feed/SystemFriendSelector';

// Types de tri disponibles
type SortOption = 'recent' | 'oldest' | 'popular';

interface FeedProps {
    type?: 'global' | 'friends' | 'system';
    systemId?: string;
    alterId?: string;
    ListHeaderComponent?: React.ReactElement;
    themeColors?: ThemeColors | null;
}

// Constante pour l'intervalle d'injection des publicités
const AD_INTERVAL = 5; // Une pub tous les 5 posts

export const Feed = ({ type = 'global', systemId, alterId, ListHeaderComponent, themeColors }: FeedProps): React.JSX.Element => {
    const { user, currentAlter } = useAuth();
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

    // System Selector State
    const [showSystemSelector, setShowSystemSelector] = useState(false);

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
                // STRICT ISOLATION: Only fetch posts from explicitly followed alter IDs
                // No automatic system-wide friend aggregation
                const friendIds = await FriendService.getFriends(alterId);

                // Only show posts from these specific friend IDs, no system-level connections
                response = await PostService.fetchFeed(friendIds, [], refresh ? null : lastVisible);

            } else if (type === 'global') {
                response = await PostService.fetchGlobalFeed(refresh ? null : lastVisible);
            } else {
                // Fallback to global
                response = await PostService.fetchGlobalFeed(refresh ? null : lastVisible);
            }

            if (refresh) {
                setRawPosts(response.posts);
            } else {
                setRawPosts(prev => {
                    const newPosts = response.posts.filter(
                        newPost => !prev.some(existingPost => existingPost.id === newPost.id)
                    );
                    return [...prev, ...newPosts];
                });
            }

            setLastVisible(response.lastVisible);
            setHasMore(response.posts.length > 0);

        } catch (error: any) {
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
                    const actorId = currentAlter?.id || user.uid;
                    const isLiked = likes.includes(actorId);

                    return {
                        ...post,
                        likes: isLiked
                            ? likes.filter(id => id !== actorId)
                            : [...likes, actorId]
                    };
                }
                return post;
            }));

            await PostService.toggleLike(postId, user.uid, currentAlter?.id);
        } catch (error) {
            console.error('Like failed', error);
        }
    };

    const handleComment = (postId: string) => {
        setSelectedPostId(postId);
        setCommentsModalVisible(true);
    };

    const handleAuthorPress = (authorId: string, type: 'alter' | 'system') => {
        if (type === 'alter') {
            router.push({
                pathname: '/alter-space/[alterId]',
                params: { alterId: authorId, viewMode: 'visitor' }
            });
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

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        // Render publicité
        if (item.type === 'ad') {
            return <NativeAdCard themeColors={themeColors} />;
        }

        // Render Post
        return (
            <PostCard
                post={item}
                onLike={handleLike}
                onComment={handleComment}
                onAuthorPress={handleAuthorPress}
                currentUserId={currentAlter?.id || user?.uid}
                themeColors={themeColors}
            />
        );
    }, [themeColors, currentAlter?.id, user?.uid, handleLike, handleComment]);

    const renderHeader = () => (
        <View>
            {ListHeaderComponent}
            <View style={[styles.headerContainer, themeColors && { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                {/* Bouton de tri */}
                <TouchableOpacity
                    style={[styles.sortButton, themeColors && { backgroundColor: themeColors.backgroundCard }]}
                    onPress={() => {
                        triggerHaptic.selection();
                        setShowSortMenu(!showSortMenu);
                    }}
                >
                    <Ionicons name="filter" size={18} color={themeColors?.text || colors.text} />
                    <Text style={[styles.sortButtonText, themeColors && { color: themeColors.text }]}>{getSortLabel(sortBy)}</Text>
                    <Ionicons
                        name={showSortMenu ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={themeColors?.textSecondary || colors.textSecondary}
                    />
                </TouchableOpacity>

                {/* Menu de tri */}
                {showSortMenu && (
                    <View style={[styles.sortMenu, themeColors && { backgroundColor: themeColors.backgroundCard }]}>
                        {(['recent', 'oldest', 'popular'] as SortOption[]).map(option => (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.sortMenuItem,
                                    themeColors && { borderBottomColor: themeColors.border },
                                    sortBy === option && styles.sortMenuItemActive
                                ]}
                                onPress={() => handleSortChange(option)}
                            >
                                <Text style={[
                                    styles.sortMenuItemText,
                                    themeColors && { color: themeColors.text },
                                    sortBy === option && styles.sortMenuItemTextActive
                                ]}>
                                    {getSortLabel(option)}
                                </Text>
                                {sortBy === option && (
                                    <Ionicons name="checkmark" size={18} color={themeColors?.primary || colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Bouton Voir Système */}
                {type === 'friends' && alterId && (
                    <TouchableOpacity
                        style={[styles.systemButton, themeColors && { backgroundColor: themeColors.primary + '15' }]}
                        onPress={() => setShowSystemSelector(true)}
                    >
                        <Ionicons name="people" size={16} color={themeColors?.primary || colors.primary} />
                        <Text style={[styles.systemButtonText, themeColors && { color: themeColors.primary }]}>Voir système</Text>
                    </TouchableOpacity>
                )}
            </View>
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
                        <SkeletonFeed />
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
                keyExtractor={(item: any, index: number) => item.id || `item-${index}`}
                ListHeaderComponent={renderHeader}
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
                    <EmptyState
                        icon="newspaper-outline"
                        title="Rien à voir ici !"
                        message={
                            type === 'friends'
                                ? "Suivez d'autres systèmes pour voir leurs posts ici.\n(Tirez vers le bas pour rafraîchir)"
                                : type === 'system'
                                    ? "Ce système n'a pas encore posté."
                                    : "Aucun post public pour le moment."
                        }
                        themeColors={themeColors}
                    />
                }
                contentContainerStyle={styles.listContent}
                onScrollBeginDrag={() => setShowSortMenu(false)}
                // === PERFORMANCE OPTIMIZATIONS ===
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={8}
            />

            {/* Comments Modal */}
            <CommentsModal
                visible={commentsModalVisible}
                postId={selectedPostId}
                onClose={() => {
                    setCommentsModalVisible(false);
                    setSelectedPostId(null);
                }}
                themeColors={themeColors}
            />
            {/* System Friend Selector Logic Modal */}
            <SystemFriendSelector
                visible={showSystemSelector}
                onClose={() => setShowSystemSelector(false)}
                currentAlterId={alterId || ''}
                themeColors={themeColors}
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
    systemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary + '10',
    },
    systemButtonText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '600',
    },
});
