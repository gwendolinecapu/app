import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
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

const BUBBLE_SIZE = 85;

export default function DashboardScreen() {
    const { alters, user, refreshAlters, setFronting, activeFront } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('single');
    const [selectedAlters, setSelectedAlters] = useState<string[]>([]);

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

    const toggleSelection = (alterId: string) => {
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
    };

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
        // Long press action? Or specific button
        router.push(`/alter-space/${alter.id}`);
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
                is_host: alters.length === 0,
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

    const renderAlterBubble = (alter: Alter) => {
        const isSelected = selectedAlters.includes(alter.id);
        const showCheck = selectionMode === 'multi' && isSelected;

        return (
            <TouchableOpacity
                key={alter.id}
                style={[styles.bubbleContainer, { opacity: (selectionMode === 'multi' && !isSelected && selectedAlters.length > 0) ? 0.6 : 1 }]}
                onPress={() => toggleSelection(alter.id)}
                onLongPress={() => handleOpenAlterSpace(alter)}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.bubble,
                    { backgroundColor: alter.color },
                    showCheck && styles.bubbleSelected
                ]}>
                    {alter.avatar_url ? (
                        <Image source={{ uri: alter.avatar_url }} style={styles.bubbleImage} />
                    ) : (
                        <Text style={styles.bubbleText}>
                            {alter.name.charAt(0).toUpperCase()}
                        </Text>
                    )}
                    {showCheck && (
                        <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                    )}
                </View>
                <Text style={[styles.bubbleName, isSelected && styles.bubbleNameSelected]} numberOfLines={1}>
                    {alter.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.title}>Qui est là ?</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/settings/' as any)}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

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

            {/* Bubbles Area */}
            <ScrollView
                contentContainerStyle={styles.bubblesArea}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.bubblesGrid}>
                    {/* Blurry Mode Button */}
                    <TouchableOpacity
                        style={styles.bubbleContainer}
                        onPress={handleBlurryMode}
                    >
                        <View style={[styles.bubble, styles.blurryBubble]}>
                            <Text style={styles.blurryIcon}>?</Text>
                        </View>
                        <Text style={styles.bubbleName}>Flou / ?</Text>
                    </TouchableOpacity>

                    {/* Add Button */}
                    <TouchableOpacity
                        style={styles.bubbleContainer}
                        onPress={() => setModalVisible(true)}
                    >
                        <View style={[styles.bubble, styles.addBubble]}>
                            <Text style={styles.addIcon}>+</Text>
                        </View>
                        <Text style={styles.bubbleName}>Nouveau</Text>
                    </TouchableOpacity>

                    {/* Alter Bubbles */}
                    {alters.map(renderAlterBubble)}
                </View>
            </ScrollView>

            {/* Co-Front Floating Action Button */}
            {selectionMode === 'multi' && selectedAlters.length > 0 && (
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fabButton} onPress={handleConfirmCoFront}>
                        <Text style={styles.fabText}>
                            Confirmer ({selectedAlters.length})
                        </Text>
                        <Ionicons name="arrow-forward" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Footer Actions */}
            <View style={styles.footerActions}>
                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={() => router.push('/fronting/history')}
                >
                    <Text style={styles.footerButtonText}>🕒 Historique</Text>
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
                                            <Text>📷</Text>
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
        paddingBottom: spacing.md,
        paddingTop: spacing.md,
    },
    greeting: {
        ...typography.body,
        color: colors.textSecondary,
    },
    title: {
        ...typography.h1,
        color: colors.text,
    },
    settingsIcon: {
        fontSize: 24,
    },
    modeSwitchContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: 4,
        marginBottom: spacing.lg,
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
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
    },
    modeButtonTextActive: {
        color: colors.text,
    },
    bubblesArea: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: 100, // Space for FAB
    },
    bubblesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    bubbleContainer: {
        alignItems: 'center',
        width: BUBBLE_SIZE + 10,
        marginBottom: spacing.md,
    },
    bubble: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        position: 'relative',
    },
    bubbleSelected: {
        borderWidth: 3,
        borderColor: colors.primary,
        transform: [{ scale: 1.05 }],
    },
    checkBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.primary,
        borderRadius: 10,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
    },
    bubbleText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
    },
    bubbleName: {
        ...typography.bodySmall,
        marginTop: spacing.sm,
        textAlign: 'center',
        fontWeight: '600',
    },
    bubbleNameSelected: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    addBubble: {
        backgroundColor: colors.backgroundCard,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    addIcon: {
        fontSize: 36,
        color: colors.textMuted,
    },
    blurryBubble: {
        backgroundColor: colors.backgroundLight,
        borderWidth: 2,
        borderColor: colors.textMuted,
    },
    blurryIcon: {
        fontSize: 36,
        color: colors.textMuted,
        fontWeight: 'bold',
    },
    fabContainer: {
        position: 'absolute',
        bottom: spacing.xxl,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fabButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: spacing.sm,
    },
    footerActions: {
        padding: spacing.md,
        alignItems: 'center',
    },
    footerButton: {
        padding: spacing.sm,
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
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.text,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
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
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
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
        color: colors.text,
        fontWeight: 'bold',
    },
});
