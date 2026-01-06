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
// import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads'; // REMOVED: Crash fix
import AdMediationService from '../../services/AdMediationService';
import CreditService from '../../services/CreditService'; // Added
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Alter } from '../../types';
import { SketchCanvas } from '../shared/SketchCanvas';
import { MagicalLoadingView } from '../shared/MagicalLoadingView';
import { AI_COSTS, REWARD_AD_AMOUNT } from '../../services/MonetizationTypes';

interface MagicPostGeneratorProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (imageUri: string) => void;
    alters: Alter[];
    activeAlterId?: string;
}

// Helper for Ads - Removed direct instance

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
    const selectedAlter = alters.find(a => a.id === selectedAlterId);

    // UI State
    const [prompt, setPrompt] = useState('');
    const [imageCount, setImageCount] = useState<1 | 3>(1); // Batch Gen count
    const [style, setStyle] = useState('Cinematic');
    const [sceneImageUri, setSceneImageUri] = useState<string | null>(null);
    const [poseImageUri, setPoseImageUri] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Results
    const [generatedImages, setGeneratedImages] = useState<string[]>([]); // Array for batch
    const [selectedResultIndex, setSelectedResultIndex] = useState(0);

    // Ads
    // const [adLoaded, setAdLoaded] = useState(false); // Managed by Service

    React.useEffect(() => {
        // Init ads service if needed (idempotent)
        AdMediationService.initialize();
    }, []);

    const showRewardAd = async () => {
        // Check availability
        if (!AdMediationService.canWatchRewardAd()) {
            return Alert.alert("Limite atteinte", "Vous avez atteint votre limite quotidienne de publicités.");
        }

        // Check if alter is selected for credit attribution
        if (!selectedAlterId) {
            return Alert.alert("Erreur", "Aucun alter sélectionné pour recevoir les crédits.");
        }

        try {
            const result = await AdMediationService.showRewardedAd();

            if (result.completed) {
                // Grant credits via CreditService
                await CreditService.claimRewardAd(selectedAlterId);

                Alert.alert("Récompense reçue !", `Vous avez gagné ${REWARD_AD_AMOUNT} crédits pour ${selectedAlter?.name || 'votre alter'}.`);
            } else {
                if (result.network === 'admob' && result.rewardAmount === 0) {
                    // Ad failed or closed early - Do nothing or show generic error if needed
                } else {
                    Alert.alert("Vidéo interrompue", "Regardez la vidéo jusqu'au bout pour recevoir la récompense.");
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "Impossible de lancer la publicité.");
        }
    };


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

    const pickPoseImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPoseImageUri(result.assets[0].uri);
        }
    };

    const handleGenerate = async () => {
        if (!selectedAlterId) return Alert.alert("Erreur", "Sélectionnez un alter avec ADN Visuel.");
        if (!prompt && !sceneImageUri) return Alert.alert("Erreur", "Décrivez la scène ou ajoutez une image.");

        const cost = imageCount === 3 ? AI_COSTS.MAGIC_POST_BATCH : AI_COSTS.MAGIC_POST;
        if ((selectedAlter?.credits || 0) < cost) {
            return Alert.alert("Crédits insuffisants", "Regardez une publicité ou rechargez vos crédits dans la boutique.");
        }

        setIsGenerating(true);
        try {
            let uploadedSceneUrl = undefined;
            if (sceneImageUri && !sceneImageUri.startsWith('http')) { // Only upload if local
                const blob = await getBlobFromUri(sceneImageUri) as any;
                const path = `magic_uploads/${selectedAlterId}/${Date.now()}_scene.jpg`;
                const sRef = ref(storage, path);
                await uploadBytes(sRef, blob);
                uploadedSceneUrl = await getDownloadURL(sRef);
                blob.close && blob.close();
            } else if (sceneImageUri) {
                uploadedSceneUrl = sceneImageUri; // Use existing URL (Modify mode)
            }

            let uploadedPoseUrl = undefined;
            if (poseImageUri) {
                const blob = await getBlobFromUri(poseImageUri) as any;
                const path = `magic_uploads/${selectedAlterId}/${Date.now()}_pose.jpg`;
                const sRef = ref(storage, path);
                await uploadBytes(sRef, blob);
                uploadedPoseUrl = await getDownloadURL(sRef);
                blob.close && blob.close();
            }

            const generateMagicPost = httpsCallable(functions, 'generateMagicPost');
            const result: any = await generateMagicPost({
                alterId: selectedAlterId,
                prompt: prompt,
                imageCount: imageCount, // Pass count
                style,
                sceneImageUrl: uploadedSceneUrl,
                poseImageUrl: uploadedPoseUrl,
                isBodySwap: !!sceneImageUri
            });

            if (result.data.success && (result.data.images || result.data.imageUrl)) {
                // Support both legacy single 'imageUrl' and new 'images' array
                const images = result.data.images || [result.data.imageUrl];
                setGeneratedImages(images);
                setSelectedResultIndex(0);
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
        if (generatedImages[selectedResultIndex]) {
            onSuccess(generatedImages[selectedResultIndex]);
            reset();
        }
    };

    const reset = () => {
        setGeneratedImages([]);
        setPrompt('');
        setSceneImageUri(null);
        setPoseImageUri(null);
        setImageCount(1);
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
                            Aucun de vos alters ne possède d'ADN Visuel. Effectuez le "Rituel de Naissance" dans l'édition de profil d'un alter pour activer la Magie IA.
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Compris</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    const currentCost = imageCount === 3 ? AI_COSTS.MAGIC_POST_BATCH : AI_COSTS.MAGIC_POST;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Magic Post</Text>

                    {/* Credit Balance & Ad */}
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={showRewardAd} style={styles.adButton}>
                            <Ionicons name="play-circle" size={16} color="white" />
                            <Text style={styles.adButtonText}>+5</Text>
                        </TouchableOpacity>
                        <View style={styles.creditBadge}>
                            <Ionicons name="diamond" size={14} color={colors.primary} />
                            <Text style={styles.creditText}>{selectedAlter?.credits || 0}</Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* RESULT PREVIEW MODE */}
                    {generatedImages.length > 0 ? (
                        <View style={styles.resultContainer}>
                            <Image
                                source={{ uri: generatedImages[selectedResultIndex] }}
                                style={styles.resultImage}
                            />

                            {/* Batch Selection Dots */}
                            {generatedImages.length > 1 && (
                                <View style={styles.batchDots}>
                                    {generatedImages.map((_, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => setSelectedResultIndex(idx)}
                                            style={[
                                                styles.batchDot,
                                                selectedResultIndex === idx && styles.batchDotActive
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.secondaryAction]}
                                    onPress={() => setGeneratedImages([])}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Ionicons name="trash-outline" size={18} color={colors.text} />
                                        <Text style={styles.actionTextSecondary}>Jeter</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        onSuccess(generatedImages[selectedResultIndex]);
                                        reset();
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Ionicons name="checkmark-circle" size={18} color="white" />
                                        <Text style={styles.actionText}>Poster</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.modifyButton}
                                onPress={() => {
                                    // "Modify" Mode: Use result as scene image
                                    setSceneImageUri(generatedImages[selectedResultIndex]);
                                    setGeneratedImages([]); // Go back to input
                                }}
                            >
                                <Ionicons name="color-wand" size={16} color={colors.primary} />
                                <Text style={styles.modifyButtonText}>
                                    Modifier cette version
                                </Text>
                            </TouchableOpacity>

                        </View>
                    ) : (
                        <>
                            {/* --- INPUT FORM --- */}

                            {/* 1. SELECT ALTER */}
                            <Text style={styles.label}>Qui poste ?</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alterList}>
                                {magicAlters.map(alter => (
                                    <TouchableOpacity
                                        key={alter.id}
                                        style={[
                                            styles.alterChip,
                                            selectedAlterId === alter.id && styles.alterChipSelected
                                        ]}
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

                            {/* 2. IMAGE COUNT (BATCH) */}
                            <Text style={styles.label}>Quantité</Text>
                            <View style={styles.qualityContainer}>
                                <TouchableOpacity
                                    style={[styles.qualityOption, imageCount === 1 && styles.qualityOptionSelected]}
                                    onPress={() => setImageCount(1)}
                                >
                                    <Ionicons name="image" size={20} color={imageCount === 1 ? colors.primary : colors.textSecondary} style={{ marginBottom: 4 }} />
                                    <Text style={[styles.qName, imageCount === 1 && { color: colors.primary }]}>Unique</Text>
                                    <Text style={styles.qCost}>{AI_COSTS.MAGIC_POST} Crédits</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.qualityOption, imageCount === 3 && styles.qualityOptionSelected]}
                                    onPress={() => setImageCount(3)}
                                >
                                    <Ionicons name="images" size={20} color={imageCount === 3 ? colors.primary : colors.textSecondary} style={{ marginBottom: 4 }} />
                                    <Text style={[styles.qName, imageCount === 3 && { color: colors.primary }]}>Batch (x3)</Text>
                                    <Text style={styles.qCost}>{AI_COSTS.MAGIC_POST_BATCH} Crédits</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 3. STYLE */}
                            <Text style={styles.label}>Style Artistique</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
                                {['Cinematic', 'Anime', 'Painting', 'Cyberpunk', 'Polaroid'].map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[
                                            styles.styleChip,
                                            style === s && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => setStyle(s)}
                                    >
                                        <Text style={[styles.styleChipText, style === s && { color: 'white' }]}>
                                            {s}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* 4. REFERENCES */}
                            <Text style={styles.label}>Références (Optionnel)</Text>

                            {/* Scene / Body Swap */}
                            <Text style={styles.helperText}>Image de fond ou Body Swap</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={pickSceneImage}>
                                {sceneImageUri ? (
                                    <>
                                        <Image source={{ uri: sceneImageUri }} style={styles.previewScene} />
                                        <TouchableOpacity
                                            style={styles.removeImagesButton}
                                            onPress={() => setSceneImageUri(null)}
                                        >
                                            <Ionicons name="close-circle" size={24} color="white" />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                                        <Text style={styles.uploadText}>Fond / BodySwap</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={[styles.helperText, { marginTop: spacing.sm }]}>Pose ou Gribouillage (Structure)</Text>
                            {poseImageUri ? (
                                <View style={[styles.imagePicker, { borderColor: colors.primary, height: 180 }]}>
                                    <Image source={{ uri: poseImageUri }} style={styles.previewScene} />
                                    <TouchableOpacity
                                        style={styles.removeImagesButton}
                                        onPress={() => setPoseImageUri(null)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity style={[styles.imagePicker, { flex: 1, height: 100 }]} onPress={pickPoseImage}>
                                        <Ionicons name="images-outline" size={24} color={colors.textSecondary} />
                                        <Text style={styles.uploadText}>Galerie</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.imagePicker, { flex: 1, height: 100 }]} onPress={() => setIsDrawing(true)}>
                                        <Ionicons name="pencil" size={24} color={colors.textSecondary} />
                                        <Text style={styles.uploadText}>Dessiner</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* 5. PROMPT */}
                            <Text style={styles.label}>Description de la Scène</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: En train de boire un café à Paris..."
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
                                                Invoquer ({currentCost} Crédits)
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Drawing Modal */}
            <Modal
                visible={isDrawing}
                animationType="slide"
                onRequestClose={() => setIsDrawing(false)}
            >
                <SketchCanvas
                    onClose={() => setIsDrawing(false)}
                    onSave={(uri) => {
                        setPoseImageUri(uri);
                        setIsDrawing(false);
                    }}
                />
            </Modal>

            <MagicalLoadingView
                visible={isGenerating}
                message="Tissage du Post..."
                subMessage={imageCount === 3 ? "Génération de 3 variantes..." : "Veuillez patienter..."}
            />
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
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconButton: { padding: 4 },
    adButton: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f39c12', paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 20
    },
    adButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
    creditBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 20, borderWidth: 1, borderColor: colors.border
    },
    creditText: { fontWeight: 'bold', marginLeft: 6, color: colors.primary },

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
        flex: 1, padding: 15, alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        borderWidth: 1, borderColor: colors.border
    },
    qualityOptionSelected: { borderColor: colors.primary, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' },
    qName: { fontWeight: 'bold', fontSize: 14, marginBottom: 2, color: colors.text },
    qCost: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 },

    styleChip: {
        paddingVertical: 8, paddingHorizontal: 16,
        borderRadius: 20, borderWidth: 1, borderColor: colors.border,
        marginRight: 8, backgroundColor: colors.backgroundCard
    },
    styleChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

    imagePicker: {
        borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
        borderRadius: borderRadius.md, height: 140,
        justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundLight,
        marginBottom: spacing.md, overflow: 'hidden'
    },
    removeImagesButton: { position: 'absolute', top: 5, right: 5 },
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
    resultContainer: { alignItems: 'center', width: '100%' },
    resultImage: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.lg, marginBottom: spacing.md },

    batchDots: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    batchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    batchDotActive: { backgroundColor: colors.primary, width: 20 },

    actionRow: { flexDirection: 'row', width: '100%', gap: 10 },
    actionButton: {
        flex: 1, padding: 16, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.primary,
        ...Platform.select({
            ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
            android: { elevation: 4 }
        })
    },
    secondaryAction: {
        backgroundColor: colors.backgroundCard,
        borderWidth: 1, borderColor: colors.border,
        shadowOpacity: 0
    },
    actionText: { color: 'white', fontWeight: 'bold' },
    actionTextSecondary: { color: colors.text, fontWeight: '600' },

    modifyButton: { flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 10 },
    modifyButtonText: { color: colors.primary, fontWeight: '600', marginLeft: 6 },

    // Modal
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '80%', backgroundColor: colors.backgroundCard, borderRadius: 20, padding: 35, alignItems: 'center', elevation: 5 },
    modalTitle: { ...typography.h3, marginTop: 15, marginBottom: 10 },
    modalText: { textAlign: 'center', color: colors.textSecondary, marginBottom: 20 },
    closeButton: { backgroundColor: colors.primary, borderRadius: 20, padding: 10, paddingHorizontal: 20 },
    closeButtonText: { color: 'white', fontWeight: 'bold' },
});
