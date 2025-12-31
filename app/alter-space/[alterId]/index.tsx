import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
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
import { AlterGrid } from '../../../src/components/alter-space/AlterGrid';
import { AlterJournal } from '../../../src/components/alter-space/AlterJournal';
import { AlterGallery } from '../../../src/components/alter-space/AlterGallery';
import { AlterEmotions } from '../../../src/components/alter-space/AlterEmotions';
import { AlterSettings } from '../../../src/components/alter-space/AlterSettings';
import { FollowListModal } from '../../../src/components/alter-space/FollowListModal';
import { useAlterData } from '../../../src/hooks/useAlterData';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

type TabType = 'feed' | 'profile' | 'journal' | 'gallery' | 'emotions' | 'settings' | 'search';

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
                        refreshing={refreshing}
                        onRefresh={refresh}
                        alterName={alter.name}
                        listHeaderComponent={
                            <ProfileHeader
                                alter={alter}
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
                    {/* Tab Switcher for Demo Purposes - In real app, this might be a bottom bar or segment control */}
                    <TouchableOpacity onPress={() => setActiveTab(activeTab === 'feed' ? 'profile' : 'feed')}>
                        <Ionicons name={activeTab === 'feed' ? "grid-outline" : "newspaper-outline"} size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <ErrorBoundary>
                {renderContent()}
            </ErrorBoundary>

            {/* Bottom Tab Bar (Custom for Alter Space navigation) */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('feed')}>
                    <Ionicons name={activeTab === 'feed' ? "home" : "home-outline"} size={24} color={activeTab === 'feed' ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('journal')}>
                    <Ionicons name={activeTab === 'journal' ? "book" : "book-outline"} size={24} color={activeTab === 'journal' ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('gallery')}>
                    <Ionicons name={activeTab === 'gallery' ? "images" : "images-outline"} size={24} color={activeTab === 'gallery' ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('emotions')}>
                    <Ionicons name={activeTab === 'emotions' ? "heart" : "heart-outline"} size={24} color={activeTab === 'emotions' ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
                {isOwner && (
                    <TouchableOpacity style={[styles.tabButton, { minHeight: 44, justifyContent: 'center' }]} onPress={() => setActiveTab('settings')}>
                        <Ionicons name={activeTab === 'settings' ? "settings" : "settings-outline"} size={24} color={activeTab === 'settings' ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                )}
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
        width: 40,
        alignItems: 'flex-end',
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
    },
});
