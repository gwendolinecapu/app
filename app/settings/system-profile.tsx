import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../src/lib/firebase';
import { triggerHaptic } from '../../src/lib/haptics';

export default function SystemProfileScreen() {
    const { user, system, refreshSystem } = useAuth();
    const [name, setName] = useState(system?.username || '');
    const [loading, setLoading] = useState(false);
    const [avatar, setAvatar] = useState(system?.avatar_url || null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (system) {
            setName(system.username);
            setAvatar(system.avatar_url || null);
        }
    }, [system]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user || !name.trim()) return;

        setSaving(true);
        try {
            let avatarUrl = system?.avatar_url;

            // Upload new avatar if changed and is local uri
            if (avatar && avatar !== system?.avatar_url) {
                const response = await fetch(avatar);
                const blob = await response.blob();
                const storageRef = ref(storage, `avatars/system/${user.uid}_${Date.now()}`);
                await uploadBytes(storageRef, blob);
                avatarUrl = await getDownloadURL(storageRef);
            }

            const systemRef = doc(db, 'systems', user.uid);
            await updateDoc(systemRef, {
                username: name.trim(),
                avatar_url: avatarUrl
            });

            await refreshSystem();
            triggerHaptic.success();
            Alert.alert("Succès", "Profil système mis à jour !");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
            triggerHaptic.error();
        } finally {
            setSaving(false);
        }
    };

    const copyShareCode = async () => {
        // Use user.uid as share code for now, or generate a friend code logic if desired.
        // Assuming user.uid is safe enough or we'd need a simpler code.
        // User request: "avoir un code pour partager son systeme entier a ses ami".
        // Let's use the UID for simplicity as the friend code, or a derived short code.
        // For now, UID.
        await Clipboard.setStringAsync(user?.uid || '');
        triggerHaptic.success();
        Alert.alert("Copié !", "Le code de partage a été copié dans le presse-papier.");
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: "Profil Système",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { ...typography.h3, fontSize: 18 }
            }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Avatar Section */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Ionicons name="people" size={40} color={colors.textSecondary} />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Toucher pour changer la photo</Text>
                </View>

                {/* Form Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Nom du Système</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nom de votre système"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                {/* Share Code Section */}
                <View style={[styles.section, styles.shareSection]}>
                    <View style={styles.shareHeader}>
                        <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
                        <Text style={styles.shareTitle}>Code Ami</Text>
                    </View>
                    <Text style={styles.shareDescription}>
                        Partagez ce code avec vos amis pour qu'ils puissent ajouter votre système.
                    </Text>

                    <TouchableOpacity style={styles.codeContainer} onPress={copyShareCode}>
                        <Text style={styles.codeText}>{user?.uid}</Text>
                        <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Enregistrer le profil</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: colors.backgroundCard,
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    editBadge: {
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
    avatarHint: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    section: {
        marginBottom: spacing.xl,
    },
    label: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
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
    shareSection: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)', // Light blue tint
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(33, 150, 243, 0.3)',
    },
    shareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.xs,
    },
    shareTitle: {
        ...typography.h4,
        color: colors.primary,
    },
    shareDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    codeContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    codeText: {
        fontFamily: 'Courier',
        fontSize: 14,
        color: colors.text,
        fontWeight: 'bold',
        flex: 1,
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
