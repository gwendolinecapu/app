import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Post } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

export default function ProfileScreen() {
    const { currentAlter, system, alters, user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
    const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (currentAlter && user) {
            fetchPosts();
        }
    }, [currentAlter, user]);

    const fetchPosts = async () => {
        if (!currentAlter || !user) return;

        try {
            const q = query(
                collection(db, 'posts'),
                where('system_id', '==', user.uid),
                where('alter_id', '==', currentAlter.id),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const data: Post[] = [];

            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Post);
            });

            setPosts(data);
            setStats(prev => ({ ...prev, posts: data.length }));
        } catch (error) {
            console.error('Error fetching profile posts:', error);
        }
    };

    if (!currentAlter) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.emptyState}>
                    <Ionicons name="person-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Aucun alter sélectionné</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/(tabs)/dashboard')}
                    >
                        <Text style={styles.buttonText}>Voir les alters</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header - Instagram Style */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.username}>@{currentAlter.name.toLowerCase().replace(/\s/g, '_')}</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity onPress={() => router.push('/settings/index' as any)}>
                            <Ionicons name="settings-outline" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push(`/alter/${currentAlter.id}`)}>
                            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Section - Design Canva #4 */}
                <View style={styles.profileSection}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: currentAlter.color }]}>
                        {currentAlter.avatar_url ? (
                            <Image
                                source={{ uri: currentAlter.avatar_url }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {currentAlter.name.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>

                    {/* Stats Row - Instagram style: Posts, Followers, Following */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.posts}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.followers}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.following}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>
                </View>

                {/* Bio Section */}
                <View style={styles.bioSection}>
                    <Text style={styles.name}>{currentAlter.name}</Text>
                    {currentAlter.pronouns && (
                        <Text style={styles.pronouns}>{currentAlter.pronouns}</Text>
                    )}
                    {currentAlter.bio && (
                        <Text style={styles.bio}>{currentAlter.bio}</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push(`/alter/${currentAlter.id}`)}
                    >
                        <Ionicons name="pencil" size={16} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={styles.editButtonText}>Modifier le profil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statsButton}
                        onPress={() => router.push('/stats')}
                    >
                        <Ionicons name="bar-chart-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Tabs: Grid / List */}
                <View style={styles.tabsRow}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'grid' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('grid')}
                    >
                        <Ionicons
                            name="grid-outline"
                            size={22}
                            color={activeTab === 'grid' ? colors.text : colors.textMuted}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'list' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('list')}
                    >
                        <Ionicons
                            name="list-outline"
                            size={22}
                            color={activeTab === 'list' ? colors.text : colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                {/* Posts Grid - Instagram Style */}
                <View style={styles.postsGrid}>
                    {posts.length === 0 ? (
                        <View style={styles.noPostsContainer}>
                            <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.noPosts}>Aucune publication</Text>
                            <TouchableOpacity
                                style={styles.createPostButton}
                                onPress={() => router.push('/post/create')}
                            >
                                <Text style={styles.createPostText}>Créer une publication</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        posts.map((post) => (
                            <TouchableOpacity key={post.id} style={styles.gridItem}>
                                {post.media_url ? (
                                    <Image
                                        source={{ uri: post.media_url }}
                                        style={styles.gridImage}
                                    />
                                ) : (
                                    <View style={styles.gridItemContent}>
                                        <Text style={styles.gridItemText} numberOfLines={3}>
                                            {post.content}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
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
    scrollView: {
        flex: 1,
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
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
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
        color: colors.text,
        fontWeight: 'bold',
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
    name: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    pronouns: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: 2,
    },
    bio: {
        ...typography.body,
        color: colors.text,
        marginTop: spacing.xs,
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.backgroundCard,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButtonText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.text,
    },
    statsButton: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: colors.text,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: GRID_SIZE,
        height: GRID_SIZE,
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
        width: '100%',
        padding: spacing.xxl,
        alignItems: 'center',
    },
    noPosts: {
        ...typography.bodySmall,
        color: colors.textMuted,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    createPostButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    createPostText: {
        color: 'white',
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
});
