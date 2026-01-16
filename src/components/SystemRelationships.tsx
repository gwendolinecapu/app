import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Alter, Relationship, RelationshipType } from '../types';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ThemeColors } from '../lib/cosmetics';

interface Props {
    alter: Alter;
    editable?: boolean;
    themeColors?: ThemeColors | null;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
    friend: 'Ami·e',
    best_friend: 'Meilleur·e ami·e',
    partner: 'Partenaire',
    ex: 'Ex',
    crush: 'Crush',
    family: 'Famille',
    sibling: 'Frère/Sœur',
    enemy: 'Ennemi',
    rival: 'Rival',
    work: 'Travail',
    other: 'Autre'
};

const RELATIONSHIP_ICONS: Record<RelationshipType, string> = {
    friend: 'heart-outline',
    best_friend: 'heart',
    partner: 'heart',
    ex: 'heart-dislike-outline',
    crush: 'heart-half-outline',
    family: 'home-outline',
    sibling: 'people-outline',
    enemy: 'skull-outline',
    rival: 'flash-outline',
    work: 'briefcase-outline',
    other: 'ellipsis-horizontal-outline'
};

export const SystemRelationships = ({ alter, editable = false, themeColors }: Props) => {
    const { alters, refreshAlters, user } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [externalProfiles, setExternalProfiles] = useState<any[]>([]); // Store external profiles
    const [searchQuery, setSearchQuery] = useState('');

    const relationships = alter.relationships || [];

    // Load following list to populate choices and resolve names
    React.useEffect(() => {
        if (!user) return;
        const loadExternal = async () => {
            // We can fetch following + followers to have a wider range of "friends"
            try {
                // Dynamic import to avoid circular dep issues if any, though likely fine here
                const { FollowService } = await import('../services/follows');
                const following = await FollowService.getFollowing(user.uid);
                // Also fetch followers? Maybe just following for now as "Relations" usually implies you know them
                // const followers = await FollowService.getFollowers(user.uid);

                // Map to a common shape
                const mapped = following.map(p => ({
                    id: p.system_id,
                    name: p.display_name,
                    avatar_url: p.avatar_url,
                    color: colors.primary, // Default color for external
                    isExternal: true
                }));
                setExternalProfiles(mapped);
            } catch (e) {
                console.error("Failed to load external relations candidates", e);
            }
        };
        loadExternal();
    }, [user]);

    const getTargetData = (id: string) => {
        // 1. Try internal alters
        const internal = alters.find(a => a.id === id);
        if (internal) return {
            id: internal.id,
            name: internal.name,
            avatar_url: internal.avatar_url,
            color: internal.color || colors.primary,
            isExternal: false
        };

        // 2. Try external loaded profiles
        const external = externalProfiles.find(p => p.id === id);
        if (external) return external;

        // 3. Fallback (maybe data not loaded yet or unfollowed)
        return {
            id,
            name: 'Utilisateur inconnu',
            avatar_url: null,
            color: colors.textMuted,
            isExternal: true
        };
    };

    const handleAddRelationship = async (targetId: string, type: RelationshipType) => {
        setLoading(true);
        try {
            // Remove existing if any
            const existing = relationships.filter(r => r.target_alter_id !== targetId);
            const newRel: Relationship = { target_alter_id: targetId, type };

            await updateDoc(doc(db, 'alters', alter.id), {
                relationships: [...existing, newRel]
            });

            await refreshAlters();
            setModalVisible(false);
        } catch (error) {
            Alert.alert('Erreur', "Échec de l'ajout.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveRelationship = async (targetId: string) => {
        if (!editable) return;
        try {
            const updated = relationships.filter(r => r.target_alter_id !== targetId);
            await updateDoc(doc(db, 'alters', alter.id), {
                relationships: updated
            });
            await refreshAlters();
        } catch (e) {
            Alert.alert('Erreur', "Échec de la suppression.");
        }
    }

    // Merge candidates: Internal Alters (except self) + External Profiles
    const candidates = [
        ...alters.filter(a => a.id !== alter.id).map(a => ({
            id: a.id,
            name: a.name,
            avatar_url: a.avatar_url || a.avatar, // Fallback sur avatar si avatar_url n'existe pas
            color: a.color || colors.primary,
            type: 'alter'
        })),
        ...externalProfiles.map(p => ({
            ...p,
            type: 'external'
        }))
    ];

    // Filter out already added relationships
    // const availableCandidates = candidates.filter(c => !relationships.some(r => r.target_alter_id === c.id));
    // Actually, user might want to CHANGE the type, so we keep them but maybe indicate current status?
    // For simplicity, let's just list everyone.

    return (
        <View style={styles.container}>
            {/* Compact header with just icon */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => editable && setModalVisible(true)}
                    style={[styles.relationIconButton, themeColors && { backgroundColor: `${themeColors.primary}15` }]}
                    disabled={!editable}
                >
                    <Ionicons name="people" size={18} color={themeColors?.primary || colors.secondary || '#E91E63'} />
                    {relationships.length > 0 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{relationships.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {editable && relationships.length === 0 && (
                    <Text style={[styles.addHint, themeColors && { color: themeColors.textSecondary }]}>Ajouter une relation</Text>
                )}
            </View>

            {relationships.length > 0 && (
                <View style={styles.list}>
                    {relationships.map(rel => {
                        const target = getTargetData(rel.target_alter_id);
                        if (!target) return null; // Should assume getTargetData always returns something useful now

                        const isExpanded = expandedId === rel.target_alter_id;

                        return (
                            <TouchableOpacity
                                key={rel.target_alter_id}
                                onPress={() => setExpandedId(isExpanded ? null : rel.target_alter_id)}
                                activeOpacity={0.8}
                                style={[
                                    isExpanded ? styles.item : styles.itemCompact,
                                    themeColors && isExpanded && {
                                        backgroundColor: themeColors.backgroundCard,
                                        borderColor: themeColors.border
                                    },
                                    themeColors && !isExpanded && {
                                        borderColor: themeColors.border
                                    }
                                ]}
                            >
                                <View style={[styles.avatar, { backgroundColor: target.color }]}>
                                    {target.avatar_url ? (
                                        <Image source={{ uri: target.avatar_url }} style={styles.avatarImg} />
                                    ) : (
                                        <Text style={styles.avatarText}>{target.name[0]}</Text>
                                    )}
                                </View>

                                {isExpanded && (
                                    <View style={styles.info}>
                                        <Text style={[styles.name, themeColors && { color: themeColors.text }]}>{target.name}</Text>
                                        <View style={styles.badge}>
                                            <Ionicons name={RELATIONSHIP_ICONS[rel.type] as any} size={10} color={themeColors?.textSecondary || colors.textSecondary} />
                                            <Text style={[styles.badgeText, themeColors && { color: themeColors.textSecondary }]}>{RELATIONSHIP_LABELS[rel.type]}</Text>
                                        </View>
                                    </View>
                                )}

                                {isExpanded && editable && (
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => {
                                            Alert.alert("Supprimer ?", `Retirer la relation avec ${target.name} ?`, [
                                                { text: "Annuler" },
                                                { text: "Supprimer", style: 'destructive', onPress: () => handleRemoveRelationship(rel.target_alter_id) }
                                            ]);
                                        }}
                                    >
                                        <Ionicons name="close-circle" size={18} color={colors.error} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Selection Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, themeColors && { backgroundColor: themeColors.background }]}>
                        <Text style={[styles.modalTitle, themeColors && { color: themeColors.text }]}>Ajouter une relation</Text>

                        {/* Barre de recherche */}
                        <TextInput
                            style={{
                                backgroundColor: themeColors?.backgroundCard || colors.backgroundCard,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                marginBottom: 16,
                                color: themeColors?.text || colors.text,
                                borderWidth: 1,
                                borderColor: themeColors?.border || colors.border,
                            }}
                            placeholder="Rechercher un alter ou ami..."
                            placeholderTextColor={themeColors?.textSecondary || colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={candidates.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={[styles.selectItem, themeColors && { borderBottomColor: themeColors.border }]}>
                                    {/* Photo + Nom en bulle */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{
                                            width: 40, height: 40, borderRadius: 20,
                                            backgroundColor: item.color || colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
                                        }}>
                                            {(item.avatar_url || item.avatar) ? (
                                                <Image
                                                    source={{ uri: item.avatar_url || item.avatar }}
                                                    style={{ width: 40, height: 40 }}
                                                    defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }}
                                                />
                                            ) : (
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{item.name?.[0] || '?'}</Text>
                                            )}
                                        </View>
                                        <View style={{
                                            backgroundColor: themeColors?.backgroundCard || 'rgba(255,255,255,0.1)',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 16,
                                            marginLeft: 10,
                                        }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: themeColors?.text || colors.text
                                            }}>{item.name}</Text>
                                            {item.type === 'external' && (
                                                <Text style={{ fontSize: 10, color: themeColors?.textSecondary || colors.textSecondary }}>Externe</Text>
                                            )}
                                        </View>
                                    </View>


                                    {/* Carrousel scrollable des types de relations */}
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={{ marginTop: 12 }}
                                        contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
                                    >
                                        {(['friend', 'best_friend', 'partner', 'ex', 'crush', 'family', 'sibling', 'enemy', 'rival'] as RelationshipType[]).map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                style={{
                                                    width: 70,
                                                    backgroundColor: themeColors?.backgroundCard || colors.backgroundCard,
                                                    borderRadius: 10,
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 4,
                                                    borderWidth: 1,
                                                    borderColor: themeColors?.border || colors.border,
                                                    alignItems: 'center',
                                                }}
                                                onPress={() => handleAddRelationship(item.id, type)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name={RELATIONSHIP_ICONS[type] as any}
                                                    size={20}
                                                    color={themeColors?.primary || colors.primary}
                                                />
                                                <Text style={{
                                                    fontSize: 9,
                                                    fontWeight: '600',
                                                    color: themeColors?.text || colors.text,
                                                    marginTop: 4,
                                                    textAlign: 'center'
                                                }}>
                                                    {RELATIONSHIP_LABELS[type]}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                            <Text style={[styles.closeText, themeColors && { color: themeColors.textSecondary }]}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
    },
    relationIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E91E6315',
        padding: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
    },
    countBadge: {
        backgroundColor: colors.primary || '#E91E63',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    countBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    addHint: {
        ...typography.caption,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    list: {
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        padding: spacing.xs,
        paddingRight: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 2,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: 'transparent', // Or colors.border if preferred
        marginRight: -8, // Overlap effect? Or just tight spacing
    },
    deleteBtn: {
        marginLeft: spacing.xs,
        padding: 2,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.xs,
        overflow: 'hidden'
    },
    avatarImg: {
        width: '100%',
        height: '100%'
    },
    avatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold'
    },
    info: {
        justifyContent: 'center'
    },
    name: {
        ...typography.caption,
        fontWeight: 'bold',
        color: colors.text
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2
    },
    badgeText: {
        fontSize: 10,
        color: colors.textSecondary
    },
    emptyText: {
        ...typography.caption,
        color: colors.textMuted,
        fontStyle: 'italic',
        marginLeft: spacing.md
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        height: '60%',
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg
    },
    modalTitle: {
        ...typography.h2,
        marginBottom: spacing.lg,
        textAlign: 'center'
    },
    selectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    selectName: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text
    },
    typesRow: {
        flexDirection: 'row',
        gap: spacing.sm
    },
    typeBtn: {
        padding: 4,
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm
    },
    closeBtn: {
        marginTop: spacing.md,
        alignItems: 'center',
        padding: spacing.md
    },
    closeText: {
        color: colors.textMuted
    }
});
