import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    FlatList,
    Image,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import { Alter, Post } from '../../../src/types';
import { colors, spacing, borderRadius, typography } from '../../../src/lib/theme';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 430;
const GALLERY_ITEM_SIZE = (Math.min(width, MAX_WIDTH) - spacing.md * 4) / 3;

type TabType = 'feed' | 'gallery' | 'messages';

export default function AlterSpaceScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { alters, system } = useAuth();
    const [alter, setAlter] = useState<Alter | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('feed');
    const [posts, setPosts] = useState<Post[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const foundAlter = alters.find((a) => a.id === alterId);
        if (foundAlter) {
            setAlter(foundAlter);
        }
    }, [alterId, alters]);

    useEffect(() => {
        if (alter) {
            fetchPosts();
        }
    }, [alter]);

    const fetchPosts = async () => {
        if (!alter) return;

        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('alter_id', alter.id)
                .order('created_at', { ascending: false });

            if (data) {
                setPosts(data);
            }
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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return "À l'instant";
        if (hours < 24) return `Il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `Il y a ${days}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    if (!alter) {
        return (
            <View style={styles.container}>
                <Text style={styles.notFound}>Alter non trouvé</Text>
            </View>
        );
    }

    const renderFeed = () => (
        <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                />
            }
            renderItem={({ item }) => (
                <View style={styles.postCard}>
                    <Text style={styles.postContent}>{item.content}</Text>
                    <Text style={styles.postTime}>{formatTime(item.created_at)}</Text>
                </View>
            )}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📝</Text>
                    <Text style={styles.emptyTitle}>Aucune publication</Text>
                    <Text style={styles.emptySubtitle}>
                        {alter.name} n'a pas encore publié
                    </Text>
                </View>
            }
            contentContainerStyle={styles.feedContent}
        />
    );

    const renderGallery = () => {
        const postsWithMedia = posts.filter(p => p.media_url);

        return (
            <View style={styles.galleryContainer}>
                {postsWithMedia.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🖼️</Text>
                        <Text style={styles.emptyTitle}>Aucune photo</Text>
                    </View>
                ) : (
                    <FlatList
                        data={postsWithMedia}
                        numColumns={3}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.galleryItem}>
                                <Image
                                    source={{ uri: item.media_url }}
                                    style={styles.galleryImage}
                                />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        );
    };

    const renderMessages = () => (
        <View style={styles.messagesContainer}>
            <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyTitle}>Messages de {alter.name}</Text>
                <Text style={styles.emptySubtitle}>
                    Les conversations privées de cet alter apparaîtront ici
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/home')}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{alter.name}</Text>
                <TouchableOpacity onPress={() => router.push(`/alter/${alter.id}`)}>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={[styles.avatar, { backgroundColor: alter.color }]}>
                    {alter.avatar_url ? (
                        <Image source={{ uri: alter.avatar_url }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {alter.name.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
                <Text style={styles.name}>{alter.name}</Text>
                {alter.pronouns && <Text style={styles.pronouns}>{alter.pronouns}</Text>}
                {alter.bio && <Text style={styles.bio}>{alter.bio}</Text>}

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{posts.length}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>Amis</Text>
                    </View>
                </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
                    onPress={() => setActiveTab('feed')}
                >
                    <Ionicons
                        name={activeTab === 'feed' ? 'grid' : 'grid-outline'}
                        size={22}
                        color={activeTab === 'feed' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'gallery' && styles.tabActive]}
                    onPress={() => setActiveTab('gallery')}
                >
                    <Ionicons
                        name={activeTab === 'gallery' ? 'images' : 'images-outline'}
                        size={22}
                        color={activeTab === 'gallery' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Ionicons
                        name={activeTab === 'messages' ? 'chatbubble' : 'chatbubble-outline'}
                        size={22}
                        color={activeTab === 'messages' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {activeTab === 'feed' && renderFeed()}
                {activeTab === 'gallery' && renderGallery()}
                {activeTab === 'messages' && renderMessages()}
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/post/create')}
            >
                <Ionicons name="add" size={28} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    notFound: {
        ...typography.body,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xxl,
        paddingBottom: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h3,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.text,
    },
    name: {
        ...typography.h2,
        marginBottom: spacing.xs,
    },
    pronouns: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    bio: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginTop: spacing.sm,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...typography.h3,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: colors.primary,
    },
    contentArea: {
        flex: 1,
    },
    feedContent: {
        padding: spacing.md,
    },
    postCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    postContent: {
        ...typography.body,
        marginBottom: spacing.sm,
    },
    postTime: {
        ...typography.caption,
        color: colors.textMuted,
    },
    galleryContainer: {
        flex: 1,
    },
    galleryItem: {
        width: GALLERY_ITEM_SIZE,
        height: GALLERY_ITEM_SIZE,
        margin: 1,
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    messagesContainer: {
        flex: 1,
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
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
});
