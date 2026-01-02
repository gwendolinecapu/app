import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { FriendService } from '../../services/friends';
import { ThemeColors } from '../../lib/cosmetics';

interface Props {
    visible: boolean;
    onClose: () => void;
    currentAlterId: string;
    themeColors?: ThemeColors | null;
}

export const SystemFriendSelector = ({ visible, onClose, currentAlterId, themeColors }: Props) => {
    const { alters, refreshAlters } = useAuth(); // "alters" contains the current user's system alters
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    // Filter out the current alter (Gwendo shouldn't friend Gwendo, unless allowed?)
    // User request: "pour quelle puisse choisir avec quel alter du systeme elle veux etre ami"
    // "Elle" = Gwenna/Gwendo. "Du systeme" = Her system?
    // If she is viewing "Feed", she is likely "Gwendo".
    // We want to list OTHER alters in the SAME system.
    const systemAlters = alters.filter(a => a.id !== currentAlterId);

    const handleToggleFriend = async (targetAlterId: string) => {
        setLoadingMap(prev => ({ ...prev, [targetAlterId]: true }));
        try {
            // Check if already friends? 
            // We need to know status. 
            // Ideally we'd pass "relationships" or fetch them.
            // For now, let's assume we are toggling or just adding.
            // FriendService.addFriendship(currentAlterId, targetAlterId)?
            // We need to implement a 'toggle' or check check.
            // But let's look at `FriendService`.

            // Wait, FriendService usually works with requests between users.
            // Between alters of SAME system, it's usually just "Relationship".
            // "Relationship" type "friend" in `alters` collection.

            // Let's use `SystemRelationships` logic: update `relationships` array in Firestore.
            // Actually, we can just call a helper or do it manually.
            // Let's check `FriendService`... it might be for cross-system.
            // If it's internal, we update `alter` document.

            // We'll reuse logic similar to SystemRelationships.
            // But simplified.

            // Wait, we don't have access to the *current alter's* relationship list here directly unless we find it in `alters`.
            const currentAlter = alters.find(a => a.id === currentAlterId);
            if (!currentAlter) return;

            const relationships = currentAlter.relationships || [];
            const existingRel = relationships.find(r => r.target_alter_id === targetAlterId);

            // Import db/updateDoc
            const { doc, updateDoc } = require('firebase/firestore');
            const { db } = require('../../lib/firebase');

            if (existingRel) {
                // Remove (Unfriend)
                const newRels = relationships.filter(r => r.target_alter_id !== targetAlterId);
                await updateDoc(doc(db, 'alters', currentAlterId), { relationships: newRels });
            } else {
                // Add (Friend)
                const newRel = { target_alter_id: targetAlterId, type: 'friend' };
                await updateDoc(doc(db, 'alters', currentAlterId), { relationships: [...relationships, newRel] });
            }

            await refreshAlters();

        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMap(prev => ({ ...prev, [targetAlterId]: false }));
        }
    };

    const isFriend = (targetId: string) => {
        const currentAlter = alters.find(a => a.id === currentAlterId);
        return currentAlter?.relationships?.some(r => r.target_alter_id === targetId && r.type === 'friend');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, themeColors && { backgroundColor: themeColors.background }]}>
                <View style={[styles.header, themeColors && { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.title, themeColors && { color: themeColors.text }]}>Membres du Système</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={themeColors?.text || colors.text} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={systemAlters}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const friendBound = isFriend(item.id);
                        const isLoading = loadingMap[item.id];

                        return (
                            <View style={[styles.item, themeColors && { backgroundColor: themeColors.backgroundCard }]}>
                                <View style={styles.avatarRow}>
                                    <View style={[styles.avatar, { backgroundColor: item.color }]}>
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
                                        ) : (
                                            <Text style={styles.avatarText}>{item.name[0]}</Text>
                                        )}
                                    </View>
                                    <Text style={[styles.name, themeColors && { color: themeColors.text }]}>{item.name}</Text>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.actionBtn,
                                        friendBound ? styles.btnRemove : styles.btnAdd,
                                        themeColors && !friendBound && { backgroundColor: themeColors.primary },
                                        themeColors && friendBound && { borderColor: themeColors.border, backgroundColor: 'transparent' }
                                    ]}
                                    onPress={() => handleToggleFriend(item.id)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={friendBound ? colors.text : 'white'} size="small" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={friendBound ? "checkmark" : "add"}
                                                size={16}
                                                color={friendBound ? (themeColors?.text || colors.text) : 'white'}
                                            />
                                            <Text style={[
                                                styles.btnText,
                                                friendBound ? { color: themeColors?.text || colors.text } : { color: 'white' }
                                            ]}>
                                                {friendBound ? 'Ami·e' : 'Ajouter'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    closeBtn: {
        padding: spacing.xs,
    },
    list: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    name: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    btnAdd: {
        backgroundColor: colors.primary,
    },
    btnRemove: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '600',
    }
});
