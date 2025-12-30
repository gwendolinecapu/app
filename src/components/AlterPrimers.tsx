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
        try {
            const updatedPrimers = primers.filter(p => p.id !== primerId);
            await updateDoc(doc(db, 'alters', alter.id), {
                primers: updatedPrimers
            });
            await refreshAlters();
        } catch (error) {
            Alert.alert('Erreur', "Impossible de supprimer.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📌 Primers & Notes</Text>
                {editable && (
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                        <Ionicons name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {primers.length === 0 ? (
                <Text style={styles.emptyText}>Aucune note épinglée.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {primers.map(primer => (
                        <TouchableOpacity
                            key={primer.id}
                            style={[styles.card, { borderLeftColor: primer.color || colors.primary }]}
                            onLongPress={() => {
                                if (editable) {
                                    Alert.alert("Supprimer ?", "Retirer cette note ?", [
                                        { text: "Annuler" },
                                        { text: "Supprimer", style: 'destructive', onPress: () => handleDeletePrimer(primer.id) }
                                    ])
                                }
                            }}
                        >
                            <Text style={styles.cardLabel}>{primer.label}</Text>
                            <Text style={styles.cardContent} numberOfLines={4}>{primer.content}</Text>
                        </TouchableOpacity>
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
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
    },
    list: {
        paddingLeft: spacing.md,
    },
    card: {
        width: 160,
        height: 120,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginRight: spacing.md,
        borderLeftWidth: 4,
        justifyContent: 'flex-start',
    },
    cardLabel: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    cardContent: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emptyText: {
        ...typography.caption,
        color: colors.textMuted,
        fontStyle: 'italic',
        marginLeft: spacing.md,
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
