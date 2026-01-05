import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';
import { useAuth } from '../../src/contexts/AuthContext';
import { InnerWorldService } from '../../src/services/InnerWorldService';
import { InnerWorldShape } from '../../src/types';
import { colors } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TILE_SIZE = 40;
const CANVAS_SIZE = 2000; // Size of the drawable area

// Assets
const TEXTURE_ASSETS: Record<string, any> = {
    'ground_grass': require('../../assets/inner-world/ground_grass.png'),
    'ground_dirt': require('../../assets/inner-world/ground_dirt.png'),
    'ground_stone': require('../../assets/inner-world/ground_stone.png'),
    'ground_sand': require('../../assets/inner-world/ground_sand.png'),
    'ground_forest': require('../../assets/inner-world/ground_forest.png'),
    'water_tile': require('../../assets/inner-world/water_tile.png'),
};

const resolveAsset = (assetString: string | undefined) => {
    if (!assetString) return null;
    if (assetString.startsWith('asset:')) {
        const key = assetString.split(':')[1];
        return TEXTURE_ASSETS[key] || null;
    }
    return { uri: assetString };
};

const TOOLS = [
    { id: 'hand', icon: 'hand-right-outline', label: 'Bouger' },
    { id: 'brush', icon: 'brush-outline', label: 'Peindre' },
    { id: 'stamp', icon: 'cube-outline', label: 'Objets' },
    { id: 'erase', icon: 'trash-outline', label: 'Gomme' },
];

const BRUSHES = [
    { id: 'ground_grass', label: 'Herbe', color: '#7BC8A4', asset: 'asset:ground_grass' },
    { id: 'ground_dirt', label: 'Terre', color: '#D4A373', asset: 'asset:ground_dirt' },
    { id: 'ground_stone', label: 'Pierre', color: '#A8A8A8', asset: 'asset:ground_stone' },
    { id: 'ground_sand', label: 'Sable', color: '#F4D03F', asset: 'asset:ground_sand' },
    { id: 'water_tile', label: 'Eau', color: '#90E0EF', asset: 'asset:water_tile' },
    { id: 'ground_forest', label: 'Forêt', color: '#228B22', asset: 'asset:ground_forest' },
];

const STAMPS = [
    {
        category: 'Nature', items: [
            { label: 'Arbre', asset: 'tree_green', image: require('../../assets/inner-world/tree_green.png') },
            { label: 'Rocher', asset: 'rock_large', image: require('../../assets/inner-world/rock_large.png') },
            { label: 'Buisson', asset: '🌿', isEmoji: true },
            { label: 'Fleur', asset: '🌻', isEmoji: true },
        ]
    },
    {
        category: 'Ville', items: [
            { label: 'Maison', asset: '🏠', isEmoji: true },
            { label: 'Immeuble', asset: '🏢', isEmoji: true },
            { label: 'Route', asset: 'road_straight', image: require('../../assets/inner-world/road_straight.png') },
            { label: 'Virage', asset: 'road_corner', image: require('../../assets/inner-world/road_corner.png') },
            { label: 'Carrefour', asset: 'road_intersection', image: require('../../assets/inner-world/road_intersection.png') },
        ]
    },
];

export default function InnerWorldMapMaker() {
    const { worldId } = useLocalSearchParams<{ worldId: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [shapes, setShapes] = useState<InnerWorldShape[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTool, setActiveTool] = useState<'hand' | 'brush' | 'stamp' | 'erase'>('hand');

    // Tool Options
    const [selectedBrush, setSelectedBrush] = useState(BRUSHES[0]);
    const [selectedStamp, setSelectedStamp] = useState(STAMPS[0].items[0]);
    const [globalBg, setGlobalBg] = useState('ground_grass');

    // Camera
    const cameraX = useSharedValue(0);
    const cameraY = useSharedValue(0);
    const cameraScale = useSharedValue(1);
    const savedX = useSharedValue(0);
    const savedY = useSharedValue(0);
    const savedScale = useSharedValue(1);

    // Painting State (Ref to avoid re-renders during gesture)
    const lastPaintedTile = useRef<string | null>(null);

    useEffect(() => {
        if (!worldId || !user) return;
        const unsubscribe = InnerWorldService.subscribeToShapes(
            worldId,
            user.uid,
            (data) => {
                setShapes(data);
                setLoading(false);
            },
            (err) => console.error(err)
        );
        return () => unsubscribe();
    }, [worldId, user]);

    // --- Actions ---

    // 1. Paint a tile at (x, y)
    const paintTile = async (gridX: number, gridY: number) => {
        if (!user || !worldId) return;

        const tileKey = `${gridX},${gridY}`;
        if (lastPaintedTile.current === tileKey) return; // Debounce
        lastPaintedTile.current = tileKey;

        // Check if tile exists
        const existing = shapes.find(s =>
            s.type === 'rectangle' &&
            Math.abs(s.x - (gridX + TILE_SIZE / 2)) < TILE_SIZE / 2 &&
            Math.abs(s.y - (gridY + TILE_SIZE / 2)) < TILE_SIZE / 2
        );

        if (existing) {
            // Update Texture if different
            if (existing.image_url !== selectedBrush.asset) {
                // Optimistic UI could go here, but for now just fire
                InnerWorldService.updateShape(existing.id, worldId, { image_url: selectedBrush.asset });
                triggerHaptic.selection();
            }
        } else {
            // Create New Tile
            const newShape: Omit<InnerWorldShape, 'id' | 'created_at'> = {
                world_id: worldId,
                type: 'rectangle',
                x: gridX + TILE_SIZE / 2, // Center
                y: gridY + TILE_SIZE / 2,
                width: TILE_SIZE,
                height: TILE_SIZE,
                rotation: 0,
                name: selectedBrush.label,
                image_url: selectedBrush.asset,
                color: '#fff',
            };
            InnerWorldService.addShape(newShape, user.uid);
            triggerHaptic.selection();
        }
    };

    // 2. Place Stamp at (x, y)
    const placeStamp = async (gridX: number, gridY: number) => {
        if (!user || !worldId) return;

        const centerX = gridX + TILE_SIZE / 2;
        const centerY = gridY + TILE_SIZE / 2;

        const newShape: Omit<InnerWorldShape, 'id' | 'created_at'> = {
            world_id: worldId,
            type: selectedStamp.category === 'Ville' && !selectedStamp.isEmoji ? 'road' : 'nature', // Simplified types
            x: centerX,
            y: centerY,
            width: TILE_SIZE,
            height: TILE_SIZE,
            rotation: 0,
            name: selectedStamp.label,
            icon: selectedStamp.isEmoji ? selectedStamp.asset : (selectedStamp.asset.startsWith('road') ? selectedStamp.asset : null),
            image_url: !selectedStamp.isEmoji && !selectedStamp.asset.startsWith('road') ? `asset:${selectedStamp.asset}` : null,
            // Simple logic: if it's an image asset we found in local requires but not standard textures, we might need special handling.
            // For this demo, let's assume 'road' assets are special local requires, Nature are assets.
        };

        // Refined Logic for Assets
        if (selectedStamp.image) {
            // It's a local require. We can't save 'require' so we use the 'asset' key.
            // Our render function needs to map this key back to the require.
            newShape.icon = selectedStamp.asset; // Store key in icon
            newShape.image_url = null;
        }

        await InnerWorldService.addShape(newShape, user.uid);
        triggerHaptic.success();
    };

    // 3. Erase at (x, y)
    const eraseAt = async (gridX: number, gridY: number) => {
        if (!worldId) return;
        const centerX = gridX + TILE_SIZE / 2;
        const centerY = gridY + TILE_SIZE / 2;

        // Find topmost item
        const target = shapes.find(s =>
            Math.abs(s.x - centerX) < (s.width || TILE_SIZE) / 2 &&
            Math.abs(s.y - centerY) < (s.height || TILE_SIZE) / 2
        );

        if (target) {
            await InnerWorldService.deleteShape(target.id, worldId);
            triggerHaptic.selection();
        }
    };

    // --- Gestures ---

    const processGesture = (x: number, y: number, isEnd: boolean = false) => {
        // Convert screen to world
        const worldX = (x - SCREEN_WIDTH / 2 - cameraX.value) / cameraScale.value + SCREEN_WIDTH / 2;
        const worldY = (y - SCREEN_HEIGHT / 2 - cameraY.value) / cameraScale.value + SCREEN_HEIGHT / 2;

        const gridX = Math.floor(worldX / TILE_SIZE) * TILE_SIZE;
        const gridY = Math.floor(worldY / TILE_SIZE) * TILE_SIZE;

        if (activeTool === 'brush') {
            paintTile(gridX, gridY);
        } else if (activeTool === 'erase') {
            eraseAt(gridX, gridY);
        } else if (activeTool === 'stamp' && isEnd) {
            // Stamps only place on Release (Tap)
            placeStamp(gridX, gridY);
        }
    };

    const panGesture = Gesture.Pan()
        .minPointers(1)
        .maxPointers(2)
        .onStart(() => {
            lastPaintedTile.current = null;
        })
        .onUpdate((e) => {
            if (activeTool === 'hand') {
                cameraX.value = savedX.value + e.translationX;
                cameraY.value = savedY.value + e.translationY;
            } else {
                runOnJS(processGesture)(e.absoluteX, e.absoluteY, false);
            }
        })
        .onEnd((e) => {
            if (activeTool === 'hand') {
                savedX.value = cameraX.value;
                savedY.value = cameraY.value;
            } else {
                runOnJS(processGesture)(e.absoluteX, e.absoluteY, true);
            }
        });

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            cameraScale.value = Math.max(0.5, Math.min(3, savedScale.value * e.scale));
        })
        .onEnd(() => {
            savedScale.value = cameraScale.value;
        });

    // We combine them. If not in hand mode, Pan becomes Drawing.
    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: cameraX.value },
            { translateY: cameraY.value },
            { scale: cameraScale.value },
        ],
    }));

    // --- Render Helpers ---

    const renderShape = (shape: InnerWorldShape) => {
        let source = resolveAsset(shape.image_url);
        // Fallback for local assets stored in 'icon'
        if (!source && shape.icon && TEXTURE_ASSETS[shape.icon]) {
            source = TEXTURE_ASSETS[shape.icon];
        } else if (!source && shape.icon) {
            // Check stamps for local images
            for (const cat of STAMPS) {
                const found = cat.items.find(i => i.asset === shape.icon);
                if (found && 'image' in found) source = found.image;
            }
        }

        return (
            <View
                key={shape.id}
                style={{
                    position: 'absolute',
                    left: shape.x - shape.width / 2,
                    top: shape.y - shape.height / 2,
                    width: shape.width,
                    height: shape.height,
                    zIndex: shape.type === 'rectangle' ? 1 : 10, // Tiles below objects
                }}
            >
                {source ? (
                    <Image
                        source={source}
                        style={{ width: '100%', height: '100%', resizeMode: shape.type === 'rectangle' ? 'repeat' : 'contain' }}
                    />
                ) : (
                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24 }}>{shape.icon || '?'}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container} edges={['top']}>

                {/* 1. Header with Global Settings */}
                <View style={[styles.header, { top: insets.top }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Créateur de Carte</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {/* Global BG Picker could go here */}
                        <TouchableOpacity onPress={() => Alert.alert('Info', 'Dessinez avec le pinceau !')} style={styles.iconBtn}>
                            <Ionicons name="help-circle-outline" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. World Canvas */}
                <View style={styles.canvasContainer}>
                    <GestureDetector gesture={composedGesture}>
                        <Animated.View style={[styles.world, animatedStyle]}>

                            {/* Global Background */}
                            <Image
                                source={TEXTURE_ASSETS[globalBg]}
                                style={{
                                    position: 'absolute',
                                    width: CANVAS_SIZE,
                                    height: CANVAS_SIZE,
                                    top: SCREEN_HEIGHT / 2 - CANVAS_SIZE / 2,
                                    left: SCREEN_WIDTH / 2 - CANVAS_SIZE / 2,
                                    resizeMode: 'repeat'
                                }}
                            />

                            {/* Shapes */}
                            {shapes.map(renderShape)}

                            {/* Grid Overlay (Optional, faint) */}
                            <View style={{
                                position: 'absolute',
                                width: CANVAS_SIZE, height: CANVAS_SIZE,
                                top: SCREEN_HEIGHT / 2 - CANVAS_SIZE / 2,
                                left: SCREEN_WIDTH / 2 - CANVAS_SIZE / 2,
                                borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
                                userSelect: 'none', pointerEvents: 'none'
                            }} />

                        </Animated.View>
                    </GestureDetector>
                </View>

                {/* 3. Modern HUD */}
                <View style={styles.hud}>

                    {/* Tool Selector */}
                    <View style={styles.toolBar}>
                        {TOOLS.map(tool => (
                            <TouchableOpacity
                                key={tool.id}
                                style={[styles.toolBtn, activeTool === tool.id && styles.activeToolBtn]}
                                onPress={() => setActiveTool(tool.id as any)}
                            >
                                <Ionicons name={tool.icon as any} size={24} color={activeTool === tool.id ? '#FFF' : '#666'} />
                                <Text style={[styles.toolLabel, activeTool === tool.id && { color: '#FFF' }]}>{tool.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Contextual Sub-Menu */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextMenu} contentContainerStyle={{ paddingHorizontal: 16 }}>

                        {activeTool === 'brush' && BRUSHES.map(brush => (
                            <TouchableOpacity
                                key={brush.id}
                                style={[styles.optionBtn, selectedBrush.id === brush.id && styles.activeOption]}
                                onPress={() => { setSelectedBrush(brush); setGlobalBg(brush.id); }} // Selecting brush also sets bg? optional
                            >
                                <Image source={TEXTURE_ASSETS[brush.asset.split(':')[1]]} style={styles.optionImage} />
                                <Text style={styles.optionLabel}>{brush.label}</Text>
                            </TouchableOpacity>
                        ))}

                        {activeTool === 'stamp' && STAMPS.flatMap(cat => cat.items).map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.optionBtn, selectedStamp.label === item.label && styles.activeOption]}
                                onPress={() => setSelectedStamp(item as any)}
                            >
                                {item.image ? (
                                    <Image source={item.image} style={styles.optionImage} />
                                ) : (
                                    <Text style={{ fontSize: 24 }}>{item.asset}</Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        {(activeTool === 'hand' || activeTool === 'erase') && (
                            <Text style={styles.hintText}>
                                {activeTool === 'hand' ? 'Glissez pour vous déplacer dans la carte.' : 'Touchez ou glissez sur des objets pour les supprimer.'}
                            </Text>
                        )}

                    </ScrollView>
                </View>

            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },

    header: {
        position: 'absolute', left: 0, right: 0, zIndex: 50,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 60,
    },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },

    canvasContainer: { flex: 1, backgroundColor: '#87CEEB', overflow: 'hidden' }, // Sky blue background outside map
    world: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },

    hud: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingBottom: 30,
        shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
    },
    toolBar: {
        flexDirection: 'row', justifyContent: 'space-around',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
    },
    toolBtn: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
    activeToolBtn: { backgroundColor: colors.primary },
    toolLabel: { fontSize: 12, marginTop: 4, color: '#666', fontWeight: '600' },

    contextMenu: { width: '100%', height: 70, paddingTop: 10 },
    optionBtn: { alignItems: 'center', marginRight: 16, opacity: 0.6 },
    activeOption: { opacity: 1, transform: [{ scale: 1.1 }] },
    optionImage: { width: 40, height: 40, borderRadius: 8, borderWidth: 2, borderColor: '#FFF' },
    optionLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },

    hintText: { color: '#999', fontSize: 14, fontStyle: 'italic', paddingHorizontal: 20, alignSelf: 'center', marginTop: 10 }
});
