import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { db, storage } from '../../src/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { triggerHaptic } from '../../src/lib/haptics';

export default function EditSystemScreen() {
    const { system, user } = useAuth();
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (system) {
            setName(system.username || '');
            setBio(system.bio || ''); // Assuming 'bio' exists on System type, if not we need to add it or ignore
            setAvatarUrl(system.avatar_url || null); // Assuming avatar_url exists
        }
    }, [system]);

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUrl(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user || !system) return;
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom du système ne peut pas être vide.');
            return;
        }

        setLoading(true);
        try {
            let finalAvatarUrl = avatarUrl;

            // Upload image if it's new (starts with file://)
            if (avatarUrl && avatarUrl.startsWith('file://')) {
                const response = await fetch(avatarUrl);
                const blob = await response.blob();
                const fileName = `system_avatars/${user.uid}/${Date.now()}.jpg`;
                const storageRef = ref(storage, fileName);
                await uploadBytes(storageRef, blob);
                finalAvatarUrl = await getDownloadURL(storageRef);
            }

            const systemRef = doc(db, 'systems', user.uid);
            await updateDoc(systemRef, {
                username: name.trim(),
                bio: bio.trim(),
                avatar_url: finalAvatarUrl
            });

            triggerHaptic.success();
            Alert.alert('Succès', 'Profil système mis à jour !', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
            triggerHaptic.error();
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modifier mon Système</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Text style={[styles.saveButton, loading && { opacity: 0.5 }]}>
                        {loading ? '...' : 'Enregistrer'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="camera" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Changer la photo de profil</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nom du Système</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Système Solaire"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bio / Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Une courte description de votre système..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingTop: 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h3,
        flex: 1,
        textAlign: 'center',
    },
    saveButton: {
        ...typography.body,
        fontWeight: '600',
        color: colors.primary,
    },
    content: {
        padding: spacing.lg,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.backgroundLight,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatarInitial: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    changePhotoText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '500',
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
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
        minHeight: 120,
    },
});
