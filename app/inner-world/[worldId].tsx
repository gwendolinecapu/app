import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../src/lib/theme';
import { InnerWorldService } from '../../src/services/InnerWorldService';
import { InnerWorldShape, InnerWorld } from '../../src/types';
import { useAuth } from '../../src/contexts/AuthContext';
import { triggerHaptic } from '../../src/lib/haptics';

// Constants
const INITIAL_SCALE = 1;
const CANVAS_SIZE = 5000; // Infinite canvas conceptual size
const STICKER_CATEGORIES = [
    { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
    { id: 'places', label: 'Lieux', icon: 'home-outline' },
    { id: 'objects', label: 'Objets', icon: 'cube-outline' },
    { id: 'symbols', label: 'Symboles', icon: 'heart-outline' }
];

const STICKERS = {
    nature: [
        { id: 'tree_1', emoji: '🌳', label: 'Arbre' },
        { id: 'flower_1', emoji: '🌸', label: 'Fleur' },
        { id: 'rock_1', emoji: '🪨', label: 'Rocher' },
        { id: 'lake_1', emoji: '💧', label: 'Lac' },
    ],
    places: [
        { id: 'house_1', emoji: '🏠', label: 'Maison' },
        { id: 'castle_1', emoji: '🏰', label: 'Château' },
        { id: 'tent_1', emoji: '⛺', label: 'Tente' },
        { id: 'ruin_1', emoji: '🏛️', label: 'Ruines' },
    ],
    objects: [
        { id: 'bed_1', emoji: '🛏️', label: 'Lit' },
        { id: 'book_1', emoji: '📖', label: 'Livre' },
        { id: 'lamp_1', emoji: '🛋️', label: 'Canapé' },
    ],
    symbols: [
        { id: 'heart_1', emoji: '❤️', label: 'Amour' },
        { id: 'star_1', emoji: '⭐', label: 'Espoir' },
        { id: 'key_1', emoji: '🗝️', label: 'Secret' },
        { id: 'skull_1', emoji: '💀', label: 'Sombre' },
    ]
};

export default function InnerWorldEditor() {
    const { worldId } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [shapes, setShapes] = useState<InnerWorldShape[]>([]);
    const [worldData, setWorldData] = useState<InnerWorld | null>(null);

    // UI State
    const [libraryVisible, setLibraryVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('nature');
    const [activeShape, setActiveShape] = useState<InnerWorldShape | null>(null);

    // Camera
    const cameraX = useSharedValue(-CANVAS_SIZE / 2 + Dimensions.get('window').width / 2);
    const cameraY = useSharedValue(-CANVAS_SIZE / 2 + Dimensions.get('window').height / 2);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (!worldId || !user) return;

        // Fetch world details
        // Note: Real implementation would fetch world doc. Mocking for now from params/cache could be tricky without store.
        // Assuming we rely on a separate fetch or pass cached data.

        // Subscribe to shapes
        const unsubscribe = InnerWorldService.subscribeToShapes(
            worldId as string,
            user.uid,
            (newShapes) => setShapes(newShapes)
        );
        return () => unsubscribe();
    }, [worldId, user]);

    // Gestures
    const panGesture = Gesture.Pan()
        .onChange((e) => {
            cameraX.value -= e.changeX / scale.value;
            cameraY.value -= e.changeY / scale.value;
        });

    const pinchGesture = Gesture.Pinch()
        .onChange((e) => {
            scale.value *= e.scaleChange;
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: -cameraX.value },
            { translateY: -cameraY.value },
        ],
    }));

    const handleAddSticker = async (sticker: any) => {
        if (!user || !worldId) return;

        const newShape: any = {
            world_id: worldId,
            type: 'custom',
            x: cameraX.value + 100, // Center-ish
            y: cameraY.value + 100,
            width: 100,
            height: 100,
            rotation: 0,
            name: sticker.label,
            icon: sticker.emoji,
            emotion: 'calm',
        };

        await InnerWorldService.addShape(newShape, user.uid);
        setLibraryVisible(false);
        triggerHaptic.success();
    };

    const handleShapePress = (shape: InnerWorldShape) => {
        setActiveShape(shape);
        triggerHaptic.selection();
    };

    const handleEnterShape = async () => {
        if (!activeShape || !worldId || !user) return;

        // If already linked, go there
        if (activeShape.linked_world_id) {
            triggerHaptic.selection();
            router.push(`/inner-world/${activeShape.linked_world_id}`);
            return;
        }

        // Otherwise prompt to create
        Alert.alert(
            `Entrer dans ${activeShape.name}`,
            "Cet objet ne contient pas encore de monde. Voulez-vous en créer un ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Créer l'intérieur",
                    onPress: async () => {
                        try {
                            // Create new world linked to this user/system
                            // Note: We might want to inherit access, for now same owner
                            const newWorldId = await InnerWorldService.createWorld({
                                system_id: user.uid,
                                alter_id: activeShape.world_id, // Keep hierarchy owner or current? Let's use current user context if available, or just same system.
                                // Ideally we need currentAlter here. 
                                // Let's assume for now we use the same parameters as parent or default.
                                // We'll update InnerWorldService to be flexible.
                                name: `Intérieur de ${activeShape.name}`,
                                background_color: '#F8F9FA'
                            } as any);

                            // Link it to the shape
                            await InnerWorldService.updateShape(activeShape.id, worldId as string, {
                                linked_world_id: newWorldId
                            });

                            triggerHaptic.success();
                            router.push(`/inner-world/${newWorldId}`);
                        } catch (e) {
                            Alert.alert("Erreur", "Impossible de créer le monde intérieur.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteShape = async () => {
        if (!activeShape || !worldId) return;
        await InnerWorldService.deleteShape(activeShape.id, worldId as string);
        setActiveShape(null);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.canvasContainer}>
                <GestureDetector gesture={Gesture.Simultaneous(panGesture, pinchGesture)}>
                    <Animated.View style={[styles.canvasContent, animatedStyle]}>
                        {/* Background Grid (Optional, maybe subtle dots) */}
                        <View style={styles.background} />

                        {shapes.map(shape => (
                            <TouchableOpacity
                                key={shape.id}
                                style={[
                                    styles.shapeObj,
                                    {
                                        left: shape.x,
                                        top: shape.y,
                                        width: shape.width,
                                        height: shape.height,
                                        transform: [{ rotate: `${shape.rotation}deg` }]
                                    },
                                    activeShape?.id === shape.id && styles.selectedShape
                                ]}
                                onPress={() => handleShapePress(shape)}
                                onLongPress={handleEnterShape}
                            >
                                <Text style={styles.emoji}>{shape.icon || '❓'}</Text>
                                {shape.name && <Text style={styles.label}>{shape.name}</Text>}
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </GestureDetector>
            </View>

            {/* HUD */}
            <SafeAreaView style={styles.hud} pointerEvents="box-none">
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.worldTitle}>Monde</Text>
                    <View style={styles.iconBtn} />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setLibraryVisible(true)}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Context Menu for Selected Shape */}
            {activeShape && (
                <View style={styles.contextMenu}>
                    <Text style={styles.contextTitle}>{activeShape.name}</Text>
                    <View style={styles.contextActions}>
                        <TouchableOpacity style={styles.contextBtn} onPress={handleEnterShape}>
                            <Ionicons name="enter-outline" size={20} color={colors.primary} />
                            <Text style={styles.contextBtnText}>Entrer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contextBtn} onPress={handleDeleteShape}>
                            <Ionicons name="trash-outline" size={20} color="#FF5252" />
                            <Text style={[styles.contextBtnText, { color: '#FF5252' }]}>Supprimer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeContextBtn} onPress={() => setActiveShape(null)}>
                            <Ionicons name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Sticker Library Modal */}
            <Modal visible={libraryVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Bibliothèque</Text>
                        <TouchableOpacity onPress={() => setLibraryVisible(false)}>
                            <Text style={styles.closeText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Categories */}
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

                    <ScrollView contentContainerStyle={styles.stickerGrid}>
                        {(STICKERS as any)[selectedCategory]?.map((sticker: any) => (
                            <TouchableOpacity
                                key={sticker.id}
                                style={styles.stickerItem}
                                onPress={() => handleAddSticker(sticker)}
                            >
                                <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
                                <Text style={styles.stickerLabel}>{sticker.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    canvasContainer: { flex: 1, overflow: 'hidden' },
    canvasContent: { width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: 'transparent' }, // Color handled by World Settings
    background: { ...StyleSheet.absoluteFillObject }, // Add patterns here if needed

    shapeObj: {
        position: 'absolute',
        justifyContent: 'center', alignItems: 'center',
    },
    emoji: { fontSize: 64 },
    label: {
        position: 'absolute', bottom: -20,
        backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 8, borderRadius: 8,
        fontSize: 12, fontWeight: '600', overflow: 'hidden'
    },
    selectedShape: {
        borderWidth: 2, borderColor: colors.primary, borderRadius: 12, borderStyle: 'dashed'
    },

    hud: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'space-between'
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 8,
    },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    worldTitle: { fontSize: 18, fontWeight: '700', color: '#333' },

    footer: {
        alignItems: 'center', marginBottom: 20,
    },
    addBtn: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    },

    contextMenu: {
        position: 'absolute', bottom: 100, left: 20, right: 20,
        backgroundColor: 'white', borderRadius: 16, padding: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
        elevation: 5,
    },
    contextTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    contextActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    contextBtn: { alignItems: 'center', gap: 4 },
    contextBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    closeContextBtn: { padding: 8 },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#F9F9F9', paddingTop: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: 'bold' },
    closeText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
    categories: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, maxHeight: 40 },
    catChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#EEE', marginRight: 10,
    },
    catChipActive: { backgroundColor: colors.primary },
    catLabel: { fontWeight: '600', color: '#666' },
    catLabelActive: { color: 'white' },

    stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
    stickerItem: { width: '33%', alignItems: 'center', marginBottom: 24 },
    stickerEmoji: { fontSize: 48, marginBottom: 8 },
    stickerLabel: { fontSize: 12, color: '#666' },
});
