import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Message, Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

export default function ConversationScreen() {
    const { id, internal } = useLocalSearchParams<{ id: string; internal?: string }>();
    const { alters, currentAlter, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherAlter, setOtherAlter] = useState<Alter | null>(null);
    const [loading, setLoading] = useState(false);
    const [useSystemTag, setUseSystemTag] = useState(false); // Toggle for System Tag

    const getConversationId = (id1: string, id2: string) => {
        return [id1, id2].sort().join('_');
    };

    useEffect(() => {
        // Find other participant
        const alter = alters.find((a) => a.id === id);
        setOtherAlter(alter || null);
    }, [id, alters]);

    useEffect(() => {
        if (!currentAlter || !id) return;

        const conversationId = getConversationId(currentAlter.id, id);
        const q = query(
            collection(db, 'messages'),
            where('conversation_id', '==', conversationId),
            orderBy('created_at', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Message[] = [];
            snapshot.docs.forEach((docSnap) => {
                const msg = { id: docSnap.id, ...docSnap.data() } as Message;
                data.push(msg);

                // Mark as read if not mine
                if (msg.receiver_alter_id === currentAlter.id && !msg.is_read) {
                    markMessageAsRead(docSnap.id);
                }
            });
            setMessages(data);
        });

        return () => unsubscribe();
    }, [currentAlter, id]);

    const markMessageAsRead = async (messageId: string) => {
        try {
            await updateDoc(doc(db, 'messages', messageId), {
                is_read: true
            });
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    const toggleLike = async (message: Message) => {
        if (!currentAlter) return;
        const messageRef = doc(db, 'messages', message.id);
        const existingReaction = message.reactions?.find(r => r.user_id === currentAlter.id && r.emoji === '❤️');

        try {
            if (existingReaction) {
                await updateDoc(messageRef, {
                    reactions: arrayRemove(existingReaction)
                });
            } else {
                await updateDoc(messageRef, {
                    reactions: arrayUnion({ emoji: '❤️', user_id: currentAlter.id })
                });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentAlter || !id) return;

        setLoading(true);
        try {
            const conversationId = getConversationId(currentAlter.id, id);

            await addDoc(collection(db, 'messages'), {
                sender_alter_id: currentAlter.id,
                receiver_alter_id: id,
                systemId: user?.uid, // Add systemId for permissions
                conversation_id: conversationId,
                content: newMessage.trim(),
                is_internal: internal === 'true',
                is_read: false,
                created_at: new Date().toISOString(),
                system_tag: useSystemTag ? (currentAlter.name) : undefined,
            });

            setNewMessage('');
            // No need to fetchMessages() if using onSnapshot
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.sender_alter_id === currentAlter?.id;
        const senderAlter = alters.find((a) => a.id === item.sender_alter_id);
        const likedByMe = item.reactions?.some(r => r.user_id === currentAlter?.id && r.emoji === '❤️');

        // Simple double tap simulation using timestamp for now to avoid gesture handler complexity if not set up
        let lastTap = 0;
        const handleDoubleTap = () => {
            const now = Date.now();
            const DOUBLE_PRESS_DELAY = 300;
            if (now - lastTap < DOUBLE_PRESS_DELAY) {
                const { triggerHaptic } = require('../../src/lib/haptics');
                triggerHaptic.selection();
                toggleLike(item);
            }
            lastTap = now;
        };

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleDoubleTap}
            >
                <View
                    style={[
                        styles.messageContainer,
                        isMine ? styles.messageContainerMine : styles.messageContainerOther,
                    ]}
                >
                    {!isMine && (
                        <View
                            style={[
                                styles.messageAvatar,
                                { backgroundColor: senderAlter?.color || colors.primary },
                            ]}
                        >
                            <Text style={styles.messageAvatarText}>
                                {senderAlter?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                    <View
                        style={[
                            styles.messageBubble,
                            isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                        ]}
                    >
                        {!isMine && (
                            <Text style={styles.senderName}>
                                {senderAlter?.name} {item.system_tag && <Text style={styles.systemTag}>• {item.system_tag}</Text>}
                            </Text>
                        )}
                        <Text style={styles.messageText}>{item.content}</Text>

                        {item.reactions && item.reactions.length > 0 && (
                            <View style={styles.reactionsContainer}>
                                <Text style={styles.reactionText}>❤️ {item.reactions.length}</Text>
                            </View>
                        )}

                        <View style={styles.messageFooter}>
                            <Text style={styles.messageTime}>
                                {new Date(item.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                            {isMine && (
                                <Text style={styles.readStatus}>
                                    {item.is_read ? ' ✓✓' : ' ✓'}
                                </Text>
                            )}
                            )}
                        </View>
                    </View>
            </TouchableOpacity>
            </View >
        );
};

const renderEmptyState = () => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={styles.emptyText}>
            Commencez la conversation avec {otherAlter?.name || 'cet alter'}
        </Text>
    </View>
);

return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={100}
    >
        <View style={styles.header}>
            <View
                style={[
                    styles.avatar,
                    { backgroundColor: otherAlter?.color || colors.primary },
                ]}
            >
                <Text style={styles.avatarText}>
                    {otherAlter?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
            </View>
            <View style={styles.headerInfo}>
                <Text style={styles.headerName}>{otherAlter?.name || 'Conversation'}</Text>
                <Text style={styles.headerSubtitle}>
                    {internal === 'true' ? '💜 Discussion interne' : '🌐 Discussion externe'}
                </Text>
            </View>
            <TouchableOpacity
                style={[styles.tagButton, useSystemTag && styles.tagButtonActive]}
                onPress={() => {
                    const { triggerHaptic } = require('../../src/lib/haptics');
                    triggerHaptic.selection();
                    setUseSystemTag(!useSystemTag);
                }}
            >
                <Text style={[styles.tagButtonText, useSystemTag && styles.tagButtonTextActive]}># Tag</Text>
            </TouchableOpacity>
        </View>

        <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={renderEmptyState}
            inverted={false}
        />

        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Écrire un message..."
                placeholderTextColor={colors.textMuted}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
            />
            <TouchableOpacity
                style={[
                    styles.sendButton,
                    !newMessage.trim() && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={loading || !newMessage.trim()}
            >
                <Text style={styles.sendButtonText}>→</Text>
            </TouchableOpacity>
        </View>
    </KeyboardAvoidingView>
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
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerInfo: {
        marginLeft: spacing.md,
    },
    headerName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        ...typography.caption,
        marginTop: 2,
    },
    tagButton: {
        marginLeft: 'auto',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tagButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tagButtonText: {
        ...typography.caption,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    tagButtonTextActive: {
        color: colors.text,
    },
    messagesList: {
        padding: spacing.md,
        flexGrow: 1,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        alignItems: 'flex-end',
    },
    messageContainerMine: {
        justifyContent: 'flex-end',
    },
    messageContainerOther: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    messageAvatarText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    messageBubbleMine: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: colors.backgroundCard,
        borderBottomLeftRadius: 4,
    },
    senderName: {
        ...typography.caption,
        fontWeight: 'bold',
        marginBottom: spacing.xs,
    },
    messageText: {
        ...typography.body,
    },
    messageTime: {
        ...typography.caption,
        marginTop: spacing.xs,
        opacity: 0.7,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.bodySmall,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        color: colors.text,
        maxHeight: 100,
        marginRight: spacing.sm,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: colors.textMuted,
    },
    sendButtonText: {
        color: colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    systemTag: {
        fontWeight: 'normal',
        fontStyle: 'italic',
        opacity: 0.8
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    readStatus: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        marginLeft: 4,
    },
    reactionsContainer: {
        position: 'absolute',
        bottom: -10,
        left: 10,
        backgroundColor: colors.backgroundCard,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    reactionText: {
        fontSize: 10,
    }
});
