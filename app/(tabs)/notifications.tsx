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
    Alert,
} from 'react-native';
import { collection, query, where, getDocs, orderBy, limit, writeBatch, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
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
    actorName?: string; // Enriched
    actorAvatar?: string; // Enriched
    timestamp: Date;
    isRead: boolean;
    actionData?: any; // Données pour l'action (requestId, postId, etc.)
    mediaUrl?: string | null;  // Added
    postId?: string;
    senderId?: string;
}

interface NotificationSection {
    title: string;
    data: Notification[];
}

export default function NotificationsScreen() {
    const { currentAlter, alters, user } = useAuth();
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(true);
    const [loading, setLoading] = useState(true);

    // Charger les données
    const loadData = useCallback(async () => {
        if (!currentAlter || !user) return;

        try {
            // 2. Charger les demandes d'amis (pending et accepted)
            // Fetch for current Alter AND System (in case request was sent to system)
            const alterRequests = await FriendService.getRequests(currentAlter.id, ['pending', 'accepted']);
            let systemRequests: FriendRequest[] = [];

            // Avoid duplicate check if currentAlter.id IS the system id (unlikely but possible in some archs)
            if (user.uid && user.uid !== currentAlter.id) {
                try {
                    systemRequests = await FriendService.getRequests(user.uid, ['pending', 'accepted']);
                } catch (e) {
                    console.log('Error fetching system requests', e);
                }
            }

            // Merge and dedup by ID
            const allRequests = [...alterRequests, ...systemRequests];
            const uniqueRequests = Array.from(new Map(allRequests.map(item => [item.id, item])).values());

            // Sort by date descending
            uniqueRequests.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date();
                const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date();
                return dateB.getTime() - dateA.getTime();
            });

            setFriendRequests(uniqueRequests);

            // Charger les notifications
            const q = query(
                collection(db, 'notifications'),
                where('recipientId', '==', user.uid),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const loadedNotifications: Notification[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedNotifications.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.created_at?.toDate() || new Date()
                } as Notification);
            });

            // Ajouter les demandes d'amis comme notifications (si non dupliquées)
            requests.forEach(req => {
                loadedNotifications.push({
                    id: `friend_${req.id}`,
                    type: 'friend_request',
                    title: 'Nouvelle demande d\'ami',
                    subtitle: `De: ${req.senderId}`,
                    timestamp: req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000) : new Date(),
                    isRead: false,
                    actionData: req,
                });
            });

            // Trier par date
            loadedNotifications.sort((a, b) => {
                const timeA = a.timestamp?.getTime?.() || 0;
                const timeB = b.timestamp?.getTime?.() || 0;
                return timeB - timeA;
            });

            setNotifications(loadedNotifications);

            // Marquer comme lu
            markAllAsRead(snapshot.docs);

        } catch (error) {
            console.error('[Notifications] Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentAlter, user]);

    const markAllAsRead = async (docs: any[]) => {
        const batch = writeBatch(db);
        let hasUpdates = false;
        docs.forEach(doc => {
            if (!doc.data().read) {
                batch.update(doc.ref, { read: true });
                hasUpdates = true;
            }
        });
        if (hasUpdates) {
            await batch.commit();
        }
    };

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
            loadData();
        } catch (error) {
            console.error('[Notifications] Error rejecting request:', error);
            triggerHaptic.error();
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            triggerHaptic.selection();
            await deleteDoc(doc(db, 'notifications', notificationId));
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Erreur', "Impossible de supprimer la notification");
        }
    };

    const handleClearAll = async () => {
        Alert.alert(
            "Tout effacer",
            "Voulez-vous vraiment supprimer toutes les notifications ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Effacer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const batch = writeBatch(db);
                            notifications.forEach(n => {
                                const ref = doc(db, 'notifications', n.id);
                                batch.delete(ref);
                            });
                            await batch.commit();
                            setNotifications([]);
                            triggerHaptic.success();
                        } catch (error) {
                            console.error('Error clear all:', error);
                            Alert.alert('Erreur', "Impossible de tout supprimer");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getAlterName = (alterId: string): string => {
        const alter = alters.find(a => a.id === alterId);
        return alter?.name || alterId;
    };

    const renderFriendRequest = ({ item }: { item: FriendRequest }) => {
        const senderName = getAlterName(item.senderId);
        const isAccepted = item.status === 'accepted';

        return (
            <View style={[styles.requestCard, isAccepted && { opacity: 0.6, backgroundColor: colors.backgroundLight + '40' }]}>
                <View style={[styles.requestAvatar, isAccepted && { backgroundColor: colors.textMuted }]}>
                    <Text style={styles.requestAvatarText}>
                        {senderName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.requestContent}>
                    <Text style={styles.requestTitle}>{senderName}</Text>
                    <Text style={styles.requestSubtitle}>
                        {isAccepted ? "Demande acceptée" : "Veut être ton ami"}
                    </Text>
                </View>
                <View style={styles.requestActions}>
                    {isAccepted ? (
                        <View style={[styles.acceptButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.success }]}>
                            <Text style={[styles.acceptButtonText, { color: colors.success }]}>Amis</Text>
                        </View>
                    ) : (
                        <>
                            <AnimatedPressable style={styles.acceptButton} onPress={() => handleAcceptRequest(item.id)}>
                                <Text style={styles.acceptButtonText}>Accepter</Text>
                            </AnimatedPressable>
                            <AnimatedPressable style={styles.rejectButton} onPress={() => handleRejectRequest(item.id)}>
                                <Text style={styles.rejectButtonText}>Refuser</Text>
                            </AnimatedPressable>
                        </>
                    )}
                </View>
            </View>
        );
    };

    // Rendu d'une notification style Instagram
    const renderNotification = ({ item }: { item: Notification }) => {
        const time_ago = timeAgo(item.timestamp);
        const hasMedia = !!item.mediaUrl;

        // Handle press: navigate to post or profile
        const handlePress = () => {
            if (item.postId) {
                // Navigate to post detail (we can use the modal profile trick or a dedidcated route)
                // For now, assuming modal logic or feed logic. 
                // If we have a route for single post, use it.
                // We have /post/[id] but usually it's better to show in context.
                // Ideally we'd open the post in a way that allows scrolling.
                // Let's just create a generic route or assume standard navigation.
                // Since we don't have a direct "view post" handy globally without context, 
                // we might check if there is a generic post view.
                // There is app/post/[id].tsx (implied from earlier context).
                // Try:
                // router.push(`/post/${item.postId}`);
                // Actually previous snippets showed we used a Modal in Profile.
                // Let's try to navigate to the user profile and open the post? No, too complex.
                // app/post/[id] seems safe if exists.
                // Wait, context said "Post Not Found" error debugging used app/post/[id].tsx. So it exists.
                router.push(`/post/${item.postId}` as any);
            } else if (item.senderId) {
                router.push(`/profile/${item.senderId}` as any);
            }
        };

        return (
            <AnimatedPressable
                style={[
                    styles.notificationItem,
                    !item.isRead && { backgroundColor: colors.primary + '05' }
                ]}
                onPress={handlePress}
            >
                {/* Avatar Left */}
                <TouchableOpacity onPress={() => item.senderId && router.push(`/profile/${item.senderId}` as any)}>
                    <View style={styles.notificationAvatarContainer}>
                        {item.actorAvatar ? (
                            <Image
                                source={{ uri: item.actorAvatar }}
                                style={styles.notificationAvatar}
                            />
                        ) : (
                            <View style={[styles.notificationAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.actorName?.[0] || '?'}</Text>
                            </View>
                        )}
                        {/* Type Icon Badge (optional, Insta usually doesn't show it on avatar except stories) */}
                        {/* 
                        <View style={styles.typeBadge}>
                             <Ionicons name={getIcon(item.type)} size={10} color="white" />
                        </View>
                        */}
                    </View>
                </TouchableOpacity>

                {/* Center Text */}
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationText} numberOfLines={3}>
                        <Text style={styles.username}>{item.actorName || "Un utilisateur"}</Text>
                        <Text style={styles.actionText}>
                            {item.type === 'like' && " a aimé votre publication."}
                            {item.type === 'comment' && ` a commenté : "${item.subtitle || ''}"`}
                            {item.type === 'follow' && " a commencé à vous suivre."}
                            {item.type === 'mention' && " vous a mentionné."}
                            {item.type === 'friend_request' && " vous a envoyé une demande d'ami."}
                        </Text>
                        <Text style={styles.timeText}> {time_ago}</Text>
                    </Text>
                </View>

                {/* Right Side: Media or Follow Button */}
                {hasMedia && item.mediaUrl ? (
                    <TouchableOpacity onPress={handlePress}>
                        <Image
                            source={{ uri: item.mediaUrl }}
                            style={styles.notificationMedia}
                        />
                    </TouchableOpacity>
                ) : item.type === 'follow' || item.type === 'friend_request' ? (
                    <TouchableOpacity style={styles.followButtonSmall}>
                        <Text style={styles.followButtonText}>Suivre</Text>
                    </TouchableOpacity>
                ) : null}

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
                    <TouchableOpacity onPress={handleClearAll}>
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
                ListEmptyComponent={!hasContent && !loading ? renderEmpty : null}
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
        // Removed card background, keeping sections simpler or transparent could be better for Insta style
        // but keeping it for now to group
        // backgroundColor: colors.backgroundCard, 
        // INSTA STYLE: Transparent background, just list
        marginHorizontal: 0, // Full width
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        // backgroundColor: colors.backgroundLight,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.border,
        marginTop: spacing.sm
    },
    sectionTitle: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.text,
        fontSize: 15,
        // textTransform: 'uppercase', // Insta doesn't uppercase
        // letterSpacing: 0.5,
    },
    // Friend Request Card
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.border,
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

    // INSTA NOTIFICATION STYLES
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Increased spacing
        paddingHorizontal: spacing.md,
        justifyContent: 'space-between',
        // borderBottomWidth: 0, // Insta doesn't show dividers usually or very subtle
    },
    notificationAvatarContainer: {
        marginRight: 12,
    },
    notificationAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border, // Subtle border
    },
    typeBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: colors.primary,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    notificationContent: {
        flex: 1,
        marginRight: 12,
    },
    notificationText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 18,
    },
    username: {
        fontWeight: 'bold',
        color: colors.text,
    },
    actionText: {
        color: colors.text,
    },
    timeText: {
        color: colors.textMuted,
        fontSize: 12,
    },
    notificationMedia: {
        width: 44,
        height: 44,
        borderRadius: 4, // Square with slight radius
    },
    followButtonSmall: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    followButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
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

