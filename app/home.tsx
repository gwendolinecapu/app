import React from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { Alter } from '../src/types';
import { colors, spacing, borderRadius, typography, alterColors } from '../src/lib/theme';

const BUBBLE_SIZE = 85;

export default function HomeScreen() {
    const { alters, user, refreshAlters } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [newAlterName, setNewAlterName] = useState('');
    const [newAlterPronouns, setNewAlterPronouns] = useState('');
    const [newAlterBio, setNewAlterBio] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(alterColors[0]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleOpenAlterSpace = (alter: Alter) => {
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
                    const fileName = `${user.id}/${Date.now()}.jpg`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, blob, {
                            contentType: 'image/jpeg',
                        });

                    if (uploadError) {
                        console.log('Upload error:', uploadError);
                    } else if (uploadData) {
                        const { data: urlData } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(uploadData.path);
                        avatarUrl = urlData.publicUrl;
                    }
                } catch (uploadErr) {
                    console.log('Image upload failed:', uploadErr);
                }
            }

            const { error } = await supabase.from('alters').insert({
                system_id: user.id,
                name: newAlterName.trim(),
                pronouns: newAlterPronouns.trim() || null,
                bio: newAlterBio.trim() || null,
                color: selectedColor,
                avatar_url: avatarUrl,
                is_host: alters.length === 0,
                is_active: false,
            });

            if (error) throw error;

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

    const renderAlterBubble = (alter: Alter) => (
        <TouchableOpacity
            key={alter.id}
            style={styles.bubbleContainer}
            onPress={() => handleOpenAlterSpace(alter)}
            activeOpacity={0.8}
        >
            <View style={[styles.bubble, { backgroundColor: alter.color }]}>
                {alter.avatar_url ? (
                    <Image source={{ uri: alter.avatar_url }} style={styles.bubbleImage} />
                ) : (
                    <Text style={styles.bubbleText}>
                        {alter.name.charAt(0).toUpperCase()}
                    </Text>
                )}
            </View>
            <Text style={styles.bubbleName} numberOfLines={1}>
                {alter.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header minimal */}
            <View style={styles.header}>
                <Text style={styles.logo}>PluralConnect</Text>
                <TouchableOpacity onPress={() => router.push('/settings')}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Bubbles Area */}
            <ScrollView
                contentContainerStyle={styles.bubblesArea}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>Choisissez un profil</Text>

                <View style={styles.bubblesGrid}>
                    {/* Add Button */}
                    <TouchableOpacity
                        style={styles.bubbleContainer}
                        onPress={() => setModalVisible(true)}
                    >
                        <View style={[styles.bubble, styles.addBubble]}>
                            <Text style={styles.addIcon}>+</Text>
                        </View>
                        <Text style={styles.bubbleName}>Ajouter</Text>
                    </TouchableOpacity>

                    {/* Alter Bubbles */}
                    {alters.map(renderAlterBubble)}
                </View>
            </ScrollView>

            {/* Add Alter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
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
    },
    logo: {
        ...typography.h1,
        color: colors.primary,
        fontSize: 24,
    },
    settingsIcon: {
        fontSize: 24,
    },
    bubblesArea: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
    },
    subtitle: {
        ...typography.h3,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    bubblesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    bubbleContainer: {
        alignItems: 'center',
        width: BUBBLE_SIZE + 20,
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
