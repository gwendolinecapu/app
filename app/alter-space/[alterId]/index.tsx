import React, { useState, useEffect, useCallback } from 'react';
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
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
// import { Video, ResizeMode, Audio } from 'expo-av'; // TODO: Fix expo-av installation
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/contexts/AuthContext';
import { db } from '../../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { Alter, Post } from '../../../src/types';
import { colors, spacing, borderRadius, typography } from '../../../src/lib/theme';
import { PostService } from '../../../src/services/posts';
import { FriendService } from '../../../src/services/friends';
import { SYSTEM_TIPS, SystemTip } from '../../../src/data/tips';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 430;
const GALLERY_ITEM_SIZE = (Math.min(width, MAX_WIDTH) - spacing.md * 4) / 3;

type TabType = 'feed' | 'profile' | 'journal' | 'search' | 'emotions' | 'settings';
type FeedItem = Post | SystemTip;

// Helper for media type
const getMediaType = (url: string) => {
    if (!url) return 'none';
    const ext = url.split('.').pop()?.toLowerCase();
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'video';
    if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) return 'audio';
    return 'image';
};

export default function AlterSpaceScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { alters, system } = useAuth();
    const [alter, setAlter] = useState<Alter | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('feed');
    const [posts, setPosts] = useState<Post[]>([]); // Gallery posts
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]); // Global feed items
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const isOwner = alter ? alters.some(a => a.id === alter.id) : false;

    // Filter states for search
    const [searchQuery, setSearchQuery] = useState('');
    const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({});
    const [friendCount, setFriendCount] = useState(0);

    // Refresh alter data from Firestore when screen gains focus (after edit)
    const fetchAlterFromFirestore = useCallback(async () => {
        if (!alterId) return;
        try {
            const docRef = doc(db, 'alters', alterId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const alterData = { id: docSnap.id, ...docSnap.data() } as Alter;
                setAlter(alterData);
                FriendService.getFriends(alterData.id).then(friends => setFriendCount(friends.length));
            }
        } catch (error) {
            console.error('Error fetching alter:', error);
        }
    }, [alterId]);

    // Use focus effect to refresh data when coming back from edit screen
    useFocusEffect(
        useCallback(() => {
            fetchAlterFromFirestore();
        }, [fetchAlterFromFirestore])
    );

    useEffect(() => {
        // Initial load from local context
        const foundAlter = alters.find((a) => a.id === alterId);
        if (foundAlter) {
            setAlter(foundAlter);
            FriendService.getFriends(foundAlter.id).then(friends => setFriendCount(friends.length));
        }
    }, [alterId, alters]);

    useEffect(() => {
        if (alter) {
            fetchPosts();
            fetchGlobalFeed();
        }
    }, [alter]);

    useEffect(() => {
        if (searchQuery.length > 0 && alter) {
            const results = alters.filter(a =>
                a.id !== alter.id &&
                (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (a.role_ids && a.role_ids.some((r: string) => r.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                    (a.custom_fields && a.custom_fields.some((f: any) => f.value.toLowerCase().includes(searchQuery.toLowerCase()))))
            );
            results.forEach(async (r) => {
                const status = await FriendService.checkStatus(alter.id, r.id);
                setFriendStatuses(prev => ({ ...prev, [r.id]: status }));
            });
        }
    }, [searchQuery, alter]);

    const handleFriendAction = async (targetId: string) => {
        if (!alter) return;
        const currentStatus = friendStatuses[targetId] || 'none';

        try {
            if (currentStatus === 'none') {
                await FriendService.sendRequest(alter.id, targetId);
                setFriendStatuses(prev => ({ ...prev, [targetId]: 'pending' }));
                Alert.alert('Succès', 'Demande envoyée !');
            } else if (currentStatus === 'friends') {
                router.push(`/alter-space/${targetId}`);
            } else if (currentStatus === 'pending') {
                Alert.alert('Info', 'Demande déjà envoyée');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Une erreur est survenue");
        }
    };

    const fetchGlobalFeed = async () => {
        try {
            let items: FeedItem[] = [];

            if (alter) {
                // Fetch friends first to mix in feed
                const friends = await FriendService.getFriends(alter.id);
                // If we have friends, show their posts.
                // Note: user said "posts in our feed".
                const feedData = await PostService.fetchFeed(friends);
                items = feedData.posts ? [...feedData.posts] : [];
            } else {
                const globalPosts = await PostService.fetchGlobalFeed();
                items = globalPosts.posts ? [...globalPosts.posts] : [];
            }

            // Integrer les tips systeme
            // Ajouter un tip tous les 5 posts
            SYSTEM_TIPS.forEach((tip, index) => {
                const position = (index + 1) * 5;
                if (items.length >= position) {
                    items.splice(position, 0, tip);
                } else {
                    items.push(tip); // Si pas assez de posts, ajouter a la fin
                }
            });

            setFeedItems(items);
        } catch (error) {
            console.error('Error fetching global feed:', error);
        } finally {
            setRefreshing(false); // Ensure this is not forgotten if stuck
        }
    };

    const fetchPosts = async () => {
        if (!alter) return;

        try {
            const q = query(
                collection(db, 'posts'),
                where('alter_id', '==', alter.id),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const data: Post[] = [];

            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Post);
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
        await Promise.all([fetchPosts(), fetchGlobalFeed()]);
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

    const renderProfile = () => {
        const ProfileHeader = () => (
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
                {alter.pronouns ? (
                    <Text style={styles.pronouns}>{alter.pronouns}</Text>
                ) : null}
                {alter.custom_fields?.find(f => f.label === 'Role')?.value ? (
                    <View style={styles.roleTag}>
                        <Ionicons name="shield" size={12} color={colors.primary} />
                        <Text style={styles.roleText}>
                            {alter.custom_fields.find(f => f.label === 'Role')?.value}
                        </Text>
                    </View>
                ) : null}
                <Text style={styles.bio}>
                    {alter.bio || "Aucune biographie"}
                </Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{posts.length}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{friendCount}</Text>
                        <Text style={styles.statLabel}>Amis</Text>
                    </View>
                </View>

                {/* Profile Actions */}
                <View style={styles.profileActions}>
                    {isOwner ? (
                        <TouchableOpacity
                            style={styles.editProfileButton}
                            onPress={() => router.push(`/alter-space/${alter.id}/edit`)}
                        >
                            <Text style={styles.editProfileText}>Modifier le profil</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.editProfileButton}
                                onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: alter.id } })}
                            >
                                <Text style={styles.editProfileText}>Message</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.followButton} onPress={() => handleFriendAction(alter.id)}>
                                <Text style={styles.followButtonText}>
                                    {friendStatuses[alter.id] === 'friends' ? 'Amis' :
                                        friendStatuses[alter.id] === 'pending' ? 'Demande envoyée' : 'Ajouter'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
        // In "Profile" mode, we show all posts in a grid
        return (
            <View style={styles.galleryContainer}>
                {posts.length === 0 ? (
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <ProfileHeader />
                        <View style={styles.emptyState}>
                            <Image
                                source={require('../../../assets/icon.png')} // Fallback until we have a specific illustration
                                style={{ width: 64, height: 64, marginBottom: 16, opacity: 0.5, alignSelf: 'center' }}
                            />
                            <Text style={styles.emptyTitle}>Aucune publication</Text>
                            <Text style={styles.emptySubtitle}>
                                {alter.name} n'a pas encore publié
                            </Text>
                        </View>
                    </ScrollView>
                ) : (
                    <FlatList
                        data={posts}
                        numColumns={3}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={ProfileHeader}
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

    const renderFeedItem = ({ item }: { item: FeedItem }) => {
        if ('type' in item && item.type === 'tip') {
            let iconName = 'bulb-outline';
            let title = 'Conseil Système';

            if (item.category === 'management') {
                iconName = 'list-outline';
                title = 'Organisation';
            } else if (item.category === 'wellness') {
                iconName = 'leaf-outline';
                title = 'Bien-être';
            } else if (item.category === 'communication') {
                iconName = 'chatbubbles-outline';
                title = 'Communication';
            }

            return (
                <View style={styles.tipCard}>
                    <View style={styles.tipHeader}>
                        <Ionicons name={iconName as any} size={24} color={colors.primary} />
                        <Text style={styles.tipTitle}>{title}</Text>
                    </View>
                    <Text style={styles.tipContent}>{item.content}</Text>
                </View>
            );
        }

        const post = item as Post;
        return (
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    <View style={styles.postAuthorInfo}>
                        <View style={styles.postAvatar}>
                            {alter?.avatar ? (
                                <Image source={{ uri: alter.avatar }} style={styles.postAvatarImage} />
                            ) : (
                                <Text style={styles.postAvatarText}>{alter?.name?.charAt(0)}</Text>
                            )}
                        </View>
                        <View>
                            <Text style={styles.postAuthorName}>{alter?.name}</Text>
                            <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                {post.media_url && (
                    <View style={styles.mediaContainer}>
                        {getMediaType(post.media_url) === 'image' && (
                            <Image source={{ uri: post.media_url }} style={styles.postImage} resizeMode="cover" />
                        )}
                        {getMediaType(post.media_url) === 'video' && (
                            <View style={{
                                width: '100%',
                                height: 200,
                                borderRadius: borderRadius.md,
                                backgroundColor: colors.backgroundLight,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <Ionicons name="videocam" size={40} color={colors.primary} />
                                <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>Vidéo (lecteur bientôt disponible)</Text>
                            </View>
                        )}
                        {getMediaType(post.media_url) === 'audio' && (
                            <View style={{
                                backgroundColor: colors.backgroundLight,
                                padding: spacing.md,
                                borderRadius: borderRadius.md,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: spacing.sm,
                                marginTop: spacing.sm
                            }}>
                                <Ionicons name="musical-note" size={24} color={colors.primary} />
                                <Text style={{ color: colors.text }}>Fichier Audio (Lecture bientôt disponible)</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.postActions}>
                    <TouchableOpacity style={styles.postAction}>
                        <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
                        <Text style={styles.postActionText}>{post.likes || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction}>
                        <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                        <Text style={styles.postActionText}>{post.comments_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction}>
                        <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderFeed = () => (
        <View style={styles.tabContent}>
            <FlatList
                data={feedItems}
                renderItem={renderFeedItem}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="newspaper-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyTitle}>Fil d'actualité</Text>
                        <Text style={styles.emptySubtitle}>
                            Aucune publication récente.
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </View>
    );

    const renderJournal = () => (
        <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Journal de {alter.name}</Text>
            <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Journal personnel</Text>
                <Text style={styles.emptySubtitle}>
                    Les entrées du journal de {alter.name} apparaîtront ici.
                    Ce journal est privé et indépendant des autres alters.
                </Text>
            </View>
        </ScrollView>
    );

    const renderMessages = () => (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Messages de {alter.name}</Text>
            <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Messagerie privée</Text>
                <Text style={styles.emptySubtitle}>
                    Les conversations de {alter.name} apparaîtront ici.
                    Cette messagerie est indépendante des autres alters.
                </Text>
                <TouchableOpacity
                    style={styles.startChatButton}
                    onPress={() => router.push('/(tabs)/messages')}
                >
                    <Text style={styles.startChatText}>Nouvelle conversation</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSearch = () => (
        <View style={styles.tabContent}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={{ flex: 1, color: colors.text, height: 40 }}
                    placeholder="Rechercher des amis..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            {searchQuery.length > 0 ? (
                <View style={{ padding: spacing.md }}>
                    <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
                        Recherche de "{searchQuery}"...
                    </Text>
                    {/* Search Results */}
                    <View style={{ marginTop: 20 }}>
                        {alters.filter(a =>
                            a.id !== alter.id && // Don't show self
                            (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (a.role_ids && a.role_ids.some((r: string) => r.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                                (a.custom_fields && a.custom_fields.some((f: any) => f.value.toLowerCase().includes(searchQuery.toLowerCase()))))
                        ).length > 0 ? (
                            alters.filter(a =>
                                a.id !== alter.id &&
                                (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (a.role_ids && a.role_ids.some((r: string) => r.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                                    (a.custom_fields && a.custom_fields.some((f: any) => f.value.toLowerCase().includes(searchQuery.toLowerCase()))))
                            ).map((result, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: spacing.sm,
                                        backgroundColor: colors.backgroundCard,
                                        marginBottom: spacing.xs,
                                        borderRadius: borderRadius.md
                                    }}
                                    onPress={() => handleFriendAction(result.id)}
                                >
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        backgroundColor: result.color || colors.primary,
                                        justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm
                                    }}>
                                        {result.avatar_url ? (
                                            <Image source={{ uri: result.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                        ) : (
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{result.name.charAt(0)}</Text>
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ ...typography.body, fontWeight: 'bold' }}>{result.name}</Text>
                                        <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                                            {result.custom_fields?.find((f: any) => f.label === 'Role')?.value || 'Membre du système'}
                                        </Text>
                                    </View>
                                    <View>
                                        {(friendStatuses[result.id] === 'friends') && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                                        {(friendStatuses[result.id] === 'pending') && <Ionicons name="time" size={24} color={colors.textSecondary} />}
                                        {(!friendStatuses[result.id] || friendStatuses[result.id] === 'none') && <Ionicons name="person-add" size={24} color={colors.primary} />}
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                                    Aucun résultat trouvé pour "{searchQuery}".
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Recherche</Text>
                    <Text style={styles.emptySubtitle}>
                        Taper pour rechercher des amis ou du contenu.
                    </Text>
                </View>
            )}
        </View>
    );

    const renderEmotions = () => (
        <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Comment te sens-tu, {alter.name} ?</Text>

            {/* Emotion Grid */}
            <View style={styles.emotionGrid}>
                {['😊', '😢', '😰', '😡', '😴', '😌', '😕', '🤩'].map((emoji, index) => (
                    <TouchableOpacity key={index} style={styles.emotionButton}>
                        <Text style={styles.emotionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Suivi émotionnel</Text>
                <Text style={styles.emptySubtitle}>
                    Enregistrer les émotions de {alter.name} pour suivre son bien-être au fil du temps.
                </Text>
            </View>
        </ScrollView>
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
                <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings')}>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                    <Text style={styles.settingText}>Paramètres de l'application</Text>
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
                    onPress={() => router.push('/(tabs)/dashboard')}
                >
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{alter.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => {
                            // For now, go to global messages.
                            router.push('/(tabs)/messages');
                        }}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => {
                            // Settings for this alter
                            // Assuming we have a settings page or just general settings
                            router.push('/settings');
                        }}
                    >
                        <Ionicons name="settings-outline" size={26} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {activeTab === 'feed' && renderFeed()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'journal' && renderJournal()}
                {activeTab === 'search' && renderSearch()}
                {activeTab === 'emotions' && renderEmotions()}
                {activeTab === 'settings' && renderSettings()}
            </View>

            {/* Bottom Tab Navigation */}
            <View style={styles.bottomTabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
                    onPress={() => setActiveTab('feed')}
                >
                    <Ionicons
                        name={activeTab === 'feed' ? 'home' : 'home-outline'}
                        size={24}
                        color={activeTab === 'feed' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>

                {isOwner && (
                    <>
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
                            style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
                            onPress={() => setActiveTab('journal')}
                        >
                            <Ionicons
                                name={activeTab === 'journal' ? 'book' : 'book-outline'}
                                size={24}
                                color={activeTab === 'journal' ? colors.primary : colors.textMuted}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'emotions' && styles.tabActive]}
                            onPress={() => setActiveTab('emotions')}
                        >
                            <Ionicons
                                name={activeTab === 'emotions' ? 'happy' : 'happy-outline'}
                                size={24}
                                color={activeTab === 'emotions' ? colors.primary : colors.textMuted}
                            />
                        </TouchableOpacity>
                    </>
                )}

                {/* Profile tab at the end (right side) */}
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
                    onPress={() => setActiveTab('profile')}
                >
                    <Ionicons
                        name={activeTab === 'profile' ? 'person-circle' : 'person-circle-outline'}
                        size={24}
                        color={activeTab === 'profile' ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            {/* Floating Action Button (Only on Gallery or Journal) */}
            {(activeTab === 'profile' || activeTab === 'journal') && (
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
    pronouns: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    roleTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.primary}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.sm,
        gap: 4,
    },
    roleText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
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
    profileActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: spacing.md,
        width: '100%',
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
    },
    editProfileButton: {
        backgroundColor: colors.backgroundLight,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    editProfileText: {
        color: colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    followButton: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    followButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    bottomTabs: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.backgroundCard,
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
        height: 85,
        alignItems: 'center',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xs,
        minWidth: 50,
    },
    tabActive: {
        // No border, just color change handled in JSX
    },
    contentArea: {
        flex: 1,
        paddingBottom: 85, // Space for bottom tabs
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
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
        color: colors.text,
    },
    startChatButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        marginTop: spacing.lg,
    },
    startChatText: {
        color: 'white',
        fontWeight: '600' as const,
    },
    fab: {
        position: 'absolute',
        bottom: 100, // Adjusted to clear bottom tab bar
        alignSelf: 'center', // Center horizontally
        // right: 30, // Removed right alignment
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
        zIndex: 20, // Ensure it's above everything
    },
    postCard: {
        backgroundColor: colors.backgroundCard,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    postAuthorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        overflow: 'hidden',
    },
    postAvatarImage: {
        width: '100%',
        height: '100%',
    },
    postAvatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    postAuthorName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    postTime: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    postContent: {
        ...typography.body,
        marginBottom: spacing.md,
        lineHeight: 22,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
    },
    postAction: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.xl,
    },
    postActionText: {
        ...typography.caption,
        marginLeft: spacing.xs,
        color: colors.textSecondary,
    },
    tipCard: {
        backgroundColor: colors.backgroundCard, // Or a slightly different color for tips
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary + '40', // slightly colored border
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    tipTitle: {
        ...typography.h3,
        fontSize: 16,
        marginLeft: spacing.xs,
        color: colors.primary,
    },
    tipContent: {
        ...typography.body,
        fontSize: 14,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    tipAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tipActionText: {
        ...typography.caption,
        fontWeight: 'bold',
        color: colors.primary,
        marginRight: spacing.xs,
    },
    emotionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        padding: spacing.md,
        justifyContent: 'center',
    },
    emotionButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    emotionEmoji: {
        fontSize: 30,
    },
    mediaContainer: {
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
});
