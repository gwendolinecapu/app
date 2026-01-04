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
    const [uploadProgress, setUploadProgress] = useState(0);

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

    const handleRitual = async () => {
        try {
            // 1. Pick Image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.9,
                base64: false,
            });

            if (result.canceled || !result.assets[0]) return;

            Alert.alert(
                "Commencer le Rituel ?",
                `Cette offrande coûtera ${AI_COSTS.RITUAL} Crédits. L'Oracle (IA) analysera votre planche de référence pour capturer l'essence visuelle de ${alter?.name || "l'alter"}.`,
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: `Offrir (${AI_COSTS.RITUAL} Crédits)`,
                        style: 'default',
                        onPress: async () => await processRitual(result.assets[0])
                    }
                ]
            );

        } catch (error) {
            console.error("Pick error:", error);
            Alert.alert("Erreur", "Impossible de sélectionner l'image.");
        }
    };

    const processRitual = async (asset: ImagePicker.ImagePickerAsset) => {
        setLoading(true);
        triggerHaptic.selection();

        try {
            // 2. Upload Reference
            const blob = await getBlobFromUri(asset.uri) as any;
            const refPath = `visual_dna/${alterId}/${Date.now()}_ref.jpg`;
            const refRef = ref(storage, refPath);
            await uploadBytes(refRef, blob);
            const downloadUrl = await getDownloadURL(refRef);
            blob.close && blob.close();

            // 3. Call Cloud Function
            const performBirthRitual = httpsCallable(functions, 'performBirthRitual');
            const response = await performBirthRitual({ alterId, referenceImageUrl: downloadUrl });
            const data = response.data as any;

            if (data.success) {
                triggerHaptic.success();
                await refresh();
                Alert.alert(
                    "Rituel Accompli ✨",
                    `L'ADN Visuel de ${alter?.name} a été extrait avec succès. Vous pouvez maintenant utiliser la Magie IA !`,
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
            {/* Background & Header */}
            <LinearGradient
                colors={[themeColors?.background || colors.background, '#1a1025']} // Dark mystic bottom
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

                {/* Intro Card */}
                <View style={[styles.card, { borderColor: primaryColor }]}>
                    <LinearGradient
                        colors={[primaryColor + '20', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="sparkles" size={32} color={primaryColor} style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Rituel de Naissance</Text>
                    <Text style={styles.cardDesc}>
                        Donnez vie à {alter?.name || "votre alter"} en définissant son ADN Visuel unique.
                        Une fois accompli, l'IA reconnaîtra son apparence pour toutes vos futures créations.
                    </Text>
                </View>

                {/* Steps */}
                <Text style={styles.sectionTitle}>Comment ça marche</Text>
                <View style={styles.stepsContainer}>
                    <View style={styles.step}>
                        <View style={[styles.stepNumber, { backgroundColor: accentColor }]}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>Choisissez une "Planche de Référence" précise (Turnaround).</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepNumber, { backgroundColor: accentColor }]}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>L'Oracle analyse les traits, vêtements et couleurs.</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={[styles.stepNumber, { backgroundColor: accentColor }]}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>L'ADN Visuel est scellé. Magie IA débloquée !</Text>
                    </View>
                </View>

                {/* Drop Zone / Action */}
                <TouchableOpacity
                    style={[styles.dropZone, { borderColor: loading ? colors.textMuted : primaryColor }]}
                    onPress={handleRitual}
                    disabled={loading || !!alter?.visual_dna?.is_ready}
                >
                    {loading ? (
                        <View style={styles.loadingContent}>
                            <ActivityIndicator size="large" color={primaryColor} />
                            <Text style={styles.loadingText}>Incantation en cours...</Text>
                            <Text style={styles.loadingSubtext}>L'Oracle analyse votre offrande</Text>
                        </View>
                    ) : alter?.visual_dna?.is_ready ? (
                        <View style={styles.successContent}>
                            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                            <Text style={styles.dropZoneTitle}>Rituel Déjà Accompli</Text>
                            <Text style={styles.dropZoneDesc}>L'ADN Visuel est actif.</Text>
                            <TouchableOpacity style={styles.reDoButton} onPress={handleRitual}>
                                <Text style={styles.reDoText}>Recommencer le Rituel ({AI_COSTS.RITUAL} ©)</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={64} color={primaryColor} />
                            <Text style={styles.dropZoneTitle}>Déposer l'Offrande</Text>
                            <Text style={styles.dropZoneDesc}>Appuyez pour sélectionner votre planche de référence</Text>
                            <View style={[styles.costTag, { backgroundColor: primaryColor }]}>
                                <Ionicons name="diamond-outline" size={14} color="white" />
                                <Text style={styles.costText}>{AI_COSTS.RITUAL} Crédits</Text>
                            </View>
                        </>
                    )}
                </TouchableOpacity>

                {/* Info Note */}
                <View style={styles.noteContainer}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.noteText}>
                        Pour un meilleur résultat, utilisez une image claire montrant le visage et la tenue entière (face/profil). Évitez les arrière-plans complexes.
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
        height: 280,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
    },
    dropZoneTitle: {
        ...typography.h3,
        color: 'white',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        fontWeight: 'bold',
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
});
