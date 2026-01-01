
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
    Platform,
    Modal
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../src/lib/firebase';
import { Alter } from '../../../src/types';
import { alterColors, freeAlterColors, premiumAlterColors, colors, spacing, borderRadius, typography } from '../../../src/lib/theme';
import PremiumService from '../../../src/services/PremiumService';
import { useAuth } from '../../../src/contexts/AuthContext';

export default function EditAlterProfileScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { user } = useAuth();
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

    // Dates
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [showArrivalPicker, setShowArrivalPicker] = useState(false);

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

                // Security Check
                const alterSystemId = data.systemId || data.system_id || data.userId;
                if (user && alterSystemId !== user.uid) {
                    Alert.alert('Accès refusé', 'Vous ne pouvez pas modifier cet alter.');
                    router.back();
                    return;
                }

                setInitialAlter(data);
                setName(data.name);
                setPronouns(data.pronouns || '');
                setBio(data.bio || '');
                setColor(data.color || freeAlterColors[0]);
                setAvatarUrl(data.avatar_url || null);

                if (data.birthDate) {
                    setBirthDate(new Date(data.birthDate));
                }
                if (data.arrivalDate) {
                    setArrivalDate(new Date(data.arrivalDate));
                }

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
                custom_fields: customFields,
                birthDate: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
                arrivalDate: arrivalDate ? arrivalDate.toISOString().split('T')[0] : undefined,
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
                {/* ==================== IDENTITY SECTION ==================== */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color={colors.primary} />
                    <Text style={styles.sectionHeaderText}>Identité</Text>
                </View>

                {/* Avatar Section (Part of Identity visually) */}
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

                <View style={styles.formSection}>
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

                    {/* Date Fields */}
                    <View style={styles.dateRow}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                            <Text style={styles.label}>Date de naissance</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowBirthPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                                <Text style={[styles.dateText, !birthDate && { color: colors.textMuted }]}>
                                    {birthDate ? birthDate.toLocaleDateString() : 'Sélectionner'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                            <Text style={styles.label}>Date d'arrivée</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowArrivalPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                                <Text style={[styles.dateText, !arrivalDate && { color: colors.textMuted }]}>
                                    {arrivalDate ? arrivalDate.toLocaleDateString() : 'Sélectionner'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
                </View>

                {/* ==================== APPEARANCE SECTION ==================== */}
                <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
                    <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                    <Text style={styles.sectionHeaderText}>Apparence & Cosmétiques</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Couleur thématique</Text>

                        <View style={styles.colorGrid}>
                            {freeAlterColors.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: c, borderWidth: c === '#FFFFFF' ? 1 : 0, borderColor: colors.border },
                                        color === c && styles.colorCircleSelected
                                    ]}
                                    onPress={() => setColor(c)}
                                >
                                    {color === c && <Ionicons name="checkmark" size={18} color="white" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.colorSubLabel, { marginTop: spacing.md }]}>
                            Couleurs Premium ✨ {!isPremium && '🔒'}
                        </Text>
                        <View style={styles.colorGrid}>
                            {premiumAlterColors.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: c },
                                        color === c && styles.colorCircleSelected,
                                        !isPremium && styles.colorCircleLocked
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
                                    {color === c && <Ionicons name="checkmark" size={18} color="white" />}
                                    {!isPremium && <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.6)" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Cosmetics Grid */}
                    <View style={styles.formGroup}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                            <Text style={styles.label}>Équipement cosmétique</Text>
                            <TouchableOpacity onPress={() => router.push('/shop')}>
                                <Text style={styles.linkText}>Boutique →</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.cosmeticGrid}>
                            {/* Theme Slot */}
                            <TouchableOpacity style={styles.cosmeticCard} onPress={() => router.push('/shop')}>
                                <View style={styles.cosmeticIconBg}>
                                    <Ionicons name="brush-outline" size={24} color={colors.primary} />
                                </View>
                                <Text style={styles.cosmeticCardLabel}>Thème</Text>
                                <Text style={styles.cosmeticCardValue} numberOfLines={1}>
                                    {initialAlter?.equipped_items?.theme || 'Standard'}
                                </Text>
                            </TouchableOpacity>

                            {/* Frame Slot */}
                            <TouchableOpacity style={styles.cosmeticCard} onPress={() => router.push('/shop')}>
                                <View style={styles.cosmeticIconBg}>
                                    <Ionicons name="image-outline" size={24} color={colors.primary} />
                                </View>
                                <Text style={styles.cosmeticCardLabel}>Cadre</Text>
                                <Text style={styles.cosmeticCardValue} numberOfLines={1}>
                                    {initialAlter?.equipped_items?.frame || 'Aucun'}
                                </Text>
                            </TouchableOpacity>

                            {/* Bubble Slot */}
                            <TouchableOpacity style={styles.cosmeticCard} onPress={() => router.push('/shop')}>
                                <View style={styles.cosmeticIconBg}>
                                    <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
                                </View>
                                <Text style={styles.cosmeticCardLabel}>Bulle</Text>
                                <Text style={styles.cosmeticCardValue} numberOfLines={1}>
                                    {initialAlter?.equipped_items?.bubble || 'Classique'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* iOS Date Picker Modals */}
                <Modal visible={showBirthPicker && Platform.OS === 'ios'} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.datePickerContainer}>
                            <View style={styles.datePickerHeader}>
                                <Text style={styles.datePickerTitle}>Date de naissance</Text>
                                <TouchableOpacity onPress={() => setShowBirthPicker(false)}>
                                    <Text style={styles.doneButton}>OK</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={birthDate || new Date()}
                                mode="date"
                                display="spinner"
                                onChange={(_, date) => {
                                    if (date) setBirthDate(date);
                                }}
                                textColor={colors.text}
                            />
                        </View>
                    </View>
                </Modal>

                <Modal visible={showArrivalPicker && Platform.OS === 'ios'} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.datePickerContainer}>
                            <View style={styles.datePickerHeader}>
                                <Text style={styles.datePickerTitle}>Date d'arrivée</Text>
                                <TouchableOpacity onPress={() => setShowArrivalPicker(false)}>
                                    <Text style={styles.doneButton}>OK</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={arrivalDate || new Date()}
                                mode="date"
                                display="spinner"
                                onChange={(_, date) => {
                                    if (date) setArrivalDate(date);
                                }}
                                textColor={colors.text}
                            />
                        </View>
                    </View>
                </Modal>

                {/* Android Date Pickers (Invisible, handled by system) */}
                {showBirthPicker && Platform.OS === 'android' && (
                    <DateTimePicker
                        value={birthDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(_, date) => {
                            setShowBirthPicker(false);
                            if (date) setBirthDate(date);
                        }}
                    />
                )}

                {showArrivalPicker && Platform.OS === 'android' && (
                    <DateTimePicker
                        value={arrivalDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(_, date) => {
                            setShowArrivalPicker(false);
                            if (date) setArrivalDate(date);
                        }}
                    />
                )}
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
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    datePickerContainer: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingBottom: spacing.xl,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    datePickerTitle: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    doneButton: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.primary,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginLeft: spacing.sm,
    },
    formSection: {
        marginBottom: spacing.md,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
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
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateText: {
        marginLeft: spacing.sm,
        color: colors.text,
        fontSize: 15,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginTop: spacing.xs,
    },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorCircleSelected: {
        borderColor: colors.text,
        transform: [{ scale: 1.1 }],
    },
    colorCircleLocked: {
        opacity: 0.6,
    },
    colorSubLabel: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    cosmeticGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    cosmeticCard: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cosmeticIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    cosmeticCardLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    cosmeticCardValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    linkText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
});
