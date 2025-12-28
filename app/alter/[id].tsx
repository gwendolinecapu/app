import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography, alterColors } from '../../src/lib/theme';

export default function AlterProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { alters, refreshAlters } = useAuth();
    const [alter, setAlter] = useState<Alter | null>(null);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [bio, setBio] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const foundAlter = alters.find((a) => a.id === id);
        if (foundAlter) {
            setAlter(foundAlter);
            setName(foundAlter.name);
            setPronouns(foundAlter.pronouns || '');
            setBio(foundAlter.bio || '');
            setSelectedColor(foundAlter.color);
        }
    }, [id, alters]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('alters')
                .update({
                    name: name.trim(),
                    pronouns: pronouns.trim() || null,
                    bio: bio.trim() || null,
                    color: selectedColor,
                })
                .eq('id', id);

            if (error) throw error;

            await refreshAlters();
            setEditing(false);
            Alert.alert('Succès', 'Profil mis à jour !');
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer cet alter ?',
            'Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('alters')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;

                            await refreshAlters();
                            router.back();
                        } catch (error: any) {
                            Alert.alert('Erreur', error.message);
                        }
                    },
                },
            ]
        );
    };

    if (!alter) {
        return (
            <View style={styles.container}>
                <Text style={styles.notFound}>Alter non trouvé</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: editing ? selectedColor : alter.color }]}>
                    <Text style={styles.avatarText}>
                        {(editing ? name : alter.name).charAt(0).toUpperCase()}
                    </Text>
                </View>
                {alter.is_host && (
                    <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>👑 Host</Text>
                    </View>
                )}
            </View>

            {editing ? (
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nom</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nom de l'alter"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Pronoms</Text>
                        <TextInput
                            style={styles.input}
                            value={pronouns}
                            onChangeText={setPronouns}
                            placeholder="Pronoms (ex: elle/lui, iel...)"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Une courte description..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
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

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setEditing(false)}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={loading}>
                            <LinearGradient
                                colors={[colors.gradientStart, colors.gradientEnd]}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveButtonText}>
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.profile}>
                    <Text style={styles.name}>{alter.name}</Text>
                    {alter.pronouns && (
                        <Text style={styles.pronouns}>{alter.pronouns}</Text>
                    )}
                    {alter.bio && <Text style={styles.bio}>{alter.bio}</Text>}

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditing(true)}
                    >
                        <Text style={styles.editButtonText}>✏️ Modifier le profil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>🗑️ Supprimer cet alter</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    notFound: {
        ...typography.body,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
    header: {
        alignItems: 'center',
        padding: spacing.xl,
        paddingTop: spacing.xxl,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        color: colors.text,
        fontSize: 48,
        fontWeight: 'bold',
    },
    hostBadge: {
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    hostBadgeText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    profile: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    name: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    pronouns: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    bio: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    editButton: {
        backgroundColor: colors.backgroundCard,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    editButtonText: {
        ...typography.body,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: colors.error + '20',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
    },
    deleteButtonText: {
        color: colors.error,
        fontWeight: '600',
    },
    form: {
        padding: spacing.lg,
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
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputMultiline: {
        height: 100,
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
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.xl,
    },
    saveButtonText: {
        color: colors.text,
        fontWeight: 'bold',
    },
});
