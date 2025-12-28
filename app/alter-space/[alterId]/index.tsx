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

type TabType = 'gallery' | 'search' | 'settings';

export default function AlterSpaceScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { alters, system } = useAuth();
    const [alter, setAlter] = useState<Alter | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('gallery');
    const [posts, setPosts] = useState<Post[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Filter states for search
    const [searchQuery, setSearchQuery] = useState('');

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

    const renderGallery = () => {
        // In "Gallery" mode, we show all posts in a grid
        return (
            <View style={styles.galleryContainer}>
                {posts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Image
                            source={require('../../../assets/icon.png')} // Fallback until we have a specific illustration
                            style={{ width: 64, height: 64, marginBottom: 16, opacity: 0.5 }}
                        />
                        <Text style={styles.emptyTitle}>Aucune publication</Text>
                        <Text style={styles.emptySubtitle}>
                            {alter.name} n'a pas encore publié
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={posts}
                        numColumns={3}
                        keyExtractor={(item) => item.id}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                            />
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.galleryItem}>
                                {item.media_url ? (
                                    <Image
                                        source={{ uri: item.media_url }}
                                        style={styles.galleryImage}
                                    />
                                ) : (
                                    <View style={styles.textPostPreview}>
                                        <Text style={styles.textPostContent} numberOfLines={3}>
                                            {item.content}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        );
    };

    const renderSearch = () => (
        <View style={styles.tabContent}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <View style={styles.searchInputPlaceholder}>
                    <Text style={{ color: colors.textSecondary }}>Rechercher...</Text>
                </View>
            </View>
            <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Recherche</Text>
                <Text style={styles.emptySubtitle}>
                    Rechercher dans les publications et amis de {alter.name}
                </Text>
            </View>
        </View>
    );

    const renderSettings = () => (
        <ScrollView style={styles.settingsContainer}>
            <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Compte</Text>
                <TouchableOpacity style={styles.settingItem} onPress={() => router.push(`/alter-space/${alter.id}/edit`)}>
                    <Ionicons name="person-outline" size={24} color={colors.text} />
                    <Text style={styles.settingText}>Modifier le profil</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
                    <Text style={styles.settingText}>Confidentialité</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                    <Text style={styles.settingText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Interactions</Text>
                <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="people-outline" size={24} color={colors.text} />
                    <Text style={styles.settingText}>Amis proches</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="ban-outline" size={24} color={colors.text} />
                    <Text style={styles.settingText}>Comptes bloqués</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Système</Text>
                <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="eye-off-outline" size={24} color={colors.error} />
                    <Text style={[styles.settingText, { color: colors.error }]}>Masquer cet alter</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/home')}
                >
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{alter.name}</Text>
                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => {
                        // For now, go to global messages.
                        // Ideal: Open specific conversation with this alter.
                        router.push('/(tabs)/messages');
                    }}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.text} />
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
                {/* Fallback bio if empty */}
                <Text style={styles.bio}>
                    {alter.bio || "Aucune biographie"}
                </Text>

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
                    style={[styles.tab, activeTab === 'gallery' && styles.tabActive]}
                    onPress={() => setActiveTab('gallery')}
                >
                    <Ionicons
                        name={activeTab === 'gallery' ? 'grid' : 'grid-outline'}
                        size={24}
                        color={activeTab === 'gallery' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'search' && styles.tabActive]}
                    onPress={() => setActiveTab('search')}
                >
                    <Ionicons
                        name={activeTab === 'search' ? 'search' : 'search-outline'}
                        size={24}
                        color={activeTab === 'search' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Ionicons
                        name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
                        size={24}
                        color={activeTab === 'settings' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {activeTab === 'gallery' && renderGallery()}
                {activeTab === 'search' && renderSearch()}
                {activeTab === 'settings' && renderSettings()}
            </View>

            {/* Floating Action Button (Only on Gallery) */}
            {activeTab === 'gallery' && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/post/create')}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            )}
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
        paddingTop: 60, // Adjusted for safe area roughly
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
        zIndex: 10,
    },
    backButton: {
        padding: spacing.xs,
    },
    messageButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h3,
        fontWeight: 'bold',
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
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
        fontSize: 24,
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
        gap: 40,
        marginTop: spacing.sm,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...typography.h3,
        fontWeight: 'bold',
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 14,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginTop: spacing.md,
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
    galleryContainer: {
        flex: 1,
        padding: 1,
    },
    galleryItem: {
        width: GALLERY_ITEM_SIZE,
        height: GALLERY_ITEM_SIZE,
        margin: 1,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    textPostPreview: {
        padding: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    textPostContent: {
        ...typography.caption,
        color: colors.text,
        textAlign: 'center',
        fontSize: 10,
    },
    tabContent: {
        flex: 1,
        padding: spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        marginBottom: spacing.lg,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInputPlaceholder: {
        flex: 1,
    },
    settingsContainer: {
        flex: 1,
    },
    settingSection: {
        marginBottom: spacing.xl,
    },
    settingSectionTitle: {
        ...typography.h3,
        fontSize: 18,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.backgroundCard,
        marginBottom: 1,
    },
    settingText: {
        ...typography.body,
        flex: 1,
        marginLeft: spacing.md,
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
        fontSize: 20,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
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
