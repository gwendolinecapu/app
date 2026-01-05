import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Image,
    Text,
    Dimensions,
    StatusBar,
    Platform,
    Animated,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { StoriesService } from '../services/stories';
import { Story } from '../types';
import { colors, spacing, typography } from '../lib/theme';
import { timeAgo } from '../lib/date';
import { useAuth } from '../contexts/AuthContext';

// =====================================================
// STORY VIEWER
// Viewer plein écran pour les stories
// - Progress bar animée
// - Tap gauche/droite pour naviguer
// - Auto-advance après 5s (images)
// =====================================================

import { StoryNativeAd } from './stories/StoryNativeAd';

// Wrapper type for Stories queue
type ViewerItem =
    | { type: 'story'; data: Story }
    | { type: 'ad'; id: string };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 secondes par story image

interface StoryViewerProps {
    visible: boolean;
    stories: Story[];
    initialIndex?: number;
    onClose: () => void;
}

export const StoryViewer = ({ visible, stories, initialIndex = 0, onClose }: StoryViewerProps) => {
    const { user } = useAuth();
    const [viewerItems, setViewerItems] = useState<ViewerItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Initialize items with ads injected
    useEffect(() => {
        if (visible) {
            const items: ViewerItem[] = [];
            let storyCount = 0;

            // Map initial index to new structure? 
            // Simplified: We assume initialIndex maps to the story at that index.
            // But if we inject ads, indices shift.
            // Strategy: Inject ads AFTER the user's current sequence if possible, or interleaved.

            stories.forEach((story, index) => {
                items.push({ type: 'story', data: story });
                storyCount++;

                // Inject ad every 3 stories
                if (storyCount % 3 === 0 && index < stories.length - 1) {
                    items.push({ type: 'ad', id: `ad-${index}` });
                }
            });

            setViewerItems(items);

            // Find the correct index in the new list corresponding to initialIndex
            // Assuming initialIndex refers to original stories array
            // We need to count how many ads are before this story
            let newIndex = 0;
            let originalIndexCounter = 0;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type === 'story') {
                    if (originalIndexCounter === initialIndex) {
                        newIndex = i;
                        break;
                    }
                    originalIndexCounter++;
                }
            }
            setCurrentIndex(newIndex);
        }
    }, [visible, stories, initialIndex]);

    const currentItem = viewerItems[currentIndex];

    useEffect(() => {
        if (visible && currentItem) {
            if (currentItem.type === 'story') {
                startProgress();
                markAsViewed(currentItem.data);
            } else {
                // Ad handles its own progress/timer
                progressAnim.setValue(0); // Reset for visual consistency if needed
            }
        }
    }, [visible, currentIndex, currentItem]);

    const startProgress = () => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                goNext();
            }
        });
    };

    const markAsViewed = async (story: Story) => {
        if (user) {
            try {
                await StoriesService.markStoryAsViewed(story.id, user.uid);
            } catch (err) {
                console.error('Failed to mark story as viewed:', err);
            }
        }
    };

    const goNext = () => {
        if (currentIndex < viewerItems.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handlePress = (event: any) => {
        const x = event.nativeEvent.locationX;
        if (x < SCREEN_WIDTH / 3) {
            goPrev();
        } else {
            goNext();
        }
    };

    const handleDelete = (storyId: string) => {
        progressAnim.stopAnimation();
        Alert.alert(
            "Supprimer la story",
            "Êtes-vous sûr de vouloir supprimer cette story ?",
            [
                { text: "Annuler", style: "cancel", onPress: () => startProgress() },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await StoriesService.deleteStory(storyId);
                            onClose();
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer la story.");
                        }
                    }
                }
            ]
        );
    };

    if (!currentItem) return null;

    // Render Native Ad
    if (currentItem.type === 'ad') {
        return (
            <Modal
                visible={visible}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={onClose}
            >
                <StatusBar backgroundColor="black" barStyle="light-content" />
                <StoryNativeAd
                    onClose={onClose}
                    onNext={goNext}
                    onPrev={goPrev}
                />
            </Modal>
        );
    }

    // Render Normal Story
    const story = currentItem.data;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <StatusBar backgroundColor="black" barStyle="light-content" />
            <View style={styles.container}>
                {/* Progress Bars (Only show for stories, or maybe skip for ads?) 
                    Instagram hides top bars for ads or shows a different one. 
                    Let's show bars for all items to indicate position, but maybe style ads differently?
                    Actually, let's keep it simple: Show bars for everything.
                */}
                <View style={styles.progressContainer}>
                    {viewerItems.map((item, index) => (
                        <View key={index} style={styles.progressBarBg}>
                            <Animated.View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: index < currentIndex
                                            ? '100%'
                                            : index === currentIndex
                                                ? progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                                : '0%',
                                        // Ad items might have different color or style?
                                        backgroundColor: item.type === 'ad' ? '#FFD700' : 'white'
                                    },
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.authorInfo}>
                        {story.author_avatar ? (
                            <Image source={{ uri: story.author_avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarInitial}>{story.author_name?.charAt(0)}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.authorName}>{story.author_name}</Text>
                            <Text style={styles.timestamp}>{timeAgo(story.created_at)}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        {user && (story.author_id === user.uid || story.system_id === user.uid) && (
                            <TouchableOpacity onPress={() => handleDelete(story.id)} style={styles.closeButton}>
                                <Ionicons name="trash-outline" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Story Content */}
                <TouchableOpacity
                    style={styles.storyContent}
                    activeOpacity={1}
                    onPress={handlePress}
                >
                    {story.media_type === 'image' ? (
                        <Image
                            source={{ uri: story.media_url }}
                            style={styles.storyMedia}
                            resizeMode="contain"
                        />
                    ) : (
                        <Video
                            source={{ uri: story.media_url }}
                            style={styles.storyMedia}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay={currentIndex === viewerItems.indexOf(currentItem)} // Only play if active
                            isLooping={false}
                            onPlaybackStatusUpdate={(status) => {
                                if (status.isLoaded && status.didJustFinish) {
                                    goNext();
                                }
                            }}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    progressContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.sm,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        gap: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        zIndex: 10,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    authorName: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    timestamp: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    closeButton: {
        padding: spacing.xs,
    },
    storyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyMedia: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.75,
    },
});
