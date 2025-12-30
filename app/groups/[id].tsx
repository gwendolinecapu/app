import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { GroupService } from '../../src/services/groups';
import { Group, Message } from '../../src/types';
import { colors, spacing, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { MessageInput } from '../../src/components/messaging/MessageInput';
import { MessageBubble } from '../../src/components/messaging/MessageBubble';
import { PollCreatorModal } from '../../src/components/messaging/PollCreatorModal';
import { NoteCreatorModal } from '../../src/components/messaging/NoteCreatorModal';

export default function GroupChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { currentAlter, user, alters } = useAuth();
    // Use a Ref to keep track of the subscription to avoid effect dependencies issues if any
    const typingUnsubscribeRef = useRef<(() => void) | null>(null);

    const [group, setGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [pollModalVisible, setPollModalVisible] = useState(false);
    const [noteModalVisible, setNoteModalVisible] = useState(false);

    // Typing state
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    useEffect(() => {
        if (id && GroupService.subscribeToTyping) {
            typingUnsubscribeRef.current = GroupService.subscribeToTyping(id, (typers) => {
                // Filter out myself if needed, though relying on name check for now
                const othersTyping = typers.filter(name => name !== currentAlter?.name);
                setTypingUsers(othersTyping);
            });
        }

        return () => {
            if (typingUnsubscribeRef.current) {
                typingUnsubscribeRef.current();
            }
        };
    }, [id, currentAlter?.name]);

    useEffect(() => {
        if (id) {
            loadGroupData();
        }
    }, [id]);

    const loadGroupData = async () => {
        setLoading(true);
        try {
            const groupData = await GroupService.getGroup(id);
            setGroup(groupData);

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

    const handleSendMessage = async (content: string, type: 'text' | 'image' | 'poll' | 'note', extraData?: any) => {
        if (!currentAlter || !user) return;

        try {
            await GroupService.sendGroupMessage(
                id,
                user.uid,
                currentAlter.id,
                content,
                type,
                extraData
            );
            fetchMessages();
        } catch (error) {
            Alert.alert("Erreur", "Message non envoyé");
        }
    };

    const handleSendPoll = (question: string, options: string[]) => {
        handleSendMessage(question, 'poll', { pollOptions: options });
        setPollModalVisible(false);
    };

    const handleSendNote = (title: string, content: string) => {
        handleSendMessage(content, 'note', { noteTitle: title });
        setNoteModalVisible(false);
    };

    const handleTyping = (isTyping: boolean) => {
        if (!currentAlter || !user || !id) return;
        GroupService.setTypingStatus(id, user.uid, isTyping, currentAlter.name);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.sender_alter_id === currentAlter?.id;
        const senderAlter = alters.find(a => a.id === item.sender_alter_id);

        return (
            <MessageBubble
                message={item}
                isMine={isMine}
                senderAlter={senderAlter}
                currentUserId={user?.uid}
            />
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

            {typingUsers.length > 0 && (
                <View style={styles.typingContainer}>
                    <Text style={styles.typingText}>
                        {typingUsers.join(', ')} {typingUsers.length > 1 ? 'sont en train d\'écrire...' : 'est en train d\'écrire...'}
                    </Text>
                </View>
            )}

            <MessageInput
                onSend={(text) => handleSendMessage(text, 'text')}
                onOpenPoll={() => setPollModalVisible(true)}
                onOpenNote={() => setNoteModalVisible(true)}
                onPickImage={() => Alert.alert("Bientôt", "Envoi d'images bientôt disponible !")}
                onTyping={handleTyping}
            />

            <PollCreatorModal
                visible={pollModalVisible}
                onClose={() => setPollModalVisible(false)}
                onSend={handleSendPoll}
            />

            <NoteCreatorModal
                visible={noteModalVisible}
                onClose={() => setNoteModalVisible(false)}
                onSend={handleSendNote}
            />
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
    typingContainer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.background,
    },
    typingText: {
        fontSize: 12,
        color: colors.textMuted,
        fontStyle: 'italic',
    }
});
