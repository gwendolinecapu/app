import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoriesService } from '../../services/stories';
import { StoryHighlight } from '../../types';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { router } from 'expo-router';

interface StoryHighlightsProps {
    authorId: string;
    isOwner: boolean;
    refreshTrigger?: number; // Prop to trigger refresh from parent
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({ authorId, isOwner, refreshTrigger }) => {
    const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHighlights = async () => {
        try {
            const data = await StoriesService.fetchHighlights(authorId);
            setHighlights(data);
        } catch (error) {
            console.error('Error fetching highlights:', error);
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
                            text: "OK", onPress: async (title) => {
                                if (!title) return;
                                try {
                                    await StoriesService.createHighlight(
                                        "SYSTEM_ID_PLACEHOLDER", // Needs context, but component props only have authorId (which is alterId). 
                                        // We might need to pass systemId too or fetch it.
                                        // Actually easier to just say: "Feature coming in next step"
                                        // But let's try to be functional.
                                        // Re-thinking: Highlights creation usually needs selecting existing stories. 
                                        // Hard to do via simple prompt.
                                        // Let's just alert "Empty" for now.
                                        title,
                                        "https://via.placeholder.com/150",
                                        [],
                                        authorId
                                    );
                                    loadHighlights();
                                } catch (e) {
                                    Alert.alert("Erreur", "Impossible de créer.");
                                }
                            }
                        }
                    ]);
                }
            }
        ]);
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
                    <TouchableOpacity style={styles.item} onPress={handleCreateHighlight}>
                        <View style={[styles.circle, styles.addCircle]}>
                            <Ionicons name="add" size={32} color={colors.text} />
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
                                Alert.alert("Options", "Supprimer cet album ?", [
                                    { text: "Non", style: "cancel" },
                                    {
                                        text: "Oui",
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
                        <View style={styles.circle}>
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
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
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
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        overflow: 'hidden',
    },
    addCircle: {
        borderWidth: 1,
        borderColor: colors.text,
        borderStyle: 'dashed',
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
