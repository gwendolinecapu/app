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
import { Ionicons } from '@expo/vector-icons';

interface ConversationItem {
    id: string;
    alter: Alter;
    lastMessage: string;
    time: string;
    unread: number;
}

export default function MessagesScreen() {
    const { alters, currentAlter, system } = useAuth();
    const [activeTab, setActiveTab] = useState<'internal' | 'groups' | 'requests'>('internal');
    const [groups, setGroups] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);


    // Fetch data when tab changes
    React.useEffect(() => {
        if (activeTab === 'groups' && system) {
            loadGroups();
        } else if (activeTab === 'requests' && currentAlter) {
            loadRequests();
        }
    }, [activeTab, system, currentAlter]);

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
                    router.push('/chat');
                } else {
                    router.push(`/conversation/${item.alter.id}?internal=true`);
                }
            }}
        >
            <View style={[styles.avatar, { backgroundColor: item.alter.color }]}>
                {item.id === 'system-general' ? (
                    <Ionicons name="people" size={24} color="white" />
                ) : (
                    <Text style={styles.avatarText}>
                        {item.alter.name.charAt(0).toUpperCase()}
                    </Text>
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
                    <Text style={[styles.tabText, activeTab === 'internal' && styles.tabTextActive]}>
                        💜 Interne
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
                    onPress={() => setActiveTab('groups')}
                >
                    <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
                        👥 Groupes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
                    onPress={() => setActiveTab('requests')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                            🔔 Demandes
                        </Text>
                        {/* Start badge mock if needed */}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Conversations List */}
            <FlatList
                data={activeTab === 'internal' ? internalConversations : activeTab === 'groups' ? groups : requests}
                renderItem={activeTab === 'internal' ? renderConversation : activeTab === 'groups' ? renderGroup : renderRequest}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
                refreshing={activeTab === 'groups' ? loadingGroups : activeTab === 'requests' ? loadingRequests : false}
                onRefresh={activeTab === 'groups' ? loadGroups : activeTab === 'requests' ? loadRequests : undefined}
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
