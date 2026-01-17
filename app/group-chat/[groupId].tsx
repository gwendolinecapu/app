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
    ActivityIndicator,
    Alert,
    Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, collection, query, orderBy, doc, updateDoc, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuth } from '../../src/contexts/AuthContext';
import { GroupService } from '../../src/services/groups';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Message, Group, Alter } from '../../src/types';
import { triggerHaptic } from '../../src/lib/haptics';

export default function GroupChatScreen() {
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    const insets = useSafeAreaInsets();
    const { user, alters, activeFront } = useAuth();
    const [group, setGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Settings modal state
    const [showSettings, setShowSettings] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Add member modal state
    const [showAddMember, setShowAddMember] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [friends, setFriends] = useState<any[]>([]);

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

    // Load group details
    useEffect(() => {
        if (!groupId) return;
        const loadGroup = async () => {
            const groupData = await GroupService.getGroup(groupId);
            setGroup(groupData);
            if (groupData) setNewGroupName(groupData.name);
        };
        loadGroup();
    }, [groupId]);

    // Subscribe to messages
    useEffect(() => {
        if (!groupId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, `groups/${groupId}/messages`),
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
            console.error('[GroupChat] Snapshot error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [groupId]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user || !selectedSenderId || !groupId) return;

        const text = inputText.trim();
        setInputText('');

        try {
            await GroupService.sendGroupMessage(
                groupId,
                user.uid,
                selectedSenderId,
                text,
                'text'
            );
            triggerHaptic.light();
        } catch (error) {
            console.error('[GroupChat] Error sending message:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer le message');
            setInputText(text); // Restore text on error
        }
    };

    const handleRenameGroup = async () => {
        if (!groupId || !newGroupName.trim()) return;
        try {
            await updateDoc(doc(db, 'groups', groupId), { name: newGroupName.trim() });
            setGroup(prev => prev ? { ...prev, name: newGroupName.trim() } : null);
            setEditingName(false);
            triggerHaptic.success();
        } catch (error) {
            console.error('[GroupChat] Error renaming:', error);
            Alert.alert('Erreur', 'Impossible de renommer le groupe');
        }
    };

    const handleLeaveGroup = () => {
        Alert.alert(
            'Quitter le groupe',
            'Êtes-vous sûr de vouloir quitter ce groupe ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Quitter',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement leave group logic
                        router.back();
                    }
                }
            ]
        );
    };

    // Search for alters/systems to add
    const searchSystems = async (text: string) => {
        if (text.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            // Search in alters by name (case-sensitive but more data)
            const textLower = text.toLowerCase();
            const textUpper = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

            // Try with capitalized first letter (more common)
            const q = query(
                collection(db, 'alters'),
                where('name', '>=', textUpper),
                where('name', '<=', textUpper + '\uf8ff'),
                limit(15)
            );
            const snapshot = await getDocs(q);

            // Also try lowercase
            const qLower = query(
                collection(db, 'alters'),
                where('name', '>=', textLower),
                where('name', '<=', textLower + '\uf8ff'),
                limit(15)
            );
            const snapshotLower = await getDocs(qLower);

            // Combine and dedupe
            const allDocs = [...snapshot.docs, ...snapshotLower.docs];
            const seen = new Set<string>();
            const results = allDocs
                .filter(d => {
                    if (seen.has(d.id)) return false;
                    seen.add(d.id);
                    return true;
                })
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((a: any) => a.system_id !== user?.uid) // Exclude own alters
                .slice(0, 10);

            setSearchResults(results);
        } catch (error) {
            console.error('[GroupChat] Search error:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Add member to group
    const handleAddMember = async (systemId: string) => {
        if (!groupId) return;
        try {
            await GroupService.addMember(groupId, systemId);
            triggerHaptic.success();
            Alert.alert('Succès', 'Membre ajouté au groupe !');
            setShowAddMember(false);
            setSearchText('');
            setSearchResults([]);
            // Refresh group data
            const updatedGroup = await GroupService.getGroup(groupId);
            setGroup(updatedGroup);
        } catch (error: any) {
            console.error('[GroupChat] Add member error:', error);
            const errorMessage = error?.message || error?.code || 'Erreur inconnue';
            Alert.alert('Erreur', `Impossible d'ajouter ce membre: ${errorMessage}`);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        // Find sender in our alters first, then assume external
        const sender = alters.find(a => a.id === item.sender_alter_id);
        const isMe = item.sender_alter_id === selectedSenderId;

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.messageRowRight : styles.messageRowLeft
            ]}>
                {!isMe && (
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
                            {sender?.name || 'Externe'}
                        </Text>
                    )}
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {isMe && (
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {group?.name || 'Groupe'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {group?.memberCount || group?.members?.length || 0} membres
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Add member button */}
                    <TouchableOpacity
                        style={styles.headerAction}
                        onPress={() => {
                            triggerHaptic.selection();
                            setShowAddMember(true);
                        }}
                    >
                        <Ionicons name="person-add-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    {/* Settings button */}
                    <TouchableOpacity
                        style={styles.headerAction}
                        onPress={() => {
                            triggerHaptic.selection();
                            setShowSettings(true);
                        }}
                    >
                        <Ionicons name="settings-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages */}
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
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Aucun message</Text>
                            <Text style={styles.emptySubtext}>Soyez le premier à écrire !</Text>
                        </View>
                    }
                />
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.md }]}>
                    {/* Sender Pill */}
                    <TouchableOpacity style={styles.senderPill}>
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

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSettings(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSettings(false)}
                >
                    <View style={styles.settingsModal} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.settingsTitle}>Paramètres du groupe</Text>

                        {/* Group Name */}
                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsLabel}>Nom du groupe</Text>
                            {editingName ? (
                                <View style={styles.editNameRow}>
                                    <TextInput
                                        style={styles.editNameInput}
                                        value={newGroupName}
                                        onChangeText={setNewGroupName}
                                        autoFocus
                                        maxLength={50}
                                    />
                                    <TouchableOpacity onPress={handleRenameGroup}>
                                        <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingName(false)}>
                                        <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.settingsRow}
                                    onPress={() => setEditingName(true)}
                                >
                                    <Text style={styles.settingsValue}>{group?.name}</Text>
                                    <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Members */}
                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsLabel}>Membres ({group?.members?.length || 0})</Text>
                            <TouchableOpacity style={styles.settingsRow}>
                                <Text style={styles.settingsValue}>Voir les membres</Text>
                                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Add Member */}
                        <TouchableOpacity style={styles.settingsAction}>
                            <Ionicons name="person-add-outline" size={24} color={colors.primary} />
                            <Text style={styles.settingsActionText}>Ajouter un membre</Text>
                        </TouchableOpacity>

                        {/* Leave Group */}
                        <TouchableOpacity style={styles.settingsActionDanger} onPress={handleLeaveGroup}>
                            <Ionicons name="exit-outline" size={24} color={colors.error || '#ff4444'} />
                            <Text style={[styles.settingsActionText, { color: colors.error || '#ff4444' }]}>
                                Quitter le groupe
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                visible={showAddMember}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddMember(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAddMember(false)}
                >
                    <View style={styles.settingsModal} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.settingsTitle}>Ajouter un membre</Text>

                        {/* Search Input */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                value={searchText}
                                onChangeText={(text) => {
                                    setSearchText(text);
                                    searchSystems(text);
                                }}
                                placeholder="Rechercher un système..."
                                placeholderTextColor={colors.textMuted}
                                autoFocus
                            />
                        </View>

                        {/* Results */}
                        {searchLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                        ) : searchResults.length === 0 ? (
                            <Text style={styles.emptySearchText}>
                                {searchText.length < 2 ? 'Tapez au moins 2 caractères' : 'Aucun système trouvé'}
                            </Text>
                        ) : (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.id}
                                style={{ maxHeight: 250 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.memberItem}
                                        onPress={() => handleAddMember(item.system_id || item.id)}
                                    >
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={styles.memberAvatarImg} />
                                        ) : (
                                            <View style={[styles.memberAvatar, { backgroundColor: item.color || colors.secondary }]}>
                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{(item.name || '?').charAt(0)}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.memberName}>{item.name || 'Alter'}</Text>
                                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.textMuted,
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
        backgroundColor: colors.background,
        borderTopWidth: 0,
    },
    senderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.sm,
        marginBottom: 8,
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
        paddingVertical: 4,
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
    // Settings Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    settingsModal: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        paddingBottom: spacing.xl + 20,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.textMuted,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    settingsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    settingsSection: {
        marginBottom: spacing.lg,
    },
    settingsLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    settingsValue: {
        ...typography.body,
        color: colors.text,
    },
    editNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    editNameInput: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
    },
    settingsAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        marginTop: spacing.sm,
    },
    settingsActionDanger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        marginTop: spacing.sm,
    },
    settingsActionText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '500',
    },
    // Add Member Modal Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    searchInput: {
        flex: 1,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
    },
    emptySearchText: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    memberName: {
        flex: 1,
        ...typography.body,
        color: colors.text,
    },
    memberAvatarImg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.md,
    },
});
