import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SecureContainer } from '../security/SecureContainer';
import { Alter } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { ThemeColors } from '../../lib/cosmetics';

interface AlterJournalProps {
    alter: Alter;
    themeColors?: ThemeColors | null;
    isPublic?: boolean;
    editable?: boolean;
}

interface JournalSectionProps {
    label: string;
    initialContent: string;
    themeColors?: ThemeColors | null;
    editable?: boolean;
    onSave: (newContent: string) => Promise<void>;
    onDelete?: () => void;
    isMain?: boolean;
}

const JournalSection: React.FC<JournalSectionProps> = ({
    label,
    initialContent,
    themeColors,
    editable,
    onSave,
    onDelete,
    isMain
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(initialContent);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert("Erreur", "Le contenu ne peut pas être vide");
            return;
        }
        setSaving(true);
        try {
            await onSave(content);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving section:", error);
            Alert.alert("Erreur", "Impossible de sauvegarder");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Supprimer la section",
            `Voulez-vous vraiment supprimer "${label}" ?`,
            [
                { text: "Annuler", style: "cancel" },
                { text: "Supprimer", style: "destructive", onPress: onDelete }
            ]
        );
    };

    return (
        <View style={styles.sectionContainer}>
            <View style={styles.headerRow}>
                <Text style={[styles.title, themeColors && { color: themeColors.text }]}>{label}</Text>
                {editable && !isEditing && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.editButton, { borderColor: themeColors?.border || colors.border }]}>
                            <Ionicons name="pencil" size={16} color={themeColors?.text || colors.text} />
                            <Text style={[styles.editButtonText, { color: themeColors?.text || colors.text }]}>Modifier</Text>
                        </TouchableOpacity>
                        {!isMain && onDelete && (
                            <TouchableOpacity onPress={handleDelete} style={[styles.iconButton, { backgroundColor: colors.error + '20' }]}>
                                <Ionicons name="trash-outline" size={16} color={colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {isEditing ? (
                <View>
                    <TextInput
                        style={[
                            styles.editor,
                            {
                                color: themeColors?.text || colors.text,
                                backgroundColor: themeColors?.backgroundCard || colors.surface,
                                borderColor: themeColors?.primary || colors.primary
                            }
                        ]}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        placeholder={`Écrivez ici...`}
                        placeholderTextColor={themeColors?.textSecondary || colors.textSecondary}
                    />
                    <View style={styles.editorActions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { borderColor: themeColors?.border || colors.border }]}
                            onPress={() => {
                                setIsEditing(false);
                                setContent(initialContent);
                            }}
                        >
                            <Text style={[styles.buttonText, { color: themeColors?.text || colors.text }]}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, { backgroundColor: themeColors?.primary || colors.primary }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={[styles.buttonText, { color: 'white' }]}>Enregistrer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text style={[styles.content, themeColors && { color: themeColors.text }]}>
                    {content || "Aucun contenu."}
                </Text>
            )}
        </View>
    );
};

import { SafetyPlanModal } from './SafetyPlanModal';

// ... (previous imports)

export const AlterJournal: React.FC<AlterJournalProps> = ({ alter, themeColors, isPublic, editable }) => {
    // Only show "Role", "MajorRole", etc. in specialized components, rely on filtering for custom journals
    const [isCreating, setIsCreating] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const RESERVED_LABELS = ['role', 'majorrole', 'pronouns'];
    const MAIN_LABELS = ['présentation', 'presentation', 'journal', 'description', 'bio'];

    const updateCustomField = async (label: string, value: string, originalLabel?: string) => {
        // ... (existing implementation)
        const alterRef = doc(db, 'alters', alter.id);
        const currentFields = [...(alter.custom_fields || [])];

        // If updating an existing field
        if (originalLabel) {
            const index = currentFields.findIndex(f => f.label === originalLabel);
            if (index !== -1) {
                if (value === null) { // Deletion signal
                    currentFields.splice(index, 1);
                } else {
                    currentFields[index] = { ...currentFields[index], value };
                }
            } else if (value !== null) {
                // If not found but should exist (rare case), add it
                currentFields.push({ label, value });
            }
        } else {
            // New field
            currentFields.push({ label, value });
        }

        await updateDoc(alterRef, { custom_fields: currentFields });
    };

    const handleCreate = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            Alert.alert("Erreur", "Le titre et le contenu sont requis");
            return;
        }

        try {
            await updateCustomField(newTitle, newContent);
            setIsCreating(false);
            setNewTitle('');
            setNewContent('');
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de créer la section");
        }
    };

    if (isPublic || editable) {
        // 1. Identify Main Section
        const mainField = alter.custom_fields?.find(f => MAIN_LABELS.includes(f.label.toLowerCase()));

        // 2. Identify Other Sections
        const otherFields = alter.custom_fields?.filter(f =>
            !MAIN_LABELS.includes(f.label.toLowerCase()) &&
            !RESERVED_LABELS.includes(f.label.toLowerCase())
        ) || [];

        return (
            <ScrollView style={[styles.container, themeColors && { backgroundColor: themeColors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Safety Plan Button (Only visible if owner/editable) */}
                {editable && (
                    <TouchableOpacity
                        style={[styles.safetyButton, { borderColor: colors.error }]}
                        onPress={() => setShowSafetyModal(true)}
                    >
                        <Ionicons name="warning-outline" size={20} color={colors.error} />
                        <Text style={[styles.safetyButtonText, { color: colors.error }]}>Plan de Sécurité / Crise</Text>
                    </TouchableOpacity>
                )}

                <SafetyPlanModal
                    visible={showSafetyModal}
                    onClose={() => setShowSafetyModal(false)}
                    alter={alter}
                    editable={editable}
                />

                {/* Main Section (Presentation) */}
                <JournalSection
                    label={mainField?.label || "Présentation"}
                    initialContent={mainField?.value || alter.bio || ""}
                    themeColors={themeColors}
                    editable={editable}
                    isMain={true}
                    onSave={async (val) => updateCustomField(mainField?.label || "Présentation", val, mainField?.label)}
                />

                {/* Other Custom Sections */}
                {otherFields.map((field, index) => (
                    <JournalSection
                        key={`${field.label}-${index}`}
                        label={field.label}
                        initialContent={field.value}
                        themeColors={themeColors}
                        editable={editable}
                        onSave={async (val) => updateCustomField(field.label, val, field.label)}
                        onDelete={() => {
                            // Specialized delete: update with null value triggers splice in helper
                            // Actually helper expects value or null?
                            // Let's modify helper to handle deletion better or just implement delete here
                            const doDelete = async () => {
                                const alterRef = doc(db, 'alters', alter.id);
                                const newFields = alter.custom_fields?.filter(f => f.label !== field.label) || [];
                                await updateDoc(alterRef, { custom_fields: newFields });
                            };
                            doDelete();
                        }}
                    />
                ))}

                {/* Creator UI */}
                {editable && (
                    <View style={styles.createContainer}>
                        {isCreating ? (
                            <View style={styles.createForm}>
                                <Text style={[styles.createTitle, themeColors && { color: themeColors.text }]}>Nouvelle Section</Text>
                                <TextInput
                                    style={[styles.input, themeColors && { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.backgroundCard }]}
                                    placeholder="Titre (ex: Mes Triggers)"
                                    placeholderTextColor={colors.textSecondary}
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                />
                                <TextInput
                                    style={[styles.input, styles.editor, themeColors && { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.backgroundCard }]}
                                    placeholder="Contenu..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    value={newContent}
                                    onChangeText={setNewContent}
                                />
                                <View style={styles.editorActions}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton, { borderColor: themeColors?.border || colors.border }]}
                                        onPress={() => setIsCreating(false)}
                                    >
                                        <Text style={[styles.buttonText, { color: themeColors?.text || colors.text }]}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: themeColors?.primary || colors.primary }]}
                                        onPress={handleCreate}
                                    >
                                        <Text style={[styles.buttonText, { color: 'white' }]}>Créer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.createButton, { backgroundColor: themeColors?.primary || colors.primary }]}
                                onPress={() => setIsCreating(true)}
                            >
                                <Ionicons name="add" size={24} color="white" />
                                <Text style={styles.createButtonText}>Ajouter une section</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        );
    }

    return (
        <SecureContainer title="Journal Privé" subtitle="Authentification requise">
            <ScrollView style={styles.container}>
                <Text style={[styles.title, themeColors && { color: themeColors.text }]}>Journal de {alter.name}</Text>
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={64} color={themeColors?.textSecondary || colors.textMuted} />
                    <Text style={[styles.emptyTitle, themeColors && { color: themeColors.text }]}>Journal personnel</Text>
                    <Text style={[styles.emptySubtitle, themeColors && { color: themeColors.textSecondary }]}>
                        Les entrées du journal de {alter.name} apparaîtront ici.
                        Ce journal est privé et indépendant des autres alters.
                    </Text>
                </View>
            </ScrollView>
        </SecureContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    sectionContainer: {
        marginBottom: spacing.xl,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h3,
        color: colors.text,
        flex: 1,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    iconButton: {
        padding: 6,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        ...typography.body,
        color: colors.text,
        lineHeight: 24,
    },
    editor: {
        minHeight: 150,
        textAlignVertical: 'top',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        fontSize: 16,
        lineHeight: 24,
        marginBottom: spacing.md,
        color: colors.text,
    },
    input: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    editorActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    saveButton: {
        // bg handled in component
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
    },
    createContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.xxl,
    },
    createForm: {
        padding: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: borderRadius.lg,
    },
    createTitle: {
        ...typography.h4,
        marginBottom: spacing.md,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.full,
        gap: 8,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
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
    },
    safetyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginBottom: spacing.xl,
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        justifyContent: 'center',
    },
    safetyButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});
