import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
    Modal,
    Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';

import { storage, functions } from '../../../src/lib/firebase';
import { colors, spacing, typography, borderRadius } from '../../../src/lib/theme';
import { getThemeColors } from '../../../src/lib/cosmetics';
import { useAlterData } from '../../../src/hooks/useAlterData';
import { useAuth } from '../../../src/contexts/AuthContext';
import { MagicalLoadingView } from '../../../src/components/shared/MagicalLoadingView';
import { AI_COSTS } from '../../../src/services/MonetizationTypes';
import { triggerHaptic } from '../../../src/lib/haptics';

const { width } = Dimensions.get('window');

export default function RitualScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { alter, refresh } = useAlterData(alterId);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState<{ visualDescription?: string; refSheetUrl?: string } | null>(null);
    const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    // Derived values for display (prefer immediate result, fallback to stored data)
    const displayRefSheetUrl = resultData?.refSheetUrl || alter?.visual_dna?.reference_sheet_url;
    const isRitualComplete = !!displayRefSheetUrl;

    const themeColors = getThemeColors(alter?.equipped_items?.theme);
    const primaryColor = themeColors?.primary || colors.primary;
    const accentColor = '#A855F7'; // Mystical purple default

    const getBlobFromUri = async (uri: string) => {
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

    const pickImages = async () => {
        // Afficher d'abord l'avertissement éthique et la compensation carbone
        Alert.alert(
            "⚠️ Utilisation Éthique de l'IA",
            "Avant de générer :\n\n" +
            "🎨 Consentement des artistes\n" +
            "Veuillez utiliser UNIQUEMENT des images dont vous avez les droits ou l'autorisation explicite de l'artiste. " +
            "L'utilisation du travail d'un artiste sans son accord est contraire à nos principes.\n\n" +
            "🌱 Compensation carbone incluse\n" +
            "Chaque image générée contribue automatiquement à une compensation carbone (0,002€/image = 2€/1000 images). " +
            "Nous estimons ~50g CO₂e par image 2K et provisionnons ce montant pour financer des projets de compensation.\n\n" +
            "En continuant, vous confirmez respecter ces conditions.",
            [
                {
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "J'ai compris, continuer",
                    onPress: async () => {
                        try {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ['images'],
                                quality: 0.9,
                                allowsMultipleSelection: true,
                                selectionLimit: 5,
                            });

                            if (!result.canceled && result.assets.length > 0) {
                                setSelectedImages(result.assets);
                            }
                        } catch (error) {
                            console.error("Pick error:", error);
                            Alert.alert("Erreur", "Impossible de sélectionner les images.");
                        }
                    }
                }
            ]
        );
    };

    const confirmRitual = () => {
        if (selectedImages.length === 0) return;

        Alert.alert(
            "Lancer la création ?",
            `Ces références (${selectedImages.length} images) coûtent ${AI_COSTS.RITUAL} Crédits.\n\n` +
            `L'IA va analyser votre alter en détail.\n\n` +
            `💚 Impact carbone : une contribution automatique de 0,002€/image est provisionnée pour la compensation carbone.`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: `Générer (${AI_COSTS.RITUAL} Crédits)`,
                    style: 'default',
                    onPress: processRitual
                }
            ]
        );
    };

    const processRitual = async () => {
        setLoading(true);
        triggerHaptic.selection();

        try {
            const uploadedUrls: string[] = [];

            // 1. Upload All References (Resized)
            for (const asset of selectedImages) {
                // Resize to max 2048 to avoid API limits (36MP)
                const manipResult = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 2048 } }], // Scale width to 2048, height auto-scales
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );

                const blob = await getBlobFromUri(manipResult.uri) as any;
                const refPath = `visual_dna/${alterId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                const refRef = ref(storage, refPath);
                await uploadBytes(refRef, blob);
                const downloadUrl = await getDownloadURL(refRef);
                uploadedUrls.push(downloadUrl);
                blob.close && blob.close();
            }

            // 2. Call Cloud Function
            const performBirthRitual = httpsCallable(functions, 'performBirthRitual', { timeout: 540000 }); // 9 mins timeout
            const response = await performBirthRitual({ alterId, referenceImageUrls: uploadedUrls });
            const data = response.data as any;

            if (data.success) {
                triggerHaptic.success();
                setSelectedImages([]); // Clear selection on success
                setResultData({
                    visualDescription: data.visualDescription,
                    refSheetUrl: data.refSheetUrl
                });
                await refresh(); // Background refresh
                Alert.alert(
                    "Création Terminée ✨",
                    `L'apparence de ${alter?.name} a été générée.`,
                    [{ text: "Voir le résultat", onPress: () => { } }]
                );
            } else {
                throw new Error("La génération n'a pas renvoyé de succès.");
            }

        } catch (err: any) {
            console.error("Ritual failed:", err);
            triggerHaptic.error();
            Alert.alert("La création a échoué", err.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[themeColors?.background || colors.background, '#1a1025']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Studio de Création</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>

                <View style={[styles.card, { borderColor: primaryColor, backgroundColor: themeColors?.backgroundCard || 'rgba(20,20,30,0.6)' }]}>
                    <LinearGradient
                        colors={[primaryColor + '20', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="sparkles" size={32} color={primaryColor} style={styles.cardIcon} />
                    <Text style={[styles.cardTitle, { color: themeColors?.text || 'white' }]}>Génération d&apos;Avatar</Text>
                    <Text style={[styles.cardDesc, { color: themeColors?.textSecondary || colors.textSecondary }]}>
                        Visualisez {alter?.name || "votre alter"}. Sélectionnez plusieurs images (Face, Profil, Détails) pour un résultat plus précis.
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: themeColors?.text || colors.text }]}>Références ({selectedImages.length}/5)</Text>

                {/* 1. Loading State */}
                {/* 1. Loading State - REPLACED BY OVERLAY */}
                {/* {loading && (...)} */}

                {/* 2. Success State (Ritual Done) */}
                {
                    !loading && isRitualComplete && selectedImages.length === 0 && (
                        <View style={styles.successContent}>
                            <View style={styles.successHeader}>
                                <Ionicons name="checkmark-circle" size={48} color={primaryColor} />
                                <Text style={[styles.successTitle, { color: primaryColor }]}>Génération Réussie</Text>
                            </View>


                            {/* Visual Result Display */}
                            {displayRefSheetUrl && (
                                <View style={[styles.dnaCard, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                                        <Image
                                            source={{ uri: displayRefSheetUrl }}
                                            style={{ width: '100%', height: 400, borderRadius: borderRadius.md, resizeMode: 'contain', backgroundColor: 'rgba(0,0,0,0.2)' }}
                                        />
                                    </TouchableOpacity>
                                    <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                                        Appuyer pour agrandir
                                    </Text>

                                    <Modal
                                        visible={imageModalVisible}
                                        transparent={true}
                                        onRequestClose={() => setImageModalVisible(false)}
                                        animationType="fade"
                                    >
                                        <View style={styles.modalContainer}>
                                            <TouchableOpacity
                                                style={styles.modalCloseButton}
                                                onPress={() => setImageModalVisible(false)}
                                            >
                                                <Ionicons name="close" size={30} color="white" />
                                            </TouchableOpacity>
                                            <Image
                                                source={{ uri: displayRefSheetUrl }}
                                                style={styles.modalImage}
                                            />
                                        </View>
                                    </Modal>
                                </View>
                            )}

                            <TouchableOpacity style={styles.reDoButton} onPress={pickImages}>
                                <Text style={styles.reDoText}>Régénérer (Mettre à jour)</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }

                {/* 3. Preview State (User has selected images, either for first time or redo) */}
                {
                    !loading && selectedImages.length > 0 && (
                        <View style={styles.previewContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                                {selectedImages.map((asset, index) => (
                                    <View key={index} style={styles.previewImageContainer}>
                                        <Image source={{ uri: asset.uri }} style={styles.previewImage} />
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#FF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addMoreCard} onPress={pickImages}>
                                    <Ionicons name="add" size={32} color={colors.textSecondary} />
                                    <Text style={styles.addMoreText}>Ajouter</Text>
                                </TouchableOpacity>
                            </ScrollView>
                            <Text style={styles.imageCountText}>{selectedImages.length} images sélectionnées</Text>

                            {/* Cancel Redo Button */}
                            {!!alter?.visual_dna?.is_ready && (
                                <TouchableOpacity
                                    style={styles.cancelRedoButton}
                                    onPress={() => setSelectedImages([])}
                                >
                                    <Text style={styles.cancelRedoText}>Annuler et garder l&apos;ADN actuel</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                }

                {/* 4. Empty/Upload State (Not ready, no selection) */}
                {
                    !loading && !alter?.visual_dna?.is_ready && selectedImages.length === 0 && (
                        <TouchableOpacity
                            style={[styles.dropZone, { borderColor: primaryColor }]}
                            onPress={pickImages}
                        >
                            <Ionicons name="images-outline" size={48} color={primaryColor} />
                            <Text style={[styles.dropZoneTitle, { color: primaryColor }]}>Sélectionner des images</Text>
                            <Text style={[styles.dropZoneDesc, { color: themeColors?.textSecondary || colors.textSecondary }]}>Photos claires du visage et du corps</Text>
                        </TouchableOpacity>
                    )
                }

                {/* Confirm Button */}
                {
                    !loading && selectedImages.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                { backgroundColor: primaryColor } // Fallback if gradient fails, but we use gradient inside
                            ]}
                            onPress={confirmRitual}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[primaryColor, accentColor]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.confirmGradient}
                            >
                                <Text style={styles.confirmText}>Lancer la création ({AI_COSTS.RITUAL} Crédits)</Text>
                                <Ionicons name="flame" size={24} color="white" style={{ marginLeft: 8 }} />
                            </LinearGradient>
                        </TouchableOpacity>
                    )
                }
            </ScrollView >
            {/* Awesome Loading Screen */}
            <MagicalLoadingView
                visible={loading}
                message="Création en cours..."
                subMessage="Analyse des traits..."
            />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: 60,
        paddingBottom: spacing.md,
    },
    headerTitle: {
        ...typography.h2,
        color: '#FFF',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'rgba(20,20,30,0.6)',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderTopWidth: 2,
        alignItems: 'center',
    },
    cardIcon: {
        marginBottom: spacing.sm,
    },
    cardTitle: {
        ...typography.h2,
        color: 'white',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    cardDesc: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    sectionTitle: {
        ...typography.h4,
        color: colors.text,
        marginBottom: spacing.md,
        fontWeight: 'bold',
        marginLeft: spacing.xs,
    },
    stepsContainer: {
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    stepNumberText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    stepText: {
        ...typography.body,
        color: colors.text,
        flex: 1,
    },
    dropZone: {
        width: '100%',
        minHeight: 300,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: spacing.lg,
        padding: spacing.md,
    },
    dropZoneActive: {
        borderStyle: 'solid',
        padding: spacing.md,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        borderColor: '#FFF',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dropZoneTitle: {
        ...typography.h3,
        marginTop: spacing.md,
    },
    dropZoneDesc: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    costTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: 6,
        marginTop: spacing.sm,
    },
    costText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loadingContent: {
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        ...typography.h3,
        marginTop: spacing.md,
        fontWeight: '600',
    },
    loadingSubtext: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    successContent: {
        alignItems: 'center',
        width: '100%',
    },
    successHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    successTitle: {
        ...typography.h2,
        marginLeft: spacing.sm,
    },
    previewContainer: {
        width: '100%',
        marginBottom: spacing.lg,
    },
    previewScroll: {
        flexDirection: 'row',
    },
    previewImageContainer: {
        position: 'relative',
        marginRight: spacing.sm,
    },
    previewImage: {
        width: 120,
        height: 160,
        borderRadius: borderRadius.md,
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addMoreCard: {
        width: 120,
        height: 160,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    addMoreText: {
        ...typography.caption,
        marginTop: spacing.xs,
        color: colors.textSecondary,
    },
    imageCountText: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },

    dnaCard: {
        width: '100%',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(30,30,40,0.8)', // Darker, more solid for better contrast
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    reDoButton: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
    },
    reDoText: {
        ...typography.button,
        color: '#FFFFFF',
        fontSize: 16,
    },
    cancelRedoButton: {
        marginTop: spacing.md,
        padding: spacing.sm,
    },
    cancelRedoText: {
        ...typography.button,
        color: colors.textSecondary,
        textDecorationLine: 'underline',
        opacity: 0.7,
    },
    confirmButton: {
        width: '100%',
        height: 56,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
        elevation: 8,
    },
    confirmGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        ...typography.button,
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    modalImage: {
        width: width,
        height: '80%',
        resizeMode: 'contain',
    },
});
