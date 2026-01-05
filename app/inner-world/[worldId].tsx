
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
import { useAuth } from '../../../src/contexts/AuthContext';
import { InnerWorldService } from '../../../src/services/InnerWorldService';
import { InnerWorldShape, ShapeType, EmotionType, EMOTION_LABELS } from '../../../src/types';
import { colors, spacing, borderRadius } from '../../../src/lib/theme';
import { getThemeColors } from '../../../src/lib/cosmetics';
import { triggerHaptic } from '../../../src/lib/haptics';
import { DraggableItem } from '../../../src/components/story-editor/DraggableItem';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Shape Icons/Previews for the library
const SHAPE_CONFIG: { type: ShapeType; icon: any; label: string }[] = [
    { type: 'rectangle', icon: 'square-outline', label: 'Rectangle' },
    { type: 'l-shape', icon: 'trending-up-outline', label: 'Forme en L' },
    { type: 'irregular', icon: 'shapes-outline', label: 'Bloc' },
    { type: 'organic', icon: 'cloud-outline', label: 'Organique' }
];

export default function InnerWorldEditorScreen() {
    const { worldId } = useLocalSearchParams<{ worldId: string }>();
    const { currentAlter } = useAuth();
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

    const themeColors = currentAlter?.equipped_items?.theme
        ? getThemeColors(currentAlter.equipped_items.theme)
        : null;

    const activeColor = themeColors?.primary || colors.primary;
    const backgroundColor = themeColors?.background || '#F8F9FA'; // Soft architectural background

    useEffect(() => {
        if (!worldId) return;
        const unsubscribe = InnerWorldService.subscribeToShapes(worldId, (data) => {
            setShapes(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [worldId]);

    const handleAddShape = async (type: ShapeType) => {
        if (!worldId) return;
        triggerHaptic.selection();
        setLibraryVisible(false);

        const newShape: Omit<InnerWorldShape, 'id' | 'created_at'> = {
            world_id: worldId,
            type,
            x: SCREEN_WIDTH / 2 - 50,
            y: SCREEN_HEIGHT / 2 - 50,
            width: 100,
            height: 100,
            rotation: 0,
            name: 'Nouvel espace',
        };

        try {
            await InnerWorldService.addShape(newShape);
        } catch (error) {
            console.error('Error adding shape:', error);
        }
    };

    const handleUpdateShapePosition = async (shapeId: string, x: number, y: number) => {
        if (!worldId) return;
        try {
            await InnerWorldService.updateShape(shapeId, worldId, { x, y });
        } catch (error) {
            console.error('Error updating shape position:', error);
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
        let skewX = 0;

        if (shape.type === 'organic') borderRadiusValue = 50;
        if (shape.type === 'irregular') skewX = 0.2;

        return (
            <DraggableItem
                key={shape.id}
                initialX={shape.x}
                initialY={shape.y}
                onDragEnd={(x, y) => handleUpdateShapePosition(shape.id, x, y)}
            >
                <TouchableOpacity
                    onLongPress={() => handleOpenEdit(shape)}
                    activeOpacity={0.8}
                >
                    <View style={[
                        styles.shapeBase,
                        {
                            width: shape.width,
                            height: shape.height,
                            borderRadius: borderRadiusValue,
                            backgroundColor: 'white',
                            borderColor: activeColor + '40',
                            borderWidth: 2,
                        }
                    ]}>
                        {shape.image_url ? (
                            <Image source={{ uri: shape.image_url }} style={styles.shapeImage} />
                        ) : (
                            <View style={styles.shapeContent}>
                                <Text style={styles.shapeLabel} numberOfLines={2}>{shape.name}</Text>
                                {shape.emotion && (
                                    <View style={[styles.emotionBadge, { backgroundColor: activeColor }]}>
                                        <Text style={styles.emotionEmoji}>
                                            {/* We'd need a mapping emoji-emotion here */}
                                            ✨
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
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Inner World</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Canvas */}
                <View style={styles.canvas}>
                    {loading ? (
                        <ActivityIndicator color={activeColor} />
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
                            <Text style={styles.libraryTitle}>Ajouter une forme</Text>
                            <View style={styles.libraryGrid}>
                                {SHAPE_CONFIG.map(config => (
                                    <TouchableOpacity
                                        key={config.type}
                                        style={styles.libraryItem}
                                        onPress={() => handleAddShape(config.type)}
                                    >
                                        <View style={styles.libraryIconBox}>
                                            <Ionicons name={config.icon} size={30} color={activeColor} />
                                        </View>
                                        <Text style={styles.libraryItemText}>{config.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
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
        color: colors.text,
    },
    canvas: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA', // Blueprint style
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
        minHeight: 300,
    },
    libraryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    libraryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    libraryItem: {
        alignItems: 'center',
        width: '25%',
        marginBottom: spacing.lg,
    },
    libraryIconBox: {
        width: 60,
        height: 60,
        borderRadius: 15,
        backgroundColor: '#F1F3F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    libraryItemText: {
        fontSize: 12,
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
    }
});
