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
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, Audio } from 'expo-av';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/contexts/AuthContext';
import { db } from '../../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { Alter, Post, Emotion, EmotionType, EMOTION_EMOJIS, EMOTION_LABELS } from '../../../src/types';
import { colors, spacing, borderRadius, typography } from '../../../src/lib/theme';
import { PostService } from '../../../src/services/posts';
import { FriendService } from '../../../src/services/friends';
import { Feed } from '../../../src/components/Feed';
import { StoriesBar } from '../../../src/components/StoriesBar';
import { SYSTEM_TIPS, SystemTip } from '../../../src/data/tips';
import { EmotionService } from '../../../src/services/emotions';
import { useToast } from '../../../src/components/ui/Toast';
import { triggerHaptic } from '../../../src/lib/haptics';
import { timeAgo } from '../../../src/lib/date';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 430;
const GALLERY_ITEM_SIZE = (Math.min(width, MAX_WIDTH) - spacing.md * 4) / 3;

type TabType = 'feed' | 'profile' | 'journal' | 'gallery' | 'emotions' | 'settings' | 'search';
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
    const { alterId, tab } = useLocalSearchParams<{ alterId: string; tab?: string }>();
    const { alters, system, currentAlter } = useAuth();
    const [alter, setAlter] = useState<Alter | null>(null);
    // Si un onglet est passé en param (ex: ?tab=profile), l'utiliser comme initial
    const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || 'feed');
    const [refreshing, setRefreshing] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [posts, setPosts] = useState<Post[]>([]); // Gallery posts
    const [loading, setLoading] = useState(true);
    const [latestEmotion, setLatestEmotion] = useState<Emotion | null>(null);
    const [menuVisible, setMenuVisible] = useState(false); // Hamburger menu drawer

    const toast = useToast();

    // Fetch latest emotion on mount
    useEffect(() => {
        if (alterId) {
            loadLatestEmotion();
        }
    }, [alterId]);

    const loadLatestEmotion = async () => {
        try {
            const emotion = await EmotionService.getLatestEmotion(alterId as string);
            setLatestEmotion(emotion);
        } catch (e) {
            console.error(e);
        }
    };

    const isOwner = alter ? alters.some(a => a.id === alter.id) : false;

    // Filter states for search
    const [searchQuery, setSearchQuery] = useState('');
    const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({});
    const [friendCount, setFriendCount] = useState(0);
    const [friendIds, setFriendIds] = useState<string[]>([]);

    // État pour la galerie privée
    const [galleryImages, setGalleryImages] = useState<Array<{ id: string, uri: string, createdAt: Date }>>([]);
    const [isCloudEnabled, setIsCloudEnabled] = useState(false);
    const [loadingGallery, setLoadingGallery] = useState(false);

    // Charger la galerie depuis le stockage local (AsyncStorage)
    useEffect(() => {
        loadGalleryFromLocal();
    }, [alterId]);

    const loadGalleryFromLocal = async () => {
        if (!alterId) return;
        try {
            setLoadingGallery(true);
            const stored = await AsyncStorage.getItem(`gallery_${alterId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                setGalleryImages(parsed);
            }
        } catch (e) {
            console.error('Erreur chargement galerie:', e);
        } finally {
            setLoadingGallery(false);
        }
    };

    const handleAddPhoto = async () => {
        try {
            triggerHaptic.selection();

            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour ajouter des photos.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newImage = {
                    id: Date.now().toString(),
                    uri: result.assets[0].uri,
                    createdAt: new Date()
                };

                const updatedGallery = [newImage, ...galleryImages];
                setGalleryImages(updatedGallery);

                await AsyncStorage.setItem(`gallery_${alterId}`, JSON.stringify(updatedGallery));
                toast.showToast('Photo ajoutée', 'success');
            }
        } catch (e) {
            console.error('Erreur ajout photo:', e);
            toast.showToast("Erreur lors de l'ajout", 'error');
        }
    };

    const fetchAlterFromFirestore = useCallback(async () => {
        if (!alterId) return;
        try {
            const docRef = doc(db, 'alters', alterId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const alterData = { id: docSnap.id, ...docSnap.data() } as Alter;
                setAlter(alterData);
                FriendService.getFriends(alterData.id).then(friends => {
                    setFriendCount(friends.length);
                    setFriendIds(friends);
                });
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
        const foundAlter = alters.find(a => a.id === alterId);
        if (foundAlter) {
            setAlter(foundAlter);
            FriendService.getFriends(foundAlter.id).then(friends => {
                setFriendCount(friends.length);
                setFriendIds(friends);
            });
        }
    }, [alterId, alters]);

    useEffect(() => {
        if (alter) {
            fetchPosts();

            // Check friend status if viewing someone else's profile
            if (!isOwner && currentAlter) { // Updated to use currentAlter
                FriendService.checkStatus(currentAlter.id, alter.id).then(status => {
                    setFriendStatuses(prev => ({ ...prev, [alter.id]: status }));
                }).catch(console.error);
            }
        }
    }, [alter, isOwner]);

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

    // ...

    const handleFriendAction = async (targetId: string) => {
        // Use the currently active alter (if any) or fallback to alert
        if (!currentAlter) {
            Alert.alert('Action impossible', 'Vous devez sélectionner un alter actif (Front) pour ajouter des amis.');
            return;
        }

        const myAlter = currentAlter;

        // Check friend status if viewing someone else's profile
        if (!isOwner && currentAlter) {
            FriendService.checkStatus(currentAlter.id, alter.id).then(status => {
                setFriendStatuses(prev => ({ ...prev, [alter.id]: status }));
            }).catch(console.error);
        }
        const currentStatus = friendStatuses[targetId] || 'none';

        try {
            if (currentStatus === 'none') {
                console.log('[DEBUG] Sending friend request from', myAlter.id, 'to', targetId);
                await FriendService.sendRequest(myAlter.id, targetId);
                setFriendStatuses(prev => ({ ...prev, [targetId]: 'pending' }));
                triggerHaptic.success();
                Alert.alert('Succès', 'Demande envoyée !');
            } else if (currentStatus === 'friends') {
                router.push(`/alter-space/${targetId}`);
            } else if (currentStatus === 'pending') {
                Alert.alert('Info', 'Demande déjà envoyée');
            }
        } catch (error: any) {
            console.error('[DEBUG] Friend request error:', error);
            Alert.alert('Erreur', error.message || "Une erreur est survenue");
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
        setLoading(true);
        await fetchPosts();
        setLoading(false);
    };

    const formatTime = (dateString: string) => {
        const ago = timeAgo(dateString);
        return ago ? `Il y a ${ago}` : '';
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
            <View style={styles.profileContainer}>
                {/* Top Section: Avatar + Stats */}
                <View style={styles.topProfileSection}>
                    {/* Avatar Column */}
                    <View style={styles.avatarColumn}>
                        <View style={[styles.profileAvatarContainer, { borderColor: alter.color || colors.primary }]}>
                            <View style={[styles.profileAvatar, { backgroundColor: alter.color || colors.primary }]}>
                                {alter.avatar_url ? (
                                    <Image source={{ uri: alter.avatar_url }} style={styles.profileAvatarImage} />
                                ) : (
                                    <Text style={styles.profileAvatarText}>
                                        {alter.name.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <Text style={styles.profileName} numberOfLines={1}>{alter.name}</Text>
                    </View>

                    {/* Stats Column */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{posts.length}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{friendCount}</Text>
                            <Text style={styles.statLabel}>Abonnés</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Suivis</Text>
                        </View>
                    </View>
                </View>

                {/* Bio Section */}
                <View style={styles.bioContainer}>
                    {alter.pronouns ? (
                        <Text style={styles.bioPronouns}>{alter.pronouns}</Text>
                    ) : null}

                    {alter.custom_fields?.find(f => f.label === 'Role')?.value && (
                        <View style={styles.bioRoleRow}>
                            <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.bioRoleText}>{alter.custom_fields.find(f => f.label === 'Role')?.value}</Text>
                        </View>
                    )}

                    {alter.bio ? (
                        <Text style={styles.bioText}>{alter.bio || "Aucune biographie"}</Text>
                    ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                    {isOwner ? (
                        <>
                            <TouchableOpacity
                                style={styles.profileActionButton}
                                onPress={() => router.push(`/alter-space/${alter.id}/edit`)}
                            >
                                <Text style={styles.profileActionButtonText}>Modifier</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.profileActionButton}
                                onPress={() => router.push('/history')}
                            >
                                <Text style={styles.profileActionButtonText}>Historique</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.profileActionButton}
                                onPress={() => router.push('/settings')}
                            >
                                <Ionicons name="settings-outline" size={16} color={colors.text} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.profileActionButton, styles.primaryActionButton]}
                                onPress={() => handleFriendAction(alter.id)}
                            >
                                <Text style={[styles.profileActionButtonText, styles.primaryActionButtonText]}>
                                    {friendStatuses[alter.id] === 'friends' ? 'Abonnés' :
                                        friendStatuses[alter.id] === 'pending' ? 'Demande envoyée' : 'S\'abonner'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.profileActionButton}
                                onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: alter.id } })}
                            >
                                <Text style={styles.profileActionButtonText}>Message</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Tab Switcher (Grid/List/Etc if needed) - Visual only for now */}
                {/* <View style={styles.profileTabs}>
                    <Ionicons name="grid" size={24} color={colors.text} />
                </View> */}
            </View>
        );

        // Grid View
        return (
            <View style={styles.postGridContainer}>
                {posts.length === 0 ? (
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <ProfileHeader />
                        <View style={styles.emptyGridState}>
                            <View style={styles.emptyGridIcon}>
                                <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                            </View>
                            <Text style={styles.emptyGridTitle}>Aucune publication</Text>
                            <Text style={styles.emptyGridSubtitle}>
                                Les photos et posts de {alter.name} apparaîtront ici.
                            </Text>
                        </View>
                    </ScrollView>
                ) : (
                    <FlatList
                        data={posts}
                        numColumns={3}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={() => (
                            <>
                                <ProfileHeader />
                                {/* Instagram-style Tabs Icon Strip */}
                                <View style={styles.feedTabsStrip}>
                                    <TouchableOpacity style={[styles.feedTabIcon, styles.feedTabIconActive]}>
                                        <Ionicons name="grid" size={24} color={colors.text} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.feedTabIcon}>
                                        <Ionicons name="person-circle-outline" size={26} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                            />
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.gridImageContainer}
                                onPress={() => {
                                    router.push(`/post/${item.id}`);
                                }}
                            >
                                {item.media_url ? (
                                    <Image
                                        source={{ uri: item.media_url }}
                                        style={styles.gridImageContent}
                                    />
                                ) : (
                                    <View style={styles.gridTextContent}>
                                        <Text style={styles.gridTextPreview} numberOfLines={3}>
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



    const handleStoryPress = (authorId: string, stories: any[]) => {
        router.push({
            pathname: '/story/view',
            params: { authorId }
        });
    };

    const renderFeed = () => (
        <View style={styles.tabContent}>
            <Feed
                type="friends"
                alterId={alterId}
                ListHeaderComponent={
                    <StoriesBar
                        onStoryPress={handleStoryPress}
                        friendIds={friendIds}
                    />
                }
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



    const renderGallery = () => (
        <View style={styles.tabContent}>
            {/* Header Galerie */}
            <View style={styles.galleryHeader}>
                <Text style={styles.sectionTitle}>Ma Galerie Privée</Text>
                <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={handleAddPhoto}
                >
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Info Stockage */}
            <View style={styles.storageInfo}>
                <Ionicons name="phone-portrait-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.storageText}>
                    Stockage local uniquement
                </Text>
                <TouchableOpacity
                    style={styles.cloudBadge}
                    onPress={() => {
                        toast.showToast('Option Cloud disponible avec Premium', 'info');
                    }}
                >
                    <Ionicons name="cloud-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.cloudBadgeText}>Premium</Text>
                </TouchableOpacity>
            </View>

            {/* Grille de photos */}
            {galleryImages.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.galleryGrid}>
                        {galleryImages.map((img, index) => (
                            <TouchableOpacity
                                key={img.id}
                                style={styles.galleryItem}
                                onPress={() => {
                                    setFullScreenImage(img.uri);
                                    triggerHaptic.selection();
                                }}
                            >
                                <Image source={{ uri: img.uri }} style={styles.galleryImage} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Galerie Privée</Text>
                    <Text style={styles.emptySubtitle}>
                        Ajoutez des photos personnelles à la galerie de {alter.name}.{'\n'}
                        Les photos sont stockées uniquement sur votre téléphone.
                    </Text>
                    <TouchableOpacity
                        style={styles.startChatButton}
                        onPress={handleAddPhoto}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.startChatText}>Ajouter une photo</Text>
                    </TouchableOpacity>

                    {/* Section Premium Cloud */}
                    <View style={styles.premiumSection}>
                        <View style={styles.premiumHeader}>
                            <Ionicons name="cloud" size={20} color={colors.primary} />
                            <Text style={styles.premiumTitle}>Sauvegarde Cloud</Text>
                            <View style={styles.premiumBadge}>
                                <Text style={styles.premiumBadgeText}>Premium</Text>
                            </View>
                        </View>
                        <Text style={styles.premiumDescription}>
                            Synchronisez vos photos sur le cloud pour y accéder depuis tous vos appareils.
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    const renderEmotions = () => {
        const EMOTION_CONFIG: { type: EmotionType; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
            { type: 'happy', icon: 'happy-outline', label: 'Joyeux', color: '#FFD93D' },
            { type: 'sad', icon: 'sad-outline', label: 'Triste', color: '#3498DB' },
            { type: 'anxious', icon: 'alert-circle-outline', label: 'Anxieux', color: '#F39C12' },
            { type: 'angry', icon: 'flame-outline', label: 'En colère', color: '#E74C3C' },
            { type: 'tired', icon: 'battery-dead-outline', label: 'Fatigué', color: '#A0AEC0' },
            { type: 'calm', icon: 'leaf-outline', label: 'Calme', color: '#6BCB77' },
            { type: 'confused', icon: 'help-circle-outline', label: 'Confus', color: '#9B59B6' },
            { type: 'excited', icon: 'star-outline', label: 'Excité', color: '#FF6B6B' }
        ];

        const handleAddEmotion = async (emotionType: EmotionType) => {
            try {
                triggerHaptic.selection();
                triggerHaptic.selection();
                await EmotionService.addEmotion(alterId as string, emotionType, 3);
                const config = EMOTION_CONFIG.find(e => e.type === emotionType);
                toast.showToast(`Emotion enregistrée: ${config?.label || emotionType}`, 'success');
                loadLatestEmotion(); // Refresh display
            } catch (error) {
                console.error('Failed to add emotion:', error);
                toast.showToast("Erreur lors de l'enregistrement", 'error');
            }
        };

        const currentEmotionConfig = latestEmotion ? EMOTION_CONFIG.find(e => e.type === latestEmotion.emotion) : null;

        return (
            <ScrollView style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Comment te sens-tu, {alter.name} ?</Text>

                {/* Emotion Grid */}
                <View style={styles.emotionGrid}>
                    {EMOTION_CONFIG.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.emotionButton, { borderColor: item.color + '40', borderWidth: 1 }]}
                            onPress={() => handleAddEmotion(item.type)}
                        >
                            <Ionicons name={item.icon} size={32} color={item.color} />
                            <Text style={[styles.emotionLabel, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {latestEmotion ? (
                    <View style={styles.emotionStatusContainer}>
                        <View style={[styles.emotionStatusIcon, { backgroundColor: (currentEmotionConfig?.color || colors.primary) + '20' }]}>
                            <Ionicons name={currentEmotionConfig?.icon || 'heart-outline'} size={24} color={currentEmotionConfig?.color || colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.emotionStatusText}>
                                Actuellement <Text style={{ fontWeight: 'bold', color: currentEmotionConfig?.color || colors.text }}>{currentEmotionConfig?.label || EMOTION_LABELS[latestEmotion.emotion]}</Text>
                            </Text>
                            <Text style={styles.emotionStatusTime}>
                                {timeAgo(latestEmotion.created_at) ? `Depuis ${timeAgo(latestEmotion.created_at)}` : "À l'instant"}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyTitle}>Suivi émotionnel</Text>
                        <Text style={styles.emptySubtitle}>
                            Enregistrer les émotions de {alter.name} pour suivre son bien-être au fil du temps.
                        </Text>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderSearch = () => (
        <View style={styles.tabContent}>
            <TouchableOpacity
                style={styles.searchContainer}
                onPress={() => router.push('/(tabs)/search')}
            >
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <Text style={styles.searchInputPlaceholder}>Rechercher des profils...</Text>
            </TouchableOpacity>
            <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Recherche</Text>
                <Text style={styles.emptySubtitle}>
                    Appuyez sur la barre de recherche pour trouver des amis, d'autres alters ou des personnes extérieures.
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
                    <Text style={styles.settingText}>Abonnés proches</Text>
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
                    {/* Search */}
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => {
                            setActiveTab('search');
                        }}
                    >
                        <Ionicons name="search" size={26} color={colors.text} />
                    </TouchableOpacity>
                    {/* Notifications */}
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => {
                            router.push('/(tabs)/notifications');
                        }}
                    >
                        <Ionicons name="heart-outline" size={26} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {activeTab === 'feed' && renderFeed()}
                {activeTab === 'search' && renderSearch()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'journal' && renderJournal()}
                {activeTab === 'gallery' && renderGallery()}
                {activeTab === 'emotions' && renderEmotions()}
                {activeTab === 'settings' && renderSettings()}
            </View>

            {/* ==================== NEW BOTTOM NAVIGATION ==================== */}
            {/* 3 buttons: Home (feed), + (create post), Menu (hamburger) */}
            {/* ==================== RESTORED BOTTOM NAVIGATION ==================== */}
            <View style={styles.bottomTabs}>
                {/* 1. Feed */}
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => {
                        triggerHaptic.selection();
                        setActiveTab('feed');
                    }}
                >
                    <Ionicons
                        name={activeTab === 'feed' ? 'home' : 'home-outline'}
                        size={24}
                        color={activeTab === 'feed' ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'feed' && styles.tabLabelActive]}>Feed</Text>
                </TouchableOpacity>

                {/* 2. Journal */}
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => {
                        triggerHaptic.selection();
                        setActiveTab('journal');
                    }}
                >
                    <Ionicons
                        name={activeTab === 'journal' ? 'book' : 'book-outline'}
                        size={24}
                        color={activeTab === 'journal' ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'journal' && styles.tabLabelActive]}>Journal</Text>
                </TouchableOpacity>

                {/* 3. + Create (Middle) */}
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => {
                        triggerHaptic.medium();
                        router.push('/post/create');
                    }}
                >
                    <View style={styles.createButtonGradient}>
                        <Ionicons name="add" size={32} color="#FFF" />
                    </View>
                </TouchableOpacity>

                {/* 4. Profile */}
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => {
                        triggerHaptic.selection();
                        setActiveTab('profile');
                    }}
                >
                    <Ionicons
                        name={activeTab === 'profile' ? 'person' : 'person-outline'}
                        size={24}
                        color={activeTab === 'profile' ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profil</Text>
                </TouchableOpacity>

                {/* 5. Profile */}
                {/* 5. Menu */}
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => {
                        triggerHaptic.selection();
                        setMenuVisible(true);
                    }}
                >
                    <Ionicons
                        name="menu"
                        size={24}
                        color={colors.textMuted}
                    />
                    <Text style={styles.tabLabel}>Menu</Text>
                </TouchableOpacity>
            </View>


            {/* Menu Modal */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuBackdrop} />
                </TouchableOpacity>

                <View style={styles.menuDrawer}>
                    <View style={styles.menuHandle} />
                    <View style={styles.menuHeader}>
                        <Text style={styles.menuTitle}>Menu</Text>
                        <TouchableOpacity
                            style={styles.menuCloseBtn}
                            onPress={() => setMenuVisible(false)}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Journal */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            setActiveTab('journal');
                        }}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#3BA55C30' }]}>
                            <Ionicons name="book" size={22} color="#3BA55C" />
                        </View>
                        <Text style={styles.menuItemText}>Journal</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* Gallery */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            setActiveTab('gallery');
                        }}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#FAA61A30' }]}>
                            <Ionicons name="images" size={22} color="#FAA61A" />
                        </View>
                        <Text style={styles.menuItemText}>Galerie Privée</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* History */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            router.push('/history');
                        }}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#F0B13230' }]}>
                            <Ionicons name="stats-chart" size={22} color="#F0B132" />
                        </View>
                        <Text style={styles.menuItemText}>Historique & Stats</Text>
                        <View style={[styles.menuBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.menuBadgeText, { color: colors.primary, fontSize: 10 }]}>NOUVEAU</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    {/* Shop */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            router.push('/shop');
                        }}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: `${colors.primary}30` }]}>
                            <Ionicons name="storefront" size={22} color={colors.primary} />
                        </View>
                        <Text style={[styles.menuItemText, { color: colors.primary, fontWeight: '600' }]}>Boutique</Text>
                        <View style={styles.menuBadge}>
                            <Ionicons name="sparkles" size={12} color="#FFF" />
                        </View>
                    </TouchableOpacity>

                    {/* Settings */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            router.push('/settings');
                        }}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#72767D30' }]}>
                            <Ionicons name="settings" size={22} color="#72767D" />
                        </View>
                        <Text style={styles.menuItemText}>Réglages</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Full Screen Image Modal */}
            < Modal
                visible={!!fullScreenImage
                }
                transparent={true}
                onRequestClose={() => setFullScreenImage(null)}
                animationType="fade"
            >
                <View style={[styles.container, { backgroundColor: 'black', justifyContent: 'center' }]}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }}
                        onPress={() => setFullScreenImage(null)}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: fullScreenImage || '' }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                </View>
            </Modal >
        </View >
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
    emotionStatusContainer: {
        alignItems: 'center',
        marginTop: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        marginHorizontal: spacing.md,
    },
    emotionStatusEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    emotionStatusText: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    emotionStatusTime: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    // Styles pour la Galerie Privée
    galleryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    addPhotoButton: {
        padding: spacing.xs,
    },
    storageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    storageText: {
        ...typography.caption,
        color: colors.textSecondary,
        flex: 1,
    },
    cloudBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.primary}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    cloudBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.primary,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing.md,
        gap: spacing.xs,
    },
    premiumSection: {
        marginTop: spacing.xl,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: `${colors.primary}40`,
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    premiumTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    premiumBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    premiumBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    premiumDescription: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    // ==================== NEW NAVIGATION STYLES ====================
    tabLabel: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2,
    },
    tabLabelActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    createButton: {
        marginTop: -20,
    },
    createButtonGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    // ==================== MENU DRAWER STYLES ====================
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    menuBackdrop: {
        flex: 1,
    },
    menuDrawer: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        paddingHorizontal: spacing.lg,
    },
    menuHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    menuTitle: {
        ...typography.h3,
        color: colors.text,
        fontWeight: '700',
    },
    menuCloseBtn: {
        padding: 8,
        backgroundColor: `${colors.textMuted}20`,
        borderRadius: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
    },
    menuIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        ...typography.body,
        color: colors.text,
        flex: 1,
        fontSize: 16,
    },
    menuDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    menuBadge: {
        backgroundColor: `${colors.primary}20`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    menuBadgeText: {
        fontSize: 14,
    },
    // ==================== INSTAGRAM PROFILE STYLES ====================
    profileContainer: {
        paddingTop: 16,
        paddingBottom: 0,
        backgroundColor: colors.background,
    },
    topProfileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    avatarColumn: {
        alignItems: 'center',
        marginRight: 24,
    },
    profileAvatarContainer: {
        width: 86,
        height: 86,
        borderRadius: 43,
        padding: 3,
        borderWidth: 2,
        marginBottom: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileAvatarImage: {
        width: '100%',
        height: '100%',
    },
    profileAvatarText: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        maxWidth: 90,
        textAlign: 'center',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginRight: 16,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 0,
    },
    statLabel: {
        fontSize: 13,
        color: colors.text,
    },
    bioContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    bioPronouns: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    bioRoleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    bioRoleText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    bioText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 10,
    },
    profileActionButton: {
        flex: 1,
        backgroundColor: colors.backgroundCard !== '#ffffff' ? colors.backgroundCard : '#EFEFEF',
        paddingVertical: 7,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    primaryActionButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    profileActionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    primaryActionButtonText: {
        color: '#FFF',
    },
    feedTabsStrip: {
        flexDirection: 'row',
        height: 48,
        borderTopWidth: 0,
        borderBottomWidth: 1,
        borderColor: colors.border,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    feedTabIcon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    feedTabIconActive: {
        borderBottomWidth: 1,
        borderBottomColor: colors.text,
    },
    postGridContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    gridImageContainer: {
        width: width / 3,
        height: width / 3,
        borderWidth: 0.5,
        borderColor: colors.background,
    },
    gridImageContent: {
        width: '100%',
        height: '100%',
    },
    gridTextContent: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridTextPreview: {
        fontSize: 10,
        color: colors.text,
        textAlign: 'center',
    },
    emptyGridState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyGridIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: colors.text,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyGridTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    emptyGridSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },
    emotionLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    emotionStatusIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
});
