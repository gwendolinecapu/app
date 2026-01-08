import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    StatusBar,
    ScrollView,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { captureRef } from 'react-native-view-shot';
import { storage } from '../../src/lib/firebase';
import { StoriesService } from '../../src/services/stories';
import { StoryHighlight } from '../../src/types';
import { colors, spacing, typography } from '../../src/lib/theme';
import { getThemeColors } from '../../src/lib/cosmetics';
import { useAuth } from '../../src/contexts/AuthContext';
import { triggerHaptic } from '../../src/lib/haptics';
import { Canvas, EditorLayer } from '../../src/components/story-editor/Canvas';
import { useMonetization } from '../../src/contexts/MonetizationContext';

// =====================================================
// CREATE STORY SCREEN (IG STYLE) - FIXED & ENHANCED
// =====================================================

export default function CreateStoryScreen() {
    const { currentAlter, user } = useAuth();
    const { isPremium, presentPaywall } = useMonetization();
    const themeColors = currentAlter?.equipped_items?.theme ? getThemeColors(currentAlter.equipped_items.theme) : null;

    // Legacy state for Video or simple preview
    const [selectedMedia, setSelectedMedia] = useState<{
        uri: string;
        type: 'image' | 'video';
    } | null>(null);

    // Editor State
    const [layers, setLayers] = useState<EditorLayer[]>([]);
    const [editorMode, setEditorMode] = useState(false);
    const canvasRef = useRef(null);
    const [textInputVisible, setTextInputVisible] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [currentTextColor, setCurrentTextColor] = useState('#ffffff');
    const [textBackgroundEnabled, setTextBackgroundEnabled] = useState(false);

    // Background & UI State
    const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#000000');
    const [canvasBackgroundGradient, setCanvasBackgroundGradient] = useState<[string, string, ...string[]] | null>(null);
    const [bgColorPickerVisible, setBgColorPickerVisible] = useState(false);

    const baseColors = [
        '#000000', '#ffffff',
        '#ef4444', // Red
        '#f97316', // Orange
        '#facc15', // Yellow
        '#22c55e', // Green
        '#0ea5e9', // Sky Blue
        '#3b82f6', // Blue
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#be123c', // Rose
        '#1e293b', // Slate
    ];
    const pastelColors = ['#FFD1DC', '#FFDAB9', '#FFF9CA', '#B2FAAF', '#AEC6CF', '#B39EB5', '#E6E6FA'];
    const backgroundColors = [...baseColors, ...pastelColors];

    const backgroundGradients = [
        { id: 'sunset', colors: ['#f83600', '#f9d423'] as [string, string, ...string[]] },
        { id: 'ocean', colors: ['#43e97b', '#38f9d7'] as [string, string, ...string[]] },
        { id: 'purple', colors: ['#667eea', '#764ba2'] as [string, string, ...string[]] },
        { id: 'candy', colors: ['#ee9ca7', '#ffdde1'] as [string, string, ...string[]] },
        { id: 'night', colors: ['#09203f', '#537895'] as [string, string, ...string[]] },
        { id: 'deep_sky', colors: ['#00c6ff', '#0072ff'] as [string, string, ...string[]] },
    ];

    const lightColors = ['#ffffff', '#facc15', '#0ea5e9', '#f97316', '#22c55e', ...pastelColors];
    const isUiDark = lightColors.includes(canvasBackgroundColor);
    const uiColor = isUiDark ? 'black' : 'white';

    const toggleBackgroundColor = () => {
        setBgColorPickerVisible(!bgColorPickerVisible);
    };

    const [uploading, setUploading] = useState(false);

    // Highlight selection state
    const [showHighlightModal, setShowHighlightModal] = useState(false);
    const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
    const [loadingHighlights, setLoadingHighlights] = useState(false);
    const [selectedHighlight, setSelectedHighlight] = useState<StoryHighlight | null>(null);
    const [addToHighlight, setAddToHighlight] = useState(false);

    // New Highlight Creation Modal State (Cross-Platform)
    const [createHighlightModalVisible, setCreateHighlightModalVisible] = useState(false);
    const [newHighlightTitle, setNewHighlightTitle] = useState('');

    const pickMedia = async (type: 'camera' | 'gallery') => {
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false,
            quality: 0.8,
            videoMaxDuration: 30,
        };

        const result = type === 'camera'
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];

            if (asset.type === 'video') {
                setSelectedMedia({ uri: asset.uri, type: 'video' });
                setEditorMode(false);
                setLayers([]);
            } else {
                const newLayer: EditorLayer = {
                    id: Date.now().toString(),
                    type: 'image',
                    content: asset.uri,
                };
                setLayers(prev => [...prev, newLayer]);
                setEditorMode(true);
                setSelectedMedia(null);
            }
        }
    };

    const addText = () => {
        if (!currentText.trim()) {
            setTextInputVisible(false);
            return;
        }

        const newLayer: EditorLayer = {
            id: Date.now().toString(),
            type: 'text',
            content: currentText,
            color: textBackgroundEnabled ? (currentTextColor === '#ffffff' ? '#000000' : '#ffffff') : currentTextColor,
            backgroundColor: textBackgroundEnabled ? currentTextColor : undefined,
        };
        setLayers(prev => [...prev, newLayer]);
        setEditorMode(true);
        setTextInputVisible(false);
        setCurrentText('');
        setTextBackgroundEnabled(false);
    };

    const loadHighlights = async () => {
        if (!currentAlter) return;
        setLoadingHighlights(true);
        try {
            const data = await StoriesService.fetchHighlights(currentAlter.id);
            setHighlights(data);
        } catch (error) {
            console.error('Error fetching highlights:', error);
            setHighlights([]);
        } finally {
            setLoadingHighlights(false);
        }
    };

    const openHighlightModal = () => {
        loadHighlights();
        setShowHighlightModal(true);
    };

    const handleCreateNewHighlight = async () => {
        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Nouvel album',
                'Donnez un titre à votre album',
                (title) => {
                    if (title && title.trim().length > 0) {
                        // Wait for Alert to close before opening Image Picker
                        setTimeout(async () => {
                            try {
                                console.log("Starting highlight creation flow for:", title);
                                // 1. Pick Image
                                const result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                    allowsEditing: true,
                                    aspect: [1, 1],
                                    quality: 0.8,
                                });

                                if (!result.canceled) {
                                    setLoadingHighlights(true);
                                    // 2. Upload Image
                                    const response = await fetch(result.assets[0].uri);
                                    const blob = await response.blob();
                                    const storageRef = ref(storage, `highlight-covers/${Date.now()}`);
                                    await uploadBytes(storageRef, blob);
                                    const coverUrl = await getDownloadURL(storageRef);

                                    // 3. Create Highlight
                                    const newHighlight = await StoriesService.createHighlight(
                                        user!.uid, // systemId
                                        title.trim(),
                                        coverUrl,
                                        [], // Empty initially, story will be added on publish
                                        currentAlter?.id
                                    );

                                    // 4. Select it
                                    setHighlights(prev => [newHighlight, ...prev]);
                                    setSelectedHighlight(newHighlight);
                                    setAddToHighlight(true);
                                    setShowHighlightModal(false);
                                } else {
                                    console.log("Image picker canceled");
                                }
                            } catch (error) {
                                Alert.alert('Erreur', "Impossible de créer l'album");
                                console.error("Error creating highlight:", error);
                            } finally {
                                setLoadingHighlights(false);
                            }
                        }, 500);
                    }
                },
                'plain-text'
            );
        } else {
            Alert.alert("Info", "La création d'album n'est pas encore supportée ici sur Android.");
        }
    };

    const handlePublish = async () => {
        if ((!selectedMedia && layers.length === 0) || !currentAlter || !user) return;

        setUploading(true);
        triggerHaptic.medium();

        try {
            let mediaUri = selectedMedia?.uri;
            let mediaType = selectedMedia?.type || 'image';

            if (editorMode && layers.length > 0) {
                try {
                    const uri = await captureRef(canvasRef, {
                        format: 'jpg',
                        quality: 0.8,
                    });
                    mediaUri = uri;
                    mediaType = 'image';
                } catch (e) {
                    console.error("Capture failed", e);
                    Alert.alert("Erreur", "Impossible de générer l'image");
                    setUploading(false);
                    return;
                }
            }

            if (!mediaUri) return;

            const response = await fetch(mediaUri);
            const blob = await response.blob();

            const ext = mediaType === 'video' ? 'mp4' : 'jpg';
            const filename = `stories/${user.uid}/${Date.now()}.${ext}`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);

            const createdStory = await StoriesService.createStory({
                authorId: currentAlter.id,
                authorName: currentAlter.name,
                authorAvatar: currentAlter.avatar || currentAlter.avatar_url,
                authorFrame: currentAlter.equipped_items?.frame,
                systemId: user.uid,
                mediaUrl: downloadUrl,
                mediaType: mediaType,
            });

            // Add to highlight if selected
            if (addToHighlight && selectedHighlight) {
                try {
                    await StoriesService.addStoryToHighlight(selectedHighlight.id, createdStory.id);
                } catch (e) {
                    console.error('Failed to add to highlight:', e);
                    // Don't fail the whole publish for this
                }
            }
            // Note: Creating new highlight with prompt was causing async issues
            // User should create highlight from profile after story is published

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
        <View style={[styles.container, { backgroundColor: canvasBackgroundColor }]}>
            <StatusBar barStyle={isUiDark ? 'dark-content' : 'light-content'} />

            {/* Canvas - Full Screen Behind */}
            <View style={styles.canvasContainer}>
                {editorMode ? (
                    <Canvas
                        ref={canvasRef}
                        layers={layers}
                        backgroundColor={canvasBackgroundGradient ? undefined : canvasBackgroundColor}
                        backgroundGradient={canvasBackgroundGradient || undefined}
                        onDeleteLayer={(id) => setLayers(prev => prev.filter(l => l.id !== id))}
                    />
                ) : selectedMedia ? (
                    <Image source={{ uri: selectedMedia.uri }} style={styles.fullscreenImage} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="image-outline" size={64} color={isUiDark ? '#333' : '#666'} />
                        <Text style={[styles.placeholderText, { color: isUiDark ? '#333' : '#666' }]}>Ajouter une photo</Text>
                    </View>
                )}
            </View>

            {/* Top Toolbar (Overlay) */}
            <View style={styles.topToolbar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="close" size={32} color={uiColor} />
                </TouchableOpacity>

                <View style={styles.tools}>
                    <TouchableOpacity onPress={() => setTextInputVisible(true)} style={styles.iconButton}>
                        <View style={[styles.textIconCircle, { backgroundColor: isUiDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                            <Text style={[styles.textIconLabel, { color: uiColor }]}>Aa</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleBackgroundColor} style={styles.iconButton}>
                        <View style={[styles.colorDot, { backgroundColor: canvasBackgroundColor, borderColor: uiColor, borderWidth: 2 }]} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => pickMedia('gallery')} style={styles.iconButton}>
                        <Ionicons name="images-outline" size={30} color={uiColor} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => pickMedia('camera')} style={styles.iconButton}>
                        <Ionicons name="camera-outline" size={30} color={uiColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Background Color Palette */}
            {bgColorPickerVisible && (
                <View style={styles.colorPaletteWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.colorPaletteScroll}
                    >
                        {/* Solid Colors (Including Free Pastels) */}
                        {backgroundColors.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.paletteDot,
                                    { backgroundColor: c, borderColor: uiColor },
                                    canvasBackgroundColor === c && !canvasBackgroundGradient && styles.paletteDotSelected,
                                ]}
                                onPress={() => {
                                    setCanvasBackgroundColor(c);
                                    setCanvasBackgroundGradient(null);
                                    setEditorMode(true);
                                }}
                            />
                        ))}

                        {/* Gradients (Premium) */}
                        {backgroundGradients.map(g => {
                            const locked = !isPremium;
                            const isSelected = canvasBackgroundGradient?.join(',') === g.colors.join(',');

                            return (
                                <TouchableOpacity
                                    key={g.id}
                                    style={[
                                        styles.paletteDot,
                                        { borderColor: uiColor, overflow: 'hidden' },
                                        isSelected && styles.paletteDotSelected,
                                        locked && { opacity: 0.8 }
                                    ]}
                                    onPress={() => {
                                        if (locked) {
                                            presentPaywall();
                                            return;
                                        }
                                        setCanvasBackgroundGradient(g.colors);
                                        setCanvasBackgroundColor(g.colors[0]);
                                        setEditorMode(true);
                                    }}
                                >
                                    <LinearGradient colors={g.colors} style={StyleSheet.absoluteFill} />
                                    {locked && (
                                        <View style={styles.lockIconContainer}>
                                            <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.8)" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Bottom Bar (Overlay) */}
            <View style={styles.bottomBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={[styles.yourStoryButton, { backgroundColor: isUiDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }]}
                        onPress={handlePublish}
                        disabled={(layers.length === 0 && !selectedMedia) || uploading}
                    >
                        <Image
                            source={{ uri: currentAlter?.avatar || currentAlter?.avatar_url || 'https://via.placeholder.com/50' }}
                            style={styles.miniAvatar}
                        />
                        <Text style={[styles.storyLabel, { color: uiColor }]}>Votre Story</Text>
                    </TouchableOpacity>

                    {/* Highlight Toggle Button */}
                    <TouchableOpacity
                        style={[
                            styles.highlightToggle,
                            { backgroundColor: isUiDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)', marginLeft: 8 },
                            addToHighlight && { backgroundColor: themeColors?.primary || colors.primary }
                        ]}
                        onPress={() => {
                            if (!addToHighlight) {
                                openHighlightModal();
                            } else {
                                setAddToHighlight(false);
                                setSelectedHighlight(null);
                            }
                        }}
                    >
                        <Ionicons
                            name={addToHighlight ? "heart" : "heart-outline"}
                            size={20}
                            color={addToHighlight ? "white" : uiColor}
                        />
                        {selectedHighlight && (
                            <Text style={[styles.highlightToggleText, { color: 'white' }]} numberOfLines={1}>
                                {selectedHighlight.title}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.publishFab}
                    onPress={handlePublish}
                    disabled={(layers.length === 0 && !selectedMedia) || uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Ionicons name="arrow-forward" size={28} color="black" />
                    )}
                </TouchableOpacity>
            </View>


            {/* Text Input Modal */}
            <Modal visible={textInputVisible} transparent animationType="fade">
                <View style={styles.textInputContainer}>
                    <View style={styles.textInputActions}>
                        <TouchableOpacity onPress={() => setTextInputVisible(false)}>
                            <Text style={styles.cancelText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setTextBackgroundEnabled(!textBackgroundEnabled)} style={styles.bgToggleButton}>
                            <View style={[styles.bgToggleIcon, textBackgroundEnabled && { backgroundColor: 'white' }]}>
                                <Text style={[styles.bgToggleText, textBackgroundEnabled && { color: 'black' }]}>A</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={addText}>
                            <Text style={styles.doneText}>Terminé</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                color: textBackgroundEnabled ? (currentTextColor === '#ffffff' ? '#000000' : '#ffffff') : currentTextColor,
                                backgroundColor: textBackgroundEnabled ? currentTextColor : undefined,
                                borderRadius: textBackgroundEnabled ? 10 : 0
                            }
                        ]}
                        value={currentText}
                        onChangeText={setCurrentText}
                        autoFocus
                        placeholder="Tapez..."
                        placeholderTextColor="#ccc"
                        multiline
                    />
                    <View style={styles.colorPicker}>
                        {['#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#9333ea', '#f97316'].map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorDot, { backgroundColor: c }, currentTextColor === c && styles.colorDotSelected]}
                                onPress={() => setCurrentTextColor(c)}
                            />
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Highlight Selection Modal */}
            <Modal visible={showHighlightModal} transparent animationType="slide">
                <View style={styles.highlightModalOverlay}>
                    <View style={[
                        styles.highlightModalContent,
                        themeColors && { backgroundColor: themeColors.backgroundCard }
                    ]}>
                        <View style={styles.highlightModalHeader}>
                            <Text style={[
                                styles.highlightModalTitle,
                                themeColors && { color: themeColors.text }
                            ]}>
                                Ajouter à un album
                            </Text>
                            <TouchableOpacity onPress={() => setShowHighlightModal(false)}>
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={themeColors ? themeColors.text : colors.text}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Create New Highlight Button */}
                        <TouchableOpacity
                            style={styles.highlightOption}
                            onPress={handleCreateNewHighlight}
                        >
                            <View style={[styles.createHighlightIcon, themeColors && { borderColor: themeColors.primary }]}>
                                <Ionicons name="add" size={24} color={themeColors ? themeColors.primary : colors.primary} />
                            </View>
                            <Text style={[
                                styles.highlightOptionText,
                                themeColors && { color: themeColors.text }
                            ]}>Nouveau...</Text>
                        </TouchableOpacity>

                        {loadingHighlights ? (
                            <Text style={[
                                styles.highlightModalLoading,
                                themeColors && { color: themeColors.textSecondary }
                            ]}>Chargement...</Text>
                        ) : (
                            <>
                                {highlights.map(highlight => (
                                    <TouchableOpacity
                                        key={highlight.id}
                                        style={styles.highlightOption}
                                        onPress={() => {
                                            setAddToHighlight(true);
                                            setSelectedHighlight(highlight);
                                            setShowHighlightModal(false);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: highlight.cover_image_url }}
                                            style={styles.highlightOptionCover}
                                        />
                                        <Text style={[
                                            styles.highlightOptionText,
                                            themeColors && { color: themeColors.text }
                                        ]}>{highlight.title}</Text>
                                        <Text style={[
                                            styles.highlightOptionCount,
                                            themeColors && { color: themeColors.textSecondary }
                                        ]}>
                                            {highlight.story_ids.length} stories
                                        </Text>
                                    </TouchableOpacity>
                                ))}

                                {highlights.length === 0 && (
                                    <Text style={[
                                        styles.highlightModalEmpty,
                                        themeColors && { color: themeColors.textSecondary }
                                    ]}>
                                        Aucun album existant. Créez-en un depuis votre profil après avoir publié.
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    canvasContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        marginTop: 10,
        fontSize: 16,
    },
    // Top Bar
    topToolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 16,
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    tools: {
        flexDirection: 'row',
    },
    textIconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textIconLabel: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    yourStoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    storyLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    publishFab: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal & Inputs
    textInputContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingTop: 60,
    },
    textInputActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    cancelText: { color: 'white', fontSize: 16 },
    doneText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    textInput: {
        flex: 1,
        fontSize: 32,
        textAlign: 'center',
        textAlignVertical: 'center',
        padding: 20,
    },
    bgToggleButton: {
        padding: 5,
    },
    bgToggleIcon: {
        width: 32,
        height: 32,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgToggleText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    colorPicker: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 40,
        gap: 15,
    },
    colorDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'white',
    },
    colorDotSelected: {
        transform: [{ scale: 1.25 }],
        borderColor: 'white',
    },
    colorPaletteWrapper: {
        position: 'absolute',
        top: 110,
        left: 0,
        right: 0,
        height: 50,
        zIndex: 20,
    },
    colorPaletteScroll: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 12,
    },
    paletteDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
    },
    paletteDotSelected: {
        transform: [{ scale: 1.25 }],
        borderWidth: 3,
    },
    lockIconContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 16,
    },
    // Highlight Toggle Button
    highlightToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    highlightToggleText: {
        fontSize: 14,
        fontWeight: '500',
        maxWidth: 100,
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
    createHighlightIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
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
});
