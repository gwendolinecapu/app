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
    ActionSheetIOS
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useNotificationContext } from '../../../src/contexts/NotificationContext';
import { FriendService } from '../../../src/services/friends';
import { Feed } from '../../../src/components/Feed';
import { StoriesBar } from '../../../src/components/StoriesBar';
import { colors, spacing, typography } from '../../../src/lib/theme';
import { getThemeColors } from '../../../src/lib/cosmetics';
import { triggerHaptic } from '../../../src/lib/haptics';
import { Ionicons } from '@expo/vector-icons';

// Components
import { ProfileHeader } from '../../../src/components/alter-space/ProfileHeader';
import { ShopUI } from '../../../src/components/shop/ShopUI';
import { AlterGrid } from '../../../src/components/alter-space/AlterGrid';
import { AlterJournal } from '../../../src/components/alter-space/AlterJournal';
import { AlterGallery } from '../../../src/components/alter-space/AlterGallery';
import { AlterEmotions } from '../../../src/components/alter-space/AlterEmotions';
import { AlterSettings } from '../../../src/components/alter-space/AlterSettings';
import { FollowListModal } from '../../../src/components/alter-space/FollowListModal';
import { useAlterData } from '../../../src/hooks/useAlterData';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

type TabType = 'feed' | 'profile' | 'journal' | 'gallery' | 'emotions' | 'settings' | 'menu' | 'shop';

export default function AlterSpaceScreen() {
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

    // Logic updated per user request: Even if we are the System Admin (user.uid === systemId),
    // if we are currently "fronting" as Alter A (Mona) and viewing Alter B (Zeph),
    // we should see the profile as a VISITOR, not as an owner.
    // "Owner" view is restricted to when the viewed alter IS the current active alter.
    const isSystemOwner = alter && user ? (user.uid === (alter.systemId || alter.system_id || alter.userId)) : false;
    const isSameAlter = alter && currentAlter ? alter.id === currentAlter.id : false;

    // Fallback: If no custom status is active (System Mode), we might allow editing, 
    // but assuming strict roleplay: isOwner requires matching IDs.
    const isOwner = isSystemOwner && isSameAlter;

    // Check relationship status
    useFocusEffect(
        useCallback(() => {
            if (alterId && currentAlter && alterId !== currentAlter.id) {
                FriendService.checkStatus(currentAlter.id, alterId).then(setFriendStatus).catch(console.error);
            }
        }, [alterId, currentAlter])
    );

    // Enforce "Profile" view for visitors (Insta-like)
    useEffect(() => {
        if (!loading && !isOwner) {
            setActiveTab('profile');
        }
    }, [loading, isOwner]);

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

    // --- THEME & COSMETICS ---

    const themeColors = getThemeColors(alter?.equipped_items?.theme);
    const backgroundStyle = { backgroundColor: themeColors?.background || colors.background };
    const activeColor = themeColors?.primary || colors.primary;
    const inactiveColor = themeColors?.textSecondary || colors.textSecondary;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                // Grid View
                return (
                    <View style={[styles.tabContent, backgroundStyle]}>
                        <AlterGrid
                            posts={posts}
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
                                    stats={{ posts: posts.length, followers: friendCount, following: followingCount }}
                                    friendStatus={friendStatus}
                                    onFriendAction={handleFriendAction}
                                    onFollowersPress={() => setShowFollowersModal(true)}
                                    onFollowingPress={() => setShowFollowingModal(true)}
                                    themeColors={themeColors}
                                />
                            }
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
                                    <View style={styles.feedHeaderContainer}>
                                        <ProfileHeader
                                            alter={alter}
                                            loading={loading}
                                            isOwner={isOwner}
                                            stats={{ posts: posts.length, followers: friendCount, following: followingCount }}
                                            friendStatus={friendStatus}
                                            onFriendAction={handleFriendAction}
                                            onFollowersPress={() => setShowFollowersModal(true)}
                                            onFollowingPress={() => setShowFollowingModal(true)}
                                            themeColors={themeColors}
                                        />
                                    </View>
                                    <StoriesBar
                                        friendIds={friendIds}
                                        onStoryPress={(authorId) => router.push({ pathname: '/story/view', params: { authorId } })}
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
                                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors?.textSecondary || colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Espace Personnel</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('journal')}>
                                    <Ionicons name="book-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Journal</Text>
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('gallery')}>
                                    <Ionicons name="images-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Galerie</Text>
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('emotions')}>
                                    <Ionicons name="heart-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Émotions</Text>
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>

                                <View style={{ height: 30 }} />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors?.textSecondary || colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Système</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('settings')}>
                                    <Ionicons name="settings-outline" size={24} color={themeColors?.text || colors.text} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Paramètres</Text>
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
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/(tabs)/messages', params: { senderId: alter.id } })}>
                                    <Ionicons name="chatbubble-outline" size={24} color={activeColor} style={{ marginRight: 15 }} />
                                    <Text style={[styles.menuItemText, { color: themeColors?.text || colors.text }]}>Messages</Text>
                                    <Ionicons name="chevron-forward" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                );
            case 'journal':
                return <AlterJournal alter={alter} />;
            case 'gallery':
                return <AlterGallery alter={alter} isCloudEnabled={false} />;
            case 'emotions':
                return <AlterEmotions alterId={alter.id} alterName={alter.name} themeColors={themeColors} />;
            case 'settings':
                return <AlterSettings alter={alter} />;
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
                <View style={[styles.bottomBar, { backgroundColor: themeColors?.backgroundCard || colors.surface, borderTopColor: themeColors?.border || colors.border }]}>
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
            />
            <FollowListModal
                visible={showFollowingModal}
                title="Suivis"
                userIds={followingIds}
                onClose={() => setShowFollowingModal(false)}
            />
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
