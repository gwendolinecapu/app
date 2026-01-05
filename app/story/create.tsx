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
    ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { captureRef } from 'react-native-view-shot';
import { storage } from '../../src/lib/firebase';
import { StoriesService } from '../../src/services/stories';
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

    const lightColors = ['#ffffff', '#facc15', '#0ea5e9', '#f97316', '#22c55e', ...pastelColors];
    const isUiDark = lightColors.includes(canvasBackgroundColor);
    const uiColor = isUiDark ? 'black' : 'white';

    const toggleBackgroundColor = () => {
        setBgColorPickerVisible(!bgColorPickerVisible);
    };

    const [uploading, setUploading] = useState(false);

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

            await StoriesService.createStory({
                authorId: currentAlter.id,
                authorName: currentAlter.name,
                authorAvatar: currentAlter.avatar || currentAlter.avatar_url,
                authorFrame: currentAlter.equipped_items?.frame,
                systemId: user.uid,
                mediaUrl: downloadUrl,
                mediaType: mediaType,
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
        <View style={[styles.container, { backgroundColor: canvasBackgroundColor }]}>
            <StatusBar barStyle={isUiDark ? 'dark-content' : 'light-content'} />

            {/* Canvas - Full Screen Behind */}
            <View style={styles.canvasContainer}>
                {editorMode ? (
                    <Canvas
                        ref={canvasRef}
                        layers={layers}
                        backgroundColor={canvasBackgroundColor}
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
                        {backgroundColors.map(c => {
                            const isPastel = pastelColors.includes(c);
                            const locked = isPastel && !isPremium;

                            return (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.paletteDot,
                                        { backgroundColor: c, borderColor: uiColor },
                                        canvasBackgroundColor === c && styles.paletteDotSelected,
                                        locked && { opacity: 0.8 }
                                    ]}
                                    onPress={() => {
                                        if (locked) {
                                            presentPaywall();
                                            return;
                                        }
                                        setCanvasBackgroundColor(c);
                                        setEditorMode(true);
                                    }}
                                >
                                    {locked && (
                                        <View style={styles.lockIconContainer}>
                                            <Ionicons name="lock-closed" size={14} color="rgba(0,0,0,0.4)" />
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
});
