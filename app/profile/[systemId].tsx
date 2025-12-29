/**
 * Profil Externe - Vue du profil d'un autre système
 * Affiche les posts publics et permet de suivre/unfollow
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    FlatList,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { FollowService } from '../../src/services/follows';
import { PublicProfile, Post } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

const GRID_ITEM_SIZE = (Dimensions.get('window').width - spacing.md * 2 - 4) / 3;

export default function ExternalProfileScreen() {
    const { systemId } = useLocalSearchParams<{ systemId: string }>();
    const { user } = useAuth();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    // Charger le profil et les posts
    useFocusEffect(
        useCallback(() => {
            if (systemId && user) {
                loadData();
            }
        }, [systemId, user])
    );

    const loadData = async () => {
        if (!systemId || !user) return;

        setLoading(true);
        try {
            // Charger le profil public
            const profileData = await FollowService.getPublicProfile(systemId);
            setProfile(profileData);

            // Vérifier si on suit ce profil
            const following = await FollowService.isFollowing(user.uid, systemId);
            setIsFollowing(following);

            // Charger les posts publics
            const publicPosts = await FollowService.getPublicPosts(systemId);
            setPosts(publicPosts as Post[]);
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Erreur', 'Impossible de charger ce profil');
        } finally {
            setLoading(false);
        }
    };

    // Suivre/Ne plus suivre
    const handleToggleFollow = async () => {
        if (!user || !systemId) return;

        try {
            if (isFollowing) {
                await FollowService.unfollowUser(user.uid, systemId);
                setIsFollowing(false);
                setProfile(prev => prev ? {
                    ...prev,
                    follower_count: prev.follower_count - 1
                } : null);
            } else {
                await FollowService.followUser(user.uid, systemId);
                setIsFollowing(true);
                setProfile(prev => prev ? {
                    ...prev,
                    follower_count: prev.follower_count + 1
                } : null);
            }
        } catch (error) {
            console.error('Follow error:', error);
            Alert.alert('Erreur', 'Action impossible. Avez-vous créé votre profil public ?');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="person-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Profil non trouvé</Text>
                    <Text style={styles.emptySubtitle}>
                        Ce système n'a pas de profil public
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.username}>@{profile.display_name.toLowerCase().replace(/\s/g, '_')}</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>
                                    {profile.display_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{posts.length}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profile.follower_count}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profile.following_count}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>
                </View>

                {/* Bio */}
                <View style={styles.bioSection}>
                    <Text style={styles.displayName}>{profile.display_name}</Text>
                    {profile.bio && (
                        <Text style={styles.bio}>{profile.bio}</Text>
                    )}
                </View>

                {/* Follow Button */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            isFollowing && styles.followingButton,
                        ]}
                        onPress={handleToggleFollow}
                    >
                        <Text style={[
                            styles.followButtonText,
                            isFollowing && styles.followingButtonText,
                        ]}>
                            {isFollowing ? 'Ne plus suivre' : 'Suivre'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Posts Grid */}
                <View style={styles.postsGrid}>
                    {posts.length === 0 ? (
                        <View style={styles.noPostsContainer}>
                            <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.noPosts}>Aucune publication publique</Text>
                        </View>
                    ) : (
                        posts.map((post) => (
                            <View key={post.id} style={styles.gridItem}>
                                {post.media_url ? (
                                    <Image source={{ uri: post.media_url }} style={styles.gridImage} />
                                ) : (
                                    <View style={styles.gridItemContent}>
                                        <Text style={styles.gridItemText} numberOfLines={3}>
                                            {post.content}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    username: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.lg,
    },
    avatarContainer: {},
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    avatarPlaceholder: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    statsRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...typography.h3,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    bioSection: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    displayName: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    bio: {
        ...typography.body,
        color: colors.text,
        marginTop: spacing.xs,
        lineHeight: 20,
    },
    actionButtons: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    followButton: {
        backgroundColor: colors.primary,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    followingButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
    followButtonText: {
        ...typography.body,
        color: 'white',
        fontWeight: '600',
    },
    followingButtonText: {
        color: colors.text,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 2,
    },
    gridItem: {
        width: GRID_ITEM_SIZE,
        height: GRID_ITEM_SIZE,
        borderWidth: 1,
        borderColor: colors.background,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridItemContent: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.sm,
    },
    gridItemText: {
        ...typography.caption,
        color: colors.text,
        textAlign: 'center',
    },
    noPostsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
        minHeight: 200,
        width: '100%',
    },
    noPosts: {
        ...typography.bodySmall,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
});
