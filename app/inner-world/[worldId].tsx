
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Image,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
    Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { useAuth } from '../../src/contexts/AuthContext';
import { InnerWorldService } from '../../src/services/InnerWorldService';
import { InnerWorldShape, ShapeType, EmotionType, EMOTION_LABELS, EMOTION_EMOJIS } from '../../src/types';
import { colors, spacing, borderRadius, alterColors } from '../../src/lib/theme';
import { getThemeColors } from '../../src/lib/cosmetics';
import { triggerHaptic } from '../../src/lib/haptics';
import { DraggableItem } from '../../src/components/story-editor/DraggableItem';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Categorized assets for the World Builder
const SHAPE_CATEGORIES = [
    {
        id: 'shapes',
        label: 'Formes',
        items: [
            { type: 'rectangle', icon: 'square-outline', label: 'Rectangle' },
            { type: 'organic', icon: 'cloud-outline', label: 'Organique' },
            { type: 'custom', icon: 'color-palette-outline', label: 'Sur mesure' },
        ]
    },
    {
        id: 'buildings',
        label: 'Bâtiments',
        items: [
            { type: 'building', icon: 'home-outline', label: 'Maison', asset: 'home' },
            { type: 'building', icon: 'school-outline', label: 'École', asset: 'school' },
            { type: 'building', icon: 'cart-outline', label: 'Marché', asset: 'cart' },
            { type: 'building', icon: 'business-outline', label: 'Bureau', asset: 'business' },
            { type: 'building', icon: 'medkit-outline', label: 'Hôpital', asset: 'medkit' },
            { type: 'building', icon: 'library-outline', label: 'Musée', asset: 'library' },
        ]
    },
    {
        id: 'nature',
        label: 'Nature',
        items: [
            { type: 'nature', icon: 'leaf-outline', label: 'Arbre', asset: 'leaf' },
            { type: 'nature', icon: 'water-outline', label: 'Eau', asset: 'water' },
            { type: 'nature', icon: 'sunny-outline', label: 'Soleil', asset: 'sunny' },
            { type: 'nature', icon: 'rose-outline', label: 'Fleur', asset: 'rose' },
            { type: 'nature', icon: 'earth-outline', label: 'Terre', asset: 'planet' },
        ]
    },
    {
        id: 'decor',
        label: 'Décor & Loisirs',
        items: [
            { type: 'furniture', icon: 'flag-outline', label: 'Drapeau', asset: 'flag' },
            { type: 'transport', icon: 'car-outline', label: 'Voiture', asset: 'car' },
            { type: 'transport', icon: 'boat-outline', label: 'Bateau', asset: 'boat' },
            { type: 'furniture', icon: 'balloon-outline', label: 'Ballon', asset: 'balloon' },
            { type: 'furniture', icon: 'megaphone-outline', label: 'Cirque', asset: 'megaphone' },
        ]
    }
];

export default function InnerWorldEditorScreen() {
    const { worldId } = useLocalSearchParams<{ worldId: string }>();
    const { currentAlter, user } = useAuth();
    const router = useRouter();

    const [shapes, setShapes] = useState<InnerWorldShape[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShape, setSelectedShape] = useState<InnerWorldShape | null>(null);
    const [libraryVisible, setLibraryVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    // Edit state
    const [editName, setEditName] = useState('');
    const [editIntention, setEditIntention] = useState('');
    const [editEmotion, setEditEmotion] = useState<EmotionType | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [worldBackgroundColor, setWorldBackgroundColor] = useState('#F1F3F5');
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [retryTrigger, setRetryTrigger] = useState(0);
    const [canvasLayout, setCanvasLayout] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

    const themeColors = currentAlter?.equipped_items?.theme
        ? getThemeColors(currentAlter.equipped_items.theme)
        : null;

    const activeColor = themeColors?.primary || colors.primary;
    const backgroundColor = themeColors?.background || '#F8F9FA'; // Soft architectural background

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!worldId || !user) return;
        setError(null);

        const unsubscribe = InnerWorldService.subscribeToShapes(
            worldId,
            user.uid,
            (data: InnerWorldShape[]) => {
                setShapes(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error subscribing to shapes:', err);
                if (err.code === 'failed-precondition') {
                    setError('Indexation en cours... Veuillez patienter quelques minutes.');
                } else {
                    setError('Erreur lors du chargement des formes.');
                }
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [worldId, user]);

    const handleAddShape = async (type: ShapeType, iconName?: string) => {
        if (!worldId || !user) return;
        triggerHaptic.selection();
        setLibraryVisible(false);

        const newShape: Omit<InnerWorldShape, 'id' | 'created_at'> = {
            world_id: worldId,
            type,
            x: canvasLayout.width / 2 - 50,
            y: canvasLayout.height / 2 - 50,
            width: 100,
            height: 100,
            rotation: 0,
            name: iconName ? '' : 'Nouvel espace',
            icon: iconName,
        };

        try {
            await InnerWorldService.addShape(newShape, user.uid);
        } catch (error) {
            console.error('Error adding shape:', error);
        }
    };

    const handleUpdateShape = async (shapeId: string, updates: Partial<InnerWorldShape>) => {
        if (!worldId) return;
        try {
            await InnerWorldService.updateShape(shapeId, worldId, updates);
        } catch (error) {
            console.error('Error updating shape:', error);
        }
    };

    const handleSelectShape = (shape: InnerWorldShape | null) => {
        setSelectedShape(shape);
        if (shape) {
            triggerHaptic.selection();
        }
    };

    const handleOpenEdit = (shape: InnerWorldShape) => {
        setSelectedShape(shape);
        setEditName(shape.name);
        setEditIntention(shape.intention || '');
        setEditEmotion(shape.emotion);
        setEditModalVisible(true);
        triggerHaptic.selection();
    };

    const handleSaveEdit = async () => {
        if (!selectedShape || !worldId) return;
        setSaving(true);
        try {
            await InnerWorldService.updateShape(selectedShape.id, worldId, {
                name: editName,
                intention: editIntention,
                emotion: editEmotion,
            });
            setEditModalVisible(false);
            triggerHaptic.success();
        } catch (error) {
            console.error('Error saving edits:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteShape = async () => {
        if (!selectedShape || !worldId) return;
        Alert.alert('Supprimer', 'Voulez-vous supprimer cette forme ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await InnerWorldService.deleteShape(selectedShape.id, worldId);
                        setEditModalVisible(false);
                        triggerHaptic.selection();
                    } catch (error) {
                        console.error('Error deleting shape:', error);
                    }
                }
            }
        ]);
    };

    const pickImage = async () => {
        if (!selectedShape || !worldId) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            // In a real app, upload to storage first. For now, we simulate update.
            // Ideally: await StorageService.upload...
            await InnerWorldService.updateShape(selectedShape.id, worldId, {
                image_url: result.assets[0].uri
            });
        }
    };

    const renderShape = (shape: InnerWorldShape) => {
        let borderRadiusValue = 4;
        let isSticker = ['building', 'nature', 'transport', 'furniture'].includes(shape.type);

        if (shape.type === 'organic') borderRadiusValue = 50;

        return (
            <DraggableItem
                key={shape.id}
                initialX={shape.x}
                initialY={shape.y}
                initialScale={shape.width / 100}
                initialRotation={shape.rotation}
                onDragEnd={(x: number, y: number) => handleUpdateShape(shape.id, { x, y })}
                onScaleEnd={(s: number) => handleUpdateShape(shape.id, { width: 100 * s, height: 100 * s })}
                onRotateEnd={(r: number) => handleUpdateShape(shape.id, { rotation: r })}
            >
                <TouchableOpacity
                    onPress={() => handleSelectShape(shape)}
                    onLongPress={() => handleOpenEdit(shape)}
                    activeOpacity={0.8}
                >
                    <View style={[
                        styles.shapeBase,
                        {
                            width: shape.width,
                            height: shape.height,
                            borderRadius: shape.border_radius || borderRadiusValue,
                            backgroundColor: isSticker && !selectedShape ? 'transparent' : (shape.color || 'white'),
                            borderColor: selectedShape?.id === shape.id ? activeColor : (isSticker ? 'transparent' : (activeColor + '40')),
                            borderWidth: selectedShape?.id === shape.id ? 3 : 2,
                        }
                    ]}>
                        {shape.image_url ? (
                            <Image source={{ uri: shape.image_url }} style={styles.shapeImage} />
                        ) : shape.icon ? (
                            <View style={styles.shapeContent}>
                                <Ionicons
                                    name={shape.icon as any}
                                    size={Math.min(shape.width, shape.height) * 0.8}
                                    color={shape.color && shape.color !== 'white' ? 'white' : activeColor}
                                />
                                {shape.name ? <Text style={styles.shapeLabel} numberOfLines={1}>{shape.name}</Text> : null}
                            </View>
                        ) : (
                            <View style={styles.shapeContent}>
                                <Text style={styles.shapeLabel} numberOfLines={2}>{shape.name}</Text>
                                {shape.emotion && (
                                    <View style={[styles.emotionBadge, { backgroundColor: activeColor }]}>
                                        <Text style={styles.emotionEmoji}>
                                            {EMOTION_EMOJIS[shape.emotion] || '✨'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </DraggableItem>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
                {/* Header Overlay */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                        <Ionicons name="close" size={28} color={activeColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: activeColor }]}>Inner World</Text>
                    <TouchableOpacity onPress={() => setShowBgPicker(!showBgPicker)} style={styles.headerButton}>
                        <Ionicons name="color-fill-outline" size={24} color={activeColor} />
                    </TouchableOpacity>
                </View>

                {/* World Background Picker Overlay */}
                {showBgPicker && (
                    <View style={styles.headerToolbar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {['#F1F3F5', '#FFF9DB', '#E7F5FF', '#F3F0FF', '#EBFBEE'].map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.bgSwatch, { backgroundColor: c }, worldBackgroundColor === c && styles.activeBgSwatch]}
                                    onPress={() => {
                                        setWorldBackgroundColor(c);
                                        setShowBgPicker(false);
                                    }}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Personalization Toolbar (Visible when a shape is selected) */}
                {selectedShape && (
                    <View style={styles.toolbar}>
                        <View style={styles.toolbarRow}>
                            <Text style={styles.toolbarLabel}>Couleur</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorList}>
                                {alterColors.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorSwatch,
                                            { backgroundColor: color },
                                            selectedShape.color === color && styles.activeSwatch
                                        ]}
                                        onPress={() => handleUpdateShape(selectedShape.id, { color })}
                                    />
                                ))}
                                <TouchableOpacity
                                    style={[styles.colorSwatch, { backgroundColor: 'white', borderColor: '#DDD', borderWidth: 1 }]}
                                    onPress={() => handleUpdateShape(selectedShape.id, { color: 'white' })}
                                >
                                    <Ionicons name="refresh" size={12} color="#999" />
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                        <View style={styles.toolbarRow}>
                            <Text style={styles.toolbarLabel}>Bordure</Text>
                            <View style={styles.radiusRow}>
                                {[0, 4, 12, 50].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[
                                            styles.radiusOption,
                                            selectedShape.border_radius === r && { backgroundColor: activeColor }
                                        ]}
                                        onPress={() => handleUpdateShape(selectedShape.id, { border_radius: r })}
                                    >
                                        <View style={[
                                            styles.radiusPreview,
                                            { borderRadius: r, borderColor: selectedShape.border_radius === r ? 'white' : '#DDD' }
                                        ]} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ flex: 1 }} />
                            <TouchableOpacity
                                style={styles.deselectBtn}
                                onPress={() => setSelectedShape(null)}
                            >
                                <Ionicons name="checkmark-circle" size={24} color={activeColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Canvas */}
                <View
                    style={[styles.canvas, { backgroundColor: worldBackgroundColor }]}
                    onLayout={(e) => {
                        const { width, height } = e.nativeEvent.layout;
                        setCanvasLayout({ width, height });
                    }}
                >
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator color={activeColor} size="large" />
                        </View>
                    ) : error ? (
                        <View style={styles.centerContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: activeColor }]}
                                onPress={() => {
                                    setLoading(true);
                                    setRetryTrigger(prev => prev + 1);
                                }}
                            >
                                <Text style={styles.retryText}>Réessayer</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        shapes.map(renderShape)
                    )}
                </View>

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: activeColor }]}
                    onPress={() => setLibraryVisible(true)}
                >
                    <Ionicons name="add" size={32} color="white" />
                </TouchableOpacity>

                {/* Library Modal */}
                <Modal visible={libraryVisible} transparent animationType="slide">
                    <Pressable style={styles.modalOverlay} onPress={() => setLibraryVisible(false)}>
                        <View style={styles.libraryContent}>
                            <Text style={styles.libraryTitle}>Bibliothèque d'objets</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {SHAPE_CATEGORIES.map(category => (
                                    <View key={category.id} style={styles.categorySection}>
                                        <Text style={styles.categoryLabel}>{category.label}</Text>
                                        <View style={styles.libraryGrid}>
                                            {category.items.map(config => (
                                                <TouchableOpacity
                                                    key={config.label}
                                                    style={styles.libraryItem}
                                                    onPress={() => handleAddShape(config.type as ShapeType, (config as any).asset)}
                                                >
                                                    <View style={styles.libraryIconBox}>
                                                        <Ionicons name={config.icon as any} size={24} color={activeColor} />
                                                    </View>
                                                    <Text style={styles.libraryItemText}>{config.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Modal>

                {/* Edit Modal */}
                <Modal visible={editModalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.editModal}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>Personnaliser l'espace</Text>

                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                    {selectedShape?.image_url ? (
                                        <Image source={{ uri: selectedShape.image_url }} style={styles.pickedImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
                                            <Text style={styles.imagePlaceholderText}>Ajouter une image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.label}>Nom de l'espace</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Ex: Mon Sanctuaire"
                                />

                                <Text style={styles.label}>Intention</Text>
                                <TextInput
                                    style={[styles.input, { height: 80 }]}
                                    value={editIntention}
                                    onChangeText={setEditIntention}
                                    placeholder="Décrivez l'énergie de cet endroit..."
                                    multiline
                                />

                                <View style={styles.editActions}>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={handleDeleteShape}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                        <Text style={styles.deleteBtnText}>Supprimer</Text>
                                    </TouchableOpacity>

                                    <View style={{ flex: 1 }} />

                                    <TouchableOpacity
                                        style={[styles.saveBtn, { backgroundColor: activeColor }]}
                                        onPress={handleSaveEdit}
                                        disabled={saving}
                                    >
                                        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.closeModal}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        height: 60,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    headerToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        zIndex: 100,
    },
    bgSwatch: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    activeBgSwatch: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    canvas: {
        flex: 1,
        backgroundColor: '#F1F3F5', // Blueprint style - softer
    },
    shapeBase: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        overflow: 'hidden',
    },
    shapeImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    shapeContent: {
        padding: 5,
        alignItems: 'center',
    },
    shapeLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        color: colors.textSecondary,
    },
    emotionBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    emotionEmoji: {
        fontSize: 8,
        color: 'white',
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    libraryContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: spacing.xl,
        height: '80%', // Higher for more items
    },
    libraryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    categorySection: {
        marginBottom: spacing.xl,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    libraryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    libraryItem: {
        alignItems: 'center',
        width: '25%',
        marginBottom: spacing.md,
    },
    libraryIconBox: {
        width: 54,
        height: 54,
        borderRadius: 15,
        backgroundColor: '#F1F3F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    libraryItemText: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    editModal: {
        backgroundColor: 'white',
        margin: spacing.lg,
        borderRadius: 25,
        padding: spacing.xl,
        height: '70%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    imagePicker: {
        width: '100%',
        height: 150,
        backgroundColor: '#F1F3F5',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    imagePlaceholderText: {
        marginTop: 8,
        color: colors.textMuted,
    },
    pickedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
        marginTop: spacing.md,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderRadius: 10,
        padding: spacing.md,
        fontSize: 16,
    },
    editActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingBottom: 40,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    deleteBtnText: {
        color: colors.error,
        marginLeft: 8,
        fontWeight: '600',
    },
    saveBtn: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 15,
    },
    saveBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    closeModal: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: spacing.md,
    },
    toolbar: {
        position: 'absolute',
        top: 70, // Below header
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 20,
    },
    toolbarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    toolbarLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
        width: 60,
    },
    colorList: {
        flex: 1,
    },
    colorSwatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeSwatch: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    radiusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radiusOption: {
        padding: 4,
        borderRadius: 8,
        marginRight: 10,
    },
    radiusPreview: {
        width: 20,
        height: 20,
        borderWidth: 2,
    },
    deselectBtn: {
        padding: 4,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    retryButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    retryText: {
        color: 'white',
        fontWeight: 'bold',
    }
});
