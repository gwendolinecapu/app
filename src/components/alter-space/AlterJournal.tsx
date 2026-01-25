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

export const AlterJournal: React.FC<AlterJournalProps> = ({ alter, themeColors, isPublic, editable }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Detect existing presentation field
    const presentationField = alter.custom_fields?.find(
        f => ['présentation', 'presentation', 'journal', 'description', 'bio'].includes(f.label.toLowerCase())
    );
    const [editContent, setEditContent] = useState(presentationField?.value || alter.bio || '');

    const handleStartEdit = () => {
        setEditContent(presentationField?.value || alter.bio || '');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editContent.trim()) {
            Alert.alert("Erreur", "Le contenu ne peut pas être vide");
            return;
        }

        setSaving(true);
        try {
            const alterRef = doc(db, 'alters', alter.id);
            let updatedFields = alter.custom_fields || [];

            // Check if field exists
            const fieldIndex = updatedFields.findIndex(f => ['présentation', 'presentation', 'journal', 'description'].includes(f.label.toLowerCase()));

            if (fieldIndex >= 0) {
                // Update existing
                updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], value: editContent };
            } else {
                // Create new "Présentation" field
                updatedFields.push({ label: 'Présentation', value: editContent });
            }

            await updateDoc(alterRef, { custom_fields: updatedFields });
            setIsEditing(false);
            Alert.alert("Succès", "Présentation mise à jour");
        } catch (error) {
            console.error("Error saving presentation:", error);
            Alert.alert("Erreur", "Impossible de sauvegarder");
        } finally {
            setSaving(false);
        }
    };

    if (isPublic || editable) {
        const displayContent = presentationField?.value || alter.bio || "Aucune présentation disponible pour le moment.";

        return (
            <ScrollView style={[styles.container, themeColors && { backgroundColor: themeColors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, themeColors && { color: themeColors.text }]}>Présentation</Text>
                    {editable && !isEditing && (
                        <TouchableOpacity onPress={handleStartEdit} style={[styles.editButton, { borderColor: themeColors?.border || colors.border }]}>
                            <Ionicons name="pencil" size={16} color={themeColors?.text || colors.text} />
                            <Text style={[styles.editButtonText, { color: themeColors?.text || colors.text }]}>Modifier</Text>
                        </TouchableOpacity>
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
                            value={editContent}
                            onChangeText={setEditContent}
                            placeholder="Écrivez votre présentation ici..."
                            placeholderTextColor={themeColors?.textSecondary || colors.textSecondary}
                        />
                        <View style={styles.editorActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { borderColor: themeColors?.border || colors.border }]}
                                onPress={() => setIsEditing(false)}
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
                    <>
                        {presentationField?.value ? (
                            <Text style={[styles.content, themeColors && { color: themeColors.text }]}>
                                {presentationField.value}
                            </Text>
                        ) : alter.bio ? (
                            <View>
                                <Text style={[styles.label, { color: themeColors?.textSecondary || colors.textSecondary }]}>Bio</Text>
                                <Text style={[styles.content, themeColors && { color: themeColors.text }]}>
                                    {alter.bio}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={48} color={themeColors?.textSecondary || colors.textMuted} />
                                <Text style={[styles.emptySubtitle, themeColors && { color: themeColors.textSecondary }]}>
                                    {displayContent}
                                </Text>
                                {editable && (
                                    <TouchableOpacity
                                        style={[styles.createButton, { backgroundColor: themeColors?.primary || colors.primary }]}
                                        onPress={handleStartEdit}
                                    >
                                        <Text style={{ color: 'white', fontWeight: '600' }}>Créer une présentation</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </>
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h3,
        color: colors.text,
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
    editButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    label: {
        fontSize: 12,
        textTransform: 'uppercase',
        marginBottom: 4,
        fontWeight: '600',
    },
    content: {
        ...typography.body,
        color: colors.text,
        lineHeight: 24,
    },
    editor: {
        minHeight: 200,
        textAlignVertical: 'top',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        fontSize: 16,
        lineHeight: 24,
        marginBottom: spacing.md,
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
    createButton: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
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
});
