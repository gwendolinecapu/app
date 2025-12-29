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
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Message, Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

export default function ConversationScreen() {
    const { id, internal } = useLocalSearchParams<{ id: string; internal?: string }>();
    const { alters, currentAlter, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherAlter, setOtherAlter] = useState<Alter | null>(null);
    const [loading, setLoading] = useState(false);

    const getConversationId = (id1: string, id2: string) => {
        return [id1, id2].sort().join('_');
    };

    useEffect(() => {
        // Trouver l'autre participant
        const alter = alters.find((a) => a.id === id);
        setOtherAlter(alter || null);

        if (currentAlter && id) {
            fetchMessages();
        }
    }, [id, alters, currentAlter]);

    const fetchMessages = async () => {
        if (!currentAlter || !id) return;

        try {
            const conversationId = getConversationId(currentAlter.id, id);
            const q = query(
                collection(db, 'messages'),
                where('conversation_id', '==', conversationId),
                orderBy('created_at', 'asc')
            );

            // Note: onSnapshot pourrait être utilisé ici pour le temps réel
            const querySnapshot = await getDocs(q);
            const data: Message[] = [];

            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Message);
            });

            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
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
            });

            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.sender_alter_id === currentAlter?.id;
        const senderAlter = alters.find((a) => a.id === item.sender_alter_id);

        return (
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
                        <Text style={styles.senderName}>{senderAlter?.name}</Text>
                    )}
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.messageTime}>
                        {new Date(item.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>
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
});
