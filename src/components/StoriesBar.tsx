import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
    Text,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, typography } from '../lib/theme';
import { getFrameStyle } from '../lib/cosmetics';
import { StoriesService } from '../services/stories';
import { Story } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { triggerHaptic } from '../lib/haptics';

// =====================================================
// STORIES BAR
// Barre horizontale de stories en haut du feed
// Style Instagram avec cercle dégradé pour stories non-vues
// =====================================================


interface StoriesBarProps {
    onStoryPress: (authorId: string, stories: Story[]) => void;
    friendIds?: string[];
    themeColors?: any | null;
}

interface StoryAuthor {
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    authorFrame?: string;
    stories: Story[];
    hasUnviewed: boolean;
}

export const StoriesBar = ({ onStoryPress, friendIds = [], themeColors }: StoriesBarProps) => {
    const { currentAlter, user } = useAuth();
    const [authors, setAuthors] = useState<StoryAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const [myStories, setMyStories] = useState<Story[]>([]);

    useEffect(() => {
        loadStories();
    }, [friendIds]);

    const loadStories = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const stories = await StoriesService.fetchActiveStories(friendIds, user.uid);
            const grouped = StoriesService.groupStoriesByAuthor(stories);

            // Fetch live decorations for all authors to ensure frames are up to date
            const authorIds = grouped.map(g => g.authorId);
            const liveDecorations = await StoriesService.fetchAuthorsDecorations(authorIds);

            // Merge live decorations
            const groupedWithDecorations = grouped.map(g => ({
                ...g,
                authorFrame: liveDecorations[g.authorId] || g.authorFrame
            }));

            // Séparer mes stories des autres
            const mine = groupedWithDecorations.filter(a => a.authorId === currentAlter?.id);
            const others = groupedWithDecorations.filter(a => a.authorId !== currentAlter?.id);

            setMyStories(mine.length > 0 ? mine[0].stories : []);
            setAuthors(others);
        } catch (error: any) {
            // Gérer silencieusement les erreurs de permissions Firestore
            // Ces erreurs sont normales quand les règles de sécurité bloquent l'accès
            if (error?.code === 'permission-denied') {
                // Ignore permissions error
            } else {
                // Log silently or ignore
            }
            // Continuer avec des tableaux vides
            setMyStories([]);
            setAuthors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStory = () => {
        triggerHaptic.selection();
        router.push('/story/create' as any);
    };

    const handleStoryPress = (author: StoryAuthor) => {
        triggerHaptic.selection();
        onStoryPress(author.authorId, author.stories);
    };

    const handleMyStoryPress = () => {
        if (myStories.length > 0 && currentAlter) {
            triggerHaptic.selection();
            Alert.alert(
                "Ma Story",
                "Que souhaitez-vous faire ?",
                [
                    {
                        text: "Annuler",
                        style: "cancel"
                    },
                    {
                        text: "Ajouter une story",
                        onPress: handleCreateStory
                    },
                    {
                        text: "Voir ma story",
                        onPress: () => onStoryPress(currentAlter.id, myStories)
                    }
                ]
            );
        } else {
            handleCreateStory();
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, themeColors && { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="small" color={themeColors?.primary || colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, themeColors && { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* My Story / Add Story */}
                <TouchableOpacity style={styles.storyItem} onPress={handleMyStoryPress}>
                    <View style={styles.avatarContainer}>
                        {(() => {
                            const frameId = currentAlter?.equipped_items?.frame;
                            // Use RING_SIZE (70) for the frame container size
                            const frameStyle = getFrameStyle(frameId, 70);
                            const isImageFrame = !!frameStyle.imageSource;

                            return (
                                <View style={[
                                    styles.viewedRing,
                                    // Remove default styling if we have a special frame
                                    frameId ? frameStyle.containerStyle : {},
                                    // If no frame is equipped, restrict to theme default (use PRIMARY for visibility)
                                    !frameId && themeColors ? { borderColor: themeColors.primary } : {},
                                    // Handle image frames (transparent container)
                                    isImageFrame ? { borderWidth: 0, backgroundColor: 'transparent' } : {},
                                ]}>
                                    {currentAlter?.avatar || currentAlter?.avatar_url ? (
                                        <Image
                                            source={{ uri: currentAlter.avatar || currentAlter.avatar_url }}
                                            style={[styles.avatar]}
                                        />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors?.primary || colors.primary }]}>
                                            <Text style={styles.avatarInitial}>{currentAlter?.name?.charAt(0) || '?'}</Text>
                                        </View>
                                    )}

                                    {/* Frame Overlay Image */}
                                    {frameStyle.imageSource && (
                                        <Image
                                            source={frameStyle.imageSource}
                                            style={{
                                                position: 'absolute',
                                                width: 76,
                                                height: 76,
                                                zIndex: 10,
                                                resizeMode: 'contain'
                                            }}
                                        />
                                    )}
                                </View>
                            );
                        })()}

                        {/* Add button overlay if no stories */}
                        {myStories.length === 0 && (
                            <View style={[styles.addButton, themeColors && { backgroundColor: themeColors.primary, borderColor: themeColors.background }]}>
                                <Ionicons name="add" size={14} color="white" />
                            </View>
                        )}
                    </View>
                    <Text style={[styles.storyName, themeColors && { color: themeColors.text }]} numberOfLines={1}>
                        {myStories.length > 0 ? 'Ma story' : 'Ajouter'}
                    </Text>
                </TouchableOpacity>

                {/* Other Users' Stories */}
                {authors.map((author) => (
                    <TouchableOpacity
                        key={author.authorId}
                        style={styles.storyItem}
                        onPress={() => handleStoryPress(author)}
                    >
                        {(() => {
                            const frameId = author.authorFrame;
                            const frameStyle = getFrameStyle(frameId, 70);
                            const isImageFrame = !!frameStyle.imageSource;

                            return (
                                <View style={styles.avatarContainer}>
                                    <View style={[
                                        // Base style depending on viewed status, but overridden by frameStyle if present
                                        author.hasUnviewed && !frameId ? styles.gradientRing : styles.viewedRing,
                                        frameId ? frameStyle.containerStyle : {},
                                        isImageFrame ? { borderWidth: 0, backgroundColor: 'transparent' } : {},
                                        !frameId && !author.hasUnviewed && themeColors ? { borderColor: themeColors.border } : {}
                                    ]}>
                                        {/* If unviewed AND no frame, use Gradient. If frame, just use frame container. */}
                                        {author.hasUnviewed && !frameId ? (
                                            <LinearGradient
                                                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                                                start={{ x: 0, y: 1 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.gradientRing}
                                            >
                                                <View style={[styles.innerRing, themeColors && { borderColor: themeColors.background }]}>
                                                    {author.authorAvatar ? (
                                                        <Image source={{ uri: author.authorAvatar }} style={styles.avatar} />
                                                    ) : (
                                                        <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors?.primary || colors.primary }]}>
                                                            <Text style={styles.avatarInitial}>{author.authorName?.charAt(0)}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </LinearGradient>
                                        ) : (
                                            <View style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                {/* Content */}
                                                <View style={[
                                                    styles.innerRing,
                                                    frameId ? { width: 64, height: 64, borderWidth: 0 } : { borderColor: themeColors?.border || colors.border }
                                                ]}>
                                                    {author.authorAvatar ? (
                                                        <Image source={{ uri: author.authorAvatar }} style={styles.avatar} />
                                                    ) : (
                                                        <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors?.primary || colors.primary }]}>
                                                            <Text style={styles.avatarInitial}>{author.authorName?.charAt(0)}</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Frame Overlay */}
                                                {frameStyle.imageSource && (
                                                    <Image
                                                        source={frameStyle.imageSource}
                                                        style={{
                                                            position: 'absolute',
                                                            width: 76,
                                                            height: 76,
                                                            zIndex: 10,
                                                            resizeMode: 'contain'
                                                        }}
                                                    />
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })()}
                        <Text style={[styles.storyName, themeColors && { color: themeColors.text }]} numberOfLines={1}>{author.authorName}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const AVATAR_SIZE = 64;
const RING_SIZE = AVATAR_SIZE + 6;

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    loadingContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
    },
    scrollContent: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        gap: spacing.md,
    },
    storyItem: {
        alignItems: 'center',
        width: 72,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.xs,
    },
    gradientRing: {
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerRing: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 2,
        borderColor: colors.backgroundCard,
        overflow: 'hidden',
    },
    viewedRing: {
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        borderWidth: 2,
        borderColor: colors.border,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: AVATAR_SIZE - 4,
        height: AVATAR_SIZE - 4,
        borderRadius: (AVATAR_SIZE - 4) / 2,
    },
    avatarPlaceholder: {
        width: AVATAR_SIZE - 4,
        height: AVATAR_SIZE - 4,
        borderRadius: (AVATAR_SIZE - 4) / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 20,
    },
    addButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.backgroundCard,
    },
    storyName: {
        ...typography.caption,
        color: colors.text,
        textAlign: 'center',
        width: 68,
    },
});
