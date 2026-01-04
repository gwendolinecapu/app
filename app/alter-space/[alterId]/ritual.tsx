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
    Dimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';

import { storage, functions, db } from '../../../src/lib/firebase';
import { colors, spacing, typography, borderRadius } from '../../../src/lib/theme';
import { getThemeColors } from '../../../src/lib/cosmetics';
import { useAlterData } from '../../../src/hooks/useAlterData';
import { AI_COSTS } from '../../../src/services/MonetizationTypes';
import { triggerHaptic } from '../../../src/lib/haptics';

const { width } = Dimensions.get('window');

export default function RitualScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { alter, refresh } = useAlterData(alterId);
    const [loading, setLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

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
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.9,
                allowsMultipleSelection: true, // Enable multiple
                selectionLimit: 5, // Reasonable limit
            });

            if (!result.canceled && result.assets.length > 0) {
                setSelectedImages(result.assets);
            }
        } catch (error) {
            console.error("Pick error:", error);
            Alert.alert("Erreur", "Impossible de sélectionner les images.");
        }
    };

    const confirmRitual = () => {
        if (selectedImages.length === 0) return;

        Alert.alert(
            "Commencer le Rituel ?",
            `Cette offrande (${selectedImages.length} images) coûte ${AI_COSTS.RITUAL} Crédits. L'Oracle va analyser votre alter en détail.`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: `Offrir (${AI_COSTS.RITUAL} Crédits)`,
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

            // 1. Upload All References
            for (const asset of selectedImages) {
                const blob = await getBlobFromUri(asset.uri) as any;
                const refPath = `visual_dna/${alterId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                const refRef = ref(storage, refPath);
                await uploadBytes(refRef, blob);
                const downloadUrl = await getDownloadURL(refRef);
                uploadedUrls.push(downloadUrl);
                blob.close && blob.close();
            }

            // 2. Call Cloud Function
            const performBirthRitual = httpsCallable(functions, 'performBirthRitual');
            const response = await performBirthRitual({ alterId, referenceImageUrls: uploadedUrls });
            const data = response.data as any;

            if (data.success) {
                triggerHaptic.success();
                await refresh();
                Alert.alert(
                    "Rituel Accompli ✨",
                    `L'ADN Visuel de ${alter?.name} a été extrait. L'Oracle a fusionné vos ${selectedImages.length} offrandes.`,
                    [{ text: "Super", onPress: () => router.back() }]
                );
            } else {
                throw new Error("Le rituel n'a pas renvoyé de succès.");
            }

        } catch (err: any) {
            console.error("Ritual failed:", err);
            triggerHaptic.error();
            Alert.alert("Le Rituel a échoué", err.message || "Une pertubation magique est survenue.");
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
                <Text style={styles.headerTitle}>Chambre du Rituel</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={[styles.card, { borderColor: primaryColor }]}>
                    <LinearGradient
                        colors={[primaryColor + '20', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="sparkles" size={32} color={primaryColor} style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Rituel de Naissance</Text>
                    <Text style={styles.cardDesc}>
                        Donnez vie à {alter?.name || "votre alter"}. Sélectionnez plusieurs images (Face, Profil, Détails) pour un résultat plus précis.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Offrandes ({selectedImages.length}/5)</Text>

                {/* Drop Zone / Image Preview */}
                <TouchableOpacity
                    style={[
                        styles.dropZone,
                        { borderColor: loading ? colors.textMuted : primaryColor },
                        selectedImages.length > 0 && styles.dropZoneActive
                    ]}
                    onPress={loading || !!alter?.visual_dna?.is_ready ? undefined : pickImages}
                    disabled={loading || !!alter?.visual_dna?.is_ready}
                >
                    {loading ? (
                        <View style={styles.loadingContent}>
                            <ActivityIndicator size="large" color={primaryColor} />
                            <Text style={styles.loadingText}>Incantation...</Text>
                            <Text style={styles.loadingSubtext}>Fusion des {selectedImages.length} offrandes</Text>
                        </View>
                    ) : !!alter?.visual_dna?.is_ready ? (
                        <View style={styles.successContent}>
                            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                            <Text style={styles.dropZoneTitle}>Rituel Accompli</Text>
                            <TouchableOpacity style={styles.reDoButton} onPress={pickImages}>
                                <Text style={styles.reDoText}>Refaire le Rituel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : selectedImages.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                            {selectedImages.map((img, i) => (
                                <Image key={i} source={{ uri: img.uri }} style={styles.previewImage} />
                            ))}
                            <View style={styles.addMoreCard}>
                                <Ionicons name="add" size={32} color={primaryColor} />
                                <Text style={[styles.addMoreText, { color: primaryColor }]}>Modifier</Text>
                            </View>
                        </ScrollView>
                    ) : (
                        <>
                            <Ionicons name="images-outline" size={64} color={primaryColor} />
                            <Text style={styles.dropZoneTitle}>Déposer les Offrandes</Text>
                            <Text style={styles.dropZoneDesc}>Appuyez pour sélectionner plusieurs images</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Confirm Action */}
                {!loading && !alter?.visual_dna?.is_ready && selectedImages.length > 0 && (
                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: primaryColor }]}
                        onPress={confirmRitual}
                    >
                        <LinearGradient
                            colors={[primaryColor, accentColor]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <Ionicons name="flame" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.confirmButtonText}>Commencer le Rituel ({AI_COSTS.RITUAL} Crédits)</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.noteContainer}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.noteText}>
                        Vous pouvez sélectionner jusqu'à 5 images pour aider l'IA à mieux comprendre l'apparence de votre alter sous tous les angles.
                    </Text>
                </View>

            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        ...typography.h3,
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    backButton: {
        padding: spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.full,
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
        minHeight: 200,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
    },
    dropZoneActive: {
        borderStyle: 'solid',
        padding: spacing.md,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    dropZoneTitle: {
        ...typography.h3,
        color: 'white',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dropZoneDesc: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
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
    },
    loadingText: {
        ...typography.h3,
        color: 'white',
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
    reDoButton: {
        marginTop: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.md,
    },
    reDoText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    noteContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(168, 85, 247, 0.1)', // Light purple bg
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    noteText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 18,
    },
    previewScroll: {
        flexGrow: 0,
        width: '100%',
    },
    previewImage: {
        width: 100,
        height: 140,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    addMoreCard: {
        width: 100,
        height: 140,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addMoreText: {
        ...typography.caption,
        marginTop: spacing.xs,
        fontWeight: 'bold',
    },
    confirmButton: {
        marginTop: spacing.xl,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        ...typography.h4,
        color: 'white',
        fontWeight: 'bold',
    },
});
