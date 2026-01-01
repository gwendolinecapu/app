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
    useWindowDimensions,
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
import { Alert } from 'react-native';

const ROLE_DEFINITIONS: Record<string, string> = {
    'host': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hote': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hôte': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'protector': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'protecteur': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'gatekeeper': "Contrôle les switchs (changements), l'accès aux souvenirs ou aux zones du monde intérieur.",
    'persecutor': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'persecuteur': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'persécuteur': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'little': "Un alter enfant, souvent porteur d'innocence ou de souvenirs traumatiques précoces.",
    'caretaker': "Prend soin des autres alters (souvent les littles) ou apaise le système.",
    'soigneur': "Prend soin des autres alters (souvent les littles) ou apaise le système.",
    'trauma holder': "Détient les souvenirs ou les émotions liés aux traumas pour protéger les autres.",
    'porteur de trauma': "Détient les souvenirs ou les émotions liés aux traumas pour protéger les autres.",
    'fictive': "Introject basé sur un personnage de fiction.",
    'factive': "Introject basé sur une personne réelle.",
};

const getRoleDefinition = (role: string) => {
    const key = role.toLowerCase().trim();
    // Try exact match
    if (ROLE_DEFINITIONS[key]) return ROLE_DEFINITIONS[key];
    // Try partial match
    const found = Object.keys(ROLE_DEFINITIONS).find(k => key.includes(k));
    if (found) return ROLE_DEFINITIONS[found];
    return "Définition non disponible pour ce rôle spécifique.";
};

const getGridSize = (width: number) => (width - 4) / 3;

export default function ProfileScreen() {
    const { currentAlter, system, alters, user } = useAuth();
    const { width } = useWindowDimensions();
    const GRID_SIZE = getGridSize(width);
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
            // Revert optimistic update
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    const likes = post.likes || [];
                    const isLiked = likes.includes(user.uid);
                    // Reversing the logic: if we "liked" it and it failed, we remove our ID. If we unliked, we add it back.
                    // Wait, the prev state above WAS the optimistic update.
                    // But here we are in catch block, so 'prev' inside setPosts might be the optimistic state or newer.
                    // To revert, we toggle again.
                    return {
                        ...post,
                        likes: isLiked ? likes.filter(id => id !== user.uid) : [...likes, user.uid]
                    };
                }
                return post;
            }));
            triggerHaptic.error();
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
                        <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
                            <Ionicons name="notifications-outline" size={24} color={colors.text} />
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

                    {/* Role Display */}
                    {currentAlter.custom_fields?.find(f => f.label === 'Role') && (
                        <TouchableOpacity
                            style={styles.roleBadge}
                            activeOpacity={0.7}
                            onPress={() => {
                                const role = currentAlter.custom_fields?.find(f => f.label === 'Role')?.value || '';
                                Alert.alert("Définition du rôle", getRoleDefinition(role));
                            }}
                        >
                            <Ionicons name="information-circle" size={14} color={colors.primaryLight} style={{ marginRight: 4 }} />
                            <Text style={styles.roleText}>
                                {currentAlter.custom_fields.find(f => f.label === 'Role')?.value}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Bio */}
                    {currentAlter.bio && (
                        <Text style={styles.bio}>{currentAlter.bio}</Text>
                    )}

                    {/* Dates Display */}
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                        {currentAlter.birthDate && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                <Text style={[styles.bio, { marginTop: 0, fontSize: 12, color: colors.textSecondary }]}>
                                    Né(e) le {new Date(currentAlter.birthDate).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                        {currentAlter.arrivalDate && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="airplane-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                <Text style={[styles.bio, { marginTop: 0, fontSize: 12, color: colors.textSecondary }]}>
                                    Arrivé(e) le {new Date(currentAlter.arrivalDate).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                    </View>
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
        width: '33.33%',
        aspectRatio: 1,
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
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    roleText: {
        ...typography.caption,
        color: colors.primaryLight,
        fontWeight: '600',
    },
});
