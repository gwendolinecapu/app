import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';
import { Message, Alter } from '../src/types';
import { triggerHaptic } from '../src/lib/haptics';

export default function TeamChatScreen() {
    const { user, alters, activeFront } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
    const [showSenderPicker, setShowSenderPicker] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Initialize sender to current front or first alter
    useEffect(() => {
        if (!selectedSenderId && alters.length > 0) {
            if (activeFront.alters.length > 0) {
                setSelectedSenderId(activeFront.alters[0].id);
            } else {
                setSelectedSenderId(alters[0].id);
            }
        }
    }, [alters, activeFront, selectedSenderId]);

    const currentSender = alters.find(a => a.id === selectedSenderId) || alters[0];

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, `system_chats/${user.uid}/messages`),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Chat snapshot error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user || !selectedSenderId) return;

        const text = inputText.trim();
        setInputText('');
        triggerHaptic.light();

        try {
            await addDoc(collection(db, `system_chats/${user.uid}/messages`), {
                content: text,
                sender_alter_id: selectedSenderId,
                type: 'text',
                is_internal: true,
                is_read: true,
                created_at: new Date().toISOString(), // Use ISO string for consistency with type
                system_id: user.uid
            });
        } catch (error) {
            console.error("Error sending message", error);
            setInputText(text); // Revert on fail
        }
    };

    const renderMessage = ({ item, index }: { item: Message, index: number }) => {
        const sender = alters.find(a => a.id === item.sender_alter_id);
        const isMe = item.sender_alter_id === selectedSenderId;

        const showAvatar = true;

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.messageRowRight : styles.messageRowLeft
            ]}>
                {!isMe && showAvatar && (
                    <Image
                        source={sender?.avatar_url ? { uri: sender.avatar_url } : { uri: 'https://via.placeholder.com/40' }}
                        style={styles.msgAvatar}
                    />
                )}

                <View style={[
                    styles.messageBubble,
                    isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
                    sender?.color && !isMe ? { borderColor: sender.color, borderWidth: 1 } : {}
                ]}>
                    {!isMe && (
                        <Text style={[styles.senderName, { color: sender?.color || colors.textSecondary }]}>
                            {sender?.name || 'Inconnu'}
                        </Text>
                    )}
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {isMe && showAvatar && (
                    <Image
                        source={sender?.avatar_url ? { uri: sender.avatar_url } : { uri: 'https://via.placeholder.com/40' }}
                        style={styles.msgAvatarRight}
                    />
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Discussion Système</Text>
                    <Text style={styles.headerSubtitle}>{alters.length} membres</Text>
                </View>
                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    inverted
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: Math.max(spacing.md, Platform.OS === 'ios' ? 0 : spacing.md) }]}>
                    <TouchableOpacity
                        style={styles.senderPill}
                        onPress={() => {
                            triggerHaptic.selection();
                            setShowSenderPicker(true);
                        }}
                    >
                        {currentSender?.avatar_url ? (
                            <Image source={{ uri: currentSender.avatar_url }} style={styles.senderPillAvatar} />
                        ) : (
                            <View style={[styles.senderPillAvatarPlaceholder, { backgroundColor: currentSender?.color || colors.primary }]}>
                                <Text style={styles.senderPillInitial}>{currentSender?.name?.charAt(0) || '?'}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Message..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            maxLength={1000}
                        />
                        {inputText.trim().length > 0 && (
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSendMessage}
                            >
                                <Ionicons name="arrow-up" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={showSenderPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSenderPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSenderPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Qui parle ?</Text>
                        <FlatList
                            data={alters}
                            keyExtractor={item => item.id}
                            numColumns={4}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerItem,
                                        selectedSenderId === item.id && styles.pickerItemSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedSenderId(item.id);
                                        setShowSenderPicker(false);
                                        triggerHaptic.selection();
                                    }}
                                >
                                    <View style={[
                                        styles.pickerAvatarContainer,
                                        selectedSenderId === item.id && { borderColor: item.color || colors.primary, borderWidth: 2 }
                                    ]}>
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={styles.pickerAvatar} />
                                        ) : (
                                            <View style={[styles.pickerPlaceholder, { backgroundColor: item.color || colors.primary }]}>
                                                <Text style={styles.pickerInitial}>{item.name.charAt(0)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.pickerName,
                                        selectedSenderId === item.id && { color: colors.primary, fontWeight: 'bold' }
                                    ]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
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
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text,
    },
    headerSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    headerAction: {
        padding: spacing.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        alignItems: 'flex-end',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    msgAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
        backgroundColor: colors.backgroundLight,
    },
    msgAvatarRight: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginLeft: spacing.sm,
        backgroundColor: colors.backgroundLight,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    messageBubbleLeft: {
        backgroundColor: colors.backgroundCard,
        borderBottomLeftRadius: 2,
    },
    messageBubbleRight: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 2,
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    messageText: {
        ...typography.body,
        color: 'white',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        backgroundColor: colors.background, // Clean background
        borderTopWidth: 0,
    },
    senderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.sm,
        marginBottom: 8, // Align with input
        padding: 4,
        borderRadius: 20,
        backgroundColor: colors.backgroundCard,
    },
    senderPillAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    senderPillAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    senderPillInitial: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: 24,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4, // Slimmer look
        minHeight: 44,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        maxHeight: 120,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '60%',
    },
    modalTitle: {
        ...typography.h3,
        textAlign: 'center',
        marginBottom: spacing.lg,
        color: colors.text,
    },
    pickerItem: {
        flex: 1,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    pickerItemSelected: {
        opacity: 1,
    },
    pickerAvatarContainer: {
        marginBottom: spacing.xs,
        borderRadius: 24,
        padding: 2,
    },
    pickerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    pickerPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    pickerName: {
        ...typography.caption,
        textAlign: 'center',
        maxWidth: 60,
    },
});
