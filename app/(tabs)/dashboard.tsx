import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Dimensions,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { db, storage } from '../../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography, alterColors } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =====================================================
// APPLE WATCH STYLE BUBBLE CONFIGURATION
// Taille DYNAMIQUE basée sur le nombre d'alters :
// - Peu d'alters (< 6) : grandes bulles (80px)
// - Moyen (6-20) : bulles moyennes (64px)  
// - Beaucoup (> 20) : petites bulles (48px)
// Support pour 2000+ alters avec FlatList optimisée
// =====================================================
const CONTAINER_PADDING = 16;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);

// Fonction pour calculer la taille des bulles selon le nombre d'alters
const getBubbleConfig = (alterCount: number) => {
    if (alterCount <= 5) {
        // Peu d'alters : grandes bulles style Apple Watch
        const size = 80;
        const spacing = 20;
        const columns = Math.floor(AVAILABLE_WIDTH / (size + spacing));
        return { size, spacing, columns: Math.max(3, columns) };
    } else if (alterCount <= 20) {
        // Nombre moyen : bulles moyennes
        const size = 64;
        const spacing = 14;
        const columns = Math.floor(AVAILABLE_WIDTH / (size + spacing));
        return { size, spacing, columns: Math.max(4, columns) };
    } else {
        // Beaucoup d'alters : petites bulles compactes
        const size = 48;
        const spacing = 10;
        const columns = Math.floor(AVAILABLE_WIDTH / (size + spacing));
        return { size, spacing, columns: Math.max(5, columns) };
    }
};

// Types pour les items de la grille (bubbles + actions spéciales)
type GridItem =
    | { type: 'blurry' }
    | { type: 'add' }
    | { type: 'alter'; data: Alter };

export default function DashboardScreen() {
    const { alters, user, refreshAlters, setFronting, activeFront } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('single');
    const [selectedAlters, setSelectedAlters] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');


    // Create new alter state
    const [newAlterName, setNewAlterName] = useState('');
    const [newAlterPronouns, setNewAlterPronouns] = useState('');
    const [newAlterBio, setNewAlterBio] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(alterColors[0]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Pre-select currently active alters
        if (activeFront.alters.length > 0) {
            setSelectedAlters(activeFront.alters.map(a => a.id));
            if (activeFront.type === 'co-front') {
                setSelectionMode('multi');
            }
        }
    }, [activeFront]);

    // =====================================================
    // CONFIG DYNAMIQUE DES BULLES
    // Taille calculée selon le nombre d'alters pour un rendu optimal
    // =====================================================
    const bubbleConfig = useMemo(() => getBubbleConfig(alters.length), [alters.length]);
    const { size: BUBBLE_SIZE, spacing: BUBBLE_SPACING, columns: NUM_COLUMNS } = bubbleConfig;

    // =====================================================
    // RECHERCHE ET FILTRAGE
    // Filtrage optimisé pour 2000+ alters avec useMemo
    // =====================================================
    const filteredAlters = useMemo(() => {
        if (!searchQuery.trim()) return alters;
        const query = searchQuery.toLowerCase();
        return alters.filter(alter =>
            alter.name.toLowerCase().includes(query) ||
            alter.pronouns?.toLowerCase().includes(query)
        );
    }, [alters, searchQuery]);

    // =====================================================
    // GRID DATA
    // Combine les boutons spéciaux + alters filtrés pour FlashList
    // =====================================================
    const gridData = useMemo((): GridItem[] => {
        const items: GridItem[] = [
            { type: 'blurry' },
            { type: 'add' },
            ...filteredAlters.map(alter => ({ type: 'alter' as const, data: alter }))
        ];
        return items;
    }, [filteredAlters]);

    const toggleSelection = useCallback((alterId: string) => {
        if (selectionMode === 'single') {
            handleSelectSingle(alterId);
        } else {
            setSelectedAlters(prev => {
                if (prev.includes(alterId)) {
                    return prev.filter(id => id !== alterId);
                } else {
                    return [...prev, alterId];
                }
            });
        }
    }, [selectionMode, alters]);

    const handleSelectSingle = async (alterId: string) => {
        const alter = alters.find(a => a.id === alterId);
        if (alter) {
            await setFronting([alter], 'single');
            router.push('/(tabs)/feed');
        }
    };

    const handleConfirmCoFront = async () => {
        if (selectedAlters.length === 0) return;

        const selectedAlterObjects = alters.filter(a => selectedAlters.includes(a.id));

        if (selectedAlterObjects.length === 1) {
            await setFronting(selectedAlterObjects, 'single');
        } else {
            await setFronting(selectedAlterObjects, 'co-front');
        }
        router.push('/(tabs)/feed');
    };

    const handleBlurryMode = async () => {
        Alert.alert(
            "Mode Flou",
            "Vous allez entrer en tant que système sans alter spécifique défini.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Continuer",
                    onPress: async () => {
                        await setFronting([], 'blurry');
                        router.push('/(tabs)/feed');
                    }
                }
            ]
        );
    };

    const handleOpenAlterSpace = (alter: Alter) => {
        // Navigation vers la page de détail de l'alter (route existante)
        router.push(`/alter/${alter.id}` as any);
    };

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
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleCreateAlter = async () => {
        if (!newAlterName.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }

        if (!user) {
            Alert.alert('Erreur', 'Vous devez être connecté');
            return;
        }

        setLoading(true);
        try {
            let avatarUrl = null;

            if (selectedImage) {
                try {
                    const response = await fetch(selectedImage);
                    const blob = await response.blob();
                    const fileName = `avatars/${user.uid}/${Date.now()}.jpg`;
                    const storageRef = ref(storage, fileName);

                    await uploadBytes(storageRef, blob);
                    avatarUrl = await getDownloadURL(storageRef);
                } catch (uploadErr) {
                    console.log('Image upload failed:', uploadErr);
                }
            }

            const newAlter = {
                system_id: user.uid,
                name: newAlterName.trim(),
                pronouns: newAlterPronouns.trim() || null,
                bio: newAlterBio.trim() || null,
                color: selectedColor,
                avatar_url: avatarUrl,
                // is_host: false par défaut, l'utilisateur peut le définir plus tard
                // L'ancienne logique `alters.length === 0` était bugguée si on créait 2 alters rapidement
                is_host: false,
                is_active: false,
                created_at: new Date().toISOString(),
            };

            await addDoc(collection(db, 'alters'), newAlter);

            await refreshAlters();
            setModalVisible(false);
            resetForm();
            Alert.alert('Succès', `${newAlterName} a été créé !`);
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewAlterName('');
        setNewAlterPronouns('');
        setNewAlterBio('');
        setSelectedColor(alterColors[0]);
        setSelectedImage(null);
    };

    // =====================================================
    // APPLE WATCH STYLE BUBBLE RENDERER
    // Design compact, fluide avec animations subtiles
    // Styles dynamiques calculés via bubbleConfig
    // =====================================================
    const renderBubble = useCallback(({ item, index }: { item: GridItem; index: number }) => {
        // Styles dynamiques basés sur le nombre d'alters
        const dynamicStyles = {
            wrapper: { width: AVAILABLE_WIDTH / NUM_COLUMNS },
            bubble: {
                width: BUBBLE_SIZE,
                height: BUBBLE_SIZE,
                borderRadius: BUBBLE_SIZE / 2
            },
            bubbleName: { maxWidth: BUBBLE_SIZE + 10 },
            iconSize: BUBBLE_SIZE < 60 ? 20 : BUBBLE_SIZE < 70 ? 24 : 28,
            initialFontSize: BUBBLE_SIZE < 60 ? 18 : BUBBLE_SIZE < 70 ? 22 : 28,
        };

        if (item.type === 'blurry') {
            return (
                <TouchableOpacity
                    style={[styles.bubbleWrapper, dynamicStyles.wrapper]}
                    onPress={handleBlurryMode}
                    activeOpacity={0.7}
                >
                    <View style={[styles.bubble, styles.blurryBubble, dynamicStyles.bubble]}>
                        <Ionicons name="help" size={dynamicStyles.iconSize} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.bubbleName, dynamicStyles.bubbleName]} numberOfLines={1}>Flou</Text>
                </TouchableOpacity>
            );
        }

        if (item.type === 'add') {
            return (
                <TouchableOpacity
                    style={[styles.bubbleWrapper, dynamicStyles.wrapper]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.bubble, styles.addBubble, dynamicStyles.bubble]}>
                        <Ionicons name="add" size={dynamicStyles.iconSize + 4} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.bubbleName, dynamicStyles.bubbleName]} numberOfLines={1}>Ajouter</Text>
                </TouchableOpacity>
            );
        }

        // Alter bubble
        const alter = item.data;
        const isSelected = selectedAlters.includes(alter.id);
        const showCheck = selectionMode === 'multi' && isSelected;
        const dimmed = selectionMode === 'multi' && !isSelected && selectedAlters.length > 0;

        return (
            <TouchableOpacity
                style={[styles.bubbleWrapper, dynamicStyles.wrapper, dimmed && styles.bubbleDimmed]}
                onPress={() => toggleSelection(alter.id)}
                onLongPress={() => handleOpenAlterSpace(alter)}
                activeOpacity={0.7}
                delayLongPress={300}
            >
                <View style={[
                    styles.bubble,
                    dynamicStyles.bubble,
                    { backgroundColor: alter.color },
                    isSelected && styles.bubbleSelected
                ]}>
                    {alter.avatar_url ? (
                        <Image source={{ uri: alter.avatar_url }} style={styles.bubbleImage} />
                    ) : (
                        <Text style={[styles.bubbleInitial, { fontSize: dynamicStyles.initialFontSize }]}>
                            {alter.name.charAt(0).toUpperCase()}
                        </Text>
                    )}
                    {/* Checkmark badge pour le mode co-front */}
                    {showCheck && (
                        <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                    )}
                </View>
                <Text
                    style={[styles.bubbleName, dynamicStyles.bubbleName, isSelected && styles.bubbleNameSelected]}
                    numberOfLines={1}
                >
                    {alter.name}
                </Text>
            </TouchableOpacity>
        );
    }, [selectedAlters, selectionMode, alters, toggleSelection, BUBBLE_SIZE, NUM_COLUMNS]);

    // Key extractor pour FlashList (performance optimale)
    const keyExtractor = useCallback((item: GridItem, index: number) => {
        if (item.type === 'blurry') return 'blurry';
        if (item.type === 'add') return 'add';
        return item.data.id;
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.title}>Qui est là ?</Text>
                </View>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/settings/index' as any)}
                >
                    <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Recherche - visible uniquement si beaucoup d'alters */}
            {alters.length > 10 && (
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher un alter..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Mode Switcher */}
            <View style={styles.modeSwitchContainer}>
                <TouchableOpacity
                    style={[styles.modeButton, selectionMode === 'single' && styles.modeButtonActive]}
                    onPress={() => {
                        setSelectionMode('single');
                        setSelectedAlters([]);
                    }}
                >
                    <Text style={[styles.modeButtonText, selectionMode === 'single' && styles.modeButtonTextActive]}>Solo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, selectionMode === 'multi' && styles.modeButtonActive]}
                    onPress={() => setSelectionMode('multi')}
                >
                    <Text style={[styles.modeButtonText, selectionMode === 'multi' && styles.modeButtonTextActive]}>Co-Front</Text>
                </TouchableOpacity>
            </View>

            {/* Compteur d'alters */}
            <View style={styles.alterCountContainer}>
                <Text style={styles.alterCountText}>
                    {filteredAlters.length} alter{filteredAlters.length !== 1 ? 's' : ''}
                    {searchQuery && ` (sur ${alters.length})`}
                </Text>
            </View>

            {/* =====================================================
                APPLE WATCH STYLE GRID
                FlatList optimisée pour performance avec 2000+ alters
                key prop obligatoire pour permettre changement de numColumns
                ===================================================== */}
            <View style={styles.gridContainer}>
                <FlatList
                    key={`grid-${NUM_COLUMNS}`}  // IMPORTANT: permet changement dynamique de numColumns
                    data={gridData}
                    renderItem={renderBubble}
                    keyExtractor={keyExtractor}
                    numColumns={NUM_COLUMNS}
                    contentContainerStyle={styles.gridContent}
                    showsVerticalScrollIndicator={false}
                    // Optimisations pour très grandes listes (2000+ items)
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    initialNumToRender={30}
                    getItemLayout={(data, index) => ({
                        length: BUBBLE_SIZE + 24,
                        offset: (BUBBLE_SIZE + 24) * Math.floor(index / NUM_COLUMNS),
                        index,
                    })}
                />
            </View>

            {/* Co-Front Floating Action Button */}
            {selectionMode === 'multi' && selectedAlters.length > 0 && (
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fabButton} onPress={handleConfirmCoFront}>
                        <Text style={styles.fabText}>
                            Confirmer ({selectedAlters.length})
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Footer Actions */}
            <View style={styles.footerActions}>
                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={() => router.push('/fronting/history')}
                >
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.footerButtonText}>Historique</Text>
                </TouchableOpacity>
            </View>

            {/* Add Alter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '100%' }}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Nouvel Alter</Text>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Avatar Picker */}
                                <View style={styles.avatarPickerContainer}>
                                    <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
                                        {selectedImage ? (
                                            <Image source={{ uri: selectedImage }} style={styles.avatarPreview} />
                                        ) : (
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: selectedColor }]}>
                                                <Text style={styles.avatarPlaceholderText}>
                                                    {newAlterName ? newAlterName.charAt(0).toUpperCase() : '?'}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.cameraIcon}>
                                            <Ionicons name="camera" size={16} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Pseudo *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={newAlterName}
                                        onChangeText={setNewAlterName}
                                        placeholder="Nom de l'alter"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Pronoms</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={newAlterPronouns}
                                        onChangeText={setNewAlterPronouns}
                                        placeholder="elle/lui, iel..."
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Bio</Text>
                                    <TextInput
                                        style={[styles.input, styles.inputMultiline]}
                                        value={newAlterBio}
                                        onChangeText={setNewAlterBio}
                                        placeholder="Description..."
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Couleur</Text>
                                    <View style={styles.colorPicker}>
                                        {alterColors.map((color: string) => (
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
                            </ScrollView>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.createButton, loading && styles.createButtonDisabled]}
                                    onPress={handleCreateAlter}
                                    disabled={loading}
                                >
                                    <Text style={styles.createButtonText}>
                                        {loading ? 'Création...' : 'Créer'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// =====================================================
// STYLES - APPLE WATCH INSPIRED DESIGN
// Bulles compactes, espacement fluide, animations subtiles
// =====================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        paddingTop: spacing.sm,
    },
    greeting: {
        ...typography.body,
        color: colors.textSecondary,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        fontSize: 26,
    },
    settingsButton: {
        padding: spacing.sm,
    },

    // Search bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        padding: 0,
    },

    // Mode switcher
    modeSwitchContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: 3,
        marginBottom: spacing.sm,
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing.xs,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    modeButtonActive: {
        backgroundColor: colors.backgroundCard,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    modeButtonText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textMuted,
        fontSize: 13,
    },
    modeButtonTextActive: {
        color: colors.text,
    },

    // Alter count
    alterCountContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xs,
    },
    alterCountText: {
        ...typography.caption,
        color: colors.textMuted,
    },

    // Grid container
    gridContainer: {
        flex: 1,
        paddingHorizontal: CONTAINER_PADDING,
    },
    gridContent: {
        paddingBottom: 120,
    },

    // Apple Watch style bubbles - width dynamique via inline style
    bubbleWrapper: {
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    bubbleDimmed: {
        opacity: 0.4,
    },
    // bubble: width/height dynamiques via inline style
    bubble: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        // Ombre subtile style Apple
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    bubbleSelected: {
        borderWidth: 2,
        borderColor: colors.primary,
        // Ring glow effect
        shadowColor: colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
    },
    bubbleInitial: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // bubbleName: maxWidth dynamique via inline style
    bubbleName: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '500',
    },
    bubbleNameSelected: {
        color: colors.primary,
        fontWeight: '700',
    },
    checkBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: colors.primary,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },

    // Special bubbles
    addBubble: {
        backgroundColor: colors.backgroundCard,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    blurryBubble: {
        backgroundColor: colors.backgroundLight,
        borderWidth: 1.5,
        borderColor: colors.textMuted,
    },

    // FAB
    fabContainer: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fabButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: spacing.xs,
    },

    // Footer
    footerActions: {
        padding: spacing.sm,
        alignItems: 'center',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
        gap: 4,
    },
    footerButtonText: {
        ...typography.caption,
        color: colors.textSecondary,
    },

    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '85%',
    },
    modalTitle: {
        ...typography.h2,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    avatarPickerContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarPicker: {
        position: 'relative',
    },
    avatarPreview: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.backgroundCard,
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
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputMultiline: {
        height: 80,
        textAlignVertical: 'top',
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    colorOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: 'bold',
    },
    createButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
