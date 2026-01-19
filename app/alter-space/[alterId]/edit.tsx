
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
import { Alter, Role } from '../../../src/types';
import { alterColors, freeAlterColors, premiumAlterColors, colors, spacing, borderRadius, typography } from '../../../src/lib/theme';
import PremiumService from '../../../src/services/PremiumService';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getFrameStyle, getThemeColors } from '../../../src/lib/cosmetics';
import { RoleService } from '../../../src/services/RoleService';

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

    // System Categories (from /categories screen)
    const [systemCategories, setSystemCategories] = useState<Role[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);



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

    // Fetch system categories
    const fetchSystemCategories = async () => {
        if (!user?.uid) return;
        setLoadingCategories(true);
        try {
            const categories = await RoleService.fetchRoles(user.uid);
            setSystemCategories(categories);
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        fetchSystemCategories();
    }, [user?.uid]);

    // Set selectedCategoryIds when alter is loaded
    useEffect(() => {
        if (initialAlter?.role_ids) {
            setSelectedCategoryIds(initialAlter.role_ids);
        }
    }, [initialAlter]);

    // Toggle category selection
    const toggleCategorySelection = (categoryId: string) => {
        setSelectedCategoryIds(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    // Role definitions for long press - detailed explanations
    const roleDefinitions: Record<string, string> = {
        // Protection
        'Protecteur': 'Rôle de défense du système. Intervient pour protéger le corps ou les autres alters contre des situations perçues comme dangereuses ou menaçantes.',
        'Protecteur émotionnel': 'Spécialisé dans la gestion des émotions intenses. Peut "absorber" ou bloquer les émotions trop fortes pour protéger le système du surmenage émotionnel.',
        'Protecteur physique': 'Prend le contrôle lors de situations de danger physique. Souvent plus résistant à la douleur et capable de réagir rapidement en cas d\'urgence.',
        'Gatekeeper': 'Le "gardien des portes" du système. Contrôle qui peut fronter, quand, et gère l\'accès aux souvenirs (parfois traumatiques) pour protéger le système.',
        'Guardian': 'Veille sur l\'ensemble du système de manière générale. Moins spécialisé que le protecteur, il surveille le bien-être global.',
        // Persécuteurs & Antagonistes
        'Persecutor': 'Alter qui semble nuisible mais dont les actions viennent souvent d\'une volonté de protéger à sa manière (contrôle par la peur). Peut reproduire des comportements d\'agresseurs passés.',
        'Avenger': 'Le "vengeur" du système. Réagit avec colère face aux injustices ou abus. Peut vouloir se venger des responsables extérieurs.',
        'Protecteur-Persécuteur': 'Alter hybride qui cherche à protéger le système mais utilise pour cela des méthodes agressives, punitives ou nuisibles car il pense que c\'est la seule façon efficace.',
        'Introject Persécuteur': 'Basé sur une figure abusive passée (réelle ou perçue). Il peut reproduire les comportements, paroles ou menaces de l\'abuseur, souvent par mimétisme traumatique.',
        'Destructeur': 'Adopte des comportements autodestructeurs ou dangereux pour le corps/système. Souvent lié à une souffrance intense, un programme ou des croyances négatives profondes.',
        'Saboteur': 'Entrave les efforts du système (thérapie, relations, travail, bonheur). Agit souvent par peur du changement, de l\'échec ou pour maintenir le statu quo connu.',
        'Punisseur': 'Inflige des punitions internes (douleur, insultes) ou externes aux autres alters lorsqu\'ils enfreignent des règles. Cherche souvent à "discipliner" pour éviter une punition extérieure pire.',
        // Gestion
        'Hôte': 'L\'alter principal qui gère la vie quotidienne la majorité du temps. C\'est souvent celui qui interagit le plus avec le monde extérieur.',
        'Co-hôte': 'Partage les responsabilités de l\'hôte. Peut alterner avec l\'hôte principal ou fronter régulièrement pour partager la charge du quotidien.',
        'Manager': 'Responsable de la planification et de l\'organisation. Prend des décisions importantes et structure la vie du système.',
        'Caretaker': 'Le "soignant" du système. Prend soin des autres alters, notamment des plus vulnérables (littles). S\'assure que tout le monde va bien.',
        'ISH': 'Internal Self Helper - Un alter très conscient du fonctionnement du système. Sert de guide interne et peut aider à la communication entre alters.',
        'Mediator': 'Gère les conflits internes entre alters. Aide à trouver des compromis et maintient l\'harmonie dans le système.',
        'Archiviste': 'Garde et organise les souvenirs du système. Peut avoir accès à plus de mémoires que les autres alters.',
        'Organisateur': 'Se concentre sur l\'organisation pratique : emploi du temps, tâches à faire, gestion des responsabilités quotidiennes.',
        'Core': 'Le "noyau" ou alter original du système. Pas toujours présent ou identifiable dans tous les systèmes. Représente parfois l\'identité d\'origine.',
        // Enfance
        'Little': 'Alter enfant, généralement perçu comme ayant moins de 12 ans. Peut garder l\'innocence, la curiosité, ou les traumatismes de l\'enfance.',
        'Middle': 'Alter préadolescent (environ 9-12 ans). Entre l\'enfance et l\'adolescence, avec des caractéristiques des deux périodes.',
        'Teen': 'Alter adolescent (13-17 ans). Peut gérer des situations que les littles ne peuvent pas, tout en ayant des besoins différents des adultes.',
        'Age slider': 'Alter dont l\'âge perçu varie selon les situations ou le temps. Peut être enfant un jour et adulte un autre.',
        'Regressor': 'Alter qui peut "régresser" vers un état plus jeune, souvent en réponse au stress ou au besoin de réconfort.',
        // Traumatismes
        'Trauma holder': 'Porte les souvenirs traumatiques pour protéger les autres alters. Peut avoir des flashbacks ou des réactions liées aux traumas.',
        'Emotional holder': 'Porte des émotions spécifiques (tristesse, colère, honte...) pour que les autres alters puissent fonctionner sans être submergés.',
        'Pain holder': 'Porte la douleur physique ou émotionnelle. Peut ressentir plus de douleur que les autres mais les protège ainsi.',
        'Fear holder': 'Spécialisé dans le port de la peur et de l\'anxiété. Permet aux autres alters de fonctionner sans être paralysés par la peur.',
        'Memory holder': 'Garde des souvenirs spécifiques, pas forcément traumatiques. Peut être le seul à se souvenir de certains événements.',
        'Fragment': 'Un alter très limité, souvent créé pour une fonction ou un souvenir très spécifique. Peut n\'avoir qu\'une personnalité partielle.',
        // Sociaux & Créatifs
        'Social alter': 'Spécialisé dans les interactions sociales. Gère les conversations, les relations, et peut être très à l\'aise en société.',
        'Mask': 'Alter créé pour "faire semblant que tout va bien". Permet au système de fonctionner socialement même quand ça ne va pas.',
        'Entertainer': 'Apporte humour, joie et divertissement. Peut alléger l\'atmosphère et aider le système à se détendre.',
        'Animateur/trice': 'Anime les situations, apporte de l\'énergie positive. Aime divertir et faire rire les autres.',
        'Artist': 'Création artistique',
        'Artiste': 'Alter créatif, s\'exprime à travers l\'art (dessin, peinture, écriture, musique...). La création peut être un exutoire important.',
        'Communicator': 'Parle pour le système',
        'Communicateur/trice': 'Gère la communication interne et externe. Peut exprimer ce que les autres alters n\'arrivent pas à dire.',
        'Performer': 'S\'exprime à travers la performance : danse, musique, théâtre, sport. Aime être sur scène ou montrer ses talents.',
        // Spécialisés
        'Worker': 'Gère le travail et les études',
        'Travailleur/se': 'Spécialisé dans le travail et la vie professionnelle. Compétent et concentré sur les tâches à accomplir.',
        'Student': 'Spécialisé dans l\'apprentissage',
        'Étudiant(e)': 'Se concentre sur les études et l\'apprentissage. Aime apprendre de nouvelles choses.',
        'Sexual alter': 'Gère la sexualité et l\'intimité du système. Peut aussi être un mécanisme de protection suite à des traumas sexuels.',
        'Romantic': 'Gère les relations amoureuses',
        'Romantique': 'Gère les relations affectives et romantiques. Ressent et exprime l\'amour et l\'attachement.',
        'Spiritual': 'Spiritualité et croyances',
        'Spirituel/le': 'Connecté à la spiritualité, la religion ou les croyances du système. Peut apporter sens et guidance.',
        'Somatic': 'Particulièrement connecté au corps et aux sensations physiques. Peut être le seul à ressentir certaines sensations.',
        // Types particuliers
        'Fictive': 'Alter basé sur un personnage fictif (de film, livre, jeu vidéo, série...). A l\'apparence et parfois la personnalité du personnage.',
        'Factive': 'Alter basé sur une personne réelle célèbre ou publique. N\'est pas cette personne mais en a des caractéristiques.',
        'Introject': 'Alter basé sur une personne réelle connue personnellement (famille, ami, agresseur...). Créé pour diverses raisons.',
        'Non-human': 'Alter qui ne s\'identifie pas comme humain : animal, créature mythique, robot, entité abstraite...',
        'Therian': 'S\'identifie spécifiquement comme un animal ou une créature. Peut avoir des instincts ou comportements liés à cet animal.',
        'Object': 'Alter objet',
        'Objet': 'Alter qui s\'identifie comme un objet (peluche, outil, etc.). Plus rare mais valide.',
        'Subsystem': 'Un système dans le système. Le subsystem contient lui-même plusieurs alters interconnectés.',
        'Shell': 'Alter avec une présence minimale, parfois "vide". Peut être utilisé pour masquer que quelqu\'un est front.',
        // États du front
        'Fronting': 'L\'alter qui contrôle actuellement le corps. Peut changer fréquemment ou rester stable longtemps.',
        'Co-front': 'Situation où plusieurs alters sont présents au front simultanément, partageant le contrôle à des degrés divers.',
        'Observer': 'Alter qui observe ce qui se passe sans prendre le contrôle. Peut être conscient de l\'extérieur sans pouvoir agir.',
        'Dormant': 'Alter actuellement inactif, parfois depuis longtemps. Peut se "réveiller" plus tard.',
        'Unknown': 'Pour les alters dont le rôle n\'est pas encore connu ou défini. Parfaitement valide !'
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
                role_ids: selectedCategoryIds, // System categories
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

    // Get theme colors for the alter
    const themeColors = getThemeColors(initialAlter?.equipped_items?.theme);
    const bgColor = themeColors?.background || colors.background;
    const textColor = themeColors?.text || colors.text;
    const textSecondaryColor = themeColors?.textSecondary || colors.textSecondary;
    const cardBg = themeColors?.backgroundCard || colors.backgroundCard;
    const borderColor = themeColors?.border || colors.border;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: bgColor }]}
        >
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Modifier le profil</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color={textColor} />
                    ) : (
                        <Ionicons name="checkmark" size={28} color={textColor} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ==================== IDENTITY SECTION ==================== */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color={color} />
                    <Text style={[styles.sectionHeaderText, { color: textColor }]}>Identité</Text>
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
                        <Text style={[styles.changePhotoText, { color: color }]}>Changer de photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Nom</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: cardBg, color: textColor, borderColor: borderColor }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nom de l'alter"
                            placeholderTextColor={textSecondaryColor}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Pronoms</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: cardBg, color: textColor, borderColor: borderColor }]}
                            value={pronouns}
                            onChangeText={setPronouns}
                            placeholder="Ex: iel/ellui"
                            placeholderTextColor={textSecondaryColor}
                        />
                    </View>

                    {/* RÔLE MAJEUR */}
                    <View style={styles.formGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.label, { color: textSecondaryColor }]}>RÔLE MAJEUR</Text>
                            <TouchableOpacity
                                onPress={() => setShowMajorRoleModal(true)}
                                style={{ marginLeft: 6, padding: 2 }}
                            >
                                <Ionicons name="information-circle-outline" size={18} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { backgroundColor: cardBg, color: textColor, borderColor: borderColor }]}
                            value={majorRole}
                            onChangeText={setMajorRole}
                            placeholder="Ex: Hôte, Protecteur..."
                            placeholderTextColor={textSecondaryColor}
                        />
                    </View>

                    {/* RÔLES SECONDAIRES */}
                    <View style={styles.formGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.label, { color: textSecondaryColor }]}>RÔLES</Text>
                            <TouchableOpacity
                                onPress={() => setShowRoleInfoModal(true)}
                                style={{ marginLeft: 6, padding: 2 }}
                            >
                                <Ionicons name="information-circle-outline" size={18} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, { backgroundColor: cardBg, color: textColor, borderColor: borderColor }]}
                            value={role}
                            onChangeText={setRole}
                            placeholder="Ex: Artiste, Non-human..."
                            placeholderTextColor={textSecondaryColor}
                        />
                    </View>

                    {/* Date Fields */}
                    <View style={styles.dateRow}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                            <Text style={[styles.label, { color: textSecondaryColor }]}>Date de naissance</Text>
                            <TouchableOpacity
                                style={[styles.dateInput, { backgroundColor: cardBg, borderColor: borderColor }]}
                                onPress={() => setShowBirthPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={textSecondaryColor} />
                                <Text style={[styles.dateText, { color: birthDate ? textColor : textSecondaryColor }]}>
                                    {birthDate ? birthDate.toLocaleDateString() : 'Sélectionner'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                            <Text style={[styles.label, { color: textSecondaryColor }]}>Date d&apos;arrivée</Text>
                            <TouchableOpacity
                                style={[styles.dateInput, { backgroundColor: cardBg, borderColor: borderColor }]}
                                onPress={() => setShowArrivalPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={textSecondaryColor} />
                                <Text style={[styles.dateText, { color: arrivalDate ? textColor : textSecondaryColor }]}>
                                    {arrivalDate ? arrivalDate.toLocaleDateString() : 'Sélectionner'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: cardBg, color: textColor, borderColor: borderColor }]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Une courte description..."
                            placeholderTextColor={textSecondaryColor}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </View>

                {/* ==================== SYSTEM CATEGORIES SECTION ==================== */}
                {systemCategories.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
                            <Ionicons name="pricetags-outline" size={20} color={color} />
                            <Text style={[styles.sectionHeaderText, { color: textColor }]}>Catégories Système</Text>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={[styles.label, { color: textSecondaryColor, marginBottom: spacing.sm }]}>
                                Sélectionnez les catégories pour cet alter
                            </Text>
                            <View style={styles.categoryGrid}>
                                {systemCategories.map((cat) => {
                                    const isSelected = selectedCategoryIds.includes(cat.id);
                                    return (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryChip,
                                                {
                                                    backgroundColor: isSelected ? cat.color : cardBg,
                                                    borderColor: isSelected ? cat.color : borderColor,
                                                }
                                            ]}
                                            onPress={() => toggleCategorySelection(cat.id)}
                                        >
                                            <Text style={[
                                                styles.categoryChipText,
                                                { color: isSelected ? 'white' : textColor }
                                            ]}>
                                                {cat.name}
                                            </Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginLeft: 4 }} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <TouchableOpacity
                                style={styles.manageCategoriesLink}
                                onPress={() => router.push('/categories')}
                            >
                                <Ionicons name="settings-outline" size={14} color={colors.primary} />
                                <Text style={styles.manageCategoriesText}>Gérer les catégories</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />

                {/* ==================== APPEARANCE SECTION ==================== */}
                <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
                    <Ionicons name="color-palette-outline" size={20} color={color} />
                    <Text style={[styles.sectionHeaderText, { color: textColor }]}>Apparence & Cosmétiques</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Couleur thématique</Text>

                        <View style={styles.colorGrid}>
                            {freeAlterColors.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: c, borderWidth: c === '#FFFFFF' ? 1 : 0, borderColor: borderColor },
                                        color === c && styles.colorCircleSelected
                                    ]}
                                    onPress={() => setColor(c)}
                                >
                                    {color === c && <Ionicons name="checkmark" size={18} color="white" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.colorSubLabel, { marginTop: spacing.md, color: textSecondaryColor }]}>
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
                {(() => {
                    const themeColors = getThemeColors(initialAlter?.equipped_items?.theme);
                    const modalBg = themeColors?.background || colors.backgroundCard;
                    const modalText = themeColors?.text || colors.text;
                    const modalTextSecondary = themeColors?.textSecondary || colors.textSecondary;
                    const chipBg = themeColors?.backgroundCard || colors.backgroundCard;
                    const chipBorder = themeColors?.border || colors.border;

                    return (
                        <Modal visible={showMajorRoleModal} transparent animationType="fade">
                            <View style={styles.modalOverlay}>
                                <View style={[styles.datePickerContainer, { maxHeight: '80%', backgroundColor: modalBg }]}>
                                    <View style={[styles.datePickerHeader, { borderBottomColor: chipBorder }]}>
                                        <Text style={[styles.datePickerTitle, { color: modalText }]}>Sélectionner un rôle majeur</Text>
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
                                                            backgroundColor: isSelected ? (themeColors?.primary || colors.primary) : chipBg,
                                                            paddingHorizontal: spacing.md,
                                                            paddingVertical: spacing.sm,
                                                            borderRadius: borderRadius.lg,
                                                            marginRight: spacing.xs,
                                                            marginBottom: spacing.xs,
                                                            borderWidth: 1,
                                                            borderColor: isSelected ? (themeColors?.primary || colors.primary) : chipBorder
                                                        }}
                                                    >
                                                        <Text style={{
                                                            fontSize: 14,
                                                            fontWeight: isSelected ? '600' : '500',
                                                            color: isSelected ? '#FFFFFF' : modalText
                                                        }}>{roleName}</Text>
                                                    </TouchableOpacity>
                                                );
                                            };

                                            return (
                                                <>
                                                    {/* Protection */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🛡️ Protection</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <MajorRoleChip roleName="Protecteur" />
                                                        <MajorRoleChip roleName="Protecteur émotionnel" />
                                                        <MajorRoleChip roleName="Protecteur physique" />
                                                        <MajorRoleChip roleName="Gatekeeper" />
                                                        <MajorRoleChip roleName="Guardian" />
                                                    </View>

                                                    {/* Persécuteurs */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🌑 Persécuteurs & Antagonistes</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <MajorRoleChip roleName="Persecutor" />
                                                        <MajorRoleChip roleName="Avenger" />
                                                        <MajorRoleChip roleName="Protecteur-Persécuteur" />
                                                        <MajorRoleChip roleName="Introject Persécuteur" />
                                                        <MajorRoleChip roleName="Saboteur" />
                                                        <MajorRoleChip roleName="Destructeur" />
                                                        <MajorRoleChip roleName="Punisseur" />
                                                    </View>

                                                    {/* Gestion */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>💼 Gestion</Text>
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
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>👶 Enfance</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <MajorRoleChip roleName="Little" />
                                                        <MajorRoleChip roleName="Middle" />
                                                        <MajorRoleChip roleName="Teen" />
                                                        <MajorRoleChip roleName="Age slider" />
                                                        <MajorRoleChip roleName="Regressor" />
                                                    </View>

                                                    {/* Traumatismes */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>💔 Traumatismes</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <MajorRoleChip roleName="Trauma holder" />
                                                        <MajorRoleChip roleName="Emotional holder" />
                                                        <MajorRoleChip roleName="Pain holder" />
                                                        <MajorRoleChip roleName="Fear holder" />
                                                        <MajorRoleChip roleName="Memory holder" />
                                                        <MajorRoleChip roleName="Fragment" />
                                                    </View>

                                                    {/* Sociaux */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🎭 Sociaux & Créatifs</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <MajorRoleChip roleName="Social alter" />
                                                        <MajorRoleChip roleName="Mask" />
                                                        <MajorRoleChip roleName="Animateur/trice" />
                                                        <MajorRoleChip roleName="Artiste" />
                                                        <MajorRoleChip roleName="Communicateur/trice" />
                                                        <MajorRoleChip roleName="Performer" />
                                                    </View>

                                                    {/* Spécialisés */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>⚙️ Spécialisés</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <MajorRoleChip roleName="Travailleur/se" />
                                                        <MajorRoleChip roleName="Étudiant(e)" />
                                                        <MajorRoleChip roleName="Sexual alter" />
                                                        <MajorRoleChip roleName="Romantique" />
                                                        <MajorRoleChip roleName="Spirituel/le" />
                                                        <MajorRoleChip roleName="Somatic" />
                                                    </View>

                                                    {/* Types particuliers */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>✨ Types particuliers</Text>
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
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🔄 États du front</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <MajorRoleChip roleName="Fronting" />
                                                        <MajorRoleChip roleName="Co-front" />
                                                        <MajorRoleChip roleName="Observer" />
                                                        <MajorRoleChip roleName="Dormant" />
                                                        <MajorRoleChip roleName="Unknown" />
                                                    </View>

                                                    <View style={{ backgroundColor: chipBg, padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md }}>
                                                        <Text style={{ fontSize: 12, color: modalTextSecondary, fontStyle: 'italic' }}>💡 Ces rôles sont indicatifs ! Vous pouvez sélectionner ici OU écrire vos propres rôles dans le champ. Appui long pour voir la définition détaillée.</Text>
                                                    </View>
                                                </>
                                            );
                                        })()}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>
                    );
                })()}

                {/* Role Info Modal */}
                {(() => {
                    const themeColors = getThemeColors(initialAlter?.equipped_items?.theme);
                    const modalBg = themeColors?.background || colors.backgroundCard;
                    const modalText = themeColors?.text || colors.text;
                    const modalTextSecondary = themeColors?.textSecondary || colors.textSecondary;
                    const chipBg = themeColors?.backgroundCard || colors.backgroundCard;
                    const chipBorder = themeColors?.border || colors.border;

                    return (
                        <Modal visible={showRoleInfoModal} transparent animationType="fade">
                            <View style={styles.modalOverlay}>
                                <View style={[styles.datePickerContainer, { maxHeight: '80%', backgroundColor: modalBg }]}>
                                    <View style={[styles.datePickerHeader, { borderBottomColor: chipBorder }]}>
                                        <Text style={[styles.datePickerTitle, { color: modalText }]}>Sélectionner des rôles</Text>
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
                                                            backgroundColor: isSelected ? (themeColors?.primary || colors.primary) : chipBg,
                                                            paddingHorizontal: spacing.md,
                                                            paddingVertical: spacing.sm,
                                                            borderRadius: borderRadius.lg,
                                                            marginRight: spacing.xs,
                                                            marginBottom: spacing.xs,
                                                            borderWidth: 1,
                                                            borderColor: isSelected ? (themeColors?.primary || colors.primary) : chipBorder
                                                        }}
                                                    >
                                                        <Text style={{
                                                            fontSize: 14,
                                                            fontWeight: isSelected ? '600' : '500',
                                                            color: isSelected ? '#FFFFFF' : modalText
                                                        }}>{roleName}</Text>
                                                    </TouchableOpacity>
                                                );
                                            };

                                            return (
                                                <>
                                                    {/* Protection */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🛡️ Protection</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Protecteur" />
                                                        <RoleChip roleName="Protecteur émotionnel" />
                                                        <RoleChip roleName="Protecteur physique" />
                                                        <RoleChip roleName="Gatekeeper" />
                                                        <RoleChip roleName="Guardian" />
                                                    </View>

                                                    {/* Persécuteurs */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🌑 Persécuteurs & Antagonistes</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Persecutor" />
                                                        <RoleChip roleName="Avenger" />
                                                        <RoleChip roleName="Protecteur-Persécuteur" />
                                                        <RoleChip roleName="Introject Persécuteur" />
                                                        <RoleChip roleName="Saboteur" />
                                                        <RoleChip roleName="Destructeur" />
                                                        <RoleChip roleName="Punisseur" />
                                                    </View>

                                                    {/* Gestion */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>💼 Gestion</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Hôte" />
                                                        <RoleChip roleName="Co-hôte" />
                                                        <RoleChip roleName="Manager" />
                                                        <RoleChip roleName="Caretaker" />
                                                        <RoleChip roleName="ISH" />
                                                        <RoleChip roleName="Mediator" />
                                                        <RoleChip roleName="Archiviste" />
                                                        <RoleChip roleName="Organisateur" />
                                                        <RoleChip roleName="Core" />
                                                    </View>

                                                    {/* Enfance */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>👶 Enfance</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Little" />
                                                        <RoleChip roleName="Middle" />
                                                        <RoleChip roleName="Teen" />
                                                        <RoleChip roleName="Age slider" />
                                                        <RoleChip roleName="Regressor" />
                                                    </View>

                                                    {/* Traumatismes */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>💔 Traumatismes</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Trauma holder" />
                                                        <RoleChip roleName="Emotional holder" />
                                                        <RoleChip roleName="Pain holder" />
                                                        <RoleChip roleName="Fear holder" />
                                                        <RoleChip roleName="Memory holder" />
                                                        <RoleChip roleName="Fragment" />
                                                    </View>

                                                    {/* Sociaux */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🎭 Sociaux & Créatifs</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Social alter" />
                                                        <RoleChip roleName="Mask" />
                                                        <RoleChip roleName="Animateur/trice" />
                                                        <RoleChip roleName="Artiste" />
                                                        <RoleChip roleName="Communicateur/trice" />
                                                        <RoleChip roleName="Performer" />
                                                    </View>

                                                    {/* Spécialisés */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>⚙️ Spécialisés</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Travailleur/se" />
                                                        <RoleChip roleName="Étudiant(e)" />
                                                        <RoleChip roleName="Sexual alter" />
                                                        <RoleChip roleName="Romantique" />
                                                        <RoleChip roleName="Spirituel/le" />
                                                        <RoleChip roleName="Somatic" />
                                                    </View>

                                                    {/* Types particuliers */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>✨ Types particuliers</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Fictive" />
                                                        <RoleChip roleName="Factive" />
                                                        <RoleChip roleName="Introject" />
                                                        <RoleChip roleName="Non-human" />
                                                        <RoleChip roleName="Therian" />
                                                        <RoleChip roleName="Objet" />
                                                        <RoleChip roleName="Subsystem" />
                                                        <RoleChip roleName="Shell" />
                                                    </View>

                                                    {/* États du front */}
                                                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: modalText, marginBottom: spacing.sm }}>🔄 États du front</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg }}>
                                                        <RoleChip roleName="Fronting" />
                                                        <RoleChip roleName="Co-front" />
                                                        <RoleChip roleName="Observer" />
                                                        <RoleChip roleName="Dormant" />
                                                        <RoleChip roleName="Unknown" />
                                                    </View>


                                                    <View style={{ backgroundColor: chipBg, padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md }}>
                                                        <Text style={{ fontSize: 12, color: modalTextSecondary, fontStyle: 'italic' }}>💡 Cette liste est pour vous inspirer ! Vous pouvez choisir ici, écrire vos propres rôles, ou les deux. Appui long sur un rôle pour sa définition détaillée.</Text>
                                                    </View>
                                                </>
                                            );
                                        })()}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>
                    );
                })()}
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
        borderRadius: 50,
        marginBottom: spacing.sm,
        position: 'relative',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
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
    // Category styles
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    manageCategoriesLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: spacing.xs,
    },
    manageCategoriesText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '500',
    },
});
