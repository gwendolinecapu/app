import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    Dimensions,
    Image,
    Platform,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { db, storage } from '../../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography, alterColors } from '../../src/lib/theme';
import { AlterBubble } from '../../src/components/AlterBubble';

import { Badge } from '../../src/components/ui/Badge';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { EmotionService } from '../../src/services/emotions';
import { Emotion, EMOTION_LABELS, EMOTION_EMOJIS } from '../../src/types';
import { timeAgo } from '../../src/lib/date';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 430;
const containerWidth = width > MAX_WIDTH ? MAX_WIDTH : width;
const BUBBLE_SIZE = 90;

type SortOption = 'name' | 'recent' | 'created';

export default function AltersScreen() {
    const { alters, currentAlter, setFronting, refreshAlters, user, togglePin, toggleArchive } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [showArchived, setShowArchived] = useState(false);

    // Emotion State
    const [systemEmotions, setSystemEmotions] = useState<Record<string, Emotion>>({});

    // Subscribe to emotions
    React.useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = EmotionService.subscribeToSystemEmotions(user.uid, (emotions) => {
            setSystemEmotions(emotions);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    // Derived latest emotion
    const latestSystemEmotion = React.useMemo(() => {
        const emotions = Object.values(systemEmotions);
        if (emotions.length === 0) return null;

        // Sort by created_at descending
        // Handle checking typings safely
        return emotions.sort((a, b) => {
            const timeA = (a.created_at as any)?.seconds || new Date(a.created_at).getTime() / 1000;
            const timeB = (b.created_at as any)?.seconds || new Date(b.created_at).getTime() / 1000;
            return timeB - timeA;
        })[0];
    }, [systemEmotions]);

    const getAlterName = (id: string) => alters.find(a => a.id === id)?.name || 'Alter inconnu';

    // Form State
    const [newAlterName, setNewAlterName] = useState('');
    const [newAlterPronouns, setNewAlterPronouns] = useState('');
    const [newAlterBio, setNewAlterBio] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(alterColors[0]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSwitchAlter = async (alter: Alter) => {
        await setFronting([alter], 'single');
    };

    const pickImage = async () => {
        // Request permission
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleCreateAlter = async () => {
        if (!newAlterName.trim()) {
            Alert.alert('Erreur', 'Le nom est requis');
            return;
        }

        if (!user) {
            Alert.alert('Erreur', 'Vous devez être connecté');
            return;
        }

        setLoading(true);
        try {
            let avatarUrl = null;

            // Upload image if selected
            if (selectedImage) {
                try {
                    const response = await fetch(selectedImage);
                    const blob = await response.blob();
                    const fileName = `${user.uid}/${Date.now()}.jpg`;

                    const storageRef = ref(storage, `avatars/${fileName}`);
                    await uploadBytes(storageRef, blob);
                    avatarUrl = await getDownloadURL(storageRef);
                } catch (uploadErr) {

                }
            }

            const newAlterData = {
                system_id: user.uid,
                name: newAlterName.trim(),
                pronouns: newAlterPronouns.trim() || null,
                bio: newAlterBio.trim() || null,
                color: selectedColor,
                avatar_url: avatarUrl,
                is_host: alters.length === 0,
                is_active: false,
                created_at: new Date().toISOString(),
            };

            const docRef = await addDoc(collection(db, 'alters'), newAlterData);


            await refreshAlters();
            setModalVisible(false);
            resetForm();
            Alert.alert('Succès', `${newAlterName} a été créé !`);
        } catch (error: any) {

            Alert.alert('Erreur', error.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewAlterName('');
        setNewAlterPronouns('');
        setNewAlterBio('');
        setSelectedColor(alterColors[0]);
        setSelectedImage(null);
    };

    const renderAlterItem = ({ item }: { item: Alter }) => (
        <View style={styles.gridItem}>
            <AlterBubble
                alter={item}
                isActive={currentAlter?.id === item.id}
                onPress={() => handleSwitchAlter(item)}
                onLongPress={() => router.push(`/alter/${item.id}`)}
                size={BUBBLE_SIZE}
            />
        </View>
    );

    const filteredAlters = React.useMemo(() => {
        let result = [...alters];

        // 1. Filter by Archive
        if (!showArchived) {
            result = result.filter(a => !a.isArchived);
        } else {
            result = result.filter(a => a.isArchived);
        }

        // 2. Filter by Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(query) ||
                a.pronouns?.toLowerCase().includes(query) ||
                a.role_ids?.includes(query) // Simple check, ideally map roles
            );
        }

        // 3. Sort
        result.sort((a, b) => {
            // Always pinned first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'created':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'recent':
                    // Approximated by created for now if no lastFronted available
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default:
                    return 0;
            }
        });

        return result;
    }, [alters, searchQuery, sortBy, showArchived]);

    const handleLongPress = (alter: Alter) => {
        Alert.alert(
            alter.name,
            'Options de gestion',
            [
                {
                    text: alter.isPinned ? 'Désépingler' : 'Épingler',
                    onPress: () => togglePin(alter.id)
                },
                {
                    text: alter.isArchived ? 'Désarchiver' : 'Archiver',
                    onPress: () => toggleArchive(alter.id),
                    style: 'destructive'
                },
                { text: 'Annuler', style: 'cancel' }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/settings/index' as any)}>
                        <Text style={styles.headerIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.title}>Mes Alters</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <TouchableOpacity onPress={() => router.push('/crisis/index' as any)}>
                        <Ionicons name="warning-outline" size={28} color={colors.error || '#FF4444'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                        <Text style={styles.headerIcon}>👤</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Status Banner */}
            {latestSystemEmotion && (
                <View style={styles.statusBanner}>
                    <Text style={styles.statusText}>
                        <Text style={{ fontWeight: 'bold' }}>{getAlterName(latestSystemEmotion.alter_id)}</Text> est {EMOTION_LABELS[latestSystemEmotion.emotion]?.toLowerCase() || '...'} {EMOTION_EMOJIS[latestSystemEmotion.emotion]} {timeAgo(latestSystemEmotion.created_at)}
                    </Text>
                </View>
            )}

            {/* Search & Filter Bar */}
            <View style={styles.filterContainer}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={{ flex: 1, marginRight: 10 }}
                />
                <TouchableOpacity
                    style={[styles.filterButton, showArchived && styles.filterButtonActive]}
                    onPress={() => setShowArchived(!showArchived)}
                >
                    <Ionicons name="archive-outline" size={20} color={showArchived ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Bubbles Grid */}
            <FlatList
                data={alters}
                renderItem={renderAlterItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                refreshing={loading} // Use loading state for refresh
                onRefresh={refreshAlters} // refreshAlters is async, need compatibility
                ListHeaderComponent={() => (
                    <View style={styles.gridItem}>
                        <TouchableOpacity
                            style={styles.addBubbleContainer}
                            onPress={() => setModalVisible(true)}
                        >
                            <View style={[styles.bubble, styles.addBubble]}>
                                <Text style={styles.addIcon}>+</Text>
                            </View>
                            <Text style={styles.bubbleName}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Current Alter Info */}
            {currentAlter && (
                <View style={styles.currentAlterBar}>
                    <View style={[styles.miniAvatar, { backgroundColor: currentAlter.color }]}>
                        {currentAlter.avatar_url ? (
                            <Image
                                source={{ uri: currentAlter.avatar_url }}
                                style={styles.miniAvatarImage}
                            />
                        ) : (
                            <Text style={styles.miniAvatarText}>
                                {currentAlter.name.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.currentAlterInfo}>
                        <Text style={styles.currentAlterName}>{currentAlter.name}</Text>
                        <Text style={styles.currentAlterStatus}>En front</Text>
                    </View>
                </View>
            )}

            {/* Add Alter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nouvel Alter</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Avatar Picker */}
                            <View style={styles.avatarPickerContainer}>
                                <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
                                    {selectedImage ? (
                                        <Image source={{ uri: selectedImage }} style={styles.avatarPreview} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: selectedColor }]}>
                                            <Text style={styles.avatarPlaceholderText}>
                                                {newAlterName ? newAlterName.charAt(0).toUpperCase() : '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.cameraIcon}>
                                        <Text>📷</Text>
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.avatarHint}>Modifier l'image de profil</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Pseudo *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newAlterName}
                                    onChangeText={setNewAlterName}
                                    placeholder="Nom de l'alter"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Pronoms</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newAlterPronouns}
                                    onChangeText={setNewAlterPronouns}
                                    placeholder="elle/lui, iel..."
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Bio</Text>
                                <TextInput
                                    style={[styles.input, styles.inputMultiline]}
                                    value={newAlterBio}
                                    onChangeText={setNewAlterBio}
                                    placeholder="Description..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Couleur</Text>
                                <View style={styles.colorPicker}>
                                    {alterColors.map((color) => (
                                        <TouchableOpacity
                                            key={color}
                                            style={[
                                                styles.colorOption,
                                                { backgroundColor: color },
                                                selectedColor === color && styles.colorOptionSelected,
                                            ]}
                                            onPress={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.createButton, loading && styles.createButtonDisabled]}
                                onPress={handleCreateAlter}
                                disabled={loading}
                            >
                                <Text style={styles.createButtonText}>
                                    {loading ? 'Création...' : 'Enreg.'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
    },
    headerIcon: {
        fontSize: 24,
    },
    title: {
        ...typography.h2,
    },
    // Filter & Search Styles
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterButtonActive: {
        backgroundColor: colors.backgroundCard,
        borderColor: colors.primary,
    },
    pinBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: colors.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.background,
    },
    gridContent: {
        padding: spacing.md,
        paddingBottom: 100, // Space for bottom bar
    },
    gridItem: {
        flex: 1,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    addBubbleContainer: {
        width: BUBBLE_SIZE + 10,
        alignItems: 'center',
        marginBottom: spacing.md,
        marginHorizontal: spacing.xs,
    },
    bubble: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    addBubble: {
        backgroundColor: colors.backgroundCard,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    addIcon: {
        fontSize: 40,
        color: colors.textMuted,
    },
    bubbleName: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    currentAlterBar: {
        position: 'absolute',
        bottom: 80,
        left: spacing.md,
        right: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    miniAvatarImage: {
        width: '100%',
        height: '100%',
    },
    miniAvatarText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    currentAlterInfo: {
        marginLeft: spacing.md,
    },
    currentAlterName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    currentAlterStatus: {
        ...typography.caption,
        color: colors.success,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '85%',
    },
    modalTitle: {
        ...typography.h2,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    avatarPickerContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarPicker: {
        position: 'relative',
    },
    avatarPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.text,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarHint: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputMultiline: {
        height: 80,
        textAlignVertical: 'top',
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: 'bold',
    },
    createButton: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    statusBanner: {
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        padding: spacing.sm,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary, // or a soft color
        flexDirection: 'row',
        justifyContent: 'center'
    },
    statusText: {
        ...typography.body,
        color: colors.text,
    }
});
