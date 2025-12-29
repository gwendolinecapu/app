import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { HelpService } from '../../src/services/help';
import { HelpRequest } from '../../src/types';

export default function CreateHelpRequestScreen() {
    const router = useRouter();
    const { user, currentAlter, system } = useAuth();
    const [loading, setLoading] = useState(false);

    const [type, setType] = useState<HelpRequest['type']>('support');
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert("Erreur", "Veuillez décrire le problème ou le besoin.");
            return;
        }

        if (!user || !system || !currentAlter) return;

        setLoading(true);
        try {
            await HelpService.createRequest(
                system.id,
                currentAlter.id,
                currentAlter.name,
                type,
                description,
                isAnonymous
            );

            Alert.alert(
                "Demande envoyée",
                "Le système a été notifié de votre demande d'aide.",
                [
                    { text: "OK", onPress: () => router.back() }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible d'envoyer la demande. Réessayez.");
        } finally {
            setLoading(false);
        }
    };

    const renderTypeOption = (value: HelpRequest['type'], icon: string, label: string, color: string) => (
        <TouchableOpacity
            style={[
                styles.typeOption,
                type === value && { borderColor: color, backgroundColor: color + '15' }
            ]}
            onPress={() => setType(value)}
        >
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={24} color="white" />
            </View>
            <Text style={[styles.typeLabel, type === value && { color: color, fontWeight: 'bold' }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Demander de l'Aide</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.instruction}>
                    Quel type d'aide recherchez-vous ?
                </Text>

                <View style={styles.typesContainer}>
                    {renderTypeOption('support', 'hand-left-outline', 'Besoin de Soutien', '#3B82F6')}
                    {renderTypeOption('talk', 'chatbubbles-outline', 'Besoin de Parler', '#10B981')}
                    {renderTypeOption('emergency', 'warning-outline', 'Urgence Interne', '#EF4444')}
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Expliquez brièvement ce qui se passe..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Envoyer anonymement</Text>
                    <Switch
                        value={isAnonymous}
                        onValueChange={setIsAnonymous}
                        trackColor={{ false: colors.backgroundLight, true: colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : isAnonymous ? colors.primary : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Envoyer la demande</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.note}>
                    Cette demande sera visible par les autres membres du système afin qu'ils puissent intervenir.
                </Text>
            </ScrollView>
        </View>
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
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: colors.backgroundCard,
    },
    title: {
        ...typography.h3,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    instruction: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.lg,
        color: colors.textSecondary,
    },
    typesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    typeOption: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: borderRadius.md,
        marginHorizontal: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    typeLabel: {
        ...typography.caption,
        textAlign: 'center',
        color: colors.textSecondary,
    },
    label: {
        ...typography.h3,
        fontSize: 16,
        marginBottom: spacing.sm,
    },
    input: {
        ...typography.body,
        backgroundColor: colors.backgroundCard,
        color: colors.text,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        height: 150,
        marginBottom: spacing.lg,
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    note: {
        marginTop: spacing.lg,
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
    },

    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    switchLabel: {
        ...typography.body,
        fontWeight: '500',
    },
});
