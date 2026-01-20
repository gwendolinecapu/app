import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GroupService } from '../../src/services/groups';
import { FriendService } from '../../src/services/friends';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { MessagingService, ConversationMeta } from '../../src/services/messaging';
import { getThemeColors } from '../../src/lib/cosmetics';

interface ConversationItem {
    id: string;
    alter: Alter;
    lastMessage: string;
    time: string;
    unread: number;
}

export default function MessagesScreen() {
    const { alters, currentAlter, system, activeFront } = useAuth();
    const [activeTab, setActiveTab] = useState<'internal' | 'groups' | 'requests' | 'friends'>('internal');

    // Theme colors based on active front alter (consistent with ThemeContext)
    const frontAlter = activeFront.alters[0];
    const themeColors = frontAlter?.equipped_items?.theme
        ? getThemeColors(frontAlter.equipped_items.theme)
        : null;
    const backgroundColor = themeColors?.background || colors.background;
    const textColor = themeColors?.text || colors.text;
    const textSecondaryColor = themeColors?.textSecondary || colors.textSecondary;
    const primaryColor = themeColors?.primary || frontAlter?.color || currentAlter?.color || colors.primary;
    const cardColor = themeColors?.backgroundCard || colors.backgroundCard;

    // State for sorted conversations
    const [sortedInternal, setSortedInternal] = useState<ConversationItem[]>([]);
    const [sortedFriends, setSortedFriends] = useState<ConversationItem[]>([]);

    const [groups, setGroups] = useState<{ id: string; name: string; description?: string }[]>([]);
    const [requests, setRequests] = useState<{ id: string; senderId: string; senderName?: string; receiverId: string }[]>([]);

    const [loadingInternal, setLoadingInternal] = useState(false);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);


    // Load data based on active tab - dependencies are minimal to avoid infinite loops
    // The actual data loading functions use current state internally
    React.useEffect(() => {
        if (activeTab === 'internal' && currentAlter) {
            loadInternalConversations();
        } else if (activeTab === 'groups' && system) {
            loadGroups();
        } else if (activeTab === 'requests' && currentAlter) {
            loadRequests();
        } else if (activeTab === 'friends' && currentAlter) {
            loadFriends();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, system?.id, currentAlter?.id]);

    // Rafraîchir les conversations quand on revient sur cet écran
    useFocusEffect(
        useCallback(() => {
            if (currentAlter) {
                if (activeTab === 'internal') {
                    loadInternalConversations();
                } else if (activeTab === 'friends') {
                    loadFriends();
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [currentAlter?.id, activeTab])
    );

    const loadInternalConversations = async () => {
        if (!currentAlter) return;
        setLoadingInternal(true);
        try {
            // 1. Get all other alters
            const otherAlters = alters.filter(a => a.id !== currentAlter.id);

            // 2. Optimized: Fetch all conversations for currentAlter first (1 query)
            const existingConversations = await MessagingService.getConversations(currentAlter.id);

            // Map by other participant ID
            const convoMap = new Map<string, ConversationMeta>();
            existingConversations.forEach(c => {
                const otherId = c.participants.find(p => p !== currentAlter.id);
                if (otherId) convoMap.set(otherId, c);
            });

            // 3. Process each alter: use cached convo or fallback to legacy check
            const conversations = await Promise.all(otherAlters.map(async (alter) => {
                const cached = convoMap.get(alter.id);

                if (cached) {
                    // Use cached data
                    const unread = cached.unreadCounts ? (cached.unreadCounts[currentAlter.id] || 0) : 0;
                    return {
                        id: alter.id,
                        alter,
                        lastMessage: cached.lastMessage || 'Démarrer une conversation',
                        time: cached.lastMessageTime || '', // Empty string = oldest sorting
                        unread: unread,
                        timestamp: cached.lastMessageTime ? new Date(cached.lastMessageTime).getTime() : 0
                    } as ConversationItem & { timestamp: number };
                }

                // Fallback: Legacy Check (N+1) only for missing conversations
                const metadata = await MessagingService.getLastMessage(currentAlter.id, alter.id);
                const unread = await MessagingService.getUnreadCount(currentAlter.id, alter.id);

                // Backfill if we found something (Lazy Migration)
                if (metadata) {
                    MessagingService.setConversationMetadata(currentAlter.id, alter.id, {
                        lastMessage: metadata.lastMessage,
                        lastMessageTime: metadata.lastMessageTime,
                        unreadCounts: {
                            [currentAlter.id]: unread,
                            [alter.id]: 0 // Approximate
                        }
                    });
                }

                return {
                    id: alter.id,
                    alter,
                    lastMessage: metadata ? metadata.lastMessage : 'Démarrer une conversation',
                    time: metadata ? metadata.lastMessageTime : '', // Empty string = oldest sorting
                    unread: unread,
                    timestamp: metadata ? new Date(metadata.lastMessageTime).getTime() : 0
                } as ConversationItem & { timestamp: number };
            }));

            // 4. Add General Chat (Static for now, but could be fetched too if we had group chat logic)
            // Giving it a high timestamp to pin it or fetch its actual last message if possible
            // For now, let's keep it at top or check if we want to sort it too.
            // Let's say System General is always pinned or treated normally? 
            // Requests say "last person messaged at top", usually General is a separate entity.
            // Let's add it with 0 timestamp or current if we want.
            // For now, let's just prepend it or sort it. User asked for "last person".

            const generalItem: ConversationItem & { timestamp: number } = {
                id: 'system-general',
                alter: {
                    id: 'general',
                    name: 'Chat Général',
                    color: colors.primary,
                } as Alter,
                lastMessage: 'Discussion de groupe système',
                time: '',
                unread: 0,
                timestamp: 9999999999999 // Pin to top? Or 0? Let's use 0 to let active chats overtake it?
                // Actually, user usually wants General accessible. Let's pin it at index 0 separate from sort, OR sort it if we had data.
                // Reverting to: Sort everything by activity.
            };

            // Sort conversations by most recent activity
            conversations.sort((a, b) => b.timestamp - a.timestamp);

            // Add General Chat at the top
            const sortedWithGeneral = [generalItem, ...conversations];
            setSortedInternal(sortedWithGeneral);

        } catch (error) {
            console.error(error);
        } finally {
            setLoadingInternal(false);
        }
    };

    const loadFriends = async () => {
        if (!currentAlter || !system) return;
        setLoadingFriends(true);
        try {
            const friendIds = await FriendService.getFriends(currentAlter.id);
            const uniqueFriendIds = [...new Set(friendIds)];

            if (uniqueFriendIds.length === 0) {
                setSortedFriends([]);
                return;
            }

            // Optimized: Fetch all conversations for currentAlter first
            const existingConversations = await MessagingService.getConversations(currentAlter.id);
            const convoMap = new Map<string, ConversationMeta>();
            existingConversations.forEach(c => {
                const otherId = c.participants.find(p => p !== currentAlter.id);
                if (otherId) convoMap.set(otherId, c);
            });

            const friendsData = await Promise.all(uniqueFriendIds.map(async (fid) => {
                const docRef = doc(db, 'alters', fid);
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) return null;
                const alter = { id: docSnap.id, ...docSnap.data() } as Alter;

                // Filter internal
                const isInternal = (alter.systemId === system.id) ||
                    (alter.system_id === system.id) ||
                    (alter.userId === system.id);
                if (isInternal) return null;

                const cached = convoMap.get(alter.id);

                if (cached) {
                    const unread = cached.unreadCounts ? (cached.unreadCounts[currentAlter.id] || 0) : 0;
                    return {
                        id: alter.id,
                        alter,
                        lastMessage: cached.lastMessage || 'Démarrer une discussion',
                        time: cached.lastMessageTime || '',
                        unread,
                        timestamp: cached.lastMessageTime ? new Date(cached.lastMessageTime).getTime() : 0
                    } as ConversationItem & { timestamp: number };
                }

                // Fallback: Legacy Check
                const metadata = await MessagingService.getLastMessage(currentAlter.id, alter.id);
                const unread = await MessagingService.getUnreadCount(currentAlter.id, alter.id);

                // Backfill
                if (metadata) {
                    MessagingService.setConversationMetadata(currentAlter.id, alter.id, {
                        lastMessage: metadata.lastMessage,
                        lastMessageTime: metadata.lastMessageTime,
                        unreadCounts: {
                            [currentAlter.id]: unread,
                            [alter.id]: 0
                        }
                    });
                }

                return {
                    id: alter.id,
                    alter,
                    lastMessage: metadata ? metadata.lastMessage : 'Démarrer une discussion',
                    time: metadata ? metadata.lastMessageTime : '',
                    unread,
                    timestamp: metadata ? new Date(metadata.lastMessageTime).getTime() : 0
                } as ConversationItem & { timestamp: number };
            }));

            const valid = friendsData.filter((i): i is ConversationItem & { timestamp: number } => i !== null);
            valid.sort((a, b) => b.timestamp - a.timestamp);

            setSortedFriends(valid);

        } catch (error) {
            console.error("Failed to load friends", error);
        } finally {
            setLoadingFriends(false);
        }
    };

    const loadRequests = async () => {
        if (!currentAlter) return;
        setLoadingRequests(true);
        try {
            const pending = await FriendService.getPendingRequests(currentAlter.id);
            setRequests(pending);
        } catch (error) {
            console.error("Failed to load requests", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    const loadGroups = async () => {
        if (!system) return;
        setLoadingGroups(true);
        try {
            const userGroups = await GroupService.getUserGroups(system.id);
            setGroups(userGroups);
        } catch (error) {
            console.error("Failed to load groups", error);
        } finally {
            setLoadingGroups(false);
        }
    };

    const renderConversation = ({ item }: { item: ConversationItem }) => (
        <TouchableOpacity
            style={[styles.conversationItem, { backgroundColor: cardColor }]}
            onPress={() => {
                if (item.id === 'system-general') {
                    router.push('/team-hub');
                } else {
                    router.push(`/conversation/${item.alter.id}?internal=true`);
                }
            }}
        >
            <View style={[styles.avatar, { backgroundColor: item.alter.color }]}>
                {item.id === 'system-general' ? (
                    <Ionicons name="people" size={24} color="white" />
                ) : (
                    item.alter.avatar_url ? (
                        <Image source={{ uri: item.alter.avatar_url }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {item.alter.name.charAt(0).toUpperCase()}
                        </Text>
                    )
                )}
            </View>
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={[styles.conversationName, { color: textColor }]}>{item.alter.name}</Text>
                    {item.time ? <Text style={[styles.conversationTime, { color: textSecondaryColor }]}>{
                        new Date(item.time).toLocaleDateString() === new Date().toLocaleDateString()
                            ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(item.time).toLocaleDateString()
                    }</Text> : null}
                </View>
                <Text style={[styles.lastMessage, { color: textSecondaryColor }]} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>
            {item.unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: primaryColor }]}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderFriendConversation = ({ item }: { item: ConversationItem }) => (
        <TouchableOpacity
            style={[styles.conversationItem, { backgroundColor: cardColor }]}
            onPress={() => router.push(`/conversation/${item.alter.id}?internal=false`)}
        >
            <View style={[styles.avatar, { backgroundColor: item.alter.color || colors.primary }]}>
                {item.alter.avatar_url ? (
                    <Image source={{ uri: item.alter.avatar_url }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                ) : (
                    <Text style={styles.avatarText}>
                        {item.alter.name.charAt(0).toUpperCase()}
                    </Text>
                )}
            </View>
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={[styles.conversationName, { color: textColor }]}>{item.alter.name}</Text>
                    {item.time ? <Text style={[styles.conversationTime, { color: textSecondaryColor }]}>{
                        new Date(item.time).toLocaleDateString() === new Date().toLocaleDateString()
                            ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(item.time).toLocaleDateString()
                    }</Text> : null}
                </View>
                <Text style={[styles.lastMessage, { color: textSecondaryColor }]} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>
            {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const handleAcceptRequest = async (requestId: string) => {
        try {
            const { triggerHaptic } = await import('../../src/lib/haptics');
            triggerHaptic.success();
            await FriendService.acceptRequest(requestId);
            loadRequests();
        } catch (error) {
            const { triggerHaptic } = await import('../../src/lib/haptics');
            triggerHaptic.error();
            console.error(error);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const { Alert } = await import('react-native');
        Alert.alert(
            "Refuser cette demande ?",
            "Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Refuser",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { triggerHaptic } = await import('../../src/lib/haptics');
                            triggerHaptic.selection();
                            await FriendService.rejectRequest(requestId);
                            loadRequests();
                        } catch (error) {
                            const { triggerHaptic } = await import('../../src/lib/haptics');
                            triggerHaptic.error();
                            console.error(error);
                        }
                    }
                }
            ]
        );
    };

    const renderRequest = ({ item }: { item: any }) => {
        const senderName = item.senderName || item.senderId || 'Utilisateur inconnu';
        const isDeleted = senderName === 'Utilisateur inconnu' || !item.senderName;

        return (
            <View style={styles.conversationItem}>
                <View style={[styles.avatar, { backgroundColor: isDeleted ? colors.textMuted : colors.primary }]}>
                    {isDeleted ? (
                        <Ionicons name="person-remove" size={24} color="white" />
                    ) : (
                        <Ionicons name="person-add" size={24} color="white" />
                    )}
                </View>
                <View style={styles.conversationContent}>
                    <Text style={styles.conversationName}>{isDeleted ? 'Utilisateur inconnu' : senderName}</Text>
                    <Text style={styles.lastMessage}>{isDeleted ? 'Profil supprimé' : 'Nouvelle demande d\'ami'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleAcceptRequest(item.id)} style={{ padding: 5 }}>
                        <Ionicons name="checkmark-circle" size={32} color={colors.success || '#4CAF50'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRejectRequest(item.id)} style={{ padding: 5 }}>
                        <Ionicons name="close-circle" size={32} color={colors.error || '#F44336'} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderGroup = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => router.push(`/groups/${item.id}` as any)}
        >
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{item.name}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.description || "Aucune description"}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>
                {activeTab === 'internal' ? 'Aucune conversation' :
                    activeTab === 'friends' ? 'Aucun ami ajouté' :
                        activeTab === 'groups' ? 'Aucun groupe' : 'Aucune demande'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {activeTab === 'internal'
                    ? 'Ajoutez des alters pour discuter entre vous'
                    : activeTab === 'groups'
                        ? 'Créez un groupe pour discuter à plusieurs'
                        : 'Vous n\'avez pas de demande d\'ami en attente'}
            </Text>
            {activeTab === 'groups' && (
                <TouchableOpacity
                    style={styles.createGroupButton}
                    onPress={() => router.push('/groups/create' as any)}
                >
                    <Text style={styles.createGroupButtonText}>Créer un groupe</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // Filter avatars for Top Bar
    // We want sortedInternal but excluding any without recent activity maybe?
    // Users generally want "Recent contacts".
    // Or just sorted list.
    const topBarAvatars = sortedInternal.slice(0, 10); // Show top 10 recent

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            {/* Header with current alter */}
            <View style={[styles.header, { backgroundColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing.xs }}>
                            <Ionicons name="arrow-back" size={24} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: textColor }]}>Messages</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                        {activeTab === 'groups' && (
                            <TouchableOpacity onPress={() => router.push('/groups/create' as any)}>
                                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => router.push('/crisis/index' as any)}>
                            <Ionicons name="warning-outline" size={28} color={colors.error || '#FF4444'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Avatar Row - Visible only on internal tab for quick access, using Sorted list */}
                {activeTab === 'internal' && topBarAvatars.length > 0 && (
                    <View style={[styles.avatarRow, { marginTop: spacing.md }]}>
                        {topBarAvatars.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                    if (item.id === 'system-general') {
                                        router.push('/team-hub');
                                    } else {
                                        router.push(`/conversation/${item.alter.id}?internal=true`);
                                    }
                                }}
                            >
                                <View
                                    style={[
                                        styles.rowAvatar,
                                        { backgroundColor: item.alter.color },
                                        item.unread > 0 && { borderColor: colors.primary, borderWidth: 2 }
                                    ]}
                                >
                                    {item.id === 'system-general' ? (
                                        <Ionicons name="people" size={24} color="white" />
                                    ) : item.alter.avatar_url ? (
                                        <Image source={{ uri: item.alter.avatar_url }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                                    ) : (
                                        <Text style={styles.rowAvatarText}>
                                            {item.alter.name.charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: cardColor }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'internal' && [styles.tabActive, { backgroundColor: primaryColor }]]}
                    onPress={() => setActiveTab('internal')}
                >
                    <Text style={styles.tabEmoji}>💜</Text>
                    <Text style={[styles.tabText, { color: textSecondaryColor }, activeTab === 'internal' && styles.tabTextActive]}>
                        Interne
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'friends' && [styles.tabActive, { backgroundColor: primaryColor }]]}
                    onPress={() => setActiveTab('friends')}
                >
                    <Text style={styles.tabEmoji}>🤝</Text>
                    <Text style={[styles.tabText, { color: textSecondaryColor }, activeTab === 'friends' && styles.tabTextActive]}>
                        Amis
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'groups' && [styles.tabActive, { backgroundColor: primaryColor }]]}
                    onPress={() => setActiveTab('groups')}
                >
                    <Text style={styles.tabEmoji}>👥</Text>
                    <Text style={[styles.tabText, { color: textSecondaryColor }, activeTab === 'groups' && styles.tabTextActive]}>
                        Groupes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && [styles.tabActive, { backgroundColor: primaryColor }]]}
                    onPress={() => setActiveTab('requests')}
                >
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={styles.tabEmoji}>🔔</Text>
                            {requests.length > 0 && (
                                <View style={{ backgroundColor: colors.error, borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, position: 'absolute', top: -4, right: -8 }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{requests.length}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.tabText, { color: textSecondaryColor }, activeTab === 'requests' && styles.tabTextActive]}>
                            Demandes
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Conversations List */}
            <FlatList
                data={activeTab === 'internal' ? sortedInternal : activeTab === 'friends' ? sortedFriends : activeTab === 'groups' ? groups : requests}
                renderItem={(activeTab === 'internal' ? renderConversation : activeTab === 'friends' ? renderFriendConversation : activeTab === 'groups' ? renderGroup : renderRequest) as any}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                refreshing={activeTab === 'groups' ? loadingGroups : activeTab === 'requests' ? loadingRequests : (activeTab === 'internal' ? loadingInternal : loadingFriends)}
                onRefresh={activeTab === 'groups' ? loadGroups : activeTab === 'requests' ? loadRequests : (activeTab === 'internal' ? loadInternalConversations : loadFriends)}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
    },
    title: {
        ...typography.h2,
        // Remove bottom margin as it's handled by parent gap
        marginBottom: 0,
    },
    avatarRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    rowAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    rowAvatarActive: {
        borderColor: colors.primary,
    },
    rowAvatarText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    moreAvatar: {
        backgroundColor: colors.backgroundCard,
    },
    moreText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.xs,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: colors.text,
    },
    tabEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    listContent: {
        padding: spacing.md,
        paddingTop: 0,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    conversationContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    conversationName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    conversationTime: {
        ...typography.caption,
        color: colors.textMuted,
    },
    lastMessage: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    unreadBadge: {
        backgroundColor: colors.primary,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: 'bold',
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
    createGroupButton: {
        marginTop: spacing.md,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    createGroupButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
