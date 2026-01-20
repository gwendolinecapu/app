/**
 * Subsystems Management Screen
 * Gestion des sous-systèmes depuis les paramètres
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, alterColors } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSubsystems } from '../../src/hooks/useSubsystems';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';
import { triggerHaptic } from '../../src/lib/haptics';
import { Subsystem } from '../../src/types';

export default function SubsystemsSettingsScreen() {
    const { user } = useAuth();
    const { subsystems, loading, createSubsystem, updateSubsystem, deleteSubsystem, setAsDefault, refresh } = useSubsystems(user?.uid);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingSubsystem, setEditingSubsystem] = useState<Subsystem | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedColor, setSelectedColor] = useState(alterColors[0]);
    const [submitting, setSubmitting] = useState(false);

    const openCreateModal = () => {
        setEditingSubsystem(null);
        setName('');
        setDescription('');
        setSelectedColor(alterColors[0]);
        setModalVisible(true);
        triggerHaptic.selection();
    };

    const openEditModal = (subsystem: Subsystem) => {
        setEditingSubsystem(subsystem);
        setName(subsystem.name);
        setDescription(subsystem.description || '');
        setSelectedColor(subsystem.color);
        setModalVisible(true);
        triggerHaptic.selection();
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }

        setSubmitting(true);
        try {
            if (editingSubsystem) {
                // Modifier
                await updateSubsystem(editingSubsystem.id, {
                    name: name.trim(),
                    description: description.trim(),
                    color: selectedColor,
                });
                triggerHaptic.success();
                Alert.alert('Succès', 'Sous-système modifié');
            } else {
                // Créer
                await createSubsystem(name.trim(), selectedColor, description.trim());
                triggerHaptic.success();
                Alert.alert('Succès', 'Sous-système créé');
            }
            setModalVisible(false);
            refresh();
        } catch (error: any) {
            triggerHaptic.error();
            Alert.alert('Erreur', error.message || 'Une erreur est survenue');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (subsystem: Subsystem) => {
        Alert.alert(
            'Supprimer le sous-système',
            `Êtes-vous sûr de vouloir supprimer "${subsystem.name}" ? Cette action est irréversible.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSubsystem(subsystem.id);
                            triggerHaptic.success();
                            Alert.alert('Succès', 'Sous-système supprimé');
                            refresh();
                        } catch (error: any) {
                            triggerHaptic.error();
                            Alert.alert('Erreur', error.message || 'Impossible de supprimer ce sous-système');
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (subsystem: Subsystem) => {
        if (subsystem.is_default) {
            return; // Déjà par défaut
        }

        try {
            await setAsDefault(subsystem.id);
            triggerHaptic.success();
            Alert.alert('Succès', `"${subsystem.name}" est maintenant le sous-système par défaut`);
            refresh();
        } catch (error: any) {
            triggerHaptic.error();
            Alert.alert('Erreur', error.message || 'Impossible de définir comme défaut');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <AnimatedPressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </AnimatedPressable>
                <Text style={styles.title}>Sous-systèmes</Text>
                <AnimatedPressable onPress={openCreateModal}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                </AnimatedPressable>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : subsystems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Aucun sous-système</Text>
                    <Text style={styles.emptySubtitle}>
                        Créez votre premier sous-système pour organiser vos alters en groupes
                    </Text>
                    <AnimatedPressable style={styles.createButton} onPress={openCreateModal}>
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.createButtonText}>Créer un sous-système</Text>
                    </AnimatedPressable>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.sectionTitle}>
                        {subsystems.length} sous-système{subsystems.length > 1 ? 's' : ''}
                    </Text>

                    {subsystems.map((subsystem) => (
                        <View key={subsystem.id} style={styles.subsystemCard}>
                            <View style={styles.subsystemHeader}>
                                <View style={[styles.colorDot, { backgroundColor: subsystem.color }]} />
                                <View style={styles.subsystemInfo}>
                                    <View style={styles.subsystemTitle}>
                                        <Text style={styles.subsystemName}>{subsystem.name}</Text>
                                        {subsystem.is_default && (
                                            <View style={styles.defaultBadge}>
                                                <Ionicons name="star" size={12} color="white" />
                                                <Text style={styles.defaultBadgeText}>Défaut</Text>
                                            </View>
                                        )}
                                    </View>
                                    {subsystem.description && (
                                        <Text style={styles.subsystemDescription} numberOfLines={2}>
                                            {subsystem.description}
                                        </Text>
                                    )}
                                    <Text style={styles.subsystemStat}>
                                        {subsystem.alter_count} alter{subsystem.alter_count !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.subsystemActions}>
                                {!subsystem.is_default && (
                                    <AnimatedPressable
                                        style={styles.actionButton}
                                        onPress={() => handleSetDefault(subsystem)}
                                    >
                                        <Ionicons name="star-outline" size={20} color={colors.textSecondary} />
                                        <Text style={styles.actionButtonText}>Définir par défaut</Text>
                                    </AnimatedPressable>
                                )}
                                <AnimatedPressable
                                    style={styles.actionButton}
                                    onPress={() => openEditModal(subsystem)}
                                >
                                    <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                                    <Text style={styles.actionButtonText}>Modifier</Text>
                                </AnimatedPressable>
                                <AnimatedPressable
                                    style={styles.actionButton}
                                    onPress={() => handleDelete(subsystem)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    <Text style={[styles.actionButtonText, { color: colors.error }]}>Supprimer</Text>
                                </AnimatedPressable>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Create/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingSubsystem ? 'Modifier' : 'Créer'} un sous-système
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Nom *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Ex: Système A, Groupe Principal..."
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.inputMultiline]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Description optionnelle..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Couleur</Text>
                                <View style={styles.colorPicker}>
                                    {alterColors.map((color) => (
                                        <TouchableOpacity
                                            key={color}
                                            style={[
                                                styles.colorOption,
                                                { backgroundColor: color },
                                                selectedColor === color && styles.colorOptionSelected,
                                            ]}
                                            onPress={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {submitting ? 'Enregistrement...' : 'Enregistrer'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    createButtonText: {
        ...typography.body,
        color: 'white',
        fontWeight: '600',
    },
    scrollContent: {
        padding: spacing.lg,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subsystemCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    subsystemHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        marginRight: spacing.sm,
    },
    subsystemInfo: {
        flex: 1,
    },
    subsystemTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    subsystemName: {
        ...typography.h3,
        color: colors.text,
    },
    defaultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        gap: 2,
    },
    defaultBadgeText: {
        ...typography.caption,
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
    subsystemDescription: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    subsystemStat: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    subsystemActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    actionButtonText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputMultiline: {
        height: 80,
        textAlignVertical: 'top',
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        ...typography.body,
        color: 'white',
        fontWeight: '600',
    },
});
