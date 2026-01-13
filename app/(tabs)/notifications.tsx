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
import { AvatarWithLoading } from '../../src/components/ui/AvatarWithLoading';

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
}

interface NotificationSection {
    title: string;
    data: Notification[];
}

import { getThemeColors } from '../../src/lib/cosmetics';

export default function NotificationsScreen() {
    const { currentAlter, alters, user } = useAuth();

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
            const systemRequestsPromise = FriendService.getSystemRequests(user.uid, ['pending', 'accepted']);

            // B. Per-Alter fetch (Legacy compatibility)
            const allAlterIds = alters.map(a => a.id);
            if (user.uid && !allAlterIds.includes(user.uid)) {
                allAlterIds.push(user.uid); // Ensure system profile is included
            }

            const individualRequestsPromises = allAlterIds.map(id =>
                FriendService.getRequests(id, ['pending', 'accepted'])
                    .catch(e => {
                        console.log(`Failed to fetch requests for ${id}`, e);
                        return [];
                    })
            );

            const [systemRequests, ...individualResults] = await Promise.all([
                systemRequestsPromise,
                ...individualRequestsPromises
            ]);

            const allRequests = [
                ...systemRequests,
                ...individualResults.flat()
            ];

            // Filter relevant requests for CURRENT ALTER only
            // logic: show if receiverId is Me OR (receiverId is UserUID [legacy system request] AND I am Host/Admin?)
            // For now, let's show requests explicitly for Me OR generic System requests (userId)
            const relevantRequests = allRequests.filter(req =>
                req.receiverId === currentAlter.id ||
                req.receiverId === user.uid
            );

            // Deduplicate by ID
            const uniqueRequests = Array.from(new Map(relevantRequests.map(item => [item.id, item])).values());

            // Helper to fetch keys
            const getSenderInfo = async (senderId: string) => {
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

                    // Profile doesn't exist (deleted)
                    return { name: 'Profil supprimé', avatar: null, exists: false };
                } catch (e) {
                    return { name: 'Utilisateur inconnu', avatar: null, exists: false };
                }
            };

            // Use Promise.all to enrich requests parallel
            const enrichedRequests = await Promise.all(uniqueRequests.map(async (req) => {
                const info = await getSenderInfo(req.senderId);

                // Also get Receiver Name (my alter)
                let receiverName = 'Vous';
                const myAlter = alters.find(a => a.id === req.receiverId);
                if (myAlter) {
                    receiverName = myAlter.name;
                } else if (req.receiverId === user.uid) {
                    receiverName = 'Système';
                }

                return { ...req, senderName: info.name, senderAvatar: info.avatar, receiverName };
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

                // FILTER: Only include if recipient matches current alter
                // If recipientId is missing, assume it's for everyone or check targetSystemId
                const isForMe = data.recipientId === currentAlter.id ||
                    data.recipientId === user.uid ||
                    (!data.recipientId && data.targetSystemId === user.uid);

                if (isForMe) {
                    loadedNotifications.push({
                        id: docSnapshot.id,
                        ...data,
                        isRead: data.read || false,
                        timestamp: data.created_at?.toDate() || new Date()
                    } as Notification);
                }
            }

            // Enrich Notifications that are missing actor info OR have generic placeholder OR are missing avatar
            const notificationsToEnrich = loadedNotifications.filter(n =>
                (
                    !n.actorName ||
                    n.actorName.includes('tilisateur') ||
                    n.actorName === '?' ||
                    !n.actorAvatar // Enrichir aussi si l'avatar manque
                ) && n.senderId
            );
            if (notificationsToEnrich.length > 0) {
                console.log('Enriching', notificationsToEnrich.length, 'notifications');
                await Promise.all(notificationsToEnrich.map(async (n) => {
                    // PRIORITÉ À L'ALTER ID si disponible pour afficher le bon profil
                    let senderId = (n as any).senderAlterId || n.senderId;

                    // Specific handling for friend_request_accepted if senderId is missing (legacy)
                    if ((n.type === 'friend_request_accepted' || n.type === 'FRIEND_REQUEST_ACCEPTED') && !senderId && n.data) {
                        senderId = n.data.alterId || n.data.friendId;
                    }

                    // For friend_request_accepted, we also want the TARGET name (the friend)
                    if ((n.type === 'friend_request_accepted' || n.type === 'FRIEND_REQUEST_ACCEPTED') && n.data) {
                        const friendId = n.data.friendId;
                        if (friendId) {
                            // Attempt to get friend name
                            try {
                                if (typeof getSenderInfo === 'function') {
                                    const info = await getSenderInfo(friendId);
                                    if (info.name && !info.name.includes('Utilisateur')) {
                                        n.targetName = info.name;
                                        if (info.avatar) n.targetAvatar = info.avatar;
                                    }
                                }

                                if (!n.targetName || !n.targetAvatar) {
                                    const { doc, getDoc } = await import('firebase/firestore');
                                    const { db } = await import('../../src/lib/firebase');
                                    const friendDoc = await getDoc(doc(db, 'alters', friendId));
                                    if (friendDoc.exists()) {
                                        if (!n.targetName) n.targetName = friendDoc.data().name;
                                        if (!n.targetAvatar) n.targetAvatar = friendDoc.data().avatar || friendDoc.data().avatar_url;
                                    } else {
                                        const sysSnap = await getDoc(doc(db, 'systems', friendId));
                                        if (sysSnap.exists()) {
                                            if (!n.targetName) n.targetName = sysSnap.data().name;
                                            if (!n.targetAvatar) n.targetAvatar = sysSnap.data().avatar_url || sysSnap.data().avatar;
                                        }
                                    }
                                }
                            } catch (e) {
                                console.log('Error fetching target info for', friendId, e);
                            }
                        }
                    }

                    if (senderId) {
                        try {
                            // Try to get name via helper if available, or fetch doc
                            if (typeof getSenderInfo === 'function') {
                                const info = await getSenderInfo(senderId);
                                n.actorName = info.name;
                                if (info.avatar) n.actorAvatar = info.avatar;
                                n.isProfileDeleted = !(info as any).exists; // Mark if profile is deleted
                            } else {
                                // Fallback: If actorName is still missing/generic, fetch directly
                                if (!n.actorName || n.actorName === '?' || n.actorName.includes('tilisateur')) {
                                    const { doc, getDoc } = await import('firebase/firestore');
                                    const { db } = await import('../../src/lib/firebase');
                                    const senderDoc = await getDoc(doc(db, 'alters', senderId));
                                    if (senderDoc.exists()) {
                                        n.actorName = senderDoc.data().name;
                                        n.actorAvatar = senderDoc.data().avatar || senderDoc.data().avatar_url;
                                        n.isProfileDeleted = false;
                                    } else {
                                        // Try system as fallback
                                        const sysSnap = await getDoc(doc(db, 'systems', senderId));
                                        if (sysSnap.exists()) {
                                            n.actorName = sysSnap.data().name || 'Système';
                                            n.actorAvatar = sysSnap.data().avatar_url || sysSnap.data().avatar;
                                            n.isProfileDeleted = false;
                                        } else {
                                            // Profile doesn't exist
                                            n.actorName = 'Profil supprimé';
                                            n.isProfileDeleted = true;
                                        }
                                    }
                                } else if (!n.actorAvatar) {
                                    // Just avatar missing
                                    const { doc, getDoc } = await import('firebase/firestore');
                                    const { db } = await import('../../src/lib/firebase');
                                    const senderDoc = await getDoc(doc(db, 'alters', senderId));
                                    if (senderDoc.exists()) {
                                        n.actorAvatar = senderDoc.data().avatar || senderDoc.data().avatar_url;
                                    }
                                }
                            }
                        } catch (err) {
                            console.log(`Could not fetch actor for notification ${n.id}`, err);
                            n.isProfileDeleted = true; // Assume deleted on error
                        }
                    } else {
                        console.log('Notification missing senderId:', n.id, n);
                    }
                }));
            }

            // Ajouter les demandes d'amis comme notifications (si non dupliquées)
            enrichedRequests.forEach(req => {
                loadedNotifications.push({
                    id: `friend_${req.id}`,
                    type: 'friend_request',
                    title: 'Nouvelle demande d\'ami',
                    subtitle: `De: ${req.senderName}`,
                    actorName: req.senderName, // Set actorName!
                    timestamp: req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000) : new Date(),
                    isRead: false,
                    actionData: req,
                    senderId: req.senderId
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
        } catch (error: any) {
            console.error('[Notifications] Error accepting request:', error);
            console.error('Error Code:', error.code);
            console.error('Error Message:', error.message);
            Alert.alert('Erreur', `Impossible d'accepter la demande: ${error.message}`);
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
                <AvatarWithLoading
                    uri={(item as any).senderAvatar}
                    fallbackText={senderName}
                    size={50}
                    color={isAccepted ? colors.textMuted : themeColor}
                />
                <View style={styles.requestContent}>
                    <Text style={[styles.requestTitle, { color: textColor }]}>{senderName}</Text>
                    <Text style={[styles.requestSubtitle, { color: textSecondaryColor }]}>
                        {isAccepted
                            ? `Ami avec ${(item as any).receiverName || 'vous'}`
                            : `Pour : ${(item as any).receiverName || 'vous'}`}
                    </Text>
                </View>
                <View style={styles.requestActions}>
                    {isAccepted ? (
                        <View style={[styles.acceptButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.success }]}>
                            <Text style={[styles.acceptButtonText, { color: colors.success }]}>Amis</Text>
                        </View>
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
                            (item.type === 'friend_request_accepted' || item.type === 'FRIEND_REQUEST_ACCEPTED') && item.senderId === currentAlter?.id && item.targetAvatar ? (
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
                            !((item.type === 'friend_request_accepted' || item.type === 'FRIEND_REQUEST_ACCEPTED') && item.senderId === currentAlter?.id) && (
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
                                item.senderId === currentAlter?.id
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
                Les demandes d'amis, likes et commentaires apparaîtront ici
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
                renderItem={({ item }: { item: any }) => {
                    if (item._isFriendRequest) {
                        return renderFriendRequest({ item });
                    } else {
                        return renderNotification({ item });
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

