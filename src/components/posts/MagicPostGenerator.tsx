import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { functions, storage } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Alter } from '../../types';

interface MagicPostGeneratorProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (imageUri: string) => void;
    alters: Alter[];
    activeAlterId?: string;
}

type QualityTier = 'eco' | 'mid' | 'high';

import { AI_COSTS } from '../../services/MonetizationTypes';

const QUALITY_INFO = {
    eco: { name: 'Éco', cost: AI_COSTS.GEN_ECO, desc: 'Rapide & Efficace.', model: 'Gemini 2.5 Flash + Imagen 3' },
    mid: { name: 'Standard', cost: AI_COSTS.GEN_STANDARD, desc: 'Équilibré.', model: 'Nano Banana 2.5 Flash' },
    high: { name: 'Pro', cost: AI_COSTS.GEN_PRO, desc: 'Haute fidélité.', model: 'Nano Banana 3 Pro' }
};

export const MagicPostGenerator: React.FC<MagicPostGeneratorProps> = ({
    visible,
    onClose,
    onSuccess,
    alters,
    activeAlterId
}) => {
    // Filter alters with DNA
    const magicAlters = alters.filter(a => a.visual_dna?.is_ready);

    const [selectedAlterId, setSelectedAlterId] = useState<string>(
        (activeAlterId && magicAlters.find(a => a.id === activeAlterId)) ? activeAlterId : (magicAlters[0]?.id || '')
    );
    const [prompt, setPrompt] = useState('');
    const [quality, setQuality] = useState<QualityTier>('mid');
    const [sceneImageUri, setSceneImageUri] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Helpers
    const getBlobFromUri = async (uri: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () { resolve(xhr.response); };
            xhr.onerror = function (e) { reject(new TypeError("Network request failed")); };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });
    };

    const pickSceneImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSceneImageUri(result.assets[0].uri);
        }
    };

    const handleGenerate = async () => {
        if (!selectedAlterId) return Alert.alert("Erreur", "Sélectionnez un alter avec ADN Visuel.");
        if (!prompt && !sceneImageUri) return Alert.alert("Erreur", "Décrivez la scène ou ajoutez une image.");

        setIsGenerating(true);
        try {
            let uploadedSceneUrl = undefined;
            if (sceneImageUri) {
                // Upload scene/body reference
                const blob = await getBlobFromUri(sceneImageUri) as any;
                const path = `magic_uploads/${selectedAlterId}/${Date.now()}_scene.jpg`;
                const sRef = ref(storage, path);
                await uploadBytes(sRef, blob);
                uploadedSceneUrl = await getDownloadURL(sRef);
                blob.close && blob.close();
            }

            const generateMagicPost = httpsCallable(functions, 'generateMagicPost');
            const result: any = await generateMagicPost({
                alterId: selectedAlterId,
                prompt: prompt,
                quality: quality,
                sceneImageUrl: uploadedSceneUrl,
                isBodySwap: !!sceneImageUri // Simplistic toggle: if image provided, treat as body swap/incrustation context
            });

            if (result.data.success && result.data.imageUrl) {
                setGeneratedImage(result.data.imageUrl);
            } else {
                throw new Error(result.data.error || "Génération échouée");
            }

        } catch (err: any) {
            console.error("Magic Gen Error:", err);
            Alert.alert("Erreur", err.message || "Impossible de générer l'image.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        if (generatedImage) {
            onSuccess(generatedImage);
            reset();
        }
    };

    const reset = () => {
        setGeneratedImage(null);
        setPrompt('');
        setSceneImageUri(null);
        // Don't close here, caller handles close
    };

    // If no alters have DNA
    if (visible && magicAlters.length === 0) {
        return (
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Ionicons name="alert-circle" size={48} color={colors.textSecondary} />
                        <Text style={styles.modalTitle}>Rituel Requis</Text>
                        <Text style={styles.modalText}>
                            Aucun de vos alters ne possède d&apos;ADN Visuel. Effectuez le &quot;Rituel de Naissance&quot; dans l&apos;édition de profil d&apos;un alter pour activer la Magie IA.
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Compris</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Magie IA ✨</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* RESULT PREVIEW */}
                    {generatedImage ? (
                        <View style={styles.resultContainer}>
                            <Image source={{ uri: generatedImage }} style={styles.resultImage} />
                            <View style={styles.resultActions}>
                                <TouchableOpacity style={styles.retryButton} onPress={() => setGeneratedImage(null)}>
                                    <Ionicons name="refresh" size={20} color={colors.text} />
                                    <Text style={styles.retryText}>Refaire</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                                    <Ionicons name="checkmark" size={20} color="white" />
                                    <Text style={styles.confirmText}>Utiliser ce post</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            {/* 1. SELECT ALTER */}
                            <Text style={styles.label}>Alter (Source ADN)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alterList}>
                                {magicAlters.map(alter => (
                                    <TouchableOpacity
                                        key={alter.id}
                                        style={[styles.alterChip, selectedAlterId === alter.id && styles.alterChipSelected]}
                                        onPress={() => setSelectedAlterId(alter.id)}
                                    >
                                        <Image
                                            source={{ uri: alter.avatar_url || 'https://via.placeholder.com/40' }}
                                            style={[styles.alterAvatar, { borderColor: alter.color || colors.primary }]}
                                        />
                                        <Text style={[styles.alterName, selectedAlterId === alter.id && styles.alterNameSelected]}>
                                            {alter.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* 2. QUALITY TIER */}
                            <Text style={styles.label}>Qualité & Coût</Text>
                            <View style={styles.qualityContainer}>
                                {(['eco', 'mid', 'high'] as QualityTier[]).map(q => (
                                    <TouchableOpacity
                                        key={q}
                                        style={[styles.qualityOption, quality === q && styles.qualityOptionSelected]}
                                        onPress={() => setQuality(q)}
                                    >
                                        <Text style={[styles.qName, quality === q && { color: colors.primary }]}>
                                            {QUALITY_INFO[q].name}
                                        </Text>
                                        <Text style={styles.qCost}>{QUALITY_INFO[q].cost} 💎</Text>
                                        <Text style={styles.qDesc}>{QUALITY_INFO[q].desc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* 3. SCENE / BODY SWAP */}
                            <Text style={styles.label}>Mise en Scène (Optionnel)</Text>
                            <Text style={styles.helperText}>Ajoutez une photo pour incruster l&apos;alter dedans (Body Swap).</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={pickSceneImage}>
                                {sceneImageUri ? (
                                    <Image source={{ uri: sceneImageUri }} style={styles.previewScene} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                                        <Text style={styles.uploadText}>Choisir une image de fond</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* 4. PROMPT */}
                            <Text style={styles.label}>Description de la Scène</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: En train de boire un café à Paris... (Laissez vide si Body Swap seul)"
                                placeholderTextColor={colors.textMuted}
                                value={prompt}
                                onChangeText={setPrompt}
                                multiline
                            />

                            {/* GENERATE BUTTON */}
                            <TouchableOpacity
                                onPress={handleGenerate}
                                disabled={isGenerating || (!prompt && !sceneImageUri)}
                                style={{ marginTop: spacing.xl }}
                            >
                                <LinearGradient
                                    colors={(!prompt && !sceneImageUri) ? [colors.textMuted, colors.textMuted] : [colors.secondary, colors.primary]}
                                    style={styles.generateButton}
                                >
                                    {isGenerating ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="sparkles" size={20} color="white" style={{ marginRight: 8 }} />
                                            <Text style={styles.generateButtonText}>
                                                Invoquer ({QUALITY_INFO[quality].cost} Crédits)
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        ...typography.h3,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 50,
    },
    label: {
        ...typography.h4,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    helperText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    // Modal Alert
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '80%', backgroundColor: colors.backgroundCard, borderRadius: 20, padding: 35, alignItems: 'center', elevation: 5 },
    modalTitle: { ...typography.h3, marginTop: 15, marginBottom: 10 },
    modalText: { textAlign: 'center', color: colors.textSecondary, marginBottom: 20 },
    closeButton: { backgroundColor: colors.primary, borderRadius: 20, padding: 10, paddingHorizontal: 20 },
    closeButtonText: { color: 'white', fontWeight: 'bold' },

    // Components
    alterList: { maxHeight: 70, marginBottom: spacing.xs },
    alterChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: 6, paddingRight: 12,
        borderRadius: 30, marginRight: 10,
        borderWidth: 1, borderColor: colors.border
    },
    alterChipSelected: { borderColor: colors.primary, backgroundColor: colors.backgroundLight },
    alterAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, marginRight: 8 },
    alterName: { fontWeight: '600', color: colors.textSecondary },
    alterNameSelected: { color: colors.text },

    qualityContainer: { flexDirection: 'row', gap: 10 },
    qualityOption: {
        flex: 1, padding: 10,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        borderWidth: 1, borderColor: colors.border
    },
    qualityOptionSelected: { borderColor: colors.primary, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' },
    qName: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
    qCost: { fontSize: 12, color: colors.secondary, fontWeight: '800', marginBottom: 4 },
    qDesc: { fontSize: 10, color: colors.textSecondary, lineHeight: 12 },

    imagePicker: {
        height: 150, backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg, overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed'
    },
    previewScene: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 8, color: colors.textSecondary, fontSize: 12 },

    input: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        height: 100, textAlignVertical: 'top',
        color: colors.text,
        fontSize: 16
    },

    generateButton: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 16, borderRadius: borderRadius.full,
    },
    generateButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Result
    resultContainer: { alignItems: 'center' },
    resultImage: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
    resultActions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
    retryButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: colors.backgroundCard, borderRadius: borderRadius.md },
    retryText: { marginLeft: 8, fontWeight: '600', color: colors.text },
    confirmButton: { flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: colors.success, borderRadius: borderRadius.md },
    confirmText: { marginLeft: 8, fontWeight: 'bold', color: 'white' }
});
