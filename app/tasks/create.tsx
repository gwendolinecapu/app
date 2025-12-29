import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { TaskService } from '../../src/services/tasks';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CreateTaskScreen() {
    const { system, currentAlter, alters, user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSystemTask, setIsSystemTask] = useState(false);
    const [assignedTo, setAssignedTo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Erreur', 'Le titre est requis');
            return;
        }

        if (!system || !user || !currentAlter) return;

        setLoading(true);
        try {
            await TaskService.createTask({
                system_id: system.id,
                title: title.trim(),
                description: description.trim(),
                assigned_to: isSystemTask ? null : (assignedTo || currentAlter.id),
                created_by: currentAlter.id,
            });

            router.back();
        } catch (error) {
            console.error("Error creating task:", error);
            Alert.alert('Erreur', 'Impossible de créer la tâche');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouvelle Tâche</Text>
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={loading}
                    style={styles.saveButton}
                >
                    <Text style={[styles.saveButtonText, loading && { opacity: 0.5 }]}>
                        {loading ? '...' : 'Créer'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Titre</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Ex: Remplir le lave-vaisselle"
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description (optionnelle)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Détails supplémentaires..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.sectionTitleContainer}>
                        <Text style={styles.sectionTitle}>Assignation</Text>
                    </View>

                    <View style={styles.optionRow}>
                        <View>
                            <Text style={styles.optionTitle}>Tâche Système</Text>
                            <Text style={styles.optionSubtitle}>Visible et réalisable par tout le monde</Text>
                        </View>
                        <Switch
                            value={isSystemTask}
                            onValueChange={(val) => {
                                setIsSystemTask(val);
                                if (val) setAssignedTo(null);
                            }}
                            trackColor={{ false: colors.backgroundLight, true: colors.primary }}
                        />
                    </View>

                    {!isSystemTask && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Assigné à</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alterSelector}>
                                {alters.map(alter => (
                                    <TouchableOpacity
                                        key={alter.id}
                                        style={[
                                            styles.alterChip,
                                            (assignedTo === alter.id || (!assignedTo && currentAlter?.id === alter.id)) && styles.alterChipSelected
                                        ]}
                                        onPress={() => setAssignedTo(alter.id)}
                                    >
                                        <Text style={[
                                            styles.alterChipText,
                                            (assignedTo === alter.id || (!assignedTo && currentAlter?.id === alter.id)) && styles.alterChipTextSelected
                                        ]}>
                                            {alter.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

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
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        ...typography.h3,
    },
    saveButton: {
        padding: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
    },
    saveButtonText: {
        color: colors.textOnPrimary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    formGroup: {
        marginBottom: spacing.xl,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 100,
    },
    sectionTitleContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.xs,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.primaryLight,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    optionTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    optionSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    alterSelector: {
        flexDirection: 'row',
        marginTop: spacing.xs,
    },
    alterChip: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        backgroundColor: colors.backgroundCard,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    alterChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    alterChipText: {
        color: colors.text,
    },
    alterChipTextSelected: {
        color: colors.textOnPrimary,
        fontWeight: 'bold',
    },
});
