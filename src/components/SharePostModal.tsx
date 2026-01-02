import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Alter, Post } from '../types';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { FriendService } from '../services/friends';
import { ShareService } from '../services/share';
import { router } from 'expo-router';

interface SharePostModalProps {
    visible: boolean;
    onClose: () => void;
    post: Post;
    onExternalShare?: () => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({ visible, onClose, post, onExternalShare }) => {
    const { currentAlter, system } = useAuth();
    const [friends, setFriends] = useState<Alter[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (visible && currentAlter) {
            loadFriends();
        }
    }, [visible, currentAlter]);

    const loadFriends = async () => {
        if (!currentAlter || !system) return;
        setLoading(true);
        try {
            const friendIds = await FriendService.getFriends(currentAlter.id);
            const uniqueFriendIds = [...new Set(friendIds)];

            if (uniqueFriendIds.length === 0) {
                setFriends([]);
                setLoading(false);
                return;
            }

            const friendsData = await Promise.all(uniqueFriendIds.map(async (fid) => {
                try {
                    const docRef = doc(db, 'alters', fid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { id: docSnap.id, ...docSnap.data() } as Alter;
                    }
                    return null;
                } catch (e) {
                    return null;
                }
            }));

            // Filter out nulls and internal alters
            const validFriends = friendsData.filter((f): f is Alter => {
                if (!f) return false;
                const isInternal = (f.systemId === system.id) ||
                    (f.system_id === system.id) ||
                    (f.userId === system.id);
                return !isInternal;
            });

            setFriends(validFriends);
        } catch (error) {
            console.error("Failed to load friends", error);
        } finally {
            setLoading(false);
        }
    };

    const getConversationId = (id1: string, id2: string) => {
        return [id1, id2].sort().join('_');
    };

    const handleSendToFriend = async (friend: Alter) => {
        if (!currentAlter || !system) return;
        setSending(true);
        try {
            const conversationId = getConversationId(currentAlter.id, friend.id);

            await addDoc(collection(db, 'messages'), {
                sender_alter_id: currentAlter.id,
                receiver_alter_id: friend.id,
                systemId: system.id,
                conversation_id: conversationId,
                content: `Partage un post de ${post.author_name || 'utilisateur'}`,
                type: 'post',
                post_id: post.id,
                is_internal: false,
                is_read: false,
                created_at: new Date().toISOString(),
                system_tag: null,
            });

            Alert.alert("Bravo", "Post envoyé !");
            onClose();
            // Optional: navigate to conversation
            // router.push(`/conversation/${friend.id}?internal=false`);

        } catch (error) {
            console.error("Error sending post:", error);
            Alert.alert("Erreur", "Impossible d'envoyer le post.");
        } finally {
            setSending(false);
        }
    };

    const handleExternalShare = () => {
        onClose();
        if (onExternalShare) {
            onExternalShare();
        } else {
            ShareService.sharePost(post.id, post.content, post.author_name || 'Utilisateur');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Partager le post</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* External Share Option */}
                    <TouchableOpacity style={styles.externalShareButton} onPress={handleExternalShare}>
                        <Ionicons name="share-outline" size={24} color={colors.primary} />
                        <Text style={styles.externalShareText}>Partager via d'autres applications...</Text>
                    </TouchableOpacity>

                    <Text style={styles.subtitle}>Envoyer à un ami</Text>

                    {loading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={friends}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Aucun ami trouvé pour partager.</Text>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.friendItem}
                                    onPress={() => handleSendToFriend(item)}
                                    disabled={sending}
                                >
                                    <View style={[styles.avatar, { backgroundColor: item.color || colors.primary }]}>
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                        ) : (
                                            <Text style={styles.avatarText}>
                                                {item.name.charAt(0).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.friendName}>{item.name}</Text>
                                    <Ionicons name="send" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h3,
        fontWeight: 'bold',
    },
    subtitle: {
        ...typography.h4,
        color: colors.textSecondary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    externalShareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    externalShareText: {
        ...typography.body,
        fontWeight: '600',
        color: colors.primary,
    },
    list: {
        maxHeight: 300,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    friendName: {
        flex: 1,
        ...typography.body,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        padding: spacing.lg,
    }
});
