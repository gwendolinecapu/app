
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../src/lib/firebase';
import { Alter } from '../../../src/types';
import { alterColors, freeAlterColors, premiumAlterColors, colors, spacing, borderRadius, typography } from '../../../src/lib/theme';
import PremiumService from '../../../src/services/PremiumService';

export default function EditAlterProfileScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Check premium status
    const [isPremium, setIsPremium] = useState(PremiumService.isPremium());

    // Form State
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [bio, setBio] = useState('');
    const [role, setRole] = useState(''); // We'll store this in custom_fields for now if dynamic
    const [color, setColor] = useState(freeAlterColors[0]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [initialAlter, setInitialAlter] = useState<Alter | null>(null);

    useEffect(() => {
        fetchAlter();
    }, [alterId]);

    const fetchAlter = async () => {
        try {
            if (!alterId) return;
            const docRef = doc(db, 'alters', alterId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as Alter;
                setInitialAlter(data);
                setName(data.name);
                setPronouns(data.pronouns || '');
                setBio(data.bio || '');
                setColor(data.color || freeAlterColors[0]);
                setAvatarUrl(data.avatar_url || null);

                // Try to find role in custom_fields
                const roleField = data.custom_fields?.find(f => f.label === 'Role');
                if (roleField) {
                    setRole(roleField.value);
                }
            } else {
                Alert.alert('Erreur', 'Alter non trouvé');
                router.back();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
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
        if (!name.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }

        setSaving(true);
        try {
            let finalAvatarUrl = avatarUrl;

            // Upload image if changed (local URI)
            if (avatarUrl && !avatarUrl.startsWith('http')) {
                const response = await fetch(avatarUrl);
                const blob = await response.blob();
                const fileName = `avatars/${alterId}/${Date.now()}.jpg`;
                const storageRef = ref(storage, fileName);
                await uploadBytes(storageRef, blob);
                finalAvatarUrl = await getDownloadURL(storageRef);
            }

            // Prepare Custom Fields (Role)
            const customFields = initialAlter?.custom_fields?.filter(f => f.label !== 'Role') || [];
            if (role.trim()) {
                customFields.push({ label: 'Role', value: role.trim() });
            }

            const updateData: Partial<Alter> = {
                name: name.trim(),
                pronouns: pronouns.trim() || '',
                bio: bio.trim() || '',
                color,
                avatar_url: finalAvatarUrl || '',
                custom_fields: customFields
            };

            const docRef = doc(db, 'alters', alterId!);
            await updateDoc(docRef, updateData);

            Alert.alert('Succès', 'Profil mis à jour', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de sauvegarder');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modifier le profil</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Ionicons name="checkmark" size={28} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={[styles.avatarContainer, { borderColor: color }]}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: color }]}>
                                <Text style={styles.avatarPlaceholderText}>
                                    {name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="camera" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage}>
                        <Text style={styles.changePhotoText}>Changer de photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nom</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nom de l'alter"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Pronoms</Text>
                    <TextInput
                        style={styles.input}
                        value={pronouns}
                        onChangeText={setPronouns}
                        placeholder="Ex: iel/ellui"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Rôle</Text>
                    <TextInput
                        style={styles.input}
                        value={role}
                        onChangeText={setRole}
                        placeholder="Ex: Protecteur, Gatekeeper..."
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Une courte description..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Couleur du système</Text>
                    <Text style={styles.colorSubLabel}>Couleurs gratuites</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                        {freeAlterColors.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: c, borderWidth: c === '#FFFFFF' ? 1 : 0, borderColor: colors.border },
                                    color === c && styles.colorOptionSelected
                                ]}
                                onPress={() => setColor(c)}
                            />
                        ))}
                    </ScrollView>

                    <Text style={[styles.colorSubLabel, { marginTop: spacing.md }]}>
                        Couleurs Premium ✨ {!isPremium && '🔒'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                        {premiumAlterColors.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: c },
                                    color === c && styles.colorOptionSelected,
                                    !isPremium && styles.colorOptionLocked
                                ]}
                                onPress={() => {
                                    if (isPremium) {
                                        setColor(c);
                                    } else {
                                        Alert.alert(
                                            'Premium requis ✨',
                                            'Cette couleur est réservée aux membres Premium. Passez à Premium pour débloquer toutes les couleurs !',
                                            [
                                                { text: 'Plus tard', style: 'cancel' },
                                                { text: 'Voir Premium', onPress: () => router.push('/shop') }
                                            ]
                                        );
                                    }
                                }}
                            >
                                {!isPremium && (
                                    <View style={styles.lockIcon}>
                                        <Ionicons name="lock-closed" size={12} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ==================== COSMETICS SECTION ==================== */}
                <View style={styles.formGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.label}>Cosmétiques équipés</Text>
                        <TouchableOpacity onPress={() => router.push('/shop')}>
                            <Text style={{ color: colors.primary, fontSize: 12 }}>Voir la boutique →</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Show equipped decorations or "None" */}
                    <View style={styles.cosmeticsRow}>
                        {/* Theme */}
                        <View style={styles.cosmeticSlot}>
                            <Text style={styles.cosmeticLabel}>🎨 Thème</Text>
                            <Text style={styles.cosmeticValue}>
                                {initialAlter?.equipped_items?.theme || 'Par défaut'}
                            </Text>
                        </View>

                        {/* Frame */}
                        <View style={styles.cosmeticSlot}>
                            <Text style={styles.cosmeticLabel}>🖼️ Cadre</Text>
                            <Text style={styles.cosmeticValue}>
                                {initialAlter?.equipped_items?.frame || 'Aucun'}
                            </Text>
                        </View>

                        {/* Bubble */}
                        <View style={styles.cosmeticSlot}>
                            <Text style={styles.cosmeticLabel}>💬 Bulle</Text>
                            <Text style={styles.cosmeticValue}>
                                {initialAlter?.equipped_items?.bubble || 'Classique'}
                            </Text>
                        </View>
                    </View>

                    {/* Owned items count */}
                    <Text style={styles.cosmeticHint}>
                        {initialAlter?.owned_items?.length || 0} objets possédés • Accédez à la boutique pour équiper
                    </Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: 60,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        ...typography.h3,
        fontWeight: 'bold',
    },
    backButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        marginBottom: spacing.sm,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 48,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    changePhotoText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.caption,
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    colorRow: {
        flexDirection: 'row',
        paddingVertical: spacing.xs,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: colors.text,
        transform: [{ scale: 1.1 }],
    },
    colorSubLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    colorOptionLocked: {
        opacity: 0.6,
    },
    lockIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -8,
        marginLeft: -8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 4,
    },
    // ==================== COSMETICS STYLES ====================
    cosmeticsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    cosmeticSlot: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        alignItems: 'center',
    },
    cosmeticLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    cosmeticValue: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    cosmeticHint: {
        marginTop: spacing.sm,
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
