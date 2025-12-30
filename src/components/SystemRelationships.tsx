import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alter, Relationship, RelationshipType } from '../types';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    alter: Alter;
    editable?: boolean;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
    friend: 'Ami·e',
    partner: 'Partenaire',
    family: 'Famille',
    enemy: 'Conflictuel',
    work: 'Travail',
    other: 'Autre'
};

const RELATIONSHIP_ICONS: Record<RelationshipType, string> = {
    friend: 'heart-outline',
    partner: 'heart',
    family: 'home-outline',
    enemy: 'flash-outline',
    work: 'briefcase-outline',
    other: 'people-outline'
};

export const SystemRelationships = ({ alter, editable = false }: Props) => {
    const { alters, refreshAlters } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const relationships = alter.relationships || [];

    const getTargetAlter = (id: string) => alters.find(a => a.id === id);

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
            console.error(e);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>💞 Relations Système</Text>
                {editable && (
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                        <Ionicons name="settings-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {relationships.length === 0 ? (
                <Text style={styles.emptyText}>Aucune relation définie.</Text>
            ) : (
                <View style={styles.list}>
                    {relationships.map(rel => {
                        const target = getTargetAlter(rel.target_alter_id);
                        if (!target) return null;

                        return (
                            <TouchableOpacity
                                key={rel.target_alter_id}
                                style={styles.item}
                                onLongPress={() => {
                                    if (editable) Alert.alert("Supprimer ?", `Retirer la relation avec ${target.name} ?`, [
                                        { text: "Annuler" },
                                        { text: "Supprimer", style: 'destructive', onPress: () => handleRemoveRelationship(rel.target_alter_id) }
                                    ])
                                }}
                            >
                                <View style={[styles.avatar, { backgroundColor: target.color }]}>
                                    {target.avatar_url ? (
                                        <Image source={{ uri: target.avatar_url }} style={styles.avatarImg} />
                                    ) : (
                                        <Text style={styles.avatarText}>{target.name[0]}</Text>
                                    )}
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.name}>{target.name}</Text>
                                    <View style={styles.badge}>
                                        <Ionicons name={RELATIONSHIP_ICONS[rel.type] as any} size={10} color={colors.textSecondary} />
                                        <Text style={styles.badgeText}>{RELATIONSHIP_LABELS[rel.type]}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Selection Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Ajouter une relation</Text>
                        <FlatList
                            data={alters.filter(a => a.id !== alter.id)}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.selectItem}>
                                    <Text style={styles.selectName}>{item.name}</Text>
                                    <View style={styles.typesRow}>
                                        {(['friend', 'partner', 'family', 'work'] as RelationshipType[]).map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                style={styles.typeBtn}
                                                onPress={() => handleAddRelationship(item.id, type)}
                                            >
                                                <Ionicons name={RELATIONSHIP_ICONS[type] as any} size={20} color={colors.primary} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                            <Text style={styles.closeText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    addButton: {
        padding: 4,
    },
    list: {
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        padding: spacing.xs,
        paddingRight: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border
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
        color: colors.text,
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
