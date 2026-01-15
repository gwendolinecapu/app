
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
import { getFrameStyle, getThemeColors } from '../../../src/lib/cosmetics';

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
    const [role, setRole] = useState(''); // Secondary roles
    const [majorRole, setMajorRole] = useState(''); // Primary role
    const [color, setColor] = useState(freeAlterColors[0]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Dates
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [showArrivalPicker, setShowArrivalPicker] = useState(false);
    const [showRoleInfoModal, setShowRoleInfoModal] = useState(false);
    const [showMajorRoleModal, setShowMajorRoleModal] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedMajorRoles, setSelectedMajorRoles] = useState<string[]>([]);

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

                // Try to find role in custom_fields (case insensitive)
                const roleField = data.custom_fields?.find(f => f.label.toLowerCase() === 'role');
                if (roleField) {
                    setRole(roleField.value);
                }

                // Try to find majorRole in custom_fields
                const majorRoleField = data.custom_fields?.find(f => f.label.toLowerCase() === 'majorrole');
                if (majorRoleField) {
                    setMajorRole(majorRoleField.value);
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

    // Role definitions for long press
    const roleDefinitions: Record<string, string> = {
        'Protecteur': 'Protège le système des menaces extérieures et intérieures',
        'Protecteur émotionnel': 'Gère et protège contre les émotions fortes',
        'Protecteur physique': 'Prend le contrôle en situation de danger physique',
        'Gatekeeper': 'Contrôle l\'accès aux souvenirs, alters et au front',
        'Persecutor': 'Semble nuire mais agit souvent pour "protéger" à sa manière',
        'Avenger': 'Réagit face aux injustices ou abus',
        'Hôte': 'Alter principal qui gère la vie quotidienne',
        'Co-hôte': 'Partage le rôle de l\'hôte',
        'Manager': 'Planifie, structure et prend des décisions',
        'Caretaker': 'Prend soin du système et des autres alters',
        'ISH': 'Internal Self Helper - alter très conscient, guide interne',
        'Mediator': 'Gère les conflits internes',
        'Archiviste': 'Garde et organise les souvenirs',
        'Little': 'Alter enfant (âge variable)',
        'Middle': 'Alter préadolescent',
        'Age slider': 'Alter dont l\'âge varie',
        'Regressor': 'Peut redevenir enfant sous stress',
        'Trauma holder': 'Porte les souvenirs traumatiques',
        'Emotional holder': 'Porte des émotions spécifiques',
        'Pain holder': 'Porte la douleur physique ou émotionnelle',
        'Fear holder': 'Porte la peur',
        'Fragment': 'Partie très spécifique ou limitée',
        'Social alter': 'Gère les interactions sociales',
        'Mask': 'Alter créé pour "faire semblant d\'aller bien"',
        'Entertainer': 'Humour et créativité',
        'Artist': 'Création artistique',
        'Communicator': 'Parle pour le système',
        'Worker': 'Gère le travail et les études',
        'Student': 'Spécialisé dans l\'apprentissage',
        'Sexual alter': 'Gère la sexualité et l\'intimité',
        'Romantic': 'Gère les relations amoureuses',
        'Spiritual': 'Spiritualité et croyances',
        'Fictive': 'Issu d\'un personnage fictif',
        'Introject': 'Basé sur une personne réelle',
        'Non-human': 'Animal, créature ou entité',
        'Object': 'Alter objet',
        'Subsystem': 'Système dans le système',
        'Shell': 'Présence minimale ou vide',
        'Fronting': 'Celui qui est au contrôle',
        'Co-front': 'Plusieurs alters au front',
        'Observer': 'Observe sans contrôler',
        'Dormant': 'Inactif temporairement'
    };

    const handleRoleSelect = (roleName: string) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleName)) {
                return prev.filter(r => r !== roleName);
            } else {
                return [...prev, roleName];
            }
        });
    };

    const handleRoleLongPress = (roleName: string) => {
        const definition = roleDefinitions[roleName];
        if (definition) {
            Alert.alert(roleName, definition);
        }
    };

    const applySelectedRoles = () => {
        setRole(selectedRoles.join(', '));
        setShowRoleInfoModal(false);
    };

    // Major role handlers (multiple selection)
    const handleMajorRoleSelect = (roleName: string) => {
        setSelectedMajorRoles(prev => {
            if (prev.includes(roleName)) {
                return prev.filter(r => r !== roleName);
            } else {
                return [...prev, roleName];
            }
        });
    };

    const applySelectedMajorRole = () => {
        setMajorRole(selectedMajorRoles.join(', '));
        setShowMajorRoleModal(false);
    };
    // Pre-select roles when modal opens
    useEffect(() => {
        if (showRoleInfoModal && role) {
            // Split current role by comma and trim
            const currentRoles = role.split(',').map(r => r.trim()).filter(r => r.length > 0);
            setSelectedRoles(currentRoles);
        } else if (!showRoleInfoModal) {
            setSelectedRoles([]);
        }
    }, [showRoleInfoModal, role]);

    // Pre-select major roles when modal opens
    useEffect(() => {
        if (showMajorRoleModal && majorRole) {
            const currentMajorRoles = majorRole.split(',').map(r => r.trim()).filter(r => r.length > 0);
            setSelectedMajorRoles(currentMajorRoles);
        } else if (!showMajorRoleModal) {
            setSelectedMajorRoles([]);
        }
    }, [showMajorRoleModal, majorRole]);
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

    // Helper for robust blob creation
    const getBlobFromUri = async (uri: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.error("XHR Error:", e);
                reject(new TypeError("Network request failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });
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
                console.log('Starting image upload...', avatarUrl);
                try {
                    const blob = await getBlobFromUri(avatarUrl) as any; // Cast to any to avoid TS issues with RN Blob vs Web Blob
                    const fileName = `avatars/${alterId}/${Date.now()}.jpg`;
                    const storageRef = ref(storage, fileName);

                    console.log('Uploading bytes to:', fileName);
                    await uploadBytes(storageRef, blob);
                    console.log('Upload complete, getting URL...');

                    finalAvatarUrl = await getDownloadURL(storageRef);
                    console.log('Got download URL:', finalAvatarUrl);

                    // Required for some RN environments to release memory
                    if (blob.close) {
                        blob.close();
                    }
                } catch (uploadError) {
                    console.error('Upload failed:', uploadError);
                    Alert.alert('Erreur Upload', 'Impossible de télécharger l&apos;image. Veuillez réessayer.');
                    setSaving(false);
                    return;
                }
            }

            // Prepare Custom Fields (Role and MajorRole)
            // Filter out any existing Role/MajorRole entries (case insensitive) to avoid duplicates
            const customFields = (initialAlter?.custom_fields || []).filter(
                f => f.label.toLowerCase() !== 'role' && f.label.toLowerCase() !== 'majorrole'
            );

            if (role.trim()) {
                customFields.push({ label: 'Role', value: role.trim() });
            }

            if (majorRole.trim()) {
                customFields.push({ label: 'MajorRole', value: majorRole.trim() });
            }

            const updateData: Partial<Alter> = {
                name: name.trim(),
                pronouns: pronouns.trim() || '',
                bio: bio.trim() || '',
                color,
                avatar_url: finalAvatarUrl || '',
                custom_fields: customFields,
            };

            if (birthDate) {
                updateData.birthDate = birthDate.toISOString().split('T')[0];
            }
            if (arrivalDate) {
                updateData.arrivalDate = arrivalDate.toISOString().split('T')[0];
            }

            const docRef = doc(db, 'alters', alterId!);
            await updateDoc(docRef, updateData);

            Alert.alert('Succès', 'Profil mis à jour', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Save error:', error);
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
                        <Ionicons name="checkmark" size={28} color={color} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ==================== IDENTITY SECTION ==================== */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color={color} />
                    <Text style={styles.sectionHeaderText}>Identité</Text>
                </View>

                {/* Avatar Section (Part of Identity visually) */}
                <View style={[styles.avatarSection]}>
                    {(() => {
                        const frameId = initialAlter?.equipped_items?.frame;
                        const frameStyle = getFrameStyle(frameId, 100);

                        return (
                            <TouchableOpacity
                                onPress={pickImage}
                                style={[
                                    styles.avatarContainer,
                                    { borderColor: color },
                                    frameStyle.containerStyle,
                                    frameStyle.imageSource ? { borderWidth: 0, backgroundColor: 'transparent' } : undefined
                                ]}
                            >
                                {avatarUrl ? (
                                    <Image
                                        source={{ uri: avatarUrl }}
                                        style={[styles.avatar, frameStyle.imageStyle as any]}
                                    />
                                ) : (
                                    <View style={[
                                        styles.avatarPlaceholder,
                                        { backgroundColor: color },
                                        frameStyle.imageStyle as any
                                    ]}>
                                        <Text style={styles.avatarPlaceholderText}>
                                            {name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}

                                {/* Static Frame Overlay for specific frames if needed */}
                                {frameStyle.imageSource && (
                                    <Image
                                        source={frameStyle.imageSource}
                                        style={{
                                            position: 'absolute',
                                            width: 110,
                                            height: 110,
                                            zIndex: 10,
                                            resizeMode: 'contain',
                                            top: -5,
                                            left: -5
                                        }}
                                    />
                                )}

                                <View style={styles.editIconBadge}>
                                    <Ionicons name="camera" size={14} color="white" />
                                </View>
                            </TouchableOpacity>
                        );
                    })()}
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

                    {/* RÔLE MAJEUR */}
                    <View style={styles.formGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.label}>RÔLE MAJEUR</Text>
                            <TouchableOpacity
                                onPress={() => setShowMajorRoleModal(true)}
                                style={{ marginLeft: 6, padding: 2 }}
                            >
                                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowMajorRoleModal(true)}
                        >
                            <Text style={{ color: majorRole ? colors.text : colors.textMuted }}>
                                {majorRole || 'Ex: Hôte, Protecteur...'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* RÔLES SECONDAIRES */}
                    <View style={styles.formGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.label}>RÔLES</Text>
                            <TouchableOpacity
                                onPress={() => setShowRoleInfoModal(true)}
                                style={{ marginLeft: 6, padding: 2 }}
                            >
                                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowRoleInfoModal(true)}
                        >
                            <Text style={{ color: role ? colors.text : colors.textMuted }}>
                                {role || 'Ex: Artiste, Non-human...'}
                            </Text>
                        </TouchableOpacity>
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
                            <Text style={styles.label}>Date d&apos;arrivée</Text>
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


                <View style={{ height: 40 }} />

                {/* ==================== APPEARANCE SECTION ==================== */}
                <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
                    <Ionicons name="color-palette-outline" size={20} color={color} />
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
                                                    { text: 'Voir Premium', onPress: () => router.push({ pathname: '/shop', params: { alterId } }) }
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
                            <TouchableOpacity onPress={() => router.push({ pathname: '/shop', params: { alterId } })}>
                                <Text style={styles.linkText}>Boutique →</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.cosmeticGrid}>
                            {/* Theme Slot */}
                            <TouchableOpacity style={styles.cosmeticCard} onPress={() => router.push({ pathname: '/shop', params: { alterId } })}>
                                <View style={styles.cosmeticIconBg}>
                                    <Ionicons name="brush-outline" size={24} color={colors.primary} />
                                </View>
                                <Text style={styles.cosmeticCardLabel}>Thème</Text>
                                <Text style={styles.cosmeticCardValue} numberOfLines={1}>
                                    {initialAlter?.equipped_items?.theme || 'Standard'}
                                </Text>
                            </TouchableOpacity>

                            {/* Frame Slot */}
                            <TouchableOpacity style={styles.cosmeticCard} onPress={() => router.push({ pathname: '/shop', params: { alterId } })}>
                                <View style={styles.cosmeticIconBg}>
                                    <Ionicons name="image-outline" size={24} color={colors.primary} />
                                </View>
                                <Text style={styles.cosmeticCardLabel}>Cadre</Text>
                                <Text style={styles.cosmeticCardValue} numberOfLines={1}>
                                    {initialAlter?.equipped_items?.frame || 'Aucun'}
                                </Text>
                            </TouchableOpacity>

                            {/* Bubble Slot */}
                            <TouchableOpacity style={styles.cosmeticCard} onPress={() => router.push({ pathname: '/shop', params: { alterId } })}>
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

                {/* Major Role Info Modal */}
                <Modal visible={showMajorRoleModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.datePickerContainer, { maxHeight: '80%' }]}>
                            <View style={styles.datePickerHeader}>
                                <Text style={styles.datePickerTitle}>Sélectionner un rôle majeur</Text>
                                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                                    <TouchableOpacity onPress={applySelectedMajorRole}>
                                        <Text style={[styles.doneButton, { fontWeight: 'bold' }]}>Appliquer</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowMajorRoleModal(false)}>
                                        <Text style={styles.doneButton}>Fermer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView style={{ padding: spacing.lg }}>
                                {/* Helper component for major role chip */}
                                {(() => {
                                    const MajorRoleChip = ({ roleName }: { roleName: string }) => {
                                        const isSelected = selectedMajorRoles.includes(roleName);
                                        return (
                                            <TouchableOpacity
                                                onPress={() => handleMajorRoleSelect(roleName)}
                                                onLongPress={() => handleRoleLongPress(roleName)}
                                                style={{
                                                    backgroundColor: isSelected ? color : colors.backgroundCard,
                                                    paddingHorizontal: spacing.md,
                                                    paddingVertical: spacing.sm,
                                                    borderRadius: borderRadius.lg,
                                                    marginRight: spacing.xs,
                                                    marginBottom: spacing.xs,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? color : colors.border
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: isSelected ? '600' : '500',
                                                    color: isSelected ? 'white' : colors.text
                                                }}>{roleName}</Text>
                                            </TouchableOpacity>
                                        );
                                    };

                                    return (
                                        <>
                                            {/* Protection */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>🛡️ Protection</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Protecteur" />
                                                <MajorRoleChip roleName="Protecteur émotionnel" />
                                                <MajorRoleChip roleName="Protecteur physique" />
                                                <MajorRoleChip roleName="Gatekeeper" />
                                                <MajorRoleChip roleName="Persecutor" />
                                                <MajorRoleChip roleName="Avenger" />
                                                <MajorRoleChip roleName="Guardian" />
                                            </View>

                                            {/* Gestion */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>💼 Gestion</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Hôte" />
                                                <MajorRoleChip roleName="Co-hôte" />
                                                <MajorRoleChip roleName="Manager" />
                                                <MajorRoleChip roleName="Caretaker" />
                                                <MajorRoleChip roleName="ISH" />
                                                <MajorRoleChip roleName="Mediator" />
                                                <MajorRoleChip roleName="Archiviste" />
                                                <MajorRoleChip roleName="Organisateur" />
                                                <MajorRoleChip roleName="Core" />
                                            </View>

                                            {/* Enfance */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>👶 Enfance</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Little" />
                                                <MajorRoleChip roleName="Middle" />
                                                <MajorRoleChip roleName="Teen" />
                                                <MajorRoleChip roleName="Age slider" />
                                                <MajorRoleChip roleName="Regressor" />
                                            </View>

                                            {/* Traumatismes */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>💔 Traumatismes</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Trauma holder" />
                                                <MajorRoleChip roleName="Emotional holder" />
                                                <MajorRoleChip roleName="Pain holder" />
                                                <MajorRoleChip roleName="Fear holder" />
                                                <MajorRoleChip roleName="Memory holder" />
                                                <MajorRoleChip roleName="Fragment" />
                                            </View>

                                            {/* Sociaux */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>🎭 Sociaux & Créatifs</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Social alter" />
                                                <MajorRoleChip roleName="Mask" />
                                                <MajorRoleChip roleName="Animateur/trice" />
                                                <MajorRoleChip roleName="Artiste" />
                                                <MajorRoleChip roleName="Communicateur/trice" />
                                                <MajorRoleChip roleName="Performer" />
                                            </View>

                                            {/* Spécialisés */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>⚙️ Spécialisés</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Travailleur/se" />
                                                <MajorRoleChip roleName="Étudiant(e)" />
                                                <MajorRoleChip roleName="Sexual alter" />
                                                <MajorRoleChip roleName="Romantique" />
                                                <MajorRoleChip roleName="Spirituel/le" />
                                                <MajorRoleChip roleName="Somatic" />
                                            </View>

                                            {/* Types particuliers */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>✨ Types particuliers</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Fictive" />
                                                <MajorRoleChip roleName="Factive" />
                                                <MajorRoleChip roleName="Introject" />
                                                <MajorRoleChip roleName="Non-human" />
                                                <MajorRoleChip roleName="Therian" />
                                                <MajorRoleChip roleName="Objet" />
                                                <MajorRoleChip roleName="Subsystem" />
                                                <MajorRoleChip roleName="Shell" />
                                            </View>

                                            {/* États du front */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>🔄 États du front</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <MajorRoleChip roleName="Fronting" />
                                                <MajorRoleChip roleName="Co-front" />
                                                <MajorRoleChip roleName="Observer" />
                                                <MajorRoleChip roleName="Dormant" />
                                                <MajorRoleChip roleName="Unknown" />
                                            </View>

                                            <View style={{ backgroundColor: colors.backgroundCard, padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md }}>
                                                <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>💡 Sélectionnez un ou plusieurs rôles majeurs pour cet alter. Appui long pour voir la définition.</Text>
                                            </View>
                                        </>
                                    );
                                })()}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Role Info Modal */}
                <Modal visible={showRoleInfoModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.datePickerContainer, { maxHeight: '80%' }]}>
                            <View style={styles.datePickerHeader}>
                                <Text style={styles.datePickerTitle}>Sélectionner des rôles</Text>
                                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                                    <TouchableOpacity onPress={applySelectedRoles}>
                                        <Text style={[styles.doneButton, { fontWeight: 'bold' }]}>Appliquer</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowRoleInfoModal(false)}>
                                        <Text style={styles.doneButton}>Fermer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView style={{ padding: spacing.lg }}>
                                {/* Helper component for role chip */}
                                {(() => {
                                    const RoleChip = ({ roleName }: { roleName: string }) => {
                                        const isSelected = selectedRoles.includes(roleName);
                                        return (
                                            <TouchableOpacity
                                                onPress={() => handleRoleSelect(roleName)}
                                                onLongPress={() => handleRoleLongPress(roleName)}
                                                style={{
                                                    backgroundColor: isSelected ? color : colors.backgroundCard,
                                                    paddingHorizontal: spacing.md,
                                                    paddingVertical: spacing.sm,
                                                    borderRadius: borderRadius.lg,
                                                    marginRight: spacing.xs,
                                                    marginBottom: spacing.xs,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? color : colors.border
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontWeight: isSelected ? '600' : '500',
                                                    color: isSelected ? 'white' : colors.text
                                                }}>{roleName}</Text>
                                            </TouchableOpacity>
                                        );
                                    };

                                    return (
                                        <>
                                            {/* Protection */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>Protection</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Protecteur" />
                                                <RoleChip roleName="Protecteur émotionnel" />
                                                <RoleChip roleName="Protecteur physique" />
                                                <RoleChip roleName="Gatekeeper" />
                                                <RoleChip roleName="Persecutor" />
                                                <RoleChip roleName="Avenger" />
                                            </View>

                                            {/* Gestion */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>Gestion</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Hôte" />
                                                <RoleChip roleName="Co-hôte" />
                                                <RoleChip roleName="Manager" />
                                                <RoleChip roleName="Caretaker" />
                                                <RoleChip roleName="ISH" />
                                                <RoleChip roleName="Mediator" />
                                                <RoleChip roleName="Archiviste" />
                                            </View>

                                            {/* Enfance */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>Enfance</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Little" />
                                                <RoleChip roleName="Middle" />
                                                <RoleChip roleName="Age slider" />
                                                <RoleChip roleName="Regressor" />
                                            </View>

                                            {/* Traumatismes */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>Traumatismes</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Trauma holder" />
                                                <RoleChip roleName="Emotional holder" />
                                                <RoleChip roleName="Pain holder" />
                                                <RoleChip roleName="Fear holder" />
                                                <RoleChip roleName="Fragment" />
                                            </View>

                                            {/* Sociaux */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>Sociaux</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Social alter" />
                                                <RoleChip roleName="Mask" />
                                                <RoleChip roleName="Animateur/trice" />
                                                <RoleChip roleName="Artiste" />
                                                <RoleChip roleName="Communicateur/trice" />
                                            </View>

                                            {/* Spécialisés */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>Spécialisés</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Travailleur/se" />
                                                <RoleChip roleName="Étudiant(e)" />
                                                <RoleChip roleName="Sexual alter" />
                                                <RoleChip roleName="Romantique" />
                                                <RoleChip roleName="Spirituel/le" />
                                            </View>

                                            {/* Types particuliers */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>Types particuliers</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Fictive" />
                                                <RoleChip roleName="Introject" />
                                                <RoleChip roleName="Non-human" />
                                                <RoleChip roleName="Objet" />
                                                <RoleChip roleName="Subsystem" />
                                                <RoleChip roleName="Shell" />
                                            </View>

                                            {/* États du front */}
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: color, marginBottom: spacing.sm }}>États du front</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                <RoleChip roleName="Co-front" />
                                                <RoleChip roleName="Dormant" />
                                            </View>

                                            <View style={{ backgroundColor: colors.backgroundCard, padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md }}>
                                                <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>💡 Appui long sur un rôle pour voir sa définition. Sélectionnez un ou plusieurs rôles puis appuyez sur "Appliquer".</Text>
                                            </View>
                                        </>
                                    );
                                })()}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView >
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
        borderWidth: 3,
        marginBottom: spacing.sm,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
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
    ritualCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ritualHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    ritualTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    ritualSubtitle: {
        fontSize: 12,
        color: colors.success,
        fontWeight: '600',
    },
    ritualDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    ritualButton: {
        backgroundColor: colors.secondary, // Use distinct color for Magic AI
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ritualButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
