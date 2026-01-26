import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { GroupService } from '../../src/services/groups';
import { FriendService } from '../../src/services/friends';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Alter } from '../../src/types';
import { triggerHaptic } from '../../src/lib/haptics';
import { getDoc, doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';

export default function CreateGroupScreen() {
    const { user, alters, currentAlter } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // System IDs
    const [inviteCategory, setInviteCategory] = useState<'friends' | 'search'>('friends');
    const [searchText, setSearchText] = useState('');
    const [friends, setFriends] = useState<Alter[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Ajouter automatiquement le système courant comme membre par défaut
    useEffect(() => {
        if (user?.uid && !selectedMembers.includes(user.uid)) {
            setSelectedMembers([user.uid]);
        }
    }, [user]);

    useEffect(() => {
        loadFriends();
    }, [currentAlter]);

    const loadFriends = async () => {
        if (!currentAlter) return;
        setLoading(true);
        try {
            const friendIds = await FriendService.getFriends(currentAlter.id);
            if (friendIds.length > 0) {
                const friendsData = await Promise.all(friendIds.map(async (fid) => {
                    try {
                        const d = await getDoc(doc(db, 'alters', fid));
                        return d.exists() ? { ...d.data(), id: d.id } as Alter : null;
                    } catch (e) { return null; }
                }));
                setFriends(friendsData.filter(f => f !== null) as Alter[]);
            }
        } catch (error) {
            console.error('[CreateGroup] Error loading friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchSystems = async (text: string) => {
        if (text.length < 2) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const q = query(
                collection(db, 'systems'),
                where('username', '>=', text),
                where('username', '<=', text + '\uf8ff'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const systems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSearchResults(systems.filter((s: any) => s.id !== user?.uid));
        } catch (error) {
            console.error('[CreateGroup] Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (systemId: string) => {
        setSelectedMembers(prev =>
            prev.includes(systemId)
                ? prev.filter(id => id !== systemId)
                : [...prev, systemId]
        );
        triggerHaptic.selection();
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un nom de groupe');
            return;
        }
        if (!user) return;

        setCreating(true);
        try {
            const groupId = await GroupService.createGroup(
                groupName.trim(),
                description.trim(),
                user.uid,
                selectedMembers
            );
            triggerHaptic.success();
            Alert.alert('Succès', 'Groupe créé !', [
                { text: 'OK', onPress: () => router.replace({ pathname: '/group-chat/[groupId]', params: { groupId } }) }
            ]);
        } catch (error) {
            console.error('[CreateGroup] Error:', error);
            Alert.alert('Erreur', 'Impossible de créer le groupe');
        } finally {
            setCreating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nouveau groupe</Text>
                    <TouchableOpacity
                        onPress={handleCreateGroup}
                        disabled={creating || !groupName.trim()}
                        style={styles.createButton}
                    >
                        {creating ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={[
                                styles.createButtonText,
                                !groupName.trim() && { opacity: 0.5 }
                            ]}>Créer</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Group Name Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Nom du groupe</Text>
                        <TextInput
                            style={styles.input}
                            value={groupName}
                            onChangeText={setGroupName}
                            placeholder="Ex: Notre groupe de soutien"
                            placeholderTextColor={colors.textMuted}
                            maxLength={50}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Description (optionnel)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="De quoi parle ce groupe ?"
                            placeholderTextColor={colors.textMuted}
                            multiline
                            maxLength={200}
                        />
                    </View>

                    {/* Members Section */}
                    <View style={styles.membersSection}>
                        <Text style={styles.label}>
                            Inviter des membres {selectedMembers.length > 0 && `(${selectedMembers.length})`}
                        </Text>

                        {/* Category Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, inviteCategory === 'friends' && styles.tabButtonActive]}
                                onPress={() => setInviteCategory('friends')}
                            >
                                <Text style={[styles.tabButtonText, inviteCategory === 'friends' && styles.tabButtonTextActive]}>
                                    Amis
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, inviteCategory === 'search' && styles.tabButtonActive]}
                                onPress={() => setInviteCategory('search')}
                            >
                                <Text style={[styles.tabButtonText, inviteCategory === 'search' && styles.tabButtonTextActive]}>
                                    Rechercher
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Input for external */}
                        {inviteCategory === 'search' && (
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
                                />
                            </View>
                        )}

                        {/* Members List */}
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <View style={styles.membersList}>
                                {inviteCategory === 'friends' ? (
                                    friends.length === 0 ? (
                                        <Text style={styles.emptyText}>Aucun ami trouvé</Text>
                                    ) : (
                                        friends.map(friend => (
                                            <TouchableOpacity
                                                key={friend.id}
                                                style={[
                                                    styles.memberItem,
                                                    selectedMembers.includes(friend.system_id || '') && styles.memberItemSelected
                                                ]}
                                                onPress={() => toggleMember(friend.system_id || '')}
                                            >
                                                {friend.avatar_url ? (
                                                    <Image source={{ uri: friend.avatar_url }} style={styles.memberAvatar} />
                                                ) : (
                                                    <View style={[styles.memberPlaceholder, { backgroundColor: friend.color || colors.primary }]}>
                                                        <Text style={styles.memberInitial}>{friend.name.charAt(0)}</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.memberName} numberOfLines={1}>{friend.name}</Text>
                                                {selectedMembers.includes(friend.system_id || '') && (
                                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))
                                    )
                                ) : (
                                    searchResults.length === 0 ? (
                                        <Text style={styles.emptyText}>
                                            {searchText.length < 2 ? 'Tapez au moins 2 caractères' : 'Aucun système trouvé'}
                                        </Text>
                                    ) : (
                                        searchResults.map(system => (
                                            <TouchableOpacity
                                                key={system.id}
                                                style={[
                                                    styles.memberItem,
                                                    selectedMembers.includes(system.id) && styles.memberItemSelected
                                                ]}
                                                onPress={() => toggleMember(system.id)}
                                            >
                                                <View style={[styles.memberPlaceholder, { backgroundColor: colors.secondary }]}>
                                                    <Ionicons name="planet" size={18} color="white" />
                                                </View>
                                                <Text style={styles.memberName} numberOfLines={1}>{system.username}</Text>
                                                {selectedMembers.includes(system.id) && (
                                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))
                                    )
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        ...typography.h5,
        color: colors.text,
    },
    createButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    createButtonText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    inputSection: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    membersSection: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    tabButtonActive: {
        backgroundColor: colors.primary,
    },
    tabButtonText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    tabButtonTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
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
    membersList: {
        flex: 1,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    memberItemSelected: {
        borderWidth: 1,
        borderColor: colors.primary,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.md,
    },
    memberPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    memberInitial: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberName: {
        flex: 1,
        ...typography.body,
        color: colors.text,
    },
    emptyText: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});
