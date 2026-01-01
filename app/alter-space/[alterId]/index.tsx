import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { FriendService } from '../../../src/services/friends';
import { StoriesBar } from '../../../src/components/StoriesBar';
import { colors, spacing, typography } from '../../../src/lib/theme';
import { triggerHaptic } from '../../../src/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../../../src/lib/cosmetics';

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
    const { alters, currentAlter } = useAuth(); // currentAlter is the one viewing
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

    // Check relationship status
    useFocusEffect(
        useCallback(() => {
            if (alterId && currentAlter && alterId !== currentAlter.id) {
                FriendService.checkStatus(currentAlter.id, alterId).then(setFriendStatus).catch(console.error);
            }
        }, [alterId, currentAlter])
    );

    const isOwner = alter ? alters.some(a => a.id === alter.id) : false;

    // Handle Friend Actions (Follow/Unfollow)
    const handleFriendAction = async () => {
        if (!currentAlter) {
            Alert.alert('Action impossible', 'Vous devez sélectionner un alter actif pour suivre quelqu\'un.');
            return;
        }

        try {
            if (friendStatus === 'none') {
                await FriendService.sendRequest(currentAlter.id, alterId as string);
                setFriendStatus('pending');
                triggerHaptic.success();
                Alert.alert('Succès', 'Demande envoyée !');
            } else if (friendStatus === 'friends') {
                // Already friends/following
                Alert.alert('Abonné', 'Vous suivez déjà ce profil.');
            }
        } catch (e: any) {
            Alert.alert('Erreur', e.message);
        }
    };

    // --- THEME & COSMETICS ---
    const themeColors = getThemeColors(alter?.equipped_items?.theme);
    const backgroundStyle = { backgroundColor: themeColors?.background || colors.background };
    const textStyle = { color: themeColors?.text || colors.text };
    const iconColor = themeColors?.text || colors.text;

    if (loading) {
        return (
            <View style={[styles.loadingContainer, backgroundStyle]}>
                <ActivityIndicator size="large" color={themeColors?.primary || colors.primary} />
            </View>
        );
    }

    if (error || !alter) {
        return (
            <View style={[styles.container, backgroundStyle]}>
                <View style={[styles.header, backgroundStyle]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={iconColor} />
                    </TouchableOpacity>
                    <Text style={[styles.notFoundText, textStyle]}>{error || "Alter non trouvé"}</Text>
                </View>
            </View>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'feed':
                return (
                    <ScrollView
                        style={[styles.tabContent, backgroundStyle]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Stories Bar placed here effectively */}
                        <View style={styles.feedHeaderContainer}>
                            {/* Add stories or quick actions if needed */}
                        </View>
                        <AlterGrid
                            posts={posts}
                            loading={loading || refreshing}
                            refreshing={refreshing}
                            onRefresh={refresh}
                            alterName={alter.name}
                            listHeaderComponent={
                                <ProfileHeader
                                    alter={alter}
                                    isOwner={isOwner}
                                    stats={{
                                        posts: posts.length,
                                        followers: friendCount,
                                        following: followingCount
                                    }}
                                    friendStatus={friendStatus}
                                    onFriendAction={handleFriendAction}
                                    onFollowersPress={() => setShowFollowersModal(true)}
                                    onFollowingPress={() => setShowFollowingModal(true)}
                                />
                            }
                        />
                    </ScrollView>
                );
            case 'profile':
                // Profile is essentially the feed with header for now, or detailed info?
                // Usually Profile tab sends user to 'feed' view but focused on info. 
                // Let's reuse AlterGrid but maybe scrolled to info?
                // Actually in this app 'Profile' usually means the main view provided by 'feed' case generally.
                // Let's just render the Feed view again for now to match default behavior or specific profile details.
                return (
                    <ScrollView style={[styles.tabContent, backgroundStyle]}>
                        <ProfileHeader
                            alter={alter}
                            isOwner={isOwner}
                            stats={{
                                posts: posts.length,
                                followers: friendCount,
                                following: followingCount
                            }}
                            friendStatus={friendStatus}
                            onFriendAction={handleFriendAction}
                            onFollowersPress={() => setShowFollowersModal(true)}
                            onFollowingPress={() => setShowFollowingModal(true)}
                        />
                    </ScrollView>
                );
            case 'journal':
                return <AlterJournal alter={alter} />;
            case 'gallery':
                return <AlterGallery alter={alter} />;
            case 'emotions':
                return <AlterEmotions alterId={alter.id} alterName={alter.name} />;
            case 'settings':
                return <AlterSettings alter={alter} />;
            case 'shop':
                return <ShopUI />;
            case 'menu':
                return (
                    <ScrollView style={[styles.tabContent, { padding: spacing.md }, backgroundStyle]}>
                        <Text style={[typography.h3, { marginBottom: spacing.md, color: textStyle.color }]}>Menu</Text>
                        {isOwner && (
                            <>
                                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors?.border || colors.border }]} onPress={() => setActiveTab('journal')}>
                                    <Ionicons name="book-outline" size={24} color={iconColor} style={{ marginRight: 10 }} />
                                    <Text style={[styles.menuItemText, textStyle]}>Journal</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors?.border || colors.border }]} onPress={() => setActiveTab('gallery')}>
                                    <Ionicons name="images-outline" size={24} color={iconColor} style={{ marginRight: 10 }} />
                                    <Text style={[styles.menuItemText, textStyle]}>Galerie Privée</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors?.border || colors.border }]} onPress={() => setActiveTab('emotions')}>
                                    <Ionicons name="happy-outline" size={24} color={iconColor} style={{ marginRight: 10 }} />
                                    <Text style={[styles.menuItemText, textStyle]}>Humeur & Émotions</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors?.border || colors.border }]} onPress={() => setActiveTab('shop')}>
                                    <Ionicons name="cart-outline" size={24} color={iconColor} style={{ marginRight: 10 }} />
                                    <Text style={[styles.menuItemText, textStyle]}>Boutique</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors?.border || colors.border }]} onPress={() => router.push('/settings')}>
                                    <Ionicons name="settings-outline" size={24} color={iconColor} style={{ marginRight: 10 }} />
                                    <Text style={[styles.menuItemText, textStyle]}>Paramètres Système</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </>
                        )}
                        {!isOwner && (
                            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors?.border || colors.border }]} onPress={() => { }}>
                                <Ionicons name="flag-outline" size={24} color={colors.error} style={{ marginRight: 10 }} />
                                <Text style={[styles.menuItemText, { color: colors.error }]}>Signaler ce profil</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, backgroundStyle]}>
            {/* Header */}
            <View style={[styles.header, backgroundStyle, { borderBottomColor: themeColors?.border || colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={iconColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, textStyle]}>{alter.name}</Text>
                <View style={styles.headerRight}>
                    {/* Search / Notifications placeholders */}
                    <TouchableOpacity style={{ padding: 4 }}>
                        <Ionicons name="search-outline" size={24} color={iconColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <ErrorBoundary>
                {renderContent()}
            </ErrorBoundary>

            {/* Bottom Bar (Custom Navigation) */}
            <View style={[styles.bottomBar, {
                backgroundColor: themeColors?.backgroundCard || colors.surface,
                borderTopColor: themeColors?.border || colors.border
            }]}>
                {/* 1. Home / Feed */}
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('feed')}>
                    <Ionicons name={activeTab === 'feed' ? "home" : "home-outline"} size={24} color={activeTab === 'feed' ? (themeColors?.primary || colors.primary) : (themeColors?.textSecondary || colors.textSecondary)} />
                    <Text style={{ fontSize: 10, color: activeTab === 'feed' ? (themeColors?.primary || colors.primary) : (themeColors?.textSecondary || colors.textSecondary), marginTop: 4 }}>Accueil</Text>
                </TouchableOpacity>

                {/* 2. Message (Quick Access) */}
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => router.push('/messages')}>
                    <Ionicons name="chatbubble-outline" size={24} color={themeColors?.textSecondary || colors.textSecondary} />
                    <Text style={{ fontSize: 10, color: themeColors?.textSecondary || colors.textSecondary, marginTop: 4 }}>Messages</Text>
                </TouchableOpacity>

                {/* 3. Post (+) Button - Prominent */}
                <TouchableOpacity
                    style={{ top: -20 }}
                    onPress={() => router.push('/post/create')}
                >
                    <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: themeColors?.primary || colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: themeColors?.primary || colors.primary,
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
                    <Ionicons name={activeTab === 'profile' ? "person" : "person-outline"} size={24} color={activeTab === 'profile' ? (themeColors?.primary || colors.primary) : (themeColors?.textSecondary || colors.textSecondary)} />
                    <Text style={{ fontSize: 10, color: activeTab === 'profile' ? (themeColors?.primary || colors.primary) : (themeColors?.textSecondary || colors.textSecondary), marginTop: 4 }}>Profil</Text>
                </TouchableOpacity>

                {/* 5. Menu */}
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('menu')}>
                    <Ionicons name={activeTab === 'menu' ? "menu" : "menu-outline"} size={24} color={activeTab === 'menu' ? (themeColors?.primary || colors.primary) : (themeColors?.textSecondary || colors.textSecondary)} />
                    <Text style={{ fontSize: 10, color: activeTab === 'menu' ? (themeColors?.primary || colors.primary) : (themeColors?.textSecondary || colors.textSecondary), marginTop: 4 }}>Menu</Text>
                </TouchableOpacity>
            </View>

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
