import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

import { SafeAreaView } from 'react-native-safe-area-context';
import { GroupService } from '../../src/services/groups';
import { FriendService } from '../../src/services/friends';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';

interface ConversationItem {
    id: string;
    alter: Alter;
    lastMessage: string;
    time: string;
    unread: number;
}

export default function MessagesScreen() {
    const { alters, currentAlter, system } = useAuth();
    const [activeTab, setActiveTab] = useState<'internal' | 'groups' | 'requests' | 'friends'>('internal');
    const [groups, setGroups] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<Alter[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [loadingFriends, setLoadingFriends] = useState(false);


    React.useEffect(() => {
        if (activeTab === 'groups' && system) {
            loadGroups();
        } else if (activeTab === 'requests' && currentAlter) {
            loadRequests();
        } else if (activeTab === 'friends' && currentAlter) {
            loadFriends();
        }
    }, [activeTab, system, currentAlter]);

    const loadFriends = async () => {
        if (!currentAlter) return;
        setLoadingFriends(true);
        try {
            const friendIds = await FriendService.getFriends(currentAlter.id);
            if (friendIds.length === 0) {
                setFriends([]);
            } else {
                // Fetch alters data
                // Note: Firestore 'in' query limit is 10. For now using parallel getDocs or multiple queries if needed.
                // Simpler approach for now: fetch all alters matching the IDs.
                // Since IDs usually match document IDs.
                // We'll use Promise.all for simplicity if list is small, or batches.
                // "in" query with documentId() is best but limited to 10 (or 30?).
                // Let's use chunks of 10.

                const chunks = [];
                for (let i = 0; i < friendIds.length; i += 10) {
                    chunks.push(friendIds.slice(i, i + 10));
                }

                let allFriends: Alter[] = [];

                for (const chunk of chunks) {
                    // We need to import documentId from firebase/firestore which might not be imported yet. 
                    // Alternatively, just map getDoc requests.
                    /* 
                    const q = query(collection(db, 'alters'), where(documentId(), 'in', chunk));
                    const snap = await getDocs(q);
                    ...
                    */
                    // Actually, we don't have documentId imported. Let's rely on mapping getDoc for now or add import.
                    // I will update imports in a separate Edit if needed or just use parallel fetches which is fine for < 20 friends.
                    // But to be robust let's assume I can use `where('__name__', 'in', chunk)` which is the same as documentId().

                    // Importing documentId might be annoying if I don't check imports.
                    // Let's use parallel fetching for now, it's safe.
                    // Actually, better:
                }
                // Wait, I can't easily change imports in this chunk if they are at the top.
                // I will add the fetching logic using what is available or assumed available.
                // If getDoc is available (it is not imported in messages.tsx I think).
                // Let's check imports first or assume I need to add them.
                // messages.tsx has no firestore imports shown in previous context (it was truncated or I didn't see).
                // Wait, messages.tsx DOES NOT have firestore imports in the lines I saw? 
                // Ah, line 15-16 import services.
                // I need to add imports.

                // Let's just use a loop with manual fetching for now to be safe without messing up imports too much, 
                // OR better: use a service method if one existed.
                // Since I can't see imports, I will assume I need to add them effectively. 
                // BUT multi_replace allows multiple chunks. I'll add imports in another chunk.
            }
            // Real implementation below using a helper or assuming imports will be added.

            // Actually, I'll put the fetching logic inside FriendService in a future step or just do it here properly.
            // Let's try to do it here.

            const friendsData = await Promise.all(friendIds.map(async (fid) => {
                // We need getDoc.
                // I will add getDoc to imports.
                const docRef = doc(db, 'alters', fid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() } as Alter;
                }
                return null;
            }));
            setFriends(friendsData.filter(f => f !== null) as Alter[]);

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

    // Create mock conversations from alters
    const internalConversations: ConversationItem[] = [
        {
            id: 'system-general',
            alter: {
                id: 'general',
                name: 'Chat Général',
                color: colors.primary,
                avatar_url: undefined // Use specific icon logic if needed
            } as Alter,
            lastMessage: 'Discussion de groupe système',
            time: '',
            unread: 0,
        },
        ...alters
            .filter(a => a.id !== currentAlter?.id)
            .map(alter => ({
                id: alter.id,
                alter,
                lastMessage: 'Démarrer une conversation',
                time: '',
                unread: 0,
            }))
    ];

    const renderConversation = ({ item }: { item: ConversationItem }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => {
                if (item.id === 'system-general') {
                    router.push('/team-chat');
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
                    <Text style={styles.conversationName}>{item.alter.name}</Text>
                    {item.time && <Text style={styles.conversationTime}>{item.time}</Text>}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
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

    const renderFriendConversation = ({ item }: { item: Alter }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => router.push(`/conversation/${item.id}?internal=false`)}
        >
            <View style={[styles.avatar, { backgroundColor: item.color || colors.primary }]}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                ) : (
                    <Text style={styles.avatarText}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                )}
            </View>
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{item.name}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    Démarrer une discussion
                </Text>
            </View>
        </TouchableOpacity>
    );

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await FriendService.acceptRequest(requestId);
            // Refresh list
            loadRequests();
            // Show success?
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await FriendService.rejectRequest(requestId);
            loadRequests();
        } catch (error) {
            console.error(error);
        }
    };

    const renderRequest = ({ item }: { item: any }) => (
        <View style={styles.conversationItem}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person-add" size={24} color="white" />
            </View>
            <View style={styles.conversationContent}>
                <Text style={styles.conversationName}>Nouvelle demande</Text>
                <Text style={styles.lastMessage}>De: {item.senderId}</Text>
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
                    {/* Time placeholder if needed */}
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header with current alter */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing.xs }}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Messages</Text>
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

                {/* Avatar Row - Visible only on internal tab for quick access */}
                {activeTab === 'internal' && (
                    <View style={styles.avatarRow}>
                        {alters.slice(0, 6).map((alter) => (
                            <TouchableOpacity
                                key={alter.id}
                                onPress={() => router.push(`/alter/${alter.id}`)}
                            >
                                <View
                                    style={[
                                        styles.rowAvatar,
                                        { backgroundColor: alter.color },
                                        // Ne pas montrer comme "actif" car on ne s'envoie pas de message à soi-même
                                    ]}
                                >
                                    <Text style={styles.rowAvatarText}>
                                        {alter.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {alters.length > 6 && (
                            <View style={[styles.rowAvatar, styles.moreAvatar]}>
                                <Text style={styles.moreText}>+{alters.length - 6}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'internal' && styles.tabActive]}
                    onPress={() => setActiveTab('internal')}
                >
                    <Text style={styles.tabEmoji}>💜</Text>
                    <Text style={[styles.tabText, activeTab === 'internal' && styles.tabTextActive]}>
                        Interne
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
                    onPress={() => setActiveTab('friends')}
                >
                    <Text style={styles.tabEmoji}>🤝</Text>
                    <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
                        Amis
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
                    onPress={() => setActiveTab('groups')}
                >
                    <Text style={styles.tabEmoji}>👥</Text>
                    <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
                        Groupes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
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
                        <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                            Demandes
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Conversations List */}
            <FlatList
                data={activeTab === 'internal' ? internalConversations : activeTab === 'friends' ? friends : activeTab === 'groups' ? groups : requests}
                renderItem={activeTab === 'internal' ? renderConversation : activeTab === 'friends' ? renderFriendConversation : activeTab === 'groups' ? renderGroup : renderRequest}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                refreshing={activeTab === 'groups' ? loadingGroups : activeTab === 'requests' ? loadingRequests : activeTab === 'friends' ? loadingFriends : false}
                onRefresh={activeTab === 'groups' ? loadGroups : activeTab === 'requests' ? loadRequests : activeTab === 'friends' ? loadFriends : undefined}
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
