import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Text,
    ScrollView,
    Platform,
    ActionSheetIOS,
    Image
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useNotificationContext } from '../../../src/contexts/NotificationContext';
import { FriendService } from '../../../src/services/friends';
import { PasswordService } from '../../../src/services/PasswordService';
import { Feed } from '../../../src/components/Feed';
import { StoriesBar } from '../../../src/components/StoriesBar';
import { colors, spacing, typography } from '../../../src/lib/theme';
import { getThemeColors } from '../../../src/lib/cosmetics';
import { triggerHaptic } from '../../../src/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Snowfall } from '../../../src/components/effects/Snowfall';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';

// Components
import { ProfileHeader } from '../../../src/components/alter-space/ProfileHeader';
import ShopUI from '../../../src/components/shop/ShopUI';
import { AlterGrid } from '../../../src/components/alter-space/AlterGrid';
import { AlterJournal } from '../../../src/components/alter-space/AlterJournal';
import { AlterGallery } from '../../../src/components/alter-space/AlterGallery';
import { AlterEmotions } from '../../../src/components/alter-space/AlterEmotions';
import { AlterSettings } from '../../../src/components/alter-space/AlterSettings';
import { FollowListModal } from '../../../src/components/alter-space/FollowListModal';
import { PasswordModal } from '../../../src/components/alter-space/PasswordModal';
import { useAlterData } from '../../../src/hooks/useAlterData';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

type TabType = 'feed' | 'profile' | 'journal' | 'gallery' | 'emotions' | 'settings' | 'menu' | 'shop';

export default function AlterSpaceScreen() {
    const insets = useSafeAreaInsets();
    const { alterId, tab } = useLocalSearchParams<{ alterId: string; tab?: string }>();
    const { alters, currentAlter, user } = useAuth(); // currentAlter is the one viewing
    const { unreadCount } = useNotificationContext();

    // We can't determine isOwner immediately inside useState because user might be loading, but we can default safely
    // However, it's safer to use an effect or derived state if possible. 
    // For now, let's keep it simple: if we are visiting, we likely want 'profile' by default unless specified.
    const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || 'feed');

    // Custom Hook for Data Fetching
    const {
        alter,
        posts,
        friendCount,
        followingCount,
        friendIds,
        followingIds,
        loading,
        refreshing,
        error,
        refresh
    } = useAlterData(alterId);

    const [friendStatus, setFriendStatus] = useState<string>('none');
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);

    // Password protection state
    const [isPasswordLocked, setIsPasswordLocked] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Logic updated per user request: Even if we are the System Admin (user.uid === systemId),
    // if we are currently "fronting" as Alter A (Mona) and viewing Alter B (Zeph),
    // we should see the profile as a VISITOR, not as an owner.
    // "Owner" view is restricted to when the viewed alter IS the current active alter.
    const isSystemOwner = alter && user ? (user.uid === (alter.systemId || alter.system_id || alter.userId)) : false;
    const isSameAlter = alter && currentAlter ? alter.id === currentAlter.id : false;

    // Fallback: If no custom status is active (System Mode), we might allow editing, 
    // FIX: System owner has full access to ALL their alters including subsystem alters
    const isOwner = isSystemOwner;

    // Check relationship status
    useFocusEffect(
        useCallback(() => {
            const check = async () => {
                if (alterId && currentAlter && alterId !== currentAlter.id) {
                    try {
                        const status = await FriendService.checkStatus(currentAlter.id, alterId);
                        // Strict check: No fallback to System Friend
                        setFriendStatus(status);
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            check();
        }, [alterId, currentAlter])
    );

    // Enforce "Profile" view for visitors (Insta-like)
    useEffect(() => {
        if (!loading && !isOwner) {
            setActiveTab('profile');
        }
    }, [loading, isOwner]);


    // Check if password is required to access this AlterSpace
    useEffect(() => {
        // SECURITY: Removed debug logging that exposed sensitive password data
        // Password is required for EVERYONE if the alter has a password set
        // This works like a PIN lock - even the owner must enter the password
        if (!loading && alter && alter.password) {
            setIsPasswordLocked(true);
            setShowPasswordModal(true);
        } else {
            setIsPasswordLocked(false);
        }
    }, [loading, alter]);

    // Handle password verification (async for hash comparison)
    const handlePasswordConfirm = async (enteredPassword: string) => {
        if (!alter || !alter.password) return;

        const isValid = await PasswordService.verifyPassword(enteredPassword, alter.password);

        if (isValid) {
            setIsPasswordLocked(false);
            setShowPasswordModal(false);
            setPasswordError('');
        } else {
            setPasswordError('Mot de passe incorrect');
        }
    };

    const handlePasswordCancel = () => {
        setShowPasswordModal(false);
        router.back();
    };

    // Handle forgot password - system owner can reset
    const handleForgotPassword = async () => {
        if (!isSystemOwner || !alter) return;

        Alert.alert(
            'Réinitialiser le mot de passe',
            `Êtes-vous sûr de vouloir supprimer le mot de passe de ${alter.name} ?\n\nVous pourrez en définir un nouveau dans les paramètres.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { doc, updateDoc } = await import('firebase/firestore');
                            const { db } = await import('../../../src/lib/firebase');
                            const alterRef = doc(db, 'alters', alter.id);
                            await updateDoc(alterRef, { password: null });
                            setIsPasswordLocked(false);
                            setShowPasswordModal(false);
                            setPasswordError('');
                            Alert.alert('Succès', 'Le mot de passe a été supprimé.');
                        } catch (error) {
                            console.error('Error resetting password:', error);
                            Alert.alert('Erreur', 'Impossible de réinitialiser le mot de passe.');
                        }
                    }
                }
            ]
        );
    };

    // Handle Friend Actions (Follow/Unfollow)
    const handleFriendAction = async () => {
        if (!currentAlter || !alterId) return;

        try {
            if (friendStatus === 'friends') {
                // Determine display name (prefer system name if available)
                const targetName = alter ? (alter.name || 'ce profil') : 'ce profil';

                if (Platform.OS === 'ios') {
                    ActionSheetIOS.showActionSheetWithOptions(
                        {
                            options: ['Annuler', 'Se désabonner'],
                            destructiveButtonIndex: 1,
                            cancelButtonIndex: 0,
                            title: `Gérer l'abonnement à ${targetName}`,
                        },
                        async (buttonIndex) => {
                            if (buttonIndex === 1) {
                                await FriendService.removeFriend(currentAlter.id, alterId);
                                setFriendStatus('none');
                                refresh();
                            }
                        }
                    );
                } else {
                    Alert.alert(
                        `Se désabonner de ${targetName} ?`,
                        "Vous ne verrez plus ses publications dans votre fil d'actualité.",
                        [
                            { text: "Annuler", style: "cancel" },
                            {
                                text: "Se désabonner",
                                style: "destructive",
                                onPress: async () => {
                                    await FriendService.removeFriend(currentAlter.id, alterId);
                                    setFriendStatus('none');
                                    refresh();
                                }
                            }
                        ]
                    );
                }
            } else if (friendStatus === 'received') {
                // ... Accept logic (keep existing if detailed logic exists, otherwise default accept)
                await FriendService.acceptRequestByPair(currentAlter.id, alterId);
                setFriendStatus('friends');
                refresh();
            } else if (friendStatus === 'pending') {
                // Cancel request
                await FriendService.cancelRequest(currentAlter.id, alterId);
                setFriendStatus('none');
            } else {
                // Send request
                await FriendService.sendRequest(currentAlter.id, alterId);
                setFriendStatus('pending');
            }
        } catch (error) {
            console.error('Error handling friend action:', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'action.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !alter) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.notFoundText}>{error || "Alter non trouvé"}</Text>
                </View>
            </View>
        );
    }

    // Show password modal if locked
    if (isPasswordLocked) {
        const themeColorsLocked = getThemeColors(alter?.equipped_items?.theme);
        return (
            <View style={[styles.container, { backgroundColor: themeColorsLocked?.background || colors.background }]}>
                <View style={[styles.header, { borderBottomColor: themeColorsLocked?.border || colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={themeColorsLocked?.text || colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColorsLocked?.text || colors.text }]}>{alter.name}</Text>
                    <View style={styles.headerRight} />
                </View>
                <PasswordModal
                    visible={showPasswordModal}
                    onConfirm={handlePasswordConfirm}
                    onCancel={handlePasswordCancel}
                    onForgotPassword={handleForgotPassword}
                    alterName={alter.name}
                    error={passwordError}
                    themeColors={themeColorsLocked || undefined}
                    isSystemOwner={isSystemOwner}
                />
            </View>
        );
    }

    // --- THEME & COSMETICS ---

    const themeColors = getThemeColors(alter?.equipped_items?.theme);
    const backgroundStyle = { backgroundColor: themeColors?.background || colors.background };
    const activeColor = themeColors?.primary || colors.primary;
    const inactiveColor = themeColors?.textSecondary || colors.textSecondary;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                // Filter posts based on privacy settings
                // User Request: Strict Friends Only (regardless of post public status)
                // "tant que les deux ne sont pas amis alors il ne peuvent pas voir post ou storie"

                // If not owner and not friends, show Private State (via AlterGrid isPrivate prop)
                const isPrivate = !isOwner && friendStatus !== 'friends';

                // If private, we pass empty posts effectively (though AlterGrid handles the UI)
                // If visible, we might still respect 'post.visibility' but user implies blocking everything.
                // Assuming once friends, normal rules apply? 
                // "tant que les deux ne sont pas amis..." implies once friends, they CAN see.
                // So normal visibility rules should apply IF friends.
                // But user says: "not friends -> cannot see".
                // I will strictly enforce: if not friends, everything is hidden (private).

                const visiblePosts = isPrivate ? [] : posts.filter(post => {
                    if (isOwner) return true;
                    if (post.visibility === 'public') return true;
                    if (post.visibility === 'friends' && friendStatus === 'friends') return true;
                    return false;
                });

                return (
                    <View style={[styles.tabContent, backgroundStyle]}>
                        <AlterGrid
                            posts={visiblePosts}
                            loading={loading}
                            refreshing={refreshing}
                            onRefresh={refresh}
                            alterName={alter.name}
                            themeColors={themeColors}
                            listHeaderComponent={
                                <ProfileHeader
                                    alter={alter}
                                    loading={loading}
                                    isOwner={isOwner}
                                    stats={{ posts: visiblePosts.length, followers: friendCount, following: followingCount }}
                                    friendStatus={friendStatus}
                                    onFriendAction={handleFriendAction}
                                    onFollowersPress={() => setShowFollowersModal(true)}
                                    onFollowingPress={() => setShowFollowingModal(true)}

                                    themeColors={themeColors}
                                    friendIds={friendIds}
                                    onAvatarPress={() => {
                                        if (isOwner || friendStatus === 'friends') {
                                            router.push({ pathname: '/story/view', params: { authorId: alter.id } });
                                        } else {
                                            if (Platform.OS === 'ios') {
                                                Alert.alert("Privé", "Vous devez être ami pour voir la story.");
                                            } else {
                                                // Android standard toast or alert
                                                Alert.alert("Accès refusé", "Seuls les amis peuvent voir les stories.");
                                            }
                                        }
                                    }}
                                />
                            }
                            alterId={alter.id}
                            isPrivate={isPrivate}
                        />
                    </View>
                );
            case 'feed':
                // Social Feed View
                return (
                    <View style={[styles.tabContent, backgroundStyle]}>
                        <Feed
                            type="friends"
                            alterId={alterId}
                            themeColors={themeColors}
                            ListHeaderComponent={
                                <>
                                    <StoriesBar
                                        friendIds={friendIds}
                                        onStoryPress={(authorId) => router.push({ pathname: '/story/view', params: { authorId } })}
                                        themeColors={themeColors}
                                        profileAlter={alter}
                                    />
                                </>
                            }
                        />
                    </View>
                );

            case 'shop':
                return <ShopUI isEmbedded={true} />;

            case 'menu':
                return (
                    <ScrollView style={[{ flex: 1 }, backgroundStyle]} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: themeColors?.text || colors.text }}>Menu</Text>

                        {isOwner ? (
                            <>
                                {/* Section: Espace Personnel - Only for owner */}
                                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors?.textSecondary || colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Réseaux Sociaux (Contexte Isolé)</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/social_web', params: { alterId: alter.id, platform: 'tiktok' } })}>
                                    <Ionicons name="logo-tiktok" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>TikTok</Text>
                                    <View style={{ flex: 1 }} />
                                    <StatusBadge status="beta" />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/social_web', params: { alterId: alter.id, platform: 'instagram' } })}>
                                    <Ionicons name="logo-instagram" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Instagram</Text>
                                    <View style={{ flex: 1 }} />
                                    <StatusBadge status="beta" />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>

                                <View style={{ height: 30 }} />

                                {/* Section: Studio IA */}
                                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors?.textSecondary || colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Studio de Création</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push(`/alter-space/${alter.id}/ai-studio`)}>
                                    <Ionicons name="sparkles" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Studio IA</Text>
                                    <View style={{ flex: 1 }} />
                                    <StatusBadge status="new" />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>

                                <View style={{ height: 30 }} />

                                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors?.textSecondary || colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Espace Personnel</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('journal')}>
                                    <Ionicons name="book-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Journal</Text>
                                    <View style={{ flex: 1 }} />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('gallery')}>
                                    <Ionicons name="images-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Galerie</Text>
                                    <View style={{ flex: 1 }} />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/inner-world', params: { alterId: alter.id } })}>
                                    <Ionicons name="planet-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Inner World</Text>
                                    <View style={{ flex: 1 }} />
                                    <StatusBadge status="beta" />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>

                                <View style={{ height: 30 }} />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors?.textSecondary || colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Système</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('settings')}>
                                    <Ionicons name="settings-outline" size={24} color={themeColors?.text || colors.text} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Paramètres</Text>
                                    <View style={{ flex: 1 }} />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* For visitors - only show public actions */}
                                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors?.textSecondary || colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Actions</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={handleFriendAction}>
                                    <Ionicons name={friendStatus === 'friends' ? "checkmark-circle" : "person-add-outline"} size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>
                                        {friendStatus === 'friends' ? 'Abonné' : friendStatus === 'pending' ? 'Demande envoyée' : "S'abonner"}
                                    </Text>
                                    <View style={{ flex: 1 }} />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/(tabs)/messages', params: { senderId: alter.id } })}>
                                    <Ionicons name="chatbubble-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Messages</Text>
                                    <View style={{ flex: 1 }} />
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                );
            case 'journal':
                return <AlterJournal alter={alter} themeColors={themeColors} />;
            case 'gallery':
                return <AlterGallery alter={alter} isCloudEnabled={false} themeColors={themeColors} />;
            case 'emotions':
                return <AlterEmotions alterId={alter.id} alterName={alter.name} themeColors={themeColors} />;
            case 'settings':
                return <AlterSettings alter={alter} themeColors={themeColors ?? undefined} />;
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, backgroundStyle]}>
            {/* Main Header (Navigation) */}
            <View style={[styles.header, backgroundStyle, { borderBottomColor: themeColors?.border || colors.border }]}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard')} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={28} color={themeColors?.text || colors.text} />
                </TouchableOpacity>
                {(alter.avatar || alter.avatar_url) && (
                    <Image
                        source={{ uri: alter.avatar || alter.avatar_url }}
                        style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
                    />
                )}
                <Text style={[styles.headerTitle, { color: themeColors?.text || colors.text }]} numberOfLines={1}>{alter.name}</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => router.push('/search' as any)} style={{ marginRight: 12 }}>
                        <Ionicons name="search-outline" size={24} color={themeColors?.text || colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} style={{ marginRight: 12 }}>
                        <View>
                            <Ionicons name="notifications-outline" size={24} color={themeColors?.text || colors.text} />
                            {unreadCount > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    backgroundColor: 'red',
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    borderWidth: 1,
                                    borderColor: colors.background
                                }} />
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/shop', params: { alterId } })} style={{ marginRight: 12 }}>
                        <Ionicons name="storefront-outline" size={24} color="#A855F7" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/messages', params: { senderId: alterId } })}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={themeColors?.text || colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <ErrorBoundary>
                {renderContent()}
            </ErrorBoundary>

            {/* Bottom Tab Bar (Custom for Alter Space navigation) - Only for Owner */}
            {isOwner && (
                <View style={[styles.bottomBar, {
                    backgroundColor: themeColors?.backgroundCard || colors.surface,
                    borderTopColor: themeColors?.border || colors.border,
                    paddingBottom: 20 + (Platform.OS === 'android' ? insets.bottom : 0)
                }]}>
                    {/* 1. Accueil / Feed */}
                    <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('feed')}>
                        <Ionicons name={activeTab === 'feed' ? "home" : "home-outline"} size={24} color={activeTab === 'feed' ? activeColor : inactiveColor} />
                        <Text style={{ fontSize: 10, color: activeTab === 'feed' ? activeColor : inactiveColor, marginTop: 4 }}>Accueil</Text>
                    </TouchableOpacity>

                    {/* 2. Emotions */}
                    <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('emotions')}>
                        <Ionicons name={activeTab === 'emotions' ? "heart" : "heart-outline"} size={24} color={activeTab === 'emotions' ? activeColor : inactiveColor} />
                        <Text style={{ fontSize: 10, color: activeTab === 'emotions' ? activeColor : inactiveColor, marginTop: 4 }}>Émotions</Text>
                    </TouchableOpacity>

                    {/* 3. Post (+) */}
                    <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => {
                        // Navigate to create post
                        router.push('/post/create');
                    }}>
                        <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: activeColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: -24,
                            shadowColor: activeColor,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 5,
                        }}>
                            <Ionicons name="add" size={32} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* 4. Profil */}
                    <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('profile')}>
                        <Ionicons name={activeTab === 'profile' ? "person" : "person-outline"} size={24} color={activeTab === 'profile' ? activeColor : inactiveColor} />
                        <Text style={{ fontSize: 10, color: activeTab === 'profile' ? activeColor : inactiveColor, marginTop: 4 }}>Profil</Text>
                    </TouchableOpacity>

                    {/* 5. Menu */}
                    <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('menu')}>
                        <Ionicons name={activeTab === 'menu' ? "menu" : "menu-outline"} size={24} color={activeTab === 'menu' ? activeColor : inactiveColor} />
                        <Text style={{ fontSize: 10, color: activeTab === 'menu' ? activeColor : inactiveColor, marginTop: 4 }}>Menu</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modals */}
            <FollowListModal
                visible={showFollowersModal}
                title="Abonnés"
                userIds={friendIds}
                onClose={() => setShowFollowersModal(false)}
                themeColors={themeColors}
                onSync={async (missingIds, duplicateIds) => {
                    try {
                        if (!alter) return;
                        console.log('Cleaning up followers issues. Missing:', missingIds, 'Duplicates:', duplicateIds);

                        // Ghosts: remove completely
                        if (missingIds.length > 0) {
                            await Promise.all(missingIds.map(id => FriendService.removeFriend(alter.id, id)));
                        }

                        // Duplicates: remove extra connections
                        // For "Followers" list: I am 'friendId' (followee), they are 'alterId' (follower)
                        // The 'friendIds' array passed here contains the IDs of people following me.
                        // So we check duplicates where alterId=THEM, friendId=ME.
                        if (duplicateIds && duplicateIds.length > 0) {
                            await Promise.all(duplicateIds.map(otherId => FriendService.deduplicateConnection(otherId, alter.id)));
                        }

                        refresh();
                    } catch (e) {
                        console.error('Error in followers sync:', e);
                    }
                }}
                canRemove={isOwner}
                onRemove={async (id) => {
                    Alert.alert(
                        "Retirer l'abonné",
                        "Voulez-vous retirer cet utilisateur de vos abonnés ?",
                        [
                            { text: "Annuler", style: "cancel" },
                            {
                                text: "Retirer",
                                style: "destructive",
                                onPress: async () => {
                                    try {
                                        if (!alter) return;
                                        await FriendService.removeFriend(id, alter.id);
                                        refresh();
                                    } catch (e) {
                                        console.error(e);
                                        Alert.alert("Erreur", "Impossible de retirer l'utilisateur.");
                                    }
                                }
                            }
                        ]
                    );
                }}
            />
            <FollowListModal
                visible={showFollowingModal}
                title="Abonnements"
                userIds={followingIds}
                onClose={() => setShowFollowingModal(false)}
                themeColors={themeColors}
                onSync={async (missingIds, duplicateIds) => {
                    try {
                        if (!alter) return;
                        console.log('Cleaning up following issues. Missing:', missingIds, 'Duplicates:', duplicateIds);

                        // Ghosts
                        if (missingIds.length > 0) {
                            await Promise.all(missingIds.map(id => FriendService.removeFriend(alter.id, id)));
                        }

                        // Duplicates
                        // For "Following" list: I am 'alterId' (follower), they are 'friendId' (followee)
                        // The 'followingIds' array contains IDs of people I follow.
                        // So we check duplicates where alterId=ME, friendId=THEM.
                        if (duplicateIds && duplicateIds.length > 0) {
                            await Promise.all(duplicateIds.map(otherId => FriendService.deduplicateConnection(alter.id, otherId)));
                        }

                        refresh();
                    } catch (e) {
                        console.error('Error in following sync:', e);
                    }
                }}
                canRemove={isOwner}
                onRemove={async (id) => {
                    Alert.alert(
                        "Se désabonner",
                        "Voulez-vous ne plus suivre cet utilisateur ?",
                        [
                            { text: "Annuler", style: "cancel" },
                            {
                                text: "Se désabonner",
                                style: "destructive",
                                onPress: async () => {
                                    try {
                                        if (!alter) return;
                                        await FriendService.removeFriend(alter.id, id);
                                        refresh();
                                    } catch (e) {
                                        console.error(e);
                                        Alert.alert("Erreur", "Impossible de se désabonner.");
                                    }
                                }
                            }
                        ]
                    );
                }}
            />

            {/* Effects */}
            {alter?.equipped_items?.theme === 'theme_winter' && <Snowfall />}
        </View>
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
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: 60, // Adjust for status bar
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        ...typography.h3,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: spacing.xs,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notFoundText: {
        fontSize: 18,
        color: colors.text,
        marginLeft: spacing.lg,
    },
    tabContent: {
        flex: 1,
    },
    feedHeaderContainer: {
        marginBottom: spacing.xs,
    },
    bottomBar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: 20,
        paddingTop: 10,
        justifyContent: 'space-around',
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
        flex: 1, // Distribute evenly
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    }
});
