import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Dimensions,
    FlatList,
    RefreshControl,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { db, storage } from '../../src/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { triggerHaptic } from '../../src/lib/haptics';

import { DashboardHeader } from '../../src/components/dashboard/DashboardHeader';
import { SystemControlBar } from '../../src/components/dashboard/SystemControlBar';
import { SystemMenuModal } from '../../src/components/dashboard/SystemMenuModal';
import { AddAlterModal } from '../../src/components/dashboard/AddAlterModal';
import { DashboardGrid, GridItem } from '../../src/components/dashboard/DashboardGrid';
import { CategoryFilterModal } from '../../src/components/dashboard/CategoryFilterModal';
import { SubSystemModal } from '../../src/components/dashboard/SubSystemModal';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';

import { Alter } from '../../src/types';

const CONTAINER_PADDING = 16;

const getBubbleConfig = (alterCount: number, availableWidth: number) => {
    if (alterCount <= 5) {
        const size = 80;
        const spacing = 20;
        const columns = Math.floor(availableWidth / (size + spacing));
        return { size, spacing, columns: Math.max(3, columns) };
    } else if (alterCount <= 20) {
        const size = 64;
        const spacing = 14;
        const columns = Math.floor(availableWidth / (size + spacing));
        return { size, spacing, columns: Math.max(4, columns) };
    } else {
        const size = 48;
        const spacing = 10;
        const columns = Math.floor(availableWidth / (size + spacing));
        return { size, spacing, columns: Math.max(5, columns) };
    }
};
/**
 * Dashboard Screen - Refactored for better performance and modularity.
 * Handles the Apple Watch-inspired "Alter Grid" and system utility tools.
 */
export default function Dashboard() {
    const { alters, user, system, refreshAlters, setFronting, activeFront, loading: authLoading, toggleArchive, togglePin } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('single');
    const [selectedAlters, setSelectedAlters] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [subsystemModalVisible, setSubsystemModalVisible] = useState(false);
    const [activeSubsystemId, setActiveSubsystemId] = useState<string | null>(null);

    const { width } = useWindowDimensions();
    const availableWidth = width - (CONTAINER_PADDING * 2);

    // const scrollRef = useRef<FlatList<GridItem>>(null);
    // useScrollToTop(scrollRef as any);

    useEffect(() => {
        if (activeFront.alters.length > 0) {
            setSelectedAlters(activeFront.alters.map(a => a.id));
            if (activeFront.type === 'co-front') {
                setSelectionMode('multi');
            }
        }
    }, [activeFront]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshAlters();
        } finally {
            setRefreshing(false);
        }
    }, [refreshAlters]);

    const bubbleConfig = useMemo(() => getBubbleConfig(alters.length, availableWidth), [alters.length, availableWidth]);
    const { size: BUBBLE_SIZE, spacing: BUBBLE_SPACING, columns: NUM_COLUMNS } = bubbleConfig;

    const filteredAlters = useMemo(() => {
        let result = alters;

        // IMPORTANT: Exclude alters that belong to a subsystem (they appear in their own subsystem dashboard)
        // AND exclude archived alters
        result = result.filter(alter => !alter.subsystem_id && !alter.isArchived);

        // Filter by category first
        if (activeCategory) {
            result = result.filter(alter => alter.role_ids?.includes(activeCategory));
        }

        // Filter by subsystem (for when viewing a specific subsystem)
        if (activeSubsystemId) {
            result = result.filter(alter => alter.subsystem_id === activeSubsystemId);
        }

        // Then filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(alter =>
                alter.name.toLowerCase().includes(query) ||
                alter.pronouns?.toLowerCase().includes(query)
            );
            );
}

// Sort by Pinned status first (pinned at top), then by name
result.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Fallback to name sort or other criteria
    return a.name.localeCompare(b.name);
});

return result;
    }, [alters, searchQuery, activeCategory, activeSubsystemId]);

const gridData = useMemo((): GridItem[] => {
    return [
        { type: 'blurry' },
        { type: 'add' },
        ...filteredAlters.map(alter => ({ type: 'alter' as const, data: alter }))
    ];
}, [filteredAlters]);

const toggleSelection = useCallback((alterId: string) => {
    if (selectionMode === 'single') {
        const alter = alters.find(a => a.id === alterId);
        if (alter) {
            setFronting([alter], 'single');
            router.push(`/alter-space/${alterId}` as any);
        }
    } else {
        setSelectedAlters(prev => {
            const newSelection = prev.includes(alterId)
                ? prev.filter(id => id !== alterId)
                : [...prev, alterId];
            return newSelection;
        });
    }
}, [selectionMode, alters, setFronting]);

const handleConfirmCoFront = async () => {
    if (selectedAlters.length === 0) return;
    const selectedAlterObjects = alters.filter(a => selectedAlters.includes(a.id));
    await setFronting(selectedAlterObjects, selectedAlterObjects.length === 1 ? 'single' : 'co-front');
    triggerHaptic.success();
};

const handleBlurryMode = async () => {
    Alert.alert("Mode Flou", "Entrer en tant que système sans alter spécifique ?", [
        { text: "Annuler", style: "cancel" },
        {
            text: "Continuer", onPress: async () => {
                await setFronting([], 'blurry');
                triggerHaptic.medium();
            }
        }
    ]);
};

const handleOpenMenu = useCallback(() => setMenuVisible(true), []);
const handleCloseMenu = useCallback(() => setMenuVisible(false), []);

const handleCloseAddModal = useCallback(() => setModalVisible(false), []);

const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
    });
    return result.canceled ? null : result.assets[0].uri;
};

const handleCreateAlter = async (data: { name: string, pronouns: string, bio: string, color: string, image: string | null }) => {
    if (!user) return;
    setLoading(true);
    try {
        let avatarUrl = null;
        if (data.image) {
            const response = await fetch(data.image);
            const blob = await response.blob();
            const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
            await uploadBytes(storageRef, blob);
            avatarUrl = await getDownloadURL(storageRef);
        }
        const newAlter = {
            system_id: user.uid,
            name: data.name,
            pronouns: data.pronouns || null,
            bio: data.bio || null,
            color: data.color,
            avatar_url: avatarUrl,
            is_host: false,
            is_active: false,
            created_at: new Date().toISOString(),
        };
        await addDoc(collection(db, 'alters'), newAlter);
        await refreshAlters();
        setModalVisible(false);
        triggerHaptic.success();
    } catch (error) {
        Alert.alert('Erreur', 'Impossible de créer l\'alter');
    } finally {
        setLoading(false);
    }
};

// Handler for editing system name
const handleEditSystemName = () => {
    if (!system || !user) return;

    Alert.prompt(
        "Renommer le système",
        "Entrez le nouveau nom de votre système",
        [
            {
                text: "Annuler",
                style: "cancel"
            },
            {
                text: "Enregistrer",
                onPress: async (newName?: string) => {
                    if (newName && newName.trim().length > 0) {
                        try {
                            const systemRef = doc(db, 'systems', user.uid);
                            await updateDoc(systemRef, {
                                username: newName.trim()
                            });
                            triggerHaptic.success();
                        } catch (error) {
                            console.error("Error updating system name:", error);
                            Alert.alert("Erreur", "Impossible de mettre à jour le nom du système");
                            triggerHaptic.error();
                        }
                    }
                }
            }
        ],
        "plain-text",
        system.username || ""
    );
};

const handleToggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    if (!deleteMode) {
        // Entering delete mode
        setSelectionMode('multi');
        setSelectedAlters([]);
    } else {
        // Exiting delete mode
        setSelectionMode('single');
        setSelectedAlters([]);
    }
};

const handleBulkDelete = async () => {
    if (selectedAlters.length === 0) return;

    // Safety checks
    const hostsSelected = selectedAlters.some(id => {
        const alter = alters.find(a => a.id === id);
        return alter?.is_host;
    });

    if (hostsSelected) {
        Alert.alert('Erreur', 'Vous ne pouvez pas supprimer l\'alter host.');
        return;
    }

    if (alters.length - selectedAlters.length < 1) {
        Alert.alert('Erreur', 'Au moins un alter doit rester dans le système.');
        return;
    }

    // Confirmation
    const count = selectedAlters.length;
    Alert.alert(
        'Confirmer la suppression',
        `Êtes-vous sûr de vouloir supprimer ${count} alter${count > 1 ? 's' : ''} ? Cette action est irréversible.`,
        [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        // Delete all selected alters
                        await Promise.all(
                            selectedAlters.map(id => deleteDoc(doc(db, 'alters', id)))
                        );
                        await refreshAlters();
                        setSelectedAlters([]);
                        setDeleteMode(false);
                        setSelectionMode('single');
                        triggerHaptic.success();
                    } catch (error) {
                        Alert.alert('Erreur', 'Impossible de supprimer les alters');
                        triggerHaptic.error();
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]
    );
};

const handleSelectAll = () => {
    // Select all alters except hosts
    const selectableAlters = alters.filter(alter => !alter.is_host).map(a => a.id);
    setSelectedAlters(selectableAlters);
    triggerHaptic.selection();
};

const handleAlterLongPress = (alter: Alter) => {
    Alert.alert(
        alter.name,
        "Que voulez-vous faire ?",
        [
            { text: "Annuler", style: "cancel" },
            {
                text: alter.isPinned ? "Désépingler" : "Épingler",
                onPress: async () => {
                    await togglePin(alter.id);
                }
            },
            {
                text: "Archiver",
                style: "destructive",
                onPress: async () => {
                    await toggleArchive(alter.id);
                }
            }
        ]
    );
};

return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardGrid
            data={authLoading ? [] : gridData}
            numColumns={NUM_COLUMNS}
            bubbleSize={BUBBLE_SIZE}
            selectionMode={selectionMode}
            selectedAlters={selectedAlters}
            refreshing={refreshing}
            onRefresh={onRefresh}
            toggleSelection={toggleSelection}
            handleBlurryMode={handleBlurryMode}
            setModalVisible={setModalVisible}
            deleteMode={deleteMode}
            ListHeaderComponent={
                <View>
                    <DashboardHeader
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectionMode={selectionMode}
                        onModeChange={setSelectionMode}
                        hasSelection={selectedAlters.length > 0}
                        deleteMode={deleteMode}
                        onToggleDeleteMode={handleToggleDeleteMode}
                        onSelectAll={handleSelectAll}
                        onOpenCategories={() => setCategoryModalVisible(true)}
                        activeCategory={activeCategory}
                        onOpenSubsystems={() => setSubsystemModalVisible(true)}
                        activeSubsystemId={activeSubsystemId}
                        systemName={system?.username}
                        onSystemNamePress={handleEditSystemName}
                    />

                    <View style={{ height: 16 }} />
                </View>
            }
            onAlterLongPress={handleAlterLongPress}
        />

        {/* Delete Button - only show in delete mode */}
        {deleteMode && selectedAlters.length > 0 && (
            <View style={styles.deleteButtonContainer}>
                <AnimatedPressable
                    style={styles.deleteButton}
                    onPress={handleBulkDelete}
                >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.deleteButtonText}>
                        Supprimer {selectedAlters.length} alter{selectedAlters.length > 1 ? 's' : ''}
                    </Text>
                </AnimatedPressable>
            </View>
        )}

        {/* Co-Front Control Bar - only show when NOT in delete mode */}
        {!deleteMode && (
            <SystemControlBar
                onOpenMenu={handleOpenMenu}
                onConfirmFronting={handleConfirmCoFront}
                hasSelection={selectedAlters.length > 0}
            />
        )}

        <AddAlterModal
            visible={modalVisible}
            onClose={handleCloseAddModal}
            onCreate={handleCreateAlter}
            loading={loading}
            pickImage={pickImage}
        />

        <SystemMenuModal
            visible={menuVisible}
            onClose={handleCloseMenu}
            hasSelection={selectedAlters.length > 0}
        />

        <CategoryFilterModal
            visible={categoryModalVisible}
            onClose={() => setCategoryModalVisible(false)}
            systemId={user?.uid || ''}
            alters={alters}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectAlter={(alter) => {
                setFronting([alter], 'single');
                router.push(`/alter-space/${alter.id}` as any);
            }}
        />

        <SubSystemModal
            visible={subsystemModalVisible}
            onClose={() => setSubsystemModalVisible(false)}
            activeSubsystemId={activeSubsystemId}
            onSelectSubsystem={(subsystem) => setActiveSubsystemId(subsystem ? subsystem.id : null)}
        />
    </SafeAreaView>
);
}

// =====================================================
// STYLES - APPLE WATCH INSPIRED DESIGN
// Bulles compactes, espacement fluide, animations subtiles
// =====================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    dashboardHeader: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
    },
    dashboardFooter: {
        paddingTop: spacing.lg,
    },

    /* Section Headers */
    sectionHeader: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        fontSize: 18,
    },

    /* Tools Grid */
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    toolItem: {
        width: '25%', // Use percentage instead of fixed math
        alignItems: 'center',
        gap: 8,
    },
    toolIcon: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toolLabel: {
        ...typography.tiny,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    /* Detailed Widgets */
    widgetsContainer: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
    },

    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingTop: 20,
    },
    skeletonItem: {
        alignItems: 'center',
        marginBottom: 10,
    },

    greeting: {
        ...typography.body,
        color: colors.textSecondary,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        fontSize: 26,
    },
    settingsButton: {
        padding: spacing.sm,
    },


    // Search bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        padding: 0,
    },

    // Mode switcher
    modeSwitchContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: 3,
        marginBottom: spacing.md,
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing.xs,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    modeButtonActive: {
        backgroundColor: colors.backgroundCard,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    modeButtonText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textMuted,
        fontSize: 13,
    },
    modeButtonTextActive: {
        color: colors.text,
    },

    // Alter count
    alterCountContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xs,
    },
    alterCountText: {
        ...typography.caption,
        color: colors.textMuted,
    },

    // Grid container
    gridContainer: {
        flex: 1,
        paddingHorizontal: CONTAINER_PADDING,
    },
    gridContent: {
        paddingBottom: 40,
    },

    // Apple Watch style bubbles - width dynamique via inline style
    bubbleWrapper: {
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    bubbleDimmed: {
        opacity: 0.4,
    },
    // bubble: width/height dynamiques via inline style
    bubble: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        // Ombre subtile style Apple
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    bubbleSelected: {
        borderWidth: 2,
        borderColor: colors.primary,
        // Ring glow effect
        shadowColor: colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
    },
    bubbleInitial: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // bubbleName: maxWidth dynamique via inline style
    bubbleName: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '500',
    },
    bubbleNameSelected: {
        color: colors.primary,
        fontWeight: '700',
    },
    checkBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: colors.primary,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },

    // Special bubbles
    addBubble: {
        backgroundColor: colors.backgroundCard,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    blurryBubble: {
        backgroundColor: colors.backgroundLight,
        borderWidth: 1.5,
        borderColor: colors.textMuted,
    },

    // FAB
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fabButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: spacing.xs,
    },

    // Footer
    footerActions: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
        gap: 4,
    },
    footerButtonText: {
        ...typography.caption,
        color: colors.textSecondary,
    },

    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        maxHeight: '90%',
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center',
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
        color: 'white',
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
        borderWidth: 2,
        borderColor: colors.background,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...typography.body,
        color: colors.text,
    },
    inputMultiline: {
        height: 80,
        textAlignVertical: 'top',
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    createButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },
    createButtonDisabled: {
        opacity: 0.7,
    },
    createButtonText: {
        ...typography.body,
        fontWeight: '600',
        color: 'white',
    },
    deleteButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: spacing.lg,
        right: spacing.lg,
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: '#FF3B30', // iOS red
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

