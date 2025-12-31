import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alter, Primer } from '../types';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    alter: Alter;
    editable?: boolean;
}

export const AlterPrimers = ({ alter, editable = false }: Props) => {
    const { refreshAlters } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form
    const [label, setLabel] = useState('');
    const [content, setContent] = useState('');
    const [selectedColor, setSelectedColor] = useState(colors.primary);

    const primers = alter.primers || [];

    const handleAddPrimer = async () => {
        if (!label.trim() || !content.trim()) return;
        setLoading(true);

        try {
            const newPrimer: Primer = {
                id: Date.now().toString(),
                label: label.trim(),
                content: content.trim(),
                color: selectedColor
            };

            const updatedPrimers = [...primers, newPrimer];

            await updateDoc(doc(db, 'alters', alter.id), {
                primers: updatedPrimers
            });

            await refreshAlters();
            setModalVisible(false);
            setLabel('');
            setContent('');
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Impossible d'ajouter la note.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrimer = async (primerId: string) => {
        if (!editable) return;
        Alert.alert("Supprimer ?", "Retirer cette note ?", [
            { text: "Annuler" },
            {
                text: "Supprimer", style: 'destructive', onPress: async () => {
                    try {
                        const updatedPrimers = primers.filter(p => p.id !== primerId);
                        await updateDoc(doc(db, 'alters', alter.id), {
                            primers: updatedPrimers
                        });
                        await refreshAlters();
                    } catch (error) {
                        Alert.alert('Erreur', "Impossible de supprimer.");
                    }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Compact header with just icon */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => editable && setModalVisible(true)}
                    style={styles.noteIconButton}
                    disabled={!editable}
                >
                    <Ionicons name="document-text" size={18} color={colors.primary} />
                    {primers.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{primers.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {editable && primers.length === 0 && (
                    <Text style={styles.addHint}>Ajouter une note</Text>
                )}
            </View>

            {primers.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {primers.map(primer => (
                        <View
                            key={primer.id}
                            style={[styles.card, { borderLeftColor: primer.color || colors.primary }]}
                        >
                            {editable && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeletePrimer(primer.id)}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.error} />
                                </TouchableOpacity>
                            )}
                            <Text style={styles.cardLabel}>{primer.label}</Text>
                            <Text style={styles.cardContent} numberOfLines={3}>{primer.content}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nouveau Primer</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Titre (ex: Triggers, Comforts)"
                            placeholderTextColor={colors.textMuted}
                            value={label}
                            onChangeText={setLabel}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Contenu..."
                            placeholderTextColor={colors.textMuted}
                            value={content}
                            onChangeText={setContent}
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddPrimer} style={styles.saveBtn} disabled={loading}>
                                <Text style={styles.saveText}>{loading ? '...' : 'Ajouter'}</Text>
                            </TouchableOpacity>
                        </View>
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
    noteIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.primary}15`,
        padding: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
    },
    badge: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    badgeText: {
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
        paddingLeft: spacing.md,
    },
    card: {
        width: 140,
        height: 100,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginRight: spacing.sm,
        borderLeftWidth: 3,
        justifyContent: 'flex-start',
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        zIndex: 1,
    },
    cardLabel: {
        ...typography.caption,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 2,
        marginRight: 20,
    },
    cardContent: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 11,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    modalTitle: {
        ...typography.h2,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    input: {
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md
    },
    cancelBtn: {
        padding: spacing.md,
    },
    cancelText: {
        color: colors.textMuted,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    saveText: {
        color: colors.background,
        fontWeight: 'bold'
    }
});
