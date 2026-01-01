/**
 * Onglet Notifications (Style Instagram Activity)
 * 
 * Sections:
 * 1. Demandes d'amis en attente
 * 2. Activité récente (likes, commentaires, follows)
 * 3. Alertes système
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Image,
    SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { FriendService, FriendRequest } from '../../src/services/friends';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';
import { timeAgo } from '../../src/lib/date';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';

// Types pour les différentes notifications
type NotificationType = 'friend_request' | 'follow' | 'like' | 'comment' | 'mention' | 'system';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    subtitle?: string;
    avatar?: string;
    avatarColor?: string;
    timestamp: Date;
    isRead: boolean;
    actionData?: any; // Données pour l'action (requestId, postId, etc.)
}

interface NotificationSection {
    title: string;
    data: Notification[];
}

export default function NotificationsScreen() {
    const { currentAlter, alters, user } = useAuth();
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Charger les données
    const loadData = useCallback(async () => {
        if (!currentAlter || !user) return;

        try {
            // Charger les demandes d'amis
            const pending = await FriendService.getPendingRequests(currentAlter.id);
            setFriendRequests(pending);

            // Notifications futures : Likes, Comments, Follows
            // Nécessite une structure Firestore 'notifications' non encore implémentée.
            const mockNotifications: Notification[] = [];

            /*
                        // Mock likes and comments
                        mockNotifications.push({
                            id: 'mock_like_1',
                            type: 'like',
                            title: 'Nouveau like',
                            subtitle: 'Alex a aimé votre post',
                            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
                            isRead: false,
                        });
                        mockNotifications.push({
                            id: 'mock_comment_1',
                            type: 'comment',
                            title: 'Nouveau commentaire',
                            subtitle: 'Sarah a commenté: "Super photo !"',
                            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                            isRead: true,
                        });
            */

            // Convertir les demandes d'amis en notifications
            pending.forEach(req => {
                mockNotifications.push({
                    id: `friend_${req.id}`,
                    type: 'friend_request',
                    title: 'Nouvelle demande d\'ami',
                    subtitle: `De: ${req.senderId}`,
                    timestamp: new Date(req.createdAt),
                    isRead: false,
                    actionData: req,
                });
            });

            setNotifications(mockNotifications);
        } catch (error) {
            console.error('[Notifications] Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentAlter, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    // Actions sur les demandes d'amis
    const handleAcceptRequest = async (requestId: string) => {
        try {
            triggerHaptic.success();
            await FriendService.acceptRequest(requestId);
            // Recharger les données
            loadData();
        } catch (error) {
            console.error('[Notifications] Error accepting request:', error);
            triggerHaptic.error();
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            triggerHaptic.selection();
            await FriendService.rejectRequest(requestId);
            // Recharger les données
            loadData();
        } catch (error) {
            console.error('[Notifications] Error rejecting request:', error);
            triggerHaptic.error();
        }
    };

    // Trouver un alter par son ID (pour afficher le nom)
    const getAlterName = (alterId: string): string => {
        const alter = alters.find(a => a.id === alterId);
        return alter?.name || alterId;
    };

    // Rendu d'une demande d'ami
    const renderFriendRequest = ({ item }: { item: FriendRequest }) => {
        const senderName = getAlterName(item.senderId);

        return (
            <View style={styles.requestCard}>
                <View style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>
                        {senderName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.requestContent}>
                    <Text style={styles.requestTitle}>{senderName}</Text>
                    <Text style={styles.requestSubtitle}>
                        Veut être ton ami
                    </Text>
                </View>
                <View style={styles.requestActions}>
                    <AnimatedPressable
                        style={styles.acceptButton}
                        onPress={() => handleAcceptRequest(item.id)}
                    >
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                        style={styles.rejectButton}
                        onPress={() => handleRejectRequest(item.id)}
                    >
                        <Text style={styles.rejectButtonText}>Refuser</Text>
                    </AnimatedPressable>
                </View>
            </View>
        );
    };

    // Rendu d'une notification générique
    const renderNotification = ({ item }: { item: Notification }) => {
        const getIcon = () => {
            switch (item.type) {
                case 'follow': return 'person-add';
                case 'like': return 'heart';
                case 'comment': return 'chatbubble';
                case 'mention': return 'at';
                case 'system': return 'notifications';
                default: return 'ellipse';
            }
        };

        const getIconColor = () => {
            switch (item.type) {
                case 'follow': return colors.primary;
                case 'like': return '#FF3B5C';
                case 'comment': return colors.secondary || '#6366F1';
                case 'mention': return colors.primary;
                case 'system': return colors.warning || '#F59E0B';
                default: return colors.textMuted;
            }
        };

        return (
            <AnimatedPressable
                style={[
                    styles.notificationItem,
                    !item.isRead && styles.notificationUnread
                ]}
            >
                <View style={[styles.notificationIcon, { backgroundColor: getIconColor() + '20' }]}>
                    <Ionicons name={getIcon()} size={20} color={getIconColor()} />
                </View>
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    {item.subtitle && (
                        <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
                    )}
                </View>
                <Text style={styles.notificationTime}>
                    {timeAgo(item.timestamp)}
                </Text>
            </AnimatedPressable>
        );
    };


    // État vide
    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
                Les demandes d'amis, likes et commentaires apparaîtront ici
            </Text>
        </View>
    );

    // Calculer s'il y a du contenu
    const hasContent = friendRequests.length > 0 || notifications.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (currentAlter) {
                            router.push({ pathname: '/alter-space/[alterId]', params: { alterId: currentAlter.id } });
                        } else {
                            router.back();
                        }
                    }}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                {hasContent && (
                    <TouchableOpacity onPress={() => triggerHaptic.selection()}>
                        <Text style={styles.clearAllText}>Tout effacer</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={[]}
                renderItem={null}
                ListHeaderComponent={
                    <>
                        {/* Section Demandes d'amis */}
                        {friendRequests.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="person-add" size={20} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>
                                        Demandes d'amis ({friendRequests.length})
                                    </Text>
                                </View>
                                {friendRequests.map(request => (
                                    <React.Fragment key={request.id}>
                                        {renderFriendRequest({ item: request })}
                                    </React.Fragment>
                                ))}
                            </View>
                        )}

                        {/* Section Activité récente */}
                        {notifications.filter(n => n.type !== 'friend_request').length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="pulse" size={20} color={colors.secondary || '#6366F1'} />
                                    <Text style={styles.sectionTitle}>Activité récente</Text>
                                </View>
                                {notifications
                                    .filter(n => n.type !== 'friend_request')
                                    .map(notification => (
                                        <React.Fragment key={notification.id}>
                                            {renderNotification({ item: notification })}
                                        </React.Fragment>
                                    ))
                                }
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={!hasContent ? renderEmpty : null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md, // Keep some vertical padding for consistency
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        // Removed justifyContent: 'space-between' to allow title to take space
    },
    backButton: {
        marginRight: spacing.md,
    },
    title: {
        ...typography.h2,
        color: colors.text, // Changed from 'white' to colors.text for consistency
        flex: 1, // Allow title to take space if needed
    },
    clearAllText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '600',
        marginLeft: spacing.md, // Add margin to separate from title
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: spacing.xxl,
    },
    section: {
        marginTop: spacing.md,
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionTitle: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Friend Request Card
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    requestAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestAvatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    requestContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    requestTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    requestSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    requestActions: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    acceptButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
    },
    acceptButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },
    rejectButton: {
        backgroundColor: colors.backgroundLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    rejectButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    // Generic Notification
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    notificationUnread: {
        backgroundColor: colors.primary + '10',
    },
    notificationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    notificationTitle: {
        ...typography.body,
        color: colors.text,
    },
    notificationSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    notificationTime: {
        ...typography.caption,
        color: colors.textMuted,
    },
    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: 100,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
});

