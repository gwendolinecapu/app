import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, type SharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { InnerWorldService } from '../../src/services/InnerWorldService';
import { InnerWorldShape, InnerWorld } from '../../src/types';
import { useAuth } from '../../src/contexts/AuthContext';
import { triggerHaptic } from '../../src/lib/haptics';

// Constants
const CANVAS_SIZE = 5000;
const INITIAL_SCALE = 1;

// --- Assets & Categories ---
const STICKER_CATEGORIES = [
    { id: 'nature', label: 'Nature', icon: 'leaf' },
    { id: 'places', label: 'Lieux', icon: 'home' },
    { id: 'objects', label: 'Objets', icon: 'cube' },
    { id: 'symbols', label: 'Symboles', icon: 'heart' }
];

const STICKERS = {
    nature: [
        { id: 'tree_1', emoji: '🌳', label: 'Arbre' },
        { id: 'flower_1', emoji: '🌸', label: 'Fleur' },
        { id: 'rock_1', emoji: '🪨', label: 'Rocher' },
        { id: 'lake_1', emoji: '💧', label: 'Lac' },
        { id: 'fire_1', emoji: '🔥', label: 'Feu' },
        { id: 'cloud_1', emoji: '☁️', label: 'Nuage' },
    ],
    places: [
        { id: 'house_1', emoji: '🏠', label: 'Maison' },
        { id: 'castle_1', emoji: '🏰', label: 'Château' },
        { id: 'tent_1', emoji: '⛺', label: 'Tente' },
        { id: 'ruin_1', emoji: '🏛️', label: 'Ruines' },
        { id: 'city_1', emoji: '🏙️', label: 'Ville' },
        { id: 'island_1', emoji: '🏝️', label: 'Île' },
    ],
    objects: [
        { id: 'bed_1', emoji: '🛏️', label: 'Lit' },
        { id: 'book_1', emoji: '📖', label: 'Livre' },
        { id: 'lamp_1', emoji: '🛋️', label: 'Canapé' },
        { id: 'chest_1', emoji: '📦', label: 'Boîte' },
        { id: 'key_1', emoji: '🗝️', label: 'Clé' },
    ],
    symbols: [
        { id: 'heart_1', emoji: '❤️', label: 'Amour' },
        { id: 'star_1', emoji: '⭐', label: 'Espoir' },
        { id: 'skull_1', emoji: '💀', label: 'Peur' },
        { id: 'anchor_1', emoji: '⚓', label: 'Ancrage' },
        { id: 'sparkles_1', emoji: '✨', label: 'Magie' },
    ]
};

const TEXT_PRESETS = [
    { label: 'Ajouter un titre', style: 'h1', fontSize: 24, fontWeight: '700', text: 'Titre' },
    { label: 'Ajouter un sous-titre', style: 'h2', fontSize: 18, fontWeight: '600', text: 'Sous-titre' },
    { label: 'Ajouter du texte', style: 'body', fontSize: 14, fontWeight: '400', text: 'Votre texte ici' },
];

const BACKGROUND_COLORS = [
    '#F8F9FA', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#FCE4EC', '#F3E5F5', '#263238', '#000000'
];

// --- Components ---

// Draggable Shape (Enhanced with Pan, Pinch, Rotate)
const DraggableShape = React.memo(({
    shape,
    isSelected,
    onPress,
    onLongPress,
    onUpdateShape,
    canvasScale
}: {
    shape: InnerWorldShape & { type?: string, fontSize?: number, color?: string },
    isSelected: boolean,
    onPress: (s: InnerWorldShape) => void,
    onLongPress: () => void,
    onUpdateShape: (id: string, updates: Partial<InnerWorldShape>) => void,
    canvasScale: SharedValue<number>
}) => {
    const isPressed = useSharedValue(false);
    const offsetX = useSharedValue(shape.x);
    const offsetY = useSharedValue(shape.y);
    const rotation = useSharedValue(shape.rotation);
    const shapeScale = useSharedValue(1);

    useEffect(() => {
        offsetX.value = shape.x;
        offsetY.value = shape.y;
        rotation.value = shape.rotation;
        shapeScale.value = 1;
    }, [shape.x, shape.y, shape.rotation, shape.width, shape.height]);

    const dragGesture = Gesture.Pan()
        .onBegin(() => { isPressed.value = true; })
        .onUpdate((e) => {
            offsetX.value = shape.x + e.translationX / canvasScale.value;
            offsetY.value = shape.y + e.translationY / canvasScale.value;
        })
        .onFinalize(() => {
            isPressed.value = false;
            runOnJS(onUpdateShape)(shape.id, { x: offsetX.value, y: offsetY.value });
        });

    const rotateGesture = Gesture.Rotation()
        .onUpdate((e) => {
            rotation.value = shape.rotation + (e.rotation * 180 / Math.PI);
        })
        .onFinalize(() => {
            runOnJS(onUpdateShape)(shape.id, { rotation: rotation.value });
        });

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            shapeScale.value = e.scale;
        })
        .onFinalize(() => {
            const newWidth = shape.width * shapeScale.value;
            const newHeight = shape.height * shapeScale.value;
            shapeScale.value = 1;
            runOnJS(onUpdateShape)(shape.id, { width: newWidth, height: newHeight, fontSize: (shape.fontSize || 16) * shapeScale.value });
        });

    const composedGesture = Gesture.Simultaneous(dragGesture, rotateGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: offsetX.value },
            { translateY: offsetY.value },
            { rotate: `${rotation.value}deg` },
            { scale: isPressed.value ? 1.05 * shapeScale.value : shapeScale.value }
        ],
        zIndex: isSelected ? 100 : 10,
    }));

    // Render based on type
    const renderContent = () => {
        if (shape.type === 'text') {
            return (
                <Text style={{
                    fontSize: shape.fontSize || 16,
                    fontWeight: '600',
                    color: shape.color || '#333'
                }}>
                    {shape.name}
                </Text>
            );
        }
        return (
            <>
                <Text style={styles.emoji}>{shape.icon || '❓'}</Text>
            </>
        );
    };

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View
                style={[
                    styles.shapeObj,
                    animatedStyle,
                    { width: shape.width, height: shape.height },
                    isSelected && styles.selectedShapeBoundaries
                ]}
                onTouchEnd={() => onPress(shape)}
            >
                <TouchableOpacity
                    onPress={() => onPress(shape)}
                    onLongPress={onLongPress}
                    style={styles.shapeInner}
                >
                    {renderContent()}

                    {/* Handles (Visual Only) */}
                    {isSelected && (
                        <>
                            <View style={[styles.handle, styles.handleTL]} />
                            <View style={[styles.handle, styles.handleTR]} />
                            <View style={[styles.handle, styles.handleBL]} />
                            <View style={[styles.handle, styles.handleBR]} />
                            <View style={styles.rotateHandle}>
                                <Ionicons name="refresh" size={12} color="white" />
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </GestureDetector>
    );
});

// Main Editor Component
export default function InnerWorldEditor() {
    const { worldId } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    // Data State
    const [shapes, setShapes] = useState<InnerWorldShape[]>([]);

    // Editor State
    const [activeTab, setActiveTab] = useState<'none' | 'elements' | 'text' | 'background'>('none');
    const [selectedCategory, setSelectedCategory] = useState('nature');
    const [activeShape, setActiveShape] = useState<InnerWorldShape | null>(null);
    const [backgroundColor, setBackgroundColor] = useState('#F8F9FA'); // Default background

    // Text Editing State
    const [isEditingText, setIsEditingText] = useState(false);
    const [textInputValue, setTextInputValue] = useState('');

    // Camera
    const cameraX = useSharedValue(0);
    const cameraY = useSharedValue(0);
    const scale = useSharedValue(1);

    // Initial Setup
    useEffect(() => {
        cameraX.value = -CANVAS_SIZE / 2 + Dimensions.get('window').width / 2;
        cameraY.value = -CANVAS_SIZE / 2 + Dimensions.get('window').height / 2;
    }, []);

    useEffect(() => {
        if (!worldId || !user) return;
        const unsubscribe = InnerWorldService.subscribeToShapes(
            worldId as string,
            user.uid,
            (newShapes) => setShapes(newShapes)
        );
        return () => unsubscribe();
    }, [worldId, user]);

    // DB Ops
    const handleUpdateShape = async (id: string, updates: Partial<InnerWorldShape>) => {
        if (!worldId) return;
        setShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        await InnerWorldService.updateShape(id, worldId as string, updates);
    };

    const handleAddShape = async (item: any, type: 'sticker' | 'text') => {
        if (!user || !worldId) return;

        const centerX = -cameraX.value + Dimensions.get('window').width / 2 / scale.value;
        const centerY = -cameraY.value + Dimensions.get('window').height / 2 / scale.value;

        const newShape: any = {
            world_id: worldId,
            type: type === 'text' ? 'text' : 'custom',
            x: centerX - 50,
            y: centerY - 50,
            width: type === 'text' ? 200 : 100,
            height: type === 'text' ? 50 : 100,
            rotation: 0,
            name: type === 'text' ? item.text : item.label,
            icon: type === 'text' ? null : item.emoji,
            emotion: 'calm',
            fontSize: item.fontSize, // For text
            color: '#333' // Default text color
        };

        const id = await InnerWorldService.addShape(newShape, user.uid);
        setActiveTab('none'); // Close panel
        // Auto-select
        setActiveShape({ ...newShape, id });
        triggerHaptic.success();
    };

    const handleDeleteShape = async () => {
        if (!activeShape || !worldId) return;
        await InnerWorldService.deleteShape(activeShape.id, worldId as string);
        setActiveShape(null);
    };

    const handleEnterShape = async () => {
        if (!activeShape || !worldId || !user) return;
        if (activeShape.type === 'text') {
            // Edit text instead of enter
            startEditingText(activeShape);
            return;
        }

        if (activeShape.linked_world_id) {
            triggerHaptic.selection();
            router.push(`/inner-world/ ${activeShape.linked_world_id} `);
            return;
        }

        Alert.alert(
            `Entrer dans ${activeShape.name}`,
            "Cet objet ne contient pas encore de monde. Voulez-vous en créer un ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Créer l'intérieur",
                    onPress: async () => {
                        try {
                            const newWorldId = await InnerWorldService.createWorld({
                                system_id: user.uid,
                                alter_id: activeShape.world_id,
                                name: `Intérieur de ${activeShape.name}`,
                                background_color: '#F8F9FA'
                            } as any);
                            await InnerWorldService.updateShape(activeShape.id, worldId as string, {
                                linked_world_id: newWorldId
                            });
                            triggerHaptic.success();
                            router.push(`/inner-world/ ${newWorldId} `);
                        } catch (e) {
                            Alert.alert("Erreur", "Impossible de créer le monde intérieur.");
                        }
                    }
                }
            ]
        );
    };

    const startEditingText = (shape: InnerWorldShape) => {
        setTextInputValue(shape.name);
        setIsEditingText(true);
    };

    const saveTextEdit = async () => {
        if (!activeShape || !worldId) return;
        await InnerWorldService.updateShape(activeShape.id, worldId as string, { name: textInputValue });
        setIsEditingText(false);
    };

    // Camera Gestures
    const panGesture = Gesture.Pan()
        .onChange((e) => {
            cameraX.value -= e.changeX / scale.value;
            cameraY.value -= e.changeY / scale.value;
        });

    const pinchGesture = Gesture.Pinch()
        .onChange((e) => {
            scale.value *= e.scaleChange;
        });

    const animatedCanvasStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: cameraX.value },
            { translateY: cameraY.value },
        ],
    }));

    // --- Render Helpers ---

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* Top Bar */}
            <SafeAreaView edges={['top']} style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Design Sans Titre</Text>
                <View style={styles.topBarActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => { }}>
                        <Ionicons name="arrow-undo" size={20} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => { }}>
                        <Ionicons name="arrow-redo" size={20} color="#333" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Main Canvas */}
            <View style={[styles.canvasContainer, { backgroundColor }]}>
                <GestureDetector gesture={Gesture.Simultaneous(panGesture, pinchGesture)}>
                    <Animated.View style={[styles.canvasContent, animatedCanvasStyle]}>

                        {shapes.map(shape => (
                            <DraggableShape
                                key={shape.id}
                                shape={shape}
                                isSelected={activeShape?.id === shape.id}
                                onPress={(s) => { setActiveShape(s); triggerHaptic.selection(); }}
                                onLongPress={handleEnterShape}
                                onUpdateShape={handleUpdateShape}
                                canvasScale={scale}
                            />
                        ))}
                    </Animated.View>
                </GestureDetector>
            </View>

            {/* Context Menu (Floating above bottom bar when shape selected) */}
            {activeShape && !isEditingText && (
                <View style={[styles.contextMenu, { bottom: activeTab !== 'none' ? 300 : 100 }]}>
                    <TouchableOpacity style={styles.contextBtn} onPress={handleEnterShape}>
                        <Ionicons name={activeShape.type === 'text' ? "text" : "enter"} size={20} color={colors.primary} />
                        <Text style={styles.contextBtnText}>{activeShape.type === 'text' ? "Modifier" : "Entrer"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contextBtn} onPress={handleDeleteShape}>
                        <Ionicons name="trash-outline" size={20} color="#FF5252" />
                        <Text style={[styles.contextBtnText, { color: '#FF5252' }]}>Supprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeContextBtn} onPress={() => setActiveShape(null)}>
                        <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Toolbar & Panels */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>

                {/* Panel Content (Slides up/Overlay) */}
                {activeTab !== 'none' && (
                    <View style={styles.panel}>
                        <View style={styles.panelHeader}>
                            <Text style={styles.panelTitle}>
                                {activeTab === 'elements' ? 'Éléments' :
                                    activeTab === 'text' ? 'Texte' : 'Arrière-plan'}
                            </Text>
                            <TouchableOpacity onPress={() => setActiveTab('none')}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Elements Panel */}
                        {activeTab === 'elements' && (
                            <View style={{ flex: 1 }}>
                                <ScrollView horizontal style={styles.categories} showsHorizontalScrollIndicator={false}>
                                    {STICKER_CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
                                            onPress={() => setSelectedCategory(cat.id)}
                                        >
                                            <Ionicons name={cat.icon as any} size={16} color={selectedCategory === cat.id ? 'white' : '#666'} />
                                            <Text style={[styles.catLabel, selectedCategory === cat.id && styles.catLabelActive]}>
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <ScrollView contentContainerStyle={styles.grid}>
                                    {(STICKERS as any)[selectedCategory]?.map((sticker: any) => (
                                        <TouchableOpacity
                                            key={sticker.id}
                                            style={styles.gridItem}
                                            onPress={() => handleAddShape(sticker, 'sticker')}
                                        >
                                            <Text style={styles.gridEmoji}>{sticker.emoji}</Text>
                                            <Text style={styles.gridLabel}>{sticker.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Text Panel */}
                        {activeTab === 'text' && (
                            <View style={{ flex: 1, padding: 20 }}>
                                {TEXT_PRESETS.map((preset, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.textPresetBtn}
                                        onPress={() => handleAddShape(preset, 'text')}
                                    >
                                        <Text style={[styles.textPresetLabel, {
                                            fontSize: preset.fontSize,
                                            fontWeight: preset.fontWeight as any
                                        }]}>
                                            {preset.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Background Panel */}
                        {activeTab === 'background' && (
                            <ScrollView contentContainerStyle={[styles.grid, { padding: 20 }]}>
                                {BACKGROUND_COLORS.map((color, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.colorSwatch, { backgroundColor: color }, backgroundColor === color && styles.colorSwatchActive]}
                                        onPress={() => setBackgroundColor(color)}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'elements' && styles.tabBtnActive]}
                        onPress={() => setActiveTab(activeTab === 'elements' ? 'none' : 'elements')}
                    >
                        <Ionicons name="shapes-outline" size={24} color={activeTab === 'elements' ? colors.primary : '#666'} />
                        <Text style={[styles.tabLabel, activeTab === 'elements' && styles.tabLabelActive]}>Éléments</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'text' && styles.tabBtnActive]}
                        onPress={() => setActiveTab(activeTab === 'text' ? 'none' : 'text')}
                    >
                        <Ionicons name="text-outline" size={24} color={activeTab === 'text' ? colors.primary : '#666'} />
                        <Text style={[styles.tabLabel, activeTab === 'text' && styles.tabLabelActive]}>Texte</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'background' && styles.tabBtnActive]}
                        onPress={() => setActiveTab(activeTab === 'background' ? 'none' : 'background')}
                    >
                        <Ionicons name="color-palette-outline" size={24} color={activeTab === 'background' ? colors.primary : '#666'} />
                        <Text style={[styles.tabLabel, activeTab === 'background' && styles.tabLabelActive]}>Fond</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tabBtn} onPress={() => { /* Uploads flow */ }}>
                        <Ionicons name="cloud-upload-outline" size={24} color="#666" />
                        <Text style={styles.tabLabel}>Importer</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Text Editing Modal */}
            <Modal visible={isEditingText} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.textEditOverlay}>
                    <View style={styles.textEditContainer}>
                        <Text style={styles.textEditLabel}>Modifier le texte</Text>
                        <TextInput
                            style={styles.textInput}
                            value={textInputValue}
                            onChangeText={setTextInputValue}
                            autoFocus
                            multiline
                        />
                        <View style={styles.textEditActions}>
                            <TouchableOpacity style={styles.textEditBtnCancel} onPress={() => setIsEditingText(false)}>
                                <Text style={styles.textEditBtnLabel}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.textEditBtnSave} onPress={saveTextEdit}>
                                <Text style={[styles.textEditBtnLabel, { color: 'white' }]}>Enregistrer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    topBar: {
        backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEE',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
        paddingBottom: 12, zIndex: 10
    },
    topBarTitle: { fontWeight: '600', fontSize: 16, color: '#333' },
    topBarActions: { flexDirection: 'row', gap: 16 },
    iconBtn: { padding: 4 },

    canvasContainer: { flex: 1, overflow: 'hidden' },
    canvasContent: { width: CANVAS_SIZE, height: CANVAS_SIZE },

    // Shapes
    shapeObj: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    shapeInner: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
    emoji: { fontSize: 64 },
    selectedShapeBoundaries: {
        borderWidth: 2, borderColor: colors.primary, borderStyle: 'solid'
    },
    handle: {
        position: 'absolute', width: 10, height: 10, backgroundColor: 'white',
        borderWidth: 1, borderColor: colors.primary, borderRadius: 5
    },
    handleTL: { top: -5, left: -5 },
    handleTR: { top: -5, right: -5 },
    handleBL: { bottom: -5, left: -5 },
    handleBR: { bottom: -5, right: -5 },
    rotateHandle: {
        position: 'absolute', bottom: -25, alignSelf: 'center',
        width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center'
    },

    // Bottom Container
    bottomContainer: {
        backgroundColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
    },
    tabBar: {
        flexDirection: 'row', height: 60, alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#EEE'
    },
    tabBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
    tabBtnActive: {},
    tabLabel: { fontSize: 10, color: '#666', marginTop: 2, fontWeight: '500' },
    tabLabelActive: { color: colors.primary, fontWeight: '700' },

    // Panel
    panel: { height: 280, backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    panelTitle: { fontSize: 16, fontWeight: '700' },

    // Grid / Elements inside Panel
    categories: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, marginTop: 16, maxHeight: 40 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 10 },
    catChipActive: { backgroundColor: colors.primary },
    catLabel: { fontWeight: '600', color: '#666' },
    catLabelActive: { color: 'white' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
    gridItem: { width: '33%', alignItems: 'center', marginBottom: 24 },
    gridEmoji: { fontSize: 40, marginBottom: 4 },
    gridLabel: { fontSize: 12, color: '#666' },

    // Text Presets
    textPresetBtn: {
        padding: 16, backgroundColor: '#F8F9FA', marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEE'
    },
    textPresetLabel: { color: '#333' },

    // Background Swatches
    colorSwatch: { width: 60, height: 60, borderRadius: 8, marginBottom: 16, marginRight: 16, borderWidth: 1, borderColor: '#DDD' },
    colorSwatchActive: { borderWidth: 3, borderColor: colors.primary },

    // Context Floating Menu
    contextMenu: {
        position: 'absolute', alignSelf: 'center',
        backgroundColor: 'white', borderRadius: 50, padding: 8, paddingHorizontal: 16,
        flexDirection: 'row', gap: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    contextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contextBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
    closeContextBtn: { marginLeft: 8, padding: 4, backgroundColor: '#F0F0F0', borderRadius: 12 },

    // Modal Text Edit
    textEditOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    textEditContainer: { width: '100%', backgroundColor: 'white', borderRadius: 16, padding: 20 },
    textEditLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    textInput: {
        backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12, minHeight: 80,
        fontSize: 16, textAlignVertical: 'top', marginBottom: 20
    },
    textEditActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    textEditBtnCancel: { paddingVertical: 10, paddingHorizontal: 20 },
    textEditBtnSave: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    textEditBtnLabel: { fontWeight: '600' }
});
