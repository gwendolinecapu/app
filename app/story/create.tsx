import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../src/lib/firebase';
import { StoriesService } from '../../src/services/stories';
import { colors, spacing, typography } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { triggerHaptic } from '../../src/lib/haptics';

// =====================================================
// CREATE STORY SCREEN
// Écran de création de story avec sélection de média
// =====================================================

export default function CreateStoryScreen() {
    const { currentAlter, user } = useAuth();
    const [selectedMedia, setSelectedMedia] = useState<{
        uri: string;
        type: 'image' | 'video';
    } | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickMedia = async (type: 'camera' | 'gallery') => {
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
            videoMaxDuration: 30,
        };

        let result;
        if (type === 'camera') {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission requise', 'Accès à la caméra nécessaire');
                return;
            }
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission requise', 'Accès à la galerie nécessaire');
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setSelectedMedia({
                uri: asset.uri,
                type: asset.type === 'video' ? 'video' : 'image',
            });
        }
    };

    const handlePublish = async () => {
        if (!selectedMedia || !currentAlter || !user) return;

        setUploading(true);
        triggerHaptic.medium();

        try {
            // 1. Upload media to Firebase Storage
            const response = await fetch(selectedMedia.uri);
            const blob = await response.blob();

            const ext = selectedMedia.type === 'video' ? 'mp4' : 'jpg';
            const filename = `stories/${user.uid}/${Date.now()}.${ext}`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);

            // 2. Create story in Firestore
            await StoriesService.createStory({
                authorId: currentAlter.id,
                authorName: currentAlter.name,
                authorAvatar: currentAlter.avatar || currentAlter.avatar_url,
                systemId: user.uid,
                mediaUrl: downloadUrl,
                mediaType: selectedMedia.type,
            });

            triggerHaptic.success();
            router.back();
        } catch (error) {
            console.error('Failed to create story:', error);
            Alert.alert('Erreur', 'Impossible de publier la story');
            triggerHaptic.error();
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Nouvelle Story</Text>
                <TouchableOpacity
                    onPress={handlePublish}
                    disabled={!selectedMedia || uploading}
                    style={[styles.publishButton, (!selectedMedia || uploading) && styles.publishButtonDisabled]}
                >
                    {uploading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.publishText}>Publier</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
                {selectedMedia ? (
                    <Image source={{ uri: selectedMedia.uri }} style={styles.preview} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="image-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.placeholderText}>Aucun média sélectionné</Text>
                    </View>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => pickMedia('camera')}>
                    <View style={styles.actionIcon}>
                        <Ionicons name="camera" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.actionLabel}>Caméra</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => pickMedia('gallery')}>
                    <View style={styles.actionIcon}>
                        <Ionicons name="images" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.actionLabel}>Galerie</Text>
                </TouchableOpacity>
            </View>
        </View>
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
        paddingHorizontal: spacing.md,
        paddingTop: 60,
        paddingBottom: spacing.md,
    },
    title: {
        ...typography.h3,
        fontWeight: '600',
    },
    publishButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 20,
    },
    publishButtonDisabled: {
        opacity: 0.5,
    },
    publishText: {
        color: 'white',
        fontWeight: '600',
    },
    previewContainer: {
        flex: 1,
        margin: spacing.md,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: colors.backgroundLight,
    },
    preview: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        ...typography.body,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xl,
        padding: spacing.lg,
        paddingBottom: 40,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    actionLabel: {
        ...typography.caption,
        color: colors.text,
    },
});
