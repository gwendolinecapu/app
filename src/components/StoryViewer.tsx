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
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentStory = stories[currentIndex];

    useEffect(() => {
        if (visible && currentStory) {
            startProgress();
            markAsViewed();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible, currentIndex]);

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

    const markAsViewed = async () => {
        if (currentStory && user) {
            try {
                await StoriesService.markStoryAsViewed(currentStory.id, user.uid);
            } catch (err) {
                console.error('Failed to mark story as viewed:', err);
            }
        }
    };

    const goNext = () => {
        if (currentIndex < stories.length - 1) {
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

    if (!currentStory) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <StatusBar backgroundColor="black" barStyle="light-content" />
            <View style={styles.container}>
                {/* Progress Bars */}
                <View style={styles.progressContainer}>
                    {stories.map((_, index) => (
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
                                    },
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.authorInfo}>
                        {currentStory.author_avatar ? (
                            <Image source={{ uri: currentStory.author_avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarInitial}>{currentStory.author_name?.charAt(0)}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.authorName}>{currentStory.author_name}</Text>
                            <Text style={styles.timestamp}>{timeAgo(currentStory.created_at)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Story Content */}
                <TouchableOpacity
                    style={styles.storyContent}
                    activeOpacity={1}
                    onPress={handlePress}
                >
                    {currentStory.media_type === 'image' ? (
                        <Image
                            source={{ uri: currentStory.media_url }}
                            style={styles.storyMedia}
                            resizeMode="contain"
                        />
                    ) : (
                        <Video
                            source={{ uri: currentStory.media_url }}
                            style={styles.storyMedia}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
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
