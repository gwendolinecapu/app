import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { GroupService } from '../../src/services/groups';

export default function CreateGroupScreen() {
    const router = useRouter();
    const { system } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom du groupe est requis.');
            return;
        }

        if (!system) return;

        setLoading(true);
        try {
            const tempGroupId = await GroupService.createGroup(name, description, system.id);
            // Rediriger vers le nouveau groupe
            // Note: Nous utilisons replace pour que le retour ne revienne pas sur l'écran de création
            // router.replace(`/groups/${tempGroupId}` as any);
            // Pour l'instant, revenons à la liste car la page détail n'est pas encore prête
            Alert.alert("Succès", "Groupe créé !", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', "Impossible de créer le groupe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Nouveau Groupe</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Nom du groupe</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Coin lecture, Projet X..."
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>Description (optionnel)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="De quoi parle ce groupe ?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                />

                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.createButtonText}>Créer le groupe</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...typography.h3,
    },
    content: {
        padding: spacing.md,
    },
    label: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    input: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        color: colors.text,
        fontSize: 16,
    },
    textArea: {
        height: 100,
    },
    createButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
