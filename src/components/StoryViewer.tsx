import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    GestureResponderEvent,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { StoriesService } from '../services/stories';
import { Story, StoryHighlight } from '../types';
import { colors, spacing } from '../lib/theme';
import { timeAgo } from '../lib/date';
import { useAuth } from '../contexts/AuthContext';
import { StoryNativeAd } from './stories/StoryNativeAd';

// =====================================================
// STORY VIEWER
// Enhanced Full Screen Story Viewer
// - Unified Modal structure to prevent flashing
// - Native driver animations for performance
// - Intelligent Ad injection
// =====================================================

type ViewerItem =
    | { type: 'story'; data: Story }
    | { type: 'ad'; id: string };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

interface StoryViewerProps {
    visible: boolean;
    stories: Story[];
    initialIndex?: number;
    onClose: () => void;
}

export const StoryViewer = ({ visible, stories, initialIndex = 0, onClose }: StoryViewerProps) => {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Highlight selection state
    const [showHighlightModal, setShowHighlightModal] = useState(false);
    const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
    const [loadingHighlights, setLoadingHighlights] = useState(false);
    // Custom Modal State
    const [createHighlightModalVisible, setCreateHighlightModalVisible] = useState(false);
    const [newHighlightTitle, setNewHighlightTitle] = useState('');

    const createNewHighlightWithStory = (story: Story) => {
        setNewHighlightTitle('');
        setCreateHighlightModalVisible(true);
    };

    const handleConfirmCreateHighlight = async () => {
        if (!newHighlightTitle.trim() || !currentItem || currentItem.type !== 'story') return;

        const title = newHighlightTitle.trim();
        const story = currentItem.data;
        setCreateHighlightModalVisible(false);

        // Wait for modal transition
        setTimeout(async () => {
            try {
                await StoriesService.createHighlight(
                    story.system_id,
                    title,
                    story.media_url,
                    [story.id],
                    story.author_id
                );
                Alert.alert("Succès", "Album créé avec cette story !");
                setShowHighlightModal(false);
                if (currentItem?.type === 'story' && currentItem.data.media_type === 'image') {
                    startProgress();
                }
            } catch (e) {
                console.error("Error creating highlight:", e);
                Alert.alert("Erreur", "Impossible de créer l'album.");
            }
        }, 300);
    };

    // Animation value for progress bar (0 -> 1)
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Memoize the items list + ads injection
    // This runs once when 'stories' prop changes
    const viewerItems: ViewerItem[] = useMemo(() => {
        const items: ViewerItem[] = [];
        let storyCount = 0;

        stories.forEach((story, index) => {
            items.push({ type: 'story', data: story });
            storyCount++;

            // Inject ad every 3 stories, but not as the very last item if possible
            if (storyCount % 3 === 0 && index < stories.length - 1) {
                items.push({ type: 'ad', id: `ad-${index}` });
            }
        });
        return items;
    }, [stories]);

    // Calculate the 'start index' in the new mixed list based on the requested initialIndex
    useEffect(() => {
        if (visible) {
            let targetIndex = 0;
            let storiesSeen = 0;

            // Find the index in viewerItems that matches the Nth story (initialIndex)
            for (let i = 0; i < viewerItems.length; i++) {
                if (viewerItems[i].type === 'story') {
                    if (storiesSeen === initialIndex) {
                        targetIndex = i;
                        break;
                    }
                    storiesSeen++;
                }
            }
            setCurrentIndex(targetIndex);
            progressAnim.setValue(0);
        }
    }, [visible, initialIndex, viewerItems, progressAnim]);

    const currentItem = viewerItems[currentIndex];

    // -- Animation Logic --

    const startProgress = useCallback(() => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: true, // Optimized: runs on UI thread (requires transform/opacity)
        }).start(({ finished }) => {
            if (finished) {
                goNext();
            }
        });
    }, [progressAnim]);

    // Handle play/pause or reset when index changes
    useEffect(() => {
        if (!visible || !currentItem) return;

        if (currentItem.type === 'story') {
            // For video, we might want to wait for load? existing logic just starts timer.
            // If it's a video, the <Video> component handles the 'goNext' on finish, 
            // BUT we still run the bar for visual feedback or fallback? 
            // The original code ran startProgress() for both.
            // Let's keep consistent: if image, run timer. If video, let video drive (or sync).

            if (currentItem.data.media_type === 'image') {
                startProgress();
            } else {
                // Video: we reset bar but don't auto-run timer blind, 
                // we let the video duration drive it or just freeze it at 0 until we support video progress.
                // Current implementation simplicity: run timer strictly for images.
                progressAnim.setValue(0);
            }

            markAsViewed(currentItem.data);
        } else {
            // Ad item
            progressAnim.setValue(0);
            // Ads usually have their own internal timer or close button.
        }

        return () => {
            progressAnim.stopAnimation();
        };
    }, [visible, currentIndex, currentItem, startProgress, progressAnim]);

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

    const handlePress = (event: GestureResponderEvent) => {
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
                {
                    text: "Annuler", style: "cancel", onPress: () => {
                        // Resume if it was an image
                        if (currentItem?.type === 'story' && currentItem.data.media_type === 'image') {
                            startProgress();
                        }
                    }
                },
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

    const openHighlightModal = async (story: Story) => {
        progressAnim.stopAnimation();
        setShowHighlightModal(true);
        setLoadingHighlights(true);
        try {
            const data = await StoriesService.fetchHighlights(story.author_id);
            setHighlights(data);
        } catch (error) {
            console.error('Error fetching highlights:', error);
            setHighlights([]);
        } finally {
            setLoadingHighlights(false);
        }
    };

    const addToHighlight = async (highlightId: string, storyId: string) => {
        try {
            await StoriesService.addStoryToHighlight(highlightId, storyId);
            Alert.alert("Succès", "Story ajoutée à l'album !");
            setShowHighlightModal(false);
            // Resume playback if image
            if (currentItem?.type === 'story' && currentItem.data.media_type === 'image') {
                startProgress();
            }
        } catch (error) {
            Alert.alert("Erreur", "Impossible d'ajouter la story.");
        }
    };



    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false} // Full screen black
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <StatusBar backgroundColor="black" barStyle="light-content" />
            <View style={styles.container}>

                {/* 
                  1. CONTENT LAYER 
                  We render content first so bars/header appear on top 
                */}
                {currentItem ? (
                    currentItem.type === 'ad' ? (
                        <View style={styles.fullScreenCenter}>
                            <StoryNativeAd
                                onClose={onClose}
                                onNext={goNext}
                                onPrev={goPrev}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.storyContent}
                            activeOpacity={1}
                            onPress={handlePress}
                        >
                            {currentItem.data.media_type === 'image' ? (
                                <Image
                                    source={{ uri: currentItem.data.media_url }}
                                    style={styles.storyMedia}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Video
                                    source={{ uri: currentItem.data.media_url }}
                                    style={styles.storyMedia}
                                    resizeMode={ResizeMode.CONTAIN}
                                    shouldPlay={visible && currentIndex === viewerItems.indexOf(currentItem)}
                                    isLooping={false}
                                    useNativeControls={false}
                                    onPlaybackStatusUpdate={(status) => {
                                        if (status.isLoaded && status.didJustFinish) {
                                            goNext();
                                        }
                                        // Optional: Update progress bar based on video position
                                        // if (status.isLoaded && status.durationMillis) {
                                        //    const progress = status.positionMillis / status.durationMillis;
                                        //    progressAnim.setValue(progress);
                                        // }
                                    }}
                                />
                            )}
                        </TouchableOpacity>
                    )
                ) : null}

                {/* 
                  2. OVERLAY LAYER (Progress Bars + Header) 
                  Only show standard overlays if it's NOT an ad, or if we want them over ads too?
                  Typically ads manage their own UI. We will hide custom overlay for Ads 
                  to avoid conflict with the Ad's close button/timers.
                */}
                {currentItem && currentItem.type === 'story' && (
                    <View style={styles.overlayContainer} pointerEvents="box-none">
                        {/* Progress Bars */}
                        <View style={styles.progressContainer}>
                            {viewerItems.map((item, index) => {
                                const isCurrent = index === currentIndex;
                                const isPast = index < currentIndex;

                                // Optimization: use scaleX instead of width % for native driver
                                const scaleX = isCurrent ? progressAnim : (isPast ? 1 : 0);

                                return (
                                    <View key={index} style={styles.progressBarBg}>
                                        <Animated.View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    backgroundColor: item.type === 'ad' ? colors.secondary : 'white',
                                                    // When using scaleX, we need logic:
                                                    // If explicit number (0 or 1), just set it.
                                                    // If Animated.Value, allow interpolation if needed, or direct pass if compatible.
                                                    transform: [{
                                                        scaleX: scaleX as any // TS: Animated.Value is valid for scaleX
                                                    }]
                                                },
                                            ]}
                                        />
                                    </View>
                                );
                            })}
                        </View>

                        {/* Header Info */}
                        <View style={styles.header}>
                            <View style={styles.authorInfo}>
                                {currentItem.data.author_avatar ? (
                                    <Image source={{ uri: currentItem.data.author_avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.avatarInitial}>
                                            {currentItem.data.author_name?.charAt(0) || '?'}
                                        </Text>
                                    </View>
                                )}
                                <View>
                                    <Text style={styles.authorName}>{currentItem.data.author_name}</Text>
                                    <Text style={styles.timestamp}>{timeAgo(currentItem.data.created_at)}</Text>
                                </View>
                            </View>

                            <View style={styles.headerActions}>
                                {user && (currentItem.data.author_id === user.uid || currentItem.data.system_id === user.uid) && (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => openHighlightModal(currentItem.data)}
                                            style={styles.iconButton}
                                        >
                                            <Ionicons name="heart-outline" size={24} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(currentItem.data.id)} style={styles.iconButton}>
                                            <Ionicons name="trash-outline" size={24} color="white" />
                                        </TouchableOpacity>
                                    </>
                                )}
                                <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                                    <Ionicons name="close" size={28} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Highlight Selection Modal */}
            <Modal
                visible={showHighlightModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowHighlightModal(false);
                    if (currentItem?.type === 'story' && currentItem.data.media_type === 'image') {
                        startProgress();
                    }
                }}
            >
                <View style={styles.highlightModalOverlay}>
                    <View style={styles.highlightModalContent}>
                        <View style={styles.highlightModalHeader}>
                            <Text style={styles.highlightModalTitle}>Ajouter à un album</Text>
                            <TouchableOpacity onPress={() => {
                                setShowHighlightModal(false);
                                if (currentItem?.type === 'story' && currentItem.data.media_type === 'image') {
                                    startProgress();
                                }
                            }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {createHighlightModalVisible ? (
                            <View>
                                <Text style={{ fontSize: 16, marginBottom: 16, color: colors.text }}>
                                    Entrez le nom du nouvel album :
                                </Text>
                                <TextInput
                                    style={styles.highlightInput}
                                    value={newHighlightTitle}
                                    onChangeText={setNewHighlightTitle}
                                    placeholder="Titre..."
                                    placeholderTextColor="#999"
                                    autoFocus
                                />
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        onPress={() => setCreateHighlightModalVisible(false)}
                                        style={{ padding: 8 }}
                                    >
                                        <Text style={{ color: 'red', fontWeight: '600' }}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleConfirmCreateHighlight}
                                        style={{ padding: 8, backgroundColor: colors.primary, borderRadius: 8 }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Créer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            loadingHighlights ? (
                                <Text style={styles.highlightModalLoading}>Chargement...</Text>
                            ) : (
                                <>
                                    {/* Create new highlight option */}
                                    <TouchableOpacity
                                        style={styles.highlightOption}
                                        onPress={() => {
                                            if (currentItem?.type === 'story') {
                                                createNewHighlightWithStory(currentItem.data);
                                            }
                                        }}
                                    >
                                        <View style={[styles.highlightOptionIcon, { borderStyle: 'dashed' }]}>
                                            <Ionicons name="add" size={24} color={colors.primary} />
                                        </View>
                                        <Text style={styles.highlightOptionText}>Nouvel album</Text>
                                    </TouchableOpacity>

                                    {/* Existing highlights */}
                                    {highlights.map(highlight => (
                                        <TouchableOpacity
                                            key={highlight.id}
                                            style={styles.highlightOption}
                                            onPress={() => {
                                                if (currentItem?.type === 'story') {
                                                    addToHighlight(highlight.id, currentItem.data.id);
                                                }
                                            }}
                                        >
                                            <Image
                                                source={{ uri: highlight.cover_image_url }}
                                                style={styles.highlightOptionCover}
                                            />
                                            <Text style={styles.highlightOptionText}>{highlight.title}</Text>
                                            <Text style={styles.highlightOptionCount}>
                                                {highlight.story_ids.length} stories
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                    {highlights.length === 0 && (
                                        <Text style={styles.highlightModalEmpty}>
                                            Aucun album existant. Créez-en un nouveau !
                                        </Text>
                                    )}
                                </>
                            )
                        )}
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullScreenCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between', // Pushes content to edges if needed, main content handles mid
    },
    progressContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.sm,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        gap: 4,
        height: 4 + (Platform.OS === 'ios' ? 60 : 40), // explicit height to contain bars
    },
    progressBarBg: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        flex: 1, // Fills container
        height: '100%',
        backgroundColor: 'white',
        // Important for scaleX animation: transform origin
        // Default origin is center, we want left-to-right
        // React Native doesn't support 'transformOrigin' in styles easily for older versions,
        // but let's check. If not, this might grow from center.
        // FIX: For Left-to-Right grow with center pivot (default), we might need a workaround 
        // OR simply set width via native driver if supported (width is NOT supported by native driver).
        // Standard trick: Width 100%, translateX starting from -100% to 0%. 
        // Simpler trick: Render fill as full width, animate translateX. 
        // Actually, let's revert to JS driver for width if simple scaleX origin is tricky in RN without layout.
        // Wait, 'width' is efficient enough for simple bars usually.
        // BUT user asked for optimization. 
        // Let's TRY scaleX. If it grows from center, it looks weird.
        // To fix scaleX growing from center: 
        // Wrap in View with alignItems: 'flex-start' ? No, transform applies to element.
        // STANDARD FIX: translateX.
        // Start: translateX: -width. End: translateX: 0.
        // But width is dynamic (flex:1).
        // fallback: Use Layout to get width? Overkill.
        // Revert to useNativeDriver: false for width is acceptable for this specific UI if scaleX is complex.
        // Let's stick to useNativeDriver: false for width for safety in this iteration 
        // UNLESS we use string interpolation '0%' -> '100%'.
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        zIndex: 10,
        marginTop: 10,
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
    headerActions: {
        flexDirection: 'row',
        gap: spacing.md
    },
    iconButton: {
        padding: spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.2)', // improved hit area visibility
        borderRadius: 20,
    },
    storyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    storyMedia: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT, // Full immserive
    },
    // Highlight Modal Styles
    highlightModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    highlightModalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        maxHeight: '60%',
    },
    highlightModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    highlightModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    highlightModalLoading: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginVertical: spacing.lg,
    },
    highlightModalEmpty: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginVertical: spacing.md,
    },
    highlightOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.md,
    },
    highlightOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    highlightOptionCover: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    highlightOptionText: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    highlightOptionCount: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    highlightInput: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        color: colors.text,
        backgroundColor: colors.background, // Ensure visibility
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
});

