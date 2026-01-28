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
    Alert,
} from 'react-native';
import Animated, {
    FadeInRight,
    FadeOutLeft,
    LinearTransition,
} from 'react-native-reanimated';
import { collection, query, where, getDocs, orderBy, limit, writeBatch, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useNotificationContext } from '../../src/contexts/NotificationContext';
import { FriendService, FriendRequest } from '../../src/services/friends';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';
import { timeAgo } from '../../src/lib/date';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';
import { AvatarWithLoading } from '../../src/components/ui/AvatarWithLoading';

import { getThemeColors } from '../../src/lib/cosmetics';

// Composant animé pour chaque item de notification
const AnimatedNotificationWrapper = React.memo(({
    children,
    index,
}: {
    children: React.ReactNode;
    index: number;
}) => {
    const delay = Math.min(index * 50, 400); // Cap delay at 400ms

    return (
        <Animated.View
            entering={FadeInRight.delay(delay).duration(300).springify().damping(15)}
            exiting={FadeOutLeft.duration(200)}
            layout={LinearTransition.springify().damping(15)}
        >
            {children}
        </Animated.View>
    );
});


// Types pour les différentes notifications
type NotificationType = 'friend_request' | 'follow' | 'like' | 'comment' | 'mention' | 'system' | 'friend_request_accepted' | 'FRIEND_REQUEST_ACCEPTED' | 'friend_new';

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
    data?: any; // For legacy or complex data
    targetName?: string; // For "You accepted X's request"
    targetAvatar?: string; // For double avatar display
    isProfileDeleted?: boolean; // NEW: Flag for deleted profiles
    senderAlterId?: string; // NEW: Explicit alter ID from notification data
}

export default function NotificationsScreen() {
    const { currentAlter, alters, user } = useAuth();
    const { markNotificationsAsViewed } = useNotificationContext();

    // Mark notifications as viewed when screen opens (resets badge)
    useEffect(() => {
        markNotificationsAsViewed();
    }, [markNotificationsAsViewed]);

    // Determine Theme Colors
    const themeColors = currentAlter?.equipped_items?.theme
        ? getThemeColors(currentAlter.equipped_items.theme)
        : null;

    // Fallback or use specific color if no full theme
    const themeColor = themeColors?.primary || currentAlter?.color || colors.primary;
    const backgroundColor = themeColors?.background || colors.background;
    const textColor = themeColors?.text || colors.text;
    const textSecondaryColor = themeColors?.textSecondary || colors.textSecondary;

    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(true);
    const [loading, setLoading] = useState(true);

    // Charger les données
    const loadData = useCallback(async () => {
        if (!currentAlter || !user) return;

        try {
            // 2. Fetch requests using Hybrid Strategy (System + Individual Alters)
            // This ensures we catch NEW requests (via receiverSystemId) and OLD legacy requests (via receiverId)

            // A. System-wide fetch (Efficient)
            const systemReceivedRequestsPromise = FriendService.getSystemRequests(user.uid, ['pending', 'accepted']);
            const systemSentRequestsPromise = FriendService.getSystemSentRequests(user.uid, ['accepted']); // Only care about accepted for sent requests in this view

            // B. Per-Alter fetch (Legacy compatibility)
            const allAlterIds = alters.map(a => a.id);
            if (user.uid && !allAlterIds.includes(user.uid)) {
                allAlterIds.push(user.uid); // Ensure system profile is included
            }

            const individualReceivedPromises = allAlterIds.map(id =>
                FriendService.getRequests(id, ['pending', 'accepted'])
                    .catch(() => [])
            );

            const individualSentPromises = allAlterIds.map(id =>
                (FriendService as any).getSentRequests(id, ['accepted']) // Cast to any as we just added it
                    .catch(() => [])
            );

            const [
                systemReceived,
                systemSent,
                ...rest
            ] = await Promise.all([
                systemReceivedRequestsPromise,
                systemSentRequestsPromise,
                ...individualReceivedPromises,
                ...individualSentPromises
            ]);

            // Splitting individual results
            const individualReceivedResults = rest.slice(0, allAlterIds.length);
            const individualSentResults = rest.slice(allAlterIds.length);

            const allRequests = [
                ...systemReceived,
                ...systemSent,
                ...individualReceivedResults.flat(),
                ...individualSentResults.flat()
            ];

            // Filter relevant requests for CURRENT ALTER (Sender OR Receiver)
            const relevantRequests = allRequests.filter(req =>
                req.receiverId === currentAlter.id ||
                req.senderId === currentAlter.id ||
                req.receiverId === user.uid ||
                req.senderId === user.uid
            );

            // Deduplicate by ID
            const uniqueRequests = Array.from(new Map(relevantRequests.map(item => [item.id, item])).values());

            // Helper to fetch keys
            const getSenderInfo = async (senderId: string) => {
                if (!senderId) {
                    return { name: 'Utilisateur inconnu', avatar: null, exists: false };
                }
                try {
                    // Try Alter
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('../../src/lib/firebase');
                    const alterSnap = await getDoc(doc(db, 'alters', senderId));
                    if (alterSnap.exists()) {
                        const data = alterSnap.data();
                        return { name: data.name, avatar: data.avatar || data.avatar_url, exists: true };
                    }

                    // Try System
                    const systemSnap = await getDoc(doc(db, 'systems', senderId));
                    if (systemSnap.exists()) {
                        const data = systemSnap.data();
                        return { name: data.username || 'Système', avatar: data.avatar || data.avatar_url, exists: true };
                    }

                    // Special case: if senderId looks like a name instead of a Firebase ID
                    if (senderId.length < 15 || !looksLikeFirebaseId(senderId)) {
                        return { name: senderId, avatar: null, exists: false };
                    }

                    // Profile doesn't exist (deleted or invalid ID)
                    return { name: 'Utilisateur inconnu', avatar: null, exists: false };
                } catch {
                    return { name: 'Utilisateur inconnu', avatar: null, exists: false };
                }
            };

            // Use Promise.all to enrich requests parallel
            const enrichedRequests = await Promise.all(uniqueRequests.map(async (req) => {
                const [senderInfo, receiverInfo] = await Promise.all([
                    getSenderInfo(req.senderId),
                    getSenderInfo(req.receiverId)
                ]);

                return {
                    ...req,
                    senderName: senderInfo.name,
                    senderAvatar: senderInfo.avatar,
                    receiverName: receiverInfo.name,
                    receiverAvatar: receiverInfo.avatar
                };
            }));

            // Sort by date descending
            enrichedRequests.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date();
                const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date();
                return dateB.getTime() - dateA.getTime();
            });

            setFriendRequests(enrichedRequests as FriendRequest[]); // We augmented it but it's compatible enough or we cast

            // Charger les notifications
            const q = query(
                collection(db, 'notifications'),
                where('targetSystemId', '==', user.uid),
                orderBy('created_at', 'desc'),
                limit(50)
            );

            // console.log('[Notifications] Fetching with recipientIds:', recipientIds);
            const querySnapshot = await getDocs(q);
            // console.log('[Notifications] Fetched docs count:', querySnapshot.size);

            const loadedNotifications: Notification[] = [];
            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data();

                // matchesAlter: specifically for this alter
                // isSystemWide: notifications for the whole system (e.g. news)
                // matchesSystemId: specifically for the main system profile
                // NEW: matches senderAlterId - if I accepted a request, I want to see the "You accepted X" notification
                const matchesAlter = data.recipientId === currentAlter.id;
                const isSystemWide = !data.recipientId && data.targetSystemId === user.uid;
                const matchesSystemId = data.recipientId === user.uid;
                const isActionsByMe = (data.senderAlterId === currentAlter.id) && (data.type === 'friend_request_accepted' || data.type === 'FRIEND_REQUEST_ACCEPTED');

                if (matchesAlter || isSystemWide || matchesSystemId || isActionsByMe) {
                    loadedNotifications.push({
                        id: docSnapshot.id,
                        ...data,
                        isRead: data.read || false,
                        timestamp: data.created_at?.toDate() || new Date()
                    } as Notification);
                }
            }


            // Collect all unique sender IDs to verify existence
            const senderIdsToVerify = new Set<string>();
            loadedNotifications.forEach(n => {
                // Priority 1: Explicit senderAlterId (e.g. friend_new)
                if (n.senderAlterId) {
                    senderIdsToVerify.add(n.senderAlterId);
                }
                // Priority 2: In-data alterId (e.g. friend_request_accepted - the acceptor)
                else if ((n.type === 'friend_request_accepted' || n.type === 'FRIEND_REQUEST_ACCEPTED') && n.data?.alterId) {
                    senderIdsToVerify.add(n.data.alterId);
                }
                // Priority 3: Standard senderId
                else if (n.senderId) {
                    senderIdsToVerify.add(n.senderId);
                }

                // Also check for friend request accepted legacy data for the TARGET (the one whose request was accepted)
                // This seems to be used for targetName
                if ((n.type === 'friend_request_accepted' || n.type === 'FRIEND_REQUEST_ACCEPTED') && n.data?.friendId) {
                    senderIdsToVerify.add(n.data.friendId);
                }
            });

            // Fetch all profiles in parallel
            const senderProfiles = new Map<string, { name: string, avatar: string | null, exists: boolean }>();
            await Promise.all(Array.from(senderIdsToVerify).map(async (sid) => {
                try {
                    const info = await getSenderInfo(sid);
                    senderProfiles.set(sid, info);
                } catch {
                    senderProfiles.set(sid, { name: 'Utilisateur inconnu', avatar: null, exists: false });
                }
            }));

            // Update notifications with verified data
            const verifiedNotifications = loadedNotifications.map(n => {
                // Determine the relevant ID for this notification
                let relevantId = n.senderAlterId || n.senderId;

                // Priority logic for friendship acceptance
                if ((n.type === 'friend_request_accepted' || n.type === 'FRIEND_REQUEST_ACCEPTED')) {
                    relevantId = n.senderAlterId || n.data?.alterId || n.senderId;
                }

                if (relevantId && senderProfiles.has(relevantId)) {
                    const profile = senderProfiles.get(relevantId)!;

                    if (!profile.exists) {
                        // If profile not found in Firestore, but we have a name in the doc (from server/function), use it!
                        if (n.actorName && n.actorName !== 'Utilisateur' && n.actorName !== 'Votre ami' && n.actorName !== 'Utilisateur inconnu') {
                            return { ...n, actorAvatar: n.actorAvatar || undefined };
                        }

                        // For friend_request_accepted, we might have targetName
                        if (n.type === 'friend_request_accepted' && n.targetName) {
                            // If this is a notification "by me", and we have targetName, it's the person I accepted
                            return { ...n, actorAvatar: n.actorAvatar || undefined };
                        }

                        return {
                            ...n,
                            actorName: 'Alter supprimé',
                            actorAvatar: undefined,
                            isProfileDeleted: true
                        };
                    } else {
                        // Update with latest info
                        return {
                            ...n,
                            actorName: profile.name,
                            actorAvatar: profile.avatar || undefined,
                            isProfileDeleted: false
                        };
                    }
                }

                // If we couldn't verify, keep original but ensure actorAvatar is not null
                return { ...n, actorAvatar: n.actorAvatar || undefined };
            });

            // Special enrichment for friend_request_accepted TARGET (the friend) if needed is handled above partly
            // But if we missed any specific logic for targetName/Avatar, we can keep it simpler: 
            // The verifiedNotifications now have the correct actorName.

            // Replace loadedNotifications with verified ones
            loadedNotifications.length = 0;
            loadedNotifications.push(...verifiedNotifications);

            // Removed redundant friend request addition to notifications list
            // They are already handled via the friendRequests state and merged in FlatList

            // Trier par date
            loadedNotifications.sort((a, b) => {
                const timeA = a.timestamp?.getTime?.() || 0;
                const timeB = b.timestamp?.getTime?.() || 0;
                return timeB - timeA;
            });

            setNotifications(loadedNotifications);

            // Marquer comme lu
            if (querySnapshot.docs.length > 0) {
                markAllAsRead(querySnapshot.docs);
            }

        } catch (error) {
            console.error('[Notifications] Error loading data:', error);
            // Alert.alert('Error', String(error)); // For debugging if needed
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentAlter, user]);

    const markAllAsRead = async (docs: any[]) => {
        if (!currentAlter) return;

        const batch = writeBatch(db);
        let hasUpdates = false;
        docs.forEach(doc => {
            const data = doc.data();
            // Only mark as read if it's for the current alter
            const isForMe = data.recipientId === currentAlter.id ||
                data.recipientId === user?.uid ||
                (!data.recipientId && data.targetSystemId === user?.uid);

            if (!data.read && isForMe) {
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

    // Mark all notifications as read when screen is opened
    useEffect(() => {
        const markAsRead = async () => {
            if (!currentAlter || notifications.length === 0) return;

            try {
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../../src/lib/firebase');

                // Mark all unread notifications as read
                const unreadNotifications = notifications.filter(n => !n.isRead);

                if (unreadNotifications.length > 0) {
                    // Update each notification to read: true
                    await Promise.all(
                        unreadNotifications.map(async (notif) => {
                            try {
                                // Skip friend requests as they're virtual notifications
                                if (notif.id.startsWith('friend_')) {
                                    return;
                                }

                                const notifRef = doc(db, 'notifications', notif.id);
                                await updateDoc(notifRef, { read: true });
                            } catch {
                                // Ignore error
                            }
                        })
                    );
                }
            } catch (error) {
                console.error('Error marking notifications as read:', error);
            }
        };

        // Small delay to ensure screen is fully visible
        const timer = setTimeout(markAsRead, 500);
        return () => clearTimeout(timer);
    }, [currentAlter, notifications]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const handleAcceptRequest = async (requestId: string) => {
        if (!requestId) {
            Alert.alert('Erreur', 'ID de requête manquant');
            return;
        }
        try {
            setLoading(true);
            triggerHaptic.success();
            await FriendService.acceptRequest(requestId);
            await loadData();
            triggerHaptic.success();
        } catch (error: any) {
            console.error('[Notifications] Error accepting request:', error);
            const errorMsg = error.message || 'not-found';
            Alert.alert('Erreur', `Impossible d'accepter la demande: ${errorMsg}`);
            triggerHaptic.error();
        } finally {
            setLoading(false);
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
        Alert.alert(
            "Supprimer cette notification ?",
            "Cette action est irréversible.",
            [
                {
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Check if it's a friend request (ID starts with "friend_")
                            if (notificationId.startsWith('friend_')) {
                                const realId = notificationId.replace('friend_', '');
                                await deleteDoc(doc(db, 'friend_requests', realId));
                                setFriendRequests(prev => prev.filter(r => r.id !== realId));
                            } else {
                                // Regular notification
                                await deleteDoc(doc(db, 'notifications', notificationId));
                            }

                            // Update local state
                            setNotifications(prev => prev.filter(n => n.id !== notificationId));
                            triggerHaptic.success();
                        } catch (error) {
                            console.error('Error deleting notification:', error);
                            triggerHaptic.error();
                            Alert.alert('Érreur', "Impossible de supprimer la notification");
                        }
                    }
                }
            ]
        );
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

                            // Only delete notifications (not friend requests which have IDs starting with "friend_")
                            notifications.forEach(n => {
                                if (!n.id.startsWith('friend_')) {
                                    const ref = doc(db, 'notifications', n.id);
                                    batch.delete(ref);
                                }
                            });

                            await batch.commit();

                            // Also delete all friend requests
                            const friendRequestIds = notifications
                                .filter(n => n.id.startsWith('friend_'))
                                .map(n => n.id.replace('friend_', ''));

                            for (const reqId of friendRequestIds) {
                                try {
                                    await deleteDoc(doc(db, 'friend_requests', reqId));
                                } catch {
                                    // Ignore error
                                }
                            }

                            setNotifications([]);
                            setFriendRequests([]);
                            triggerHaptic.success();
                        } catch (error) {
                            console.error('Error clear all:', error);
                            Alert.alert('Érreur', "Impossible de tout supprimer");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderFriendRequest = ({ item }: { item: FriendRequest }) => {
        // Find which side is 'Me' and which is 'Friend'
        const isMeSender = item.senderId === currentAlter?.id;
        const friendName = (item as any)[isMeSender ? 'receiverName' : 'senderName'] || 'Utilisateur';
        const friendAvatar = (item as any)[isMeSender ? 'receiverAvatar' : 'senderAvatar'];

        const isAccepted = item.status === 'accepted';

        return (
            <View style={[styles.requestCard, isAccepted && { backgroundColor: themeColors?.border || 'rgba(0,0,0,0.05)' }]}>
                <AvatarWithLoading
                    uri={friendAvatar}
                    fallbackText={friendName}
                    size={50}
                    color={isAccepted ? colors.textMuted : themeColor}
                />
                <View style={styles.requestContent}>
                    <Text style={[styles.requestTitle, { color: textColor }]}>{friendName}</Text>
                    <Text style={[styles.requestSubtitle, { color: textSecondaryColor }]}>
                        {isAccepted
                            ? `Ami avec ${isMeSender ? 'vous' : (currentAlter?.name || 'vous')}`
                            : `Ami potentiel`}
                    </Text>
                </View>
                <View style={styles.requestActions}>
                    {isAccepted ? (
                        <View style={[styles.acceptButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.success }]}>
                            <Text style={[styles.acceptButtonText, { color: colors.success }]}>Amis</Text>
                        </View>
                    ) : isMeSender ? (
                        <Text style={[styles.statusText, { color: textSecondaryColor, fontSize: 12, marginRight: 10 }]}>En attente</Text>
                    ) : (
                        <>
                            <AnimatedPressable style={[styles.acceptButton, { backgroundColor: themeColor }]} onPress={() => handleAcceptRequest(item.id)}>
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
            // Block navigation if profile is deleted
            if (item.isProfileDeleted && !item.postId) {
                Alert.alert(
                    "Profil supprimé",
                    "Ce profil a été supprimé et n'est plus accessible.",
                    [{ text: "OK" }]
                );
                return;
            }

            if (item.postId) {
                router.push(`/post/${item.postId}` as any);
            } else if (item.senderId) {
                router.push(`/profile/${item.senderId}` as any);
            }
        };

        return (
            <AnimatedPressable
                style={[
                    styles.notificationItem,
                    !item.isRead && {
                        backgroundColor: themeColor + '20',
                        borderLeftWidth: 4,
                        borderLeftColor: themeColor
                    },
                    item.isProfileDeleted && { opacity: 0.6 } // Gray out deleted profiles
                ]}
                onPress={handlePress}
                onLongPress={() => handleDeleteNotification(item.id)}
            >
                {/* Avatar Left */}
                <TouchableOpacity
                    onPress={() => {
                        if (item.isProfileDeleted) {
                            Alert.alert(
                                "Profil supprimé",
                                "Ce profil a été supprimé et n'est plus accessible.",
                                [{ text: "OK" }]
                            );
                        } else if (item.senderId) {
                            router.push(`/profile/${item.senderId}` as any);
                        }
                    }}
                >
                    <View style={styles.notificationAvatarContainer}>
                        {/* Deleted Profile Badge */}
                        {item.isProfileDeleted ? (
                            <View style={[styles.notificationAvatar, {
                                backgroundColor: colors.textMuted,
                                justifyContent: 'center',
                                alignItems: 'center',
                                opacity: 0.5
                            }]}>
                                <Ionicons name="person-remove" size={20} color="white" />
                                <View style={styles.deletedBadge}>
                                    <Ionicons name="close-circle" size={18} color={colors.error} />
                                </View>
                            </View>
                        ) : /* Special case: Double Avatar for Self-Accepted Friend Request */
                            (item.type === 'friend_request_accepted' || item.type === 'FRIEND_REQUEST_ACCEPTED') && item.senderAlterId === currentAlter?.id && item.targetAvatar ? (
                                <View style={{ width: 50, height: 50, flexDirection: 'row', alignItems: 'center' }}>
                                    <AvatarWithLoading
                                        uri={item.actorAvatar}
                                        fallbackText={item.actorName || '?'}
                                        size={35}
                                        color={themeColor}
                                        style={{ position: 'absolute', left: 0, opacity: 0.8 }}
                                    />
                                    <AvatarWithLoading
                                        uri={item.targetAvatar}
                                        fallbackText={item.targetName || '?'}
                                        size={35}
                                        color={themeColor}
                                        style={{ position: 'absolute', right: 0, borderWidth: 2, borderColor: themeColor }}
                                    />
                                </View>
                            ) : (
                                <AvatarWithLoading
                                    uri={item.actorAvatar}
                                    fallbackText={item.actorName || '?'}
                                    size={44}
                                    color={themeColor}
                                />
                            )}
                    </View>
                </TouchableOpacity>

                {/* Center Text */}
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationText} numberOfLines={3}>
                        {/* Conditionally render actor name */
                            !((item.type === 'friend_request_accepted' || item.type === 'FRIEND_REQUEST_ACCEPTED') && item.senderAlterId === currentAlter?.id) && (
                                <Text style={[styles.username, { color: textColor }]}>{item.actorName || "Un utilisateur"}</Text>
                            )}

                        <Text style={[styles.actionText, { color: textColor }]}>
                            {item.type === 'like' && " a aimé votre publication."}
                            {item.type === 'comment' && ` a commenté : "${item.subtitle || ''}"`}
                            {item.type === 'follow' && " a commencé à vous suivre."}
                            {item.type === 'mention' && " vous a mentionné."}
                            {item.type === 'friend_request' && " vous a envoyé une demande d'ami."}
                            {item.type === 'friend_new' && " est maintenant ami(e) avec vous."}
                            {(item.type === 'friend_request_accepted' || item.type === 'FRIEND_REQUEST_ACCEPTED') && (
                                item.senderAlterId === currentAlter?.id
                                    ? `Vous avez accepté la demande d'ami${item.targetName ? ` de ${item.targetName}` : ''}.`
                                    : " a accepté votre demande d'ami."
                            )}
                            {!['like', 'comment', 'follow', 'mention', 'friend_request', 'friend_request_accepted', 'FRIEND_REQUEST_ACCEPTED', 'friend_new'].includes(item.type) && " : Nouvelle notification"}
                        </Text>
                        <Text style={[styles.timeText, { color: textSecondaryColor }]}> {time_ago}</Text>
                    </Text>
                </View>

                {/* Right Side Media/Action */}

                {/* Fallback for text posts liked */}
                {item.type === 'like' && !hasMedia && item.subtitle && item.subtitle !== 'Publication' && (
                    <TouchableOpacity onPress={handlePress}>
                        <View style={[styles.notificationMedia, { backgroundColor: backgroundColor, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="text" size={20} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Right Side: Media or Follow Button */}
                {hasMedia && item.mediaUrl ? (
                    <TouchableOpacity onPress={handlePress}>
                        <Image
                            source={{ uri: item.mediaUrl }}
                            style={styles.notificationMedia}
                        />
                    </TouchableOpacity>
                ) : item.type === 'follow' || item.type === 'friend_request' ? (
                    <TouchableOpacity style={[styles.followButtonSmall, { backgroundColor: themeColor }]}>
                        <Text style={styles.followButtonText}>Suivre</Text>
                    </TouchableOpacity>
                ) : null}

            </AnimatedPressable>
        );
    };


    // État vide
    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={textSecondaryColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>Aucune notification</Text>
            <Text style={[styles.emptySubtitle, { color: textSecondaryColor }]}>
                Les demandes d&apos;amis, likes et commentaires apparaîtront ici
            </Text>
        </View>
    );

    // Calculer s'il y a du contenu
    const hasContent = friendRequests.length > 0 || notifications.length > 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <View style={[styles.header, { borderBottomColor: themeColors?.border || colors.border }]}>
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
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.title, { color: textColor }]}>Notifications</Text>
                </View>
                {hasContent ? (
                    <TouchableOpacity onPress={handleClearAll}>
                        <Text style={[styles.clearAllText, { color: themeColors?.primary || colors.primary }]}>Tout effacer</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 60 }} />}
            </View>

            <FlatList
                data={[
                    ...friendRequests.map(req => ({ ...req, _isFriendRequest: true, sortTime: req.createdAt?.seconds ? req.createdAt.seconds * 1000 : Date.now() })),
                    ...notifications.filter(n => n.type !== 'friend_request').map(n => ({ ...n, _isFriendRequest: false, sortTime: n.timestamp?.getTime?.() || 0 }))
                ].sort((a, b) => b.sortTime - a.sortTime)}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item, index }: { item: any; index: number }) => {
                    if (item._isFriendRequest) {
                        return (
                            <AnimatedNotificationWrapper index={index}>
                                {renderFriendRequest({ item })}
                            </AnimatedNotificationWrapper>
                        );
                    } else {
                        return (
                            <AnimatedNotificationWrapper index={index}>
                                {renderNotification({ item })}
                            </AnimatedNotificationWrapper>
                        );
                    }
                }}
                ListEmptyComponent={!hasContent && !loading ? renderEmpty : null}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={themeColors?.primary || colors.primary}
                        colors={[themeColors?.primary || colors.primary]} // Android
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
        // backgroundColor matches the theme dynamically handled in component style prop
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
    deletedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: 'white',
        borderRadius: 12,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
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

