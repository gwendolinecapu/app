import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { SecureContainer } from '../security/SecureContainer';
import { Alter } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { useToast } from '../ui/Toast';
import { triggerHaptic } from '../../lib/haptics';

import { ThemeColors } from '../../lib/cosmetics';

interface AlterGalleryProps {
    alter: Alter;
    isCloudEnabled?: boolean;
    themeColors?: ThemeColors | null;
}

interface GalleryImage {
    id: string;
    uri: string;
    createdAt: Date;
}

export const AlterGallery: React.FC<AlterGalleryProps> = ({ alter, isCloudEnabled = false, themeColors }) => {
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const toast = useToast();

    // ... (keep logic same)

    const loadGallery = async () => {
        try {
            setLoading(true);
            const stored = await SecureStore.getItemAsync(`gallery_${alter.id}`);
            if (stored) {
                setGalleryImages(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Erreur chargement galerie:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPhoto = async () => {
        try {
            triggerHaptic.selection();

            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour ajouter des photos.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newImage: GalleryImage = {
                    id: Date.now().toString(),
                    uri: result.assets[0].uri,
                    createdAt: new Date()
                };

                const updatedGallery = [newImage, ...galleryImages];
                setGalleryImages(updatedGallery);

                await SecureStore.setItemAsync(`gallery_${alter.id}`, JSON.stringify(updatedGallery));
                toast.showToast('Photo ajoutée', 'success');
            }
        } catch (e) {
            console.error('Erreur ajout photo:', e);
            toast.showToast("Erreur lors de l'ajout", 'error');
        }
    };

    return (
        <SecureContainer title="Galerie Privée" subtitle="Authentification requise">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, themeColors && { color: themeColors.text }]}>Ma Galerie Privée</Text>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
                        <Ionicons name="add-circle" size={28} color={themeColors?.primary || colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Info Stockage */}
                <View style={styles.infoBar}>
                    <Ionicons name="phone-portrait-outline" size={16} color={themeColors?.textSecondary || colors.textSecondary} />
                    <Text style={[styles.infoText, themeColors && { color: themeColors.textSecondary }]}>Stockage local uniquement</Text>
                    {!isCloudEnabled && (
                        <TouchableOpacity
                            style={styles.premiumBadge}
                            onPress={() => toast.showToast('Option Cloud disponible avec Premium', 'info')}
                        >
                            <Ionicons name="cloud-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.premiumText}>Premium</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Grid */}
                {galleryImages.length > 0 ? (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.grid}>
                            {galleryImages.map((img) => (
                                <TouchableOpacity
                                    key={img.id}
                                    style={styles.gridItem}
                                    onPress={() => {
                                        setFullScreenImage(img.uri);
                                        triggerHaptic.selection();
                                    }}
                                >
                                    <Image
                                        source={{ uri: img.uri }}
                                        style={styles.image}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="images-outline" size={64} color={themeColors?.textSecondary || colors.textMuted} />
                        <Text style={[styles.emptyTitle, themeColors && { color: themeColors.text }]}>Galerie Privée</Text>
                        <Text style={[styles.emptySubtitle, themeColors && { color: themeColors.textSecondary }]}>
                            Ajoutez des photos personnelles à la galerie de {alter.name}.{'\n'}
                            Les photos sont stockées uniquement sur votre téléphone.
                        </Text>
                        <TouchableOpacity style={[styles.ctaButton, themeColors && { backgroundColor: themeColors.primary }]} onPress={handleAddPhoto}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.ctaText}>Ajouter une photo</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Fullscreen Viewer */}
                <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
                    <View style={styles.fullscreenContainer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setFullScreenImage(null)}
                        >
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        {fullScreenImage && (
                            <Image
                                source={{ uri: fullScreenImage }}
                                style={styles.fullscreenImage}
                                contentFit="contain"
                                transition={300}
                            />
                        )}
                    </View>
                </Modal>
            </View>
        </SecureContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    addButton: {
        padding: 4,
    },
    infoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: 8,
    },
    infoText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
    },
    premiumText: {
        fontSize: 10,
        color: colors.textMuted,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gridItem: {
        width: '31%', // Approx 1/3 minus gap
        aspectRatio: 1,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        backgroundColor: colors.surface,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xl,
        marginTop: spacing.xl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginVertical: spacing.md,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        gap: 8,
    },
    ctaText: {
        color: 'white',
        fontWeight: '600',
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
        padding: 10,
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
});
