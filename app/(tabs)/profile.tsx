import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Modal,
    FlatList,
    RefreshControl,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Post } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { FollowService } from '../../src/services/follows';
import { PostService } from '../../src/services/posts';
import { PostCard } from '../../src/components/PostCard';
import { CommentsModal } from '../../src/components/CommentsModal';
import { triggerHaptic } from '../../src/lib/haptics';
import { SkeletonProfile } from '../../src/components/ui/Skeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

export default function ProfileScreen() {
    const { currentAlter, system, alters, user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
    const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Feed View State
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
    const [commentsModalVisible, setCommentsModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const flatListRef = React.useRef<FlatList>(null);

    useEffect(() => {
        if (currentAlter && user) {
            loadProfileData();
        } else {
            setLoading(false);
        }
    }, [currentAlter, user]);

    const loadProfileData = async () => {
        setLoading(true);
        await Promise.all([fetchPosts(), fetchFollowStats()]);
        setLoading(false);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchPosts(), fetchFollowStats()]);
        setRefreshing(false);
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

    // Charger les compteurs followers/following depuis le profil public
    // Note: Si le profil n'existe pas encore, on le crée d'abord
    const fetchFollowStats = async () => {
        if (!user) return;

        try {
            // D'abord essayer de récupérer le profil
            let profile = await FollowService.getPublicProfile(user.uid);

            // Si pas de profil, créer un profil par défaut
            if (!profile) {
                await FollowService.createOrUpdatePublicProfile(user.uid, {
                    display_name: system?.username || 'Système',
                    is_public: false, // Privé par défaut
                });
                // Récupérer le profil nouvellement créé
                profile = await FollowService.getPublicProfile(user.uid);
            }

            if (profile) {
                setStats(prev => ({
                    ...prev,
                    followers: profile!.follower_count || 0,
                    following: profile!.following_count || 0,
                }));
            }
        } catch (error: any) {
            // Gérer silencieusement les erreurs de permission en mode développement
            // Ces erreurs peuvent survenir si le profil n'existe pas encore
            if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {

                try {
                    await FollowService.createOrUpdatePublicProfile(user.uid, {
                        display_name: system?.username || 'Système',
                        is_public: false,
                    });
                    // Réessayer
                    const newProfile = await FollowService.getPublicProfile(user.uid);
                    if (newProfile) {
                        setStats(prev => ({
                            ...prev,
                            followers: newProfile.follower_count || 0,
                            following: newProfile.following_count || 0,
                        }));
                    }
                } catch (createError) {

                }
            } else {
                console.error('Error fetching follow stats:', error);
            }
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) return;
        try {
            // Optimistic update
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    const likes = post.likes || [];
                    const isLiked = likes.includes(user.uid);
                    return {
                        ...post,
                        likes: isLiked ? likes.filter(id => id !== user.uid) : [...likes, user.uid]
                    };
                }
                return post;
            }));
            triggerHaptic.selection();
            await PostService.toggleLike(postId, user.uid);
        } catch (error) {
            console.error('Like failed', error);
        }
    };

    const handleComment = (postId: string) => {
        setSelectedPostId(postId);
        setCommentsModalVisible(true);
    };

    const handleCloseModal = () => {
        setSelectedPostIndex(null);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <SkeletonProfile />
            </SafeAreaView>
        );
    }

    if (!currentAlter) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <EmptyState
                    icon="person-outline"
                    title="Aucun alter sélectionné"
                    message="Sélectionnez un alter depuis le tableau de bord pour voir son profil."
                    actionLabel="Voir les alters"
                    onAction={() => router.push('/(tabs)/dashboard')}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header - Instagram Style */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.username}>@{currentAlter.name.toLowerCase().replace(/\s/g, '_')}</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                            <Ionicons name="search-outline" size={24} color={colors.text} />
                        </TouchableOpacity>
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
                    <AnimatedPressable
                        style={styles.editButton}
                        onPress={() => router.push(`/alter/${currentAlter.id}`)}
                    >
                        <Ionicons name="pencil" size={16} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={styles.editButtonText}>Modifier le profil</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                        style={styles.statsButton}
                        onPress={() => router.push('/history')}
                    >
                        <Ionicons name="bar-chart-outline" size={20} color={colors.text} />
                    </AnimatedPressable>
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
                        <EmptyState
                            icon="camera-outline"
                            title="Aucune publication"
                            message="Partagez votre première photo ou pensée !"
                            actionLabel="Créer une publication"
                            onAction={() => router.push('/post/create')}
                            style={{ padding: spacing.xxl, width: '100%' }}
                        />
                    ) : (
                        posts.map((post, index) => (
                            <AnimatedPressable
                                key={post.id}
                                style={styles.gridItem}
                                scaleMin={0.98}
                                onPress={() => {
                                    triggerHaptic.selection();
                                    setSelectedPostIndex(index);
                                }}
                            >
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
                            </AnimatedPressable>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Post Detail Modal */}
            <Modal
                visible={selectedPostIndex !== null}
                animationType="slide"
                onRequestClose={handleCloseModal}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleCloseModal}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Publications</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {selectedPostIndex !== null && (
                        <FlatList
                            ref={flatListRef}
                            data={posts}
                            renderItem={({ item }) => (
                                <PostCard
                                    post={item}
                                    onLike={handleLike}
                                    onComment={handleComment}
                                    onAuthorPress={() => { }} // Already on profile
                                    currentUserId={user?.uid}
                                />
                            )}
                            keyExtractor={item => item.id}
                            initialScrollIndex={selectedPostIndex}
                            onScrollToIndexFailed={info => {
                                const wait = new Promise(resolve => setTimeout(resolve, 500));
                                wait.then(() => {
                                    flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                                });
                            }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </SafeAreaView>
            </Modal>

            {/* Comments Modal */}
            <CommentsModal
                visible={commentsModalVisible}
                postId={selectedPostId}
                onClose={() => {
                    setCommentsModalVisible(false);
                    setSelectedPostId(null);
                }}
            />
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
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        ...typography.h3,
        color: colors.text,
    },
});
