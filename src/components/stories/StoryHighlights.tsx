import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { StoriesService } from '../../services/stories';
import { StoryHighlight } from '../../types';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface StoryHighlightsProps {
    authorId: string;
    systemId: string;
    isOwner: boolean;
    refreshTrigger?: number; // Prop to trigger refresh from parent
    themeColor?: string; // Color for borders and icons
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({ authorId, systemId, isOwner, refreshTrigger, themeColor = colors.primary }) => {
    const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
    const [loading, setLoading] = useState(true);

    // Custom Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newHighlightTitle, setNewHighlightTitle] = useState('');

    const loadHighlights = async () => {
        try {
            const data = await StoriesService.fetchHighlights(authorId);
            setHighlights(data);
        } catch (error: any) {
            console.error('Error fetching highlights:', error);
            // Show error to user to help debug
            if (isOwner) Alert.alert("Erreur chargement", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHighlights();
    }, [authorId, refreshTrigger]);

    const handleCreateHighlight = () => {
        setNewHighlightTitle('');
        setModalVisible(true);
    };

    const handleConfirmCreate = async () => {
        if (!newHighlightTitle.trim()) return;

        const title = newHighlightTitle.trim();
        setModalVisible(false);

        // Wait for modal to close
        setTimeout(async () => {
            try {
                // Pick a cover image
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });

                if (!result.canceled && result.assets[0]) {
                    Alert.alert("Création en cours...", "Upload de l'image...");

                    // Upload to Firebase Storage
                    const localUri = result.assets[0].uri;
                    const response = await fetch(localUri);
                    const blob = await response.blob();

                    const filename = `stories/highlights/${systemId}/${Date.now()}.jpg`;
                    const storageRef = ref(storage, filename);

                    await uploadBytes(storageRef, blob);
                    const coverUrl = await getDownloadURL(storageRef);

                    await StoriesService.createHighlight(
                        systemId,
                        title,
                        coverUrl,
                        [],
                        authorId
                    );
                    loadHighlights();
                    Alert.alert("Succès", "Album créé !");
                }
            } catch (e: any) {
                console.error('Error creating highlight:', e);
                Alert.alert("Erreur", "Impossible de créer: " + (e?.message || "Erreur inconnue"));
            }
        }, 500);
    };

    const handleDeleteAllHighlights = () => {
        Alert.alert(
            "Supprimer tous les albums ?",
            "Cette action supprimera TOUS les albums à la une de TOUS les alters. Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer tout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const count = await StoriesService.deleteAllHighlights();
                            Alert.alert("Succès", `${count} album(s) supprimé(s). Vous pouvez maintenant les recréer correctement sur chaque alter.`);
                            loadHighlights();
                        } catch (e) {
                            Alert.alert("Erreur", "Impossible de supprimer.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) return null; // Or skeleton
    if (!isOwner && highlights.length === 0) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {isOwner && (
                    <TouchableOpacity style={styles.item} onPress={handleCreateHighlight} onLongPress={handleDeleteAllHighlights}>
                        <View style={[styles.circle, styles.addCircle, { borderColor: themeColor }]}>
                            <Ionicons name="add" size={32} color={themeColor} />
                        </View>
                        <Text style={styles.label} numberOfLines={1}>Nouveau</Text>
                    </TouchableOpacity>
                )}

                {highlights.map(highlight => (
                    <TouchableOpacity
                        key={highlight.id}
                        style={styles.item}
                        onPress={() => {
                            // Navigate to viewer (highlight mode)
                            // We need to implement highlight viewing mode in StoryViewer or route
                            Alert.alert(highlight.title, `${highlight.story_ids.length} stories`);
                        }}
                        onLongPress={() => {
                            if (isOwner) {
                                Alert.alert("Options", `Gérer l'album "${highlight.title}"`, [
                                    { text: "Annuler", style: "cancel" },
                                    {
                                        text: "Modifier la couverture",
                                        onPress: async () => {
                                            try {
                                                const result = await ImagePicker.launchImageLibraryAsync({
                                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                    allowsEditing: true,
                                                    aspect: [1, 1],
                                                    quality: 0.8,
                                                });

                                                if (!result.canceled && result.assets[0]) {
                                                    Alert.alert("Upload en cours...", "Veuillez patienter");

                                                    // Upload to Firebase Storage
                                                    const localUri = result.assets[0].uri;
                                                    const response = await fetch(localUri);
                                                    const blob = await response.blob();

                                                    const filename = `stories/highlights/${systemId}/${Date.now()}.jpg`;
                                                    const storageRef = ref(storage, filename);

                                                    await uploadBytes(storageRef, blob);
                                                    const downloadUrl = await getDownloadURL(storageRef);

                                                    await StoriesService.updateHighlightCover(
                                                        highlight.id,
                                                        downloadUrl
                                                    );
                                                    Alert.alert("Succès", "Couverture mise à jour !");
                                                    loadHighlights();
                                                }
                                            } catch (e: any) {
                                                console.error('Error updating cover:', e);
                                                Alert.alert("Erreur", "Impossible de modifier: " + (e?.message || "Erreur inconnue"));
                                            }
                                        }
                                    },
                                    {
                                        text: "Supprimer",
                                        style: "destructive",
                                        onPress: async () => {
                                            await StoriesService.deleteHighlight(highlight.id);
                                            loadHighlights();
                                        }
                                    }
                                ]);
                            }
                        }}
                    >
                        <View style={[styles.circle, { borderColor: colors.border }]}>
                            <Image
                                source={{ uri: highlight.cover_image_url }}
                                style={styles.coverImage}
                            />
                        </View>
                        <Text style={styles.label} numberOfLines={1}>{highlight.title}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>


            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nouveau Highlight</Text>
                        <TextInput
                            style={styles.input}
                            value={newHighlightTitle}
                            onChangeText={setNewHighlightTitle}
                            placeholder="Nom de l'album..."
                            placeholderTextColor="#999"
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmCreate} style={styles.modalButton}>
                                <Text style={styles.modalButtonTextConfirm}>Créer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        marginTop: spacing.md, // Added space above
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        // Removed centering logic
    },
    item: {
        alignItems: 'center',
        width: 70,
    },
    circle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surface,
        borderWidth: 1, // Default border width
        borderColor: colors.border, // Default border color
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        overflow: 'hidden',
    },
    addCircle: {
        borderWidth: 2, // Thicker for add button usually nice
        borderStyle: 'dashed',
        backgroundColor: 'transparent', // Transparent to show background
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    label: {
        fontSize: 12,
        color: colors.text,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: colors.text,
    },
    input: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 20,
        color: colors.text,
        backgroundColor: colors.background,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    modalButton: {
        padding: 10,
    },
    modalButtonTextCancel: {
        color: 'red',
        fontWeight: '600',
    },
    modalButtonTextConfirm: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});
