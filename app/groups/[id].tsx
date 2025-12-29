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
    ActivityIndicator,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { GroupService } from '../../src/services/groups';
import { Group, Message, Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function GroupChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { currentAlter, user, alters } = useAuth();

    const [group, setGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadGroupData();
        }
    }, [id]);

    const loadGroupData = async () => {
        setLoading(true);
        try {
            // 1. Get Group Info
            const groupData = await GroupService.getGroup(id);
            setGroup(groupData);

            // 2. Get Messages
            if (groupData) {
                await fetchMessages();
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de charger le groupe");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        const msgs = await GroupService.getGroupMessages(id);
        setMessages(msgs as Message[]);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentAlter) return;

        try {
            await GroupService.sendGroupMessage(
                id,
                currentAlter.id,
                newMessage.trim(),
                'text'
            );
            setNewMessage('');
            fetchMessages(); // Refresh messages (should be realtime ideally)
        } catch (error) {
            Alert.alert("Erreur", "Message non envoyé");
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.sender_alter_id === currentAlter?.id;
        // Find cached alter info if available (only local alters known for now, unless we fetch members)
        const senderAlter = alters.find(a => a.id === item.sender_alter_id);
        const senderName = senderAlter ? senderAlter.name : "Membre inconnu";
        const senderColor = senderAlter ? senderAlter.color : colors.textSecondary;

        return (
            <View style={[
                styles.messageContainer,
                isMine ? styles.messageContainerMine : styles.messageContainerOther
            ]}>
                {!isMine && (
                    <View style={[styles.messageAvatar, { backgroundColor: senderColor }]}>
                        <Text style={styles.messageAvatarText}>
                            {senderName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isMine ? styles.messageBubbleMine : styles.messageBubbleOther
                ]}>
                    {!isMine && <Text style={styles.senderName}>{senderName}</Text>}
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.messageTime}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading && !group) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{group?.name || 'Groupe'}</Text>
                    <Text style={styles.headerSubtitle}>{group?.members?.length || 1} membres</Text>
                </View>
                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                inverted={false}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !newMessage.trim() && styles.disabledSendButton]}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim()}
                >
                    <Ionicons name="send" size={20} color="white" />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingTop: 60,
        backgroundColor: colors.backgroundCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        marginRight: spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        ...typography.h3,
        fontSize: 18,
    },
    headerSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    menuButton: {
        padding: spacing.xs,
    },
    messagesList: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        maxWidth: '80%',
    },
    messageContainerMine: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    messageContainerOther: {
        alignSelf: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        marginTop: 4,
    },
    messageAvatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    messageBubble: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        minWidth: 100,
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
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    messageText: {
        ...typography.body,
        color: colors.text,
    },
    messageTime: {
        fontSize: 10,
        color: colors.textMuted,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 16,
        color: colors.text,
        maxHeight: 100,
        marginRight: spacing.md,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSendButton: {
        opacity: 0.5,
        backgroundColor: colors.textMuted,
    },
});
