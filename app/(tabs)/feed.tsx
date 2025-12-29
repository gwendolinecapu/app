import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { PostService } from '../../src/services/posts';
import { Post, Alter } from '../../src/types';
import { SYSTEM_TIPS, SystemTip } from '../../src/data/tips';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

type FeedItem = Post | SystemTip;

export default function FeedScreen() {
    const { activeFront, system, alters } = useAuth();
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [system]);

    const fetchPosts = async () => {
        if (!system) return;

        try {
            const result = await PostService.fetchPosts(system.id);
            const posts = result.posts.map(post => {
                // Enrichir avec les données des alters
                if (post.author_type === 'single' && post.alter_id) {
                    post.alter = alters.find(a => a.id === post.alter_id);
                } else if (post.author_type === 'co-front' && post.co_front_alter_ids) {
                    post.co_front_alters = post.co_front_alter_ids
                        .map(id => alters.find(a => a.id === id))
                        .filter((a): a is Alter => !!a);
                }
                return post;
            });

            // Mix posts and tips
            const mixedFeed: FeedItem[] = [];
            let tipIndex = 0;
            posts.forEach((post, index) => {
                mixedFeed.push(post);
                // Insert a tip every 4 posts
                if ((index + 1) % 4 === 0) {
                    // Cycle through tips
                    const tip = SYSTEM_TIPS[tipIndex % SYSTEM_TIPS.length];
                    mixedFeed.push(tip);
                    tipIndex++;
                }
            });

            // If few posts, add one tip at the end as encouragement
            if (posts.length > 0 && posts.length < 4) {
                mixedFeed.push(SYSTEM_TIPS[0]);
            }

            // If no posts, fetchPosts logic in original just set posts.
            // renderEmptyState handles empty.
            // I'll set mixedFeed.
            setFeedItems(mixedFeed);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPosts();
        setRefreshing(false);
    };

    const renderTip = (item: SystemTip) => (
        <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
                <View style={styles.tipAvatar}>
                    <Ionicons name="sparkles" size={20} color="#FFF" />
                </View>
                <View>
                    <Text style={styles.tipAuthor}>Système & Co.</Text>
                    <Text style={styles.tipLabel}>Conseil bien-être</Text>
                </View>
            </View>
            <Text style={styles.tipContent}>{item.content}</Text>
            <TouchableOpacity
                style={styles.tipAction}
                onPress={() => Alert.alert('💡 Conseil', item.content)}
            >
                <Text style={styles.tipActionText}>En savoir plus</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const renderPost = (item: Post) => (
        <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
                <View style={styles.postHeaderLeft}>
                    {item.author_type === 'blurry' ? (
                        <View style={[styles.avatar, { backgroundColor: colors.textMuted }]}>
                            <Ionicons name="eye-off-outline" size={20} color="#FFF" />
                        </View>
                    ) : item.author_type === 'co-front' && item.co_front_alters ? (
                        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                            <Text style={styles.avatarText}>{item.co_front_alters.length}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => item.alter_id && router.push(`/alter/${item.alter_id}`)}>
                            <View style={[styles.avatar, { backgroundColor: item.alter?.color || colors.primary }]}>
                                {item.alter?.avatar_url ? (
                                    <Image source={{ uri: item.alter.avatar_url }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {item.alter?.name?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}

                    <View>
                        <Text style={styles.alterName}>
                            {item.author_type === 'blurry'
                                ? 'Mode Flou / Système'
                                : item.author_type === 'co-front'
                                    ? item.co_front_alters?.map(a => a.name).join(' & ') || 'Co-front'
                                    : item.alter?.name || 'Anonyme'}
                        </Text>
                        <Text style={styles.postTime}>
                            {formatTime(item.created_at)}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Options', 'Options du post bientôt disponibles')}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Post Content */}
            {item.content && (
                <Text style={styles.postContent}>{item.content}</Text>
            )}

            {/* Post Image - Instagram Style (Design Canva #3) */}
            {item.media_url && (
                <Image
                    source={{ uri: item.media_url }}
                    style={styles.postImage}
                    resizeMode="cover"
                />
            )}

            {/* Post Actions */}
            <View style={styles.postActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('❤️', 'Fonctionnalité likes bientôt disponible !')}
                >
                    <Text style={styles.actionIcon}>🤍</Text>
                    <Text style={styles.actionText}>J'aime</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('💬', 'Commentaires bientôt disponibles !')}
                >
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>Commenter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('↗️', 'Partage bientôt disponible !')}
                >
                    <Text style={styles.actionIcon}>↗️</Text>
                    <Text style={styles.actionText}>Partager</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFeedItem = ({ item }: { item: FeedItem }) => {
        if ('type' in item && item.type === 'tip') {
            return renderTip(item as SystemTip);
        }
        return renderPost(item as Post);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'À l\'instant';
        if (hours < 24) return `Il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `Il y a ${days}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const getIdentityLabel = () => {
        if (!activeFront) return 'Chargement...';
        if (activeFront.type === 'blurry') return 'Mode Flou / Système';
        if (activeFront.type === 'co-front') {
            return activeFront.alters.map(a => a.name).join(' & ');
        }
        return activeFront.alters[0]?.name || 'Anonyme';
    };

    const getIdentityAvatar = () => {
        if (!activeFront) return '?';
        if (activeFront.type === 'blurry') return '?';
        if (activeFront.type === 'co-front') return activeFront.alters.length;
        return activeFront.alters[0]?.name?.charAt(0).toUpperCase() || '?';
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={[styles.title, { marginBottom: 0 }]}>Newsfeed</Text>
                <TouchableOpacity onPress={() => router.push('/crisis/index' as any)}>
                    <Ionicons name="warning-outline" size={28} color={colors.error || '#FF4444'} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={styles.currentAlterBadge}
                onPress={() => router.push('/(tabs)/dashboard' as any)}
            >
                <View style={[styles.miniAvatar, { backgroundColor: activeFront?.type === 'blurry' ? colors.textMuted : (activeFront?.alters[0]?.color || colors.primary) }]}>
                    <Text style={styles.miniAvatarText}>
                        {getIdentityAvatar()}
                    </Text>
                </View>
                <View>
                    <Text style={styles.uploadText}>Connecté en tant que</Text>
                    <Text style={styles.currentAlterName} numberOfLines={1}>
                        {getIdentityLabel()}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>
                {loading ? 'Chargement...' : 'Aucune publication'}
            </Text>
            {!loading && (
                <Text style={styles.emptySubtitle}>
                    Créez votre première publication !
                </Text>
            )}
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/post/create')}
            >
                <Text style={styles.createButtonText}>Créer un post</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={feedItems}
                renderItem={renderFeedItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListFooterComponent={loading && !refreshing ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> : null}
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/post/create')}
            >
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.md,
    },
    currentAlterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.borderLight,
        maxWidth: '100%',
    },
    miniAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    miniAvatarText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    currentAlterName: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.text,
        maxWidth: 200,
    },
    uploadText: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    listContent: {
        paddingBottom: 100,
    },
    postCard: {
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    postHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    alterName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    postTime: {
        ...typography.caption,
        color: colors.textMuted,
    },
    moreIcon: {
        fontSize: 20,
        color: colors.textMuted,
    },
    postContent: {
        ...typography.body,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        lineHeight: 22,
    },
    postImage: {
        width: '100%',
        height: 300,
        marginBottom: spacing.sm,
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    actionIcon: {
        fontSize: 16,
    },
    actionText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    createButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    createButtonText: {
        color: colors.text,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    tipCard: {
        // Utilise le thème au lieu de couleur claire hardcodée
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary || '#FFC107',
        // Optional shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    tipAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.secondary || '#FFC107',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    tipAuthor: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        color: colors.text,
    },
    tipLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    tipContent: {
        ...typography.body,
        fontSize: 15,
        color: colors.text,
        marginBottom: spacing.md,
        lineHeight: 22,
    },
    tipAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    tipActionText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: 'bold',
        marginRight: 4,
    },
});
