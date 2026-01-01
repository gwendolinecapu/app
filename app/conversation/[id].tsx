
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
    Image,
    Alert,
    Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Message, Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../src/lib/firebase';

export default function ConversationScreen() {
    const { id, internal } = useLocalSearchParams<{ id: string; internal?: string }>();
    const { alters, currentAlter, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherAlter, setOtherAlter] = useState<Alter | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
    const [showSenderPicker, setShowSenderPicker] = useState(false);
    const [senderSearch, setSenderSearch] = useState('');

    // Hooks
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const getConversationId = (id1: string, id2: string) => {
        return [id1, id2].sort().join('_');
    };

    useEffect(() => {
        // Find other participant
        const alter = alters.find((a) => a.id === id);
        setOtherAlter(alter || null);
    }, [id, alters]);

    // Initialize sender
    useEffect(() => {
        if (!selectedSenderId && alters.length > 0) {
            if (currentAlter) {
                setSelectedSenderId(currentAlter.id);
            } else {
                setSelectedSenderId(alters[0].id);
            }
        }
    }, [alters, currentAlter, selectedSenderId]);

    const senderAlter = alters.find(a => a.id === selectedSenderId) || currentAlter || alters[0];

    useEffect(() => {
        if (!currentAlter || !id) return;

        const conversationId = getConversationId(currentAlter.id, id);
        const q = query(
            collection(db, 'messages'),
            where('conversation_id', '==', conversationId)
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
            // Client-side sort to fix missing index error
            data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                await sendImage(result.assets[0].uri);
            }
        } catch (error: any) { // Explicitly type error as any for Alert.alert
            console.error('Error picking image:', error);
            Alert.alert('Erreur', `Erreur lors de la sélection de l'image: ${error.message}`);
        }
    };

    const sendImage = async (uri: string) => {
        if (!senderAlter || !id || !user?.uid) return;
        setLoading(true);

        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `chat/${user.uid}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            const conversationId = getConversationId(senderAlter.id, id);
            await addDoc(collection(db, 'messages'), {
                sender_alter_id: senderAlter.id,
                receiver_alter_id: id,
                systemId: user?.uid,
                conversation_id: conversationId,
                content: '📷 Image',
                imageUrl: downloadURL,
                type: 'image',
                is_internal: internal === 'true',
                is_read: false,
                created_at: new Date().toISOString(),
                system_tag: null,
            });
        } catch (error) {
            console.error('Error sending image:', error);
            alert('Erreur lors de l\'envoi de l\'image');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !senderAlter || !id) return;

        setLoading(true);
        try {
            const conversationId = getConversationId(senderAlter.id, id);

            await addDoc(collection(db, 'messages'), {
                sender_alter_id: senderAlter.id,
                receiver_alter_id: id,
                systemId: user?.uid,
                conversation_id: conversationId,
                content: newMessage.trim(),
                is_internal: internal === 'true',
                is_read: false,
                created_at: new Date().toISOString(),
                system_tag: null,
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

        // Simple double tap simulation
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

                    {item.type === 'image' && item.imageUrl ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 4 }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.messageText}>{item.content}</Text>
                    )}

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
                    </View>
                </View>
            </TouchableOpacity>
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
            <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

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
                {/* Sender Picker */}
                <TouchableOpacity
                    style={styles.senderPill}
                    onPress={() => setShowSenderPicker(true)}
                >
                    {senderAlter?.avatar_url ? (
                        <Image source={{ uri: senderAlter.avatar_url }} style={styles.senderPillAvatar} />
                    ) : (
                        <View style={[styles.senderPillPlaceholder, { backgroundColor: senderAlter?.color || colors.primary }]}>
                            <Text style={styles.senderPillInitial}>{senderAlter?.name?.charAt(0) || '?'}</Text>
                        </View>
                    )}
                    <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 2 }} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={pickImage}
                    disabled={loading}
                >
                    <Ionicons name="image-outline" size={24} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={() => alert('Fonctionnalité GIF à venir !')}
                    disabled={loading}
                >
                    <Ionicons name="happy-outline" size={24} color={colors.primary} />
                </TouchableOpacity>

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
                    <Ionicons name="send" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Sender Picker Modal */}
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
                        <Text style={styles.modalTitle}>Parler en tant que...</Text>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher..."
                                placeholderTextColor={colors.textMuted}
                                value={senderSearch}
                                onChangeText={setSenderSearch}
                            />
                            {senderSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setSenderSearch('')}>
                                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <FlatList
                            data={alters.filter(a => a.name.toLowerCase().includes(senderSearch.toLowerCase()))}
                            keyExtractor={item => item.id}
                            numColumns={4}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.pickerItem, selectedSenderId === item.id && styles.pickerItemSelected]}
                                    onPress={() => {
                                        setSelectedSenderId(item.id);
                                        setShowSenderPicker(false);
                                        setSenderSearch('');
                                    }}
                                >
                                    <View style={[styles.pickerAvatarContainer, selectedSenderId === item.id && { borderColor: item.color || colors.primary, borderWidth: 2 }]}>
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={styles.pickerAvatar} />
                                        ) : (
                                            <View style={[styles.pickerPlaceholder, { backgroundColor: item.color || colors.primary }]}>
                                                <Text style={styles.pickerInitial}>{item.name.charAt(0)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.pickerName, selectedSenderId === item.id && { color: colors.primary, fontWeight: 'bold' }]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
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
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.xs,
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
    mediaButton: {
        marginRight: spacing.sm,
        padding: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    // Sender picker styles
    senderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.sm,
        padding: 4,
        borderRadius: 20,
        backgroundColor: colors.backgroundCard,
    },
    senderPillAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    senderPillPlaceholder: {
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
    // Modal styles
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
        marginBottom: spacing.md,
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        marginBottom: spacing.lg,
        gap: spacing.xs,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        paddingVertical: spacing.xs,
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
