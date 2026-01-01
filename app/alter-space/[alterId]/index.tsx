import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Text,
    ScrollView
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { FriendService } from '../../../src/services/friends';
import { Feed } from '../../../src/components/Feed';
import { StoriesBar } from '../../../src/components/StoriesBar';
import { colors, spacing, typography } from '../../../src/lib/theme';
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

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                // Grid View
                return (
                    <AlterGrid
                        posts={posts}
                        loading={loading}
                        refreshing={refreshing}
                        onRefresh={refresh}
                        alterName={alter.name}
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
                            />
                        }
                    />
                );
            case 'feed':
                // Social Feed View
                return (
                    <View style={styles.tabContent}>
                        <Feed
                            type="friends"
                            alterId={alterId}
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
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: colors.text }}>Menu</Text>

                        {isOwner ? (
                            <>
                                {/* Section: Espace Personnel - Only for owner */}
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Espace Personnel</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('journal')}>
                                    <Ionicons name="book-outline" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                                    <Text style={styles.menuItemText}>Journal</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('gallery')}>
                                    <Ionicons name="images-outline" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                                    <Text style={styles.menuItemText}>Galerie</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('emotions')}>
                                    <Ionicons name="heart-outline" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                                    <Text style={styles.menuItemText}>Émotions</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <View style={{ height: 30 }} />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Système</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab('settings')}>
                                    <Ionicons name="settings-outline" size={24} color={colors.text} style={{ marginRight: 15 }} />
                                    <Text style={styles.menuItemText}>Paramètres</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* For visitors - only show public actions */}
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.7 }}>Actions</Text>

                                <TouchableOpacity style={styles.menuItem} onPress={handleFriendAction}>
                                    <Ionicons name={friendStatus === 'friends' ? "checkmark-circle" : "person-add-outline"} size={24} color={colors.primary} style={{ marginRight: 15 }} />
                                    <Text style={styles.menuItemText}>
                                        {friendStatus === 'friends' ? 'Abonné' : friendStatus === 'pending' ? 'Demande envoyée' : "S'abonner"}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push({ pathname: '/(tabs)/messages', params: { senderId: alter.id } })}>
                                    <Ionicons name="chatbubble-outline" size={24} color={colors.primary} style={{ marginRight: 15 }} />
                                    <Text style={styles.menuItemText}>Messages</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
                return <AlterEmotions alterId={alter.id} alterName={alter.name} />;
            case 'settings':
                return <AlterSettings alter={alter} />;
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Main Header (Navigation) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard')} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{alter.name}</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => router.push('/search' as any)} style={{ marginRight: 12 }}>
                        <Ionicons name="search-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/shop' as any)} style={{ marginRight: 12 }}>
                        <Ionicons name="storefront-outline" size={24} color="#A855F7" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/messages', params: { senderId: alterId } })}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <ErrorBoundary>
                {renderContent()}
            </ErrorBoundary>

            {/* Bottom Tab Bar (Custom for Alter Space navigation) */}
            <View style={styles.bottomBar}>
                {/* 1. Accueil / Feed */}
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('feed')}>
                    <Ionicons name={activeTab === 'feed' ? "home" : "home-outline"} size={24} color={activeTab === 'feed' ? colors.primary : colors.textSecondary} />
                    <Text style={{ fontSize: 10, color: activeTab === 'feed' ? colors.primary : colors.textSecondary, marginTop: 4 }}>Accueil</Text>
                </TouchableOpacity>

                {/* 2. Emotions */}
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('emotions')}>
                    <Ionicons name={activeTab === 'emotions' ? "heart" : "heart-outline"} size={24} color={activeTab === 'emotions' ? colors.primary : colors.textSecondary} />
                    <Text style={{ fontSize: 10, color: activeTab === 'emotions' ? colors.primary : colors.textSecondary, marginTop: 4 }}>Émotions</Text>
                </TouchableOpacity>

                {/* 3. Post (+) */}
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => {
                    // Navigate to create post, possibly passing alterId if supported or relying on global context
                    router.push('/post/create');
                }}>
                    <View style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: -24,
                        shadowColor: colors.primary,
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
                    <Ionicons name={activeTab === 'profile' ? "person" : "person-outline"} size={24} color={activeTab === 'profile' ? colors.primary : colors.textSecondary} />
                    <Text style={{ fontSize: 10, color: activeTab === 'profile' ? colors.primary : colors.textSecondary, marginTop: 4 }}>Profil</Text>
                </TouchableOpacity>

                {/* 5. Menu */}
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('menu')}>
                    <Ionicons name={activeTab === 'menu' ? "menu" : "menu-outline"} size={24} color={activeTab === 'menu' ? colors.primary : colors.textSecondary} />
                    <Text style={{ fontSize: 10, color: activeTab === 'menu' ? colors.primary : colors.textSecondary, marginTop: 4 }}>Menu</Text>
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
