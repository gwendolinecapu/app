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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Post } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

export default function FeedScreen() {
    const { currentAlter, system, alters } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [system]);

    const fetchPosts = async () => {
        if (!system) return;

        try {
            const q = query(
                collection(db, 'posts'),
                where('system_id', '==', system.id),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const data: Post[] = [];

            querySnapshot.forEach((doc) => {
                const postData = doc.data();
                // Jointure manuelle avec les alters du contexte
                const postAlter = alters.find(a => a.id === postData.alter_id);

                data.push({
                    id: doc.id,
                    ...postData,
                    alter: postAlter
                } as Post);
            });

            setPosts(data);
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

    const renderPost = ({ item }: { item: Post }) => (
        <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
                <TouchableOpacity
                    style={styles.postHeaderLeft}
                    onPress={() => router.push(`/alter/${item.alter_id}`)}
                >
                    <View
                        style={[
                            styles.avatar,
                            { backgroundColor: item.alter?.color || colors.primary },
                        ]}
                    >
                        <Text style={styles.avatarText}>
                            {item.alter?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.alterName}>{item.alter?.name || 'Anonyme'}</Text>
                        <Text style={styles.postTime}>
                            {formatTime(item.created_at)}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.moreIcon}>⋯</Text>
                </TouchableOpacity>
            </View>

            {/* Post Content */}
            <Text style={styles.postContent}>{item.content}</Text>

            {/* Post Actions */}
            <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>🤍</Text>
                    <Text style={styles.actionText}>J'aime</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>Commenter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionIcon}>↗️</Text>
                    <Text style={styles.actionText}>Partager</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Newsfeed</Text>
            {currentAlter && (
                <TouchableOpacity
                    style={styles.currentAlterBadge}
                    onPress={() => router.push('/(tabs)/profile')}
                >
                    <View style={[styles.miniAvatar, { backgroundColor: currentAlter.color }]}>
                        <Text style={styles.miniAvatarText}>
                            {currentAlter.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.currentAlterName}>@{currentAlter.name.toLowerCase()}</Text>
                </TouchableOpacity>
            )}
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
                data={posts}
                renderItem={renderPost}
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
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    miniAvatarText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    currentAlterName: {
        ...typography.bodySmall,
        fontWeight: '600',
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
});
