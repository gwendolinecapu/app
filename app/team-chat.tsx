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
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';
import { Message, Alter } from '../src/types';
import { triggerHaptic } from '../src/lib/haptics';
import { FriendService } from '../src/services/friends';
import { getDoc, doc } from 'firebase/firestore';

export default function TeamChatScreen() {
    const { user, alters, activeFront } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
    const [showSenderPicker, setShowSenderPicker] = useState(false);
    const [senderSearch, setSenderSearch] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteSearch, setInviteSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Alter[]>([]);
    const [systemSearchResults, setSystemSearchResults] = useState<any[]>([]); // Results for system search
    const [selectedSystemIds, setSelectedSystemIds] = useState<string | null>(null); // To drill down into a system
    const [searchLoading, setSearchLoading] = useState(false);
    const [inviteCategory, setInviteCategory] = useState<'internal' | 'friends' | 'external'>('internal');
    const [invitedAlters, setInvitedAlters] = useState<Alter[]>([]);
    const [friends, setFriends] = useState<Alter[]>([]);
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
            console.error("[TeamChat] Snapshot error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user || !selectedSenderId) return;

        const text = inputText.trim();
        const senderId = selectedSenderId;

        const messageData = {
            content: text,
            sender_alter_id: senderId,
            type: 'text',
            is_internal: true,
            is_read: true,
            created_at: new Date().toISOString(),
            system_id: user.uid
        };

        try {
            const docRef = await addDoc(collection(db, 'system_chats', user.uid, 'messages'), messageData);
            setInputText('');
            triggerHaptic.light();
        } catch (error) {
            console.error('[TeamChat] Error sending message:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer le message');
        }
    };

    const loadFriends = async () => {
        if (!currentSender || !user) return;
        setSearchLoading(true);
        try {
            // Fetch friend IDs for current sender
            const friendIds = await FriendService.getFriends(currentSender.id);
            if (friendIds.length > 0) {
                // Fetch full alter details for friends
                // Note: Ideally use 'in' query in chunks, but for now parallel usage for responsiveness
                const friendsData = await Promise.all(friendIds.map(async (fid) => {
                    try {
                        const d = await getDoc(doc(db, 'alters', fid));
                        return d.exists() ? { ...d.data(), id: d.id } as Alter : null;
                    } catch (e) { return null; }
                }));
                setFriends(friendsData.filter(f => f !== null) as Alter[]);
            } else {
                setFriends([]);
            }
        } catch (error) {
            console.error("Error loading friends:", error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Open invite modal and load friends
    const openInviteModal = () => {
        setShowInviteModal(true);
        loadFriends();
        setSelectedSystemIds(null); // Reset system selection
        setInviteSearch(''); // Clear search input
        setSearchResults([]); // Clear previous search results
        setSystemSearchResults([]); // Clear system search results
        setInviteCategory('internal'); // Default to internal
    };

    // Search for systems
    const searchSystems = async (text: string) => {
        if (text.length < 2) {
            setSystemSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const q = query(
                collection(db, 'systems'),
                where('username', '>=', text),
                where('username', '<=', text + '\uf8ff'),
                limit(5)
            );
            const snapshot = await getDocs(q);
            const systems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSystemSearchResults(systems.filter((s: any) => s.id !== user?.uid));
        } catch (error) {
            console.error("Error searching systems:", error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Load alters of a selected system
    const loadSystemAlters = async (systemId: string) => {
        setSearchLoading(true);
        try {
            const q = query(
                collection(db, 'alters'),
                where('systemId', '==', systemId), // Check both case fields if needed, usually systemId or system_id
                limit(20)
            );
            // Also try system_id if schema is mixed (as seen in types)
            const q2 = query(
                collection(db, 'alters'),
                where('system_id', '==', systemId),
                limit(20)
            );

            const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);

            // Merge and dedup
            const results = new Map();
            snap1.forEach(doc => results.set(doc.id, { ...doc.data(), id: doc.id }));
            snap2.forEach(doc => results.set(doc.id, { ...doc.data(), id: doc.id }));

            setSearchResults(Array.from(results.values()) as Alter[]);
        } catch (error) {
            console.error("Error loading system alters:", error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Helper to send invite notification (mock or real)
    const sendInviteNotification = async (targetAlter: Alter) => {
        // Logic to create a notification in target alter's system
        // For now, we just mock it or assume the "Invited !" Alert is enough for the sender.
        // In a real app, this would write to `notifications` collection of the target system.
        try {
            await addDoc(collection(db, 'notifications'), {
                recipientId: targetAlter.id,
                systemId: targetAlter.systemId || targetAlter.system_id,
                type: 'system_invite',
                title: 'Invitation à discuter',
                subtitle: `${currentSender?.name || 'Un système'} vous invite à discuter`,
                senderId: currentSender?.id,
                senderSystemId: user?.uid,
                data: { chatId: 'team-chat' }, // Simplification
                createdAt: serverTimestamp(),
                isRead: false
            });
        } catch (error) {
            console.error("Failed to send notification object", error);
        }
    };

    const inviteAlter = async (alter: Alter) => {
        if (!invitedAlters.find(a => a.id === alter.id)) {
            setInvitedAlters(prev => [...prev, alter]);

            // If external, send notification
            if (inviteCategory !== 'internal') {
                await sendInviteNotification(alter);
            }

            triggerHaptic.success();
            Alert.alert('Invité !', `${alter.name} a été ajouté (ou notifié).`);
        }
        setShowInviteModal(false);
        setInviteSearch('');
        setSearchResults([]);
        setSelectedSystemIds(null);
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
                    <Text style={styles.headerSubtitle}>
                        {alters.length > 0 ? `${alters.length} membres` : (loading ? 'Chargement...' : 'Système')}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Invite Button */}
                    <TouchableOpacity
                        style={styles.headerAction}
                        onPress={openInviteModal}
                    >
                        <Ionicons name="person-add-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerAction}>
                        <Ionicons name="settings-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
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
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher un alter..."
                                placeholderTextColor={colors.textMuted}
                                value={senderSearch}
                                onChangeText={setSenderSearch}
                                autoCapitalize="none"
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
                                    style={[
                                        styles.pickerItem,
                                        selectedSenderId === item.id && styles.pickerItemSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedSenderId(item.id);
                                        setShowSenderPicker(false);
                                        setSenderSearch('');
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

            {/* Invite External Alter Modal */}
            <Modal
                visible={showInviteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInviteModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowInviteModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Ajouter des participants</Text>

                        {/* Category Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, inviteCategory === 'internal' && styles.tabButtonActive]}
                                onPress={() => { setInviteCategory('internal'); setInviteSearch(''); setSelectedSystemIds(null); }}
                            >
                                <Text style={[styles.tabButtonText, inviteCategory === 'internal' && styles.tabButtonTextActive]}>Mon Système</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, inviteCategory === 'friends' && styles.tabButtonActive]}
                                onPress={() => { setInviteCategory('friends'); setInviteSearch(''); setSelectedSystemIds(null); }}
                            >
                                <Text style={[styles.tabButtonText, inviteCategory === 'friends' && styles.tabButtonTextActive]}>Amis</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, inviteCategory === 'external' && styles.tabButtonActive]}
                                onPress={() => { setInviteCategory('external'); setInviteSearch(''); setSearchResults([]); setSelectedSystemIds(null); }}
                            >
                                <Text style={[styles.tabButtonText, inviteCategory === 'external' && styles.tabButtonTextActive]}>Autre Système</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={inviteCategory === 'external' ? "Rechercher un système..." : "Rechercher un alter..."}
                                placeholderTextColor={colors.textMuted}
                                value={inviteSearch}
                                onChangeText={(text) => {
                                    setInviteSearch(text);
                                    if (inviteCategory === 'external' && !selectedSystemIds) {
                                        searchSystems(text);
                                    }
                                }}
                            />
                            {inviteSearch.length > 0 && (
                                <TouchableOpacity onPress={() => { setInviteSearch(''); }}>
                                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {searchLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <View style={{ flex: 1, minHeight: 200 }}>
                                {/* INTERNAL & FRIENDS LIST */}
                                {inviteCategory !== 'external' && (
                                    <FlatList
                                        data={
                                            inviteCategory === 'internal'
                                                ? alters.filter(a => a.id !== currentSender?.id && a.name.toLowerCase().includes(inviteSearch.toLowerCase()))
                                                : friends.filter(a => a.name.toLowerCase().includes(inviteSearch.toLowerCase()))
                                        }
                                        keyExtractor={item => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.inviteItem}
                                                onPress={() => inviteAlter(item)}
                                            >
                                                {item.avatar_url ? (
                                                    <Image source={{ uri: item.avatar_url }} style={styles.inviteAvatar} />
                                                ) : (
                                                    <View style={[styles.invitePlaceholder, { backgroundColor: item.color || colors.primary }]}>
                                                        <Text style={styles.inviteInitial}>{item.name.charAt(0)}</Text>
                                                    </View>
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.inviteName}>{item.name}</Text>
                                                    {item.pronouns && <Text style={styles.invitePronouns}>{item.pronouns}</Text>}
                                                </View>
                                                <Ionicons name="add-circle" size={24} color={colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            <Text style={styles.noResults}>Aucun alter trouvé</Text>
                                        }
                                    />
                                )}

                                {/* EXTERNAL SYSTEM SEARCH */}
                                {inviteCategory === 'external' && (
                                    <>
                                        {/* STEP 1: SELECT SYSTEM */}
                                        {!selectedSystemIds ? (
                                            <FlatList
                                                data={systemSearchResults}
                                                keyExtractor={item => item.id}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={styles.inviteItem}
                                                        onPress={() => {
                                                            setSelectedSystemIds(item.id);
                                                            loadSystemAlters(item.id);
                                                        }}
                                                    >
                                                        <View style={[styles.invitePlaceholder, { backgroundColor: colors.secondary }]}>
                                                            <Ionicons name="planet" size={20} color="white" />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.inviteName}>{item.username}</Text>
                                                            <Text style={styles.invitePronouns}>Système</Text>
                                                        </View>
                                                        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                                                    </TouchableOpacity>
                                                )}
                                                ListEmptyComponent={
                                                    inviteSearch.length > 0 ? (
                                                        <Text style={styles.noResults}>Aucun système trouvé</Text>
                                                    ) : (
                                                        <Text style={styles.noResults}>Cherchez un nom de système pour voir ses alters</Text>
                                                    )
                                                }
                                            />
                                        ) : (
                                            // STEP 2: SELECT ALTER IN SYSTEM
                                            <View style={{ flex: 1 }}>
                                                <TouchableOpacity
                                                    onPress={() => setSelectedSystemIds(null)}
                                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 4 }}
                                                >
                                                    <Ionicons name="arrow-back" size={16} color={colors.primary} />
                                                    <Text style={{ color: colors.primary, marginLeft: 4 }}>Retour aux systèmes</Text>
                                                </TouchableOpacity>

                                                <FlatList
                                                    data={searchResults}
                                                    keyExtractor={item => item.id}
                                                    renderItem={({ item }) => (
                                                        <TouchableOpacity
                                                            style={styles.inviteItem}
                                                            onPress={() => inviteAlter(item)}
                                                        >
                                                            {item.avatar_url ? (
                                                                <Image source={{ uri: item.avatar_url }} style={styles.inviteAvatar} />
                                                            ) : (
                                                                <View style={[styles.invitePlaceholder, { backgroundColor: item.color || colors.primary }]}>
                                                                    <Text style={styles.inviteInitial}>{item.name.charAt(0)}</Text>
                                                                </View>
                                                            )}
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.inviteName}>{item.name}</Text>
                                                            </View>
                                                            <Ionicons name="paper-plane-outline" size={24} color={colors.primary} />
                                                        </TouchableOpacity>
                                                    )}
                                                    ListEmptyComponent={
                                                        <Text style={styles.noResults}>Ce système n'a pas d'alters publics</Text>
                                                    }
                                                />
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={{ alignSelf: 'center', marginTop: 16 }}
                            onPress={() => setShowInviteModal(false)}
                        >
                            <Text style={{ color: colors.textSecondary }}>Fermer</Text>
                        </TouchableOpacity>
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
    // Invite modal styles
    inviteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    inviteAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    invitePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    inviteName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    invitePronouns: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    noResults: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    tabButtonActive: {
        backgroundColor: colors.backgroundCard,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    tabButtonText: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    tabButtonTextActive: {
        color: colors.text,
    },
});
