import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
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
        // For now, simpler flow:
        Alert.alert("Nouveau Highlight", "Créer un album à la une ?", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Créer",
                onPress: async () => {
                    // MVP: Create a dummy one or navigate to selection
                    // Since selection UI is complex, we just prompt name for now to test service
                    Alert.prompt("Titre", "Entrez un nom pour l'album", [
                        { text: "Annuler" },
                        {
                            text: "OK", onPress: async (title?: string) => {
                                if (!title) return;
                                try {
                                    // Pick a cover image
                                    const result = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
                                        aspect: [1, 1],
                                        quality: 0.8,
                                    });

                                    let coverUrl = 'https://via.placeholder.com/150';

                                    if (!result.canceled && result.assets[0]) {
                                        // Upload to Firebase Storage
                                        const localUri = result.assets[0].uri;
                                        const response = await fetch(localUri);
                                        const blob = await response.blob();

                                        const filename = `highlights/${systemId}/${Date.now()}.jpg`;
                                        const storageRef = ref(storage, filename);

                                        await uploadBytes(storageRef, blob);
                                        coverUrl = await getDownloadURL(storageRef);
                                    }

                                    await StoriesService.createHighlight(
                                        systemId,
                                        title,
                                        coverUrl,
                                        [],
                                        authorId
                                    );
                                    loadHighlights();
                                } catch (e) {
                                    console.error('Error creating highlight:', e);
                                    Alert.alert("Erreur", "Impossible de créer.");
                                }
                            }
                        }
                    ]);
                }
            }
        ]);
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

                                                    const filename = `highlights/${systemId}/${Date.now()}.jpg`;
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
                                            } catch (e) {
                                                console.error('Error updating cover:', e);
                                                Alert.alert("Erreur", "Impossible de modifier la couverture.");
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
        </View>
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
});
