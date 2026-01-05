
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { InnerWorldService } from '../../src/services/InnerWorldService';
import { InnerWorld, InnerWorldShape } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { getThemeColors } from '../../src/lib/cosmetics';
import { triggerHaptic } from '../../src/lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function InnerWorldListScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { currentAlter, user } = useAuth();
    const router = useRouter();

    const [worlds, setWorlds] = useState<InnerWorld[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newWorldName, setNewWorldName] = useState('');
    const [creating, setCreating] = useState(false);

    const themeColors = currentAlter?.equipped_items?.theme
        ? getThemeColors(currentAlter.equipped_items.theme)
        : null;

    const activeColor = themeColors?.primary || colors.primary;
    const backgroundColor = themeColors?.background || colors.background;
    const textColor = themeColors?.text || colors.text;

    const loadWorlds = useCallback(async () => {
        if (!alterId || !user) return;
        try {
            const data = await InnerWorldService.fetchWorlds(alterId, user.uid);
            setWorlds(data);
        } catch (error) {
            console.error('Error loading worlds:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [alterId, user]);

    useEffect(() => {
        loadWorlds();
    }, [loadWorlds]);

    const handleCreateWorld = async () => {
        if (!newWorldName.trim() || !user || !alterId) return;

        setCreating(true);
        try {
            const worldId = await InnerWorldService.createWorld({
                name: newWorldName.trim(),
                system_id: user.uid,
                alter_id: alterId,
            });
            setModalVisible(false);
            setNewWorldName('');
            triggerHaptic.success();
            // Navigate to editor
            router.push(`/inner-world/${worldId}`);
            loadWorlds();
        } catch (error) {
            console.error('Error creating world:', error);
            Alert.alert('Erreur', 'Impossible de créer le monde intérieur.');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteWorld = (worldId: string, name: string) => {
        Alert.alert(
            'Supprimer le monde',
            `Voulez-vous vraiment supprimer "${name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await InnerWorldService.deleteWorld(worldId);
                            setWorlds(prev => prev.filter(w => w.id !== worldId));
                            triggerHaptic.selection();
                        } catch (error) {
                            console.error('Error deleting world:', error);
                        }
                    }
                }
            ]
        );
    };

    const renderWorldItem = ({ item }: { item: InnerWorld }) => (
        <TouchableOpacity
            style={[styles.worldCard, { backgroundColor: themeColors?.backgroundCard || colors.surface }]}
            onPress={() => router.push(`/inner-world/${item.id}`)}
        >
            <View style={styles.worldIconContainer}>
                <LinearGradient
                    colors={[activeColor, activeColor + '80']}
                    style={styles.worldGradient}
                >
                    <Ionicons name="planet" size={30} color="white" />
                </LinearGradient>
            </View>
            <View style={styles.worldInfo}>
                <Text style={[styles.worldName, { color: textColor }]}>{item.name}</Text>
                <Text style={styles.worldDate}>
                    Mis à jour le {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteWorld(item.id, item.name)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textColor }]}>Inner Worlds</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={30} color={activeColor} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={activeColor} />
                </View>
            ) : (
                <FlatList
                    data={worlds}
                    renderItem={renderWorldItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadWorlds();
                            }}
                            tintColor={activeColor}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="planet-outline" size={80} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Aucun monde intérieur trouvé.</Text>
                            <TouchableOpacity
                                style={[styles.createButton, { backgroundColor: activeColor }]}
                                onPress={() => setModalVisible(true)}
                            >
                                <Text style={styles.createButtonText}>Créer mon premier monde</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: themeColors?.backgroundCard || colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: textColor }]}>Nouveau Monde Intérieur</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: colors.border }]}
                            placeholder="Nom du monde (ex: Le Refuge)"
                            placeholderTextColor={colors.textMuted}
                            value={newWorldName}
                            onChangeText={setNewWorldName}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewWorldName('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmit, { backgroundColor: activeColor }]}
                                onPress={handleCreateWorld}
                                disabled={creating || !newWorldName.trim()}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Créer</Text>
                                )}
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        height: 60,
    },
    backButton: {
        padding: spacing.xs,
    },
    title: {
        ...typography.h2,
        fontWeight: 'bold',
    },
    addButton: {
        padding: spacing.xs,
    },
    list: {
        padding: spacing.md,
    },
    worldCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    worldIconContainer: {
        marginRight: spacing.md,
    },
    worldGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    worldInfo: {
        flex: 1,
    },
    worldName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    worldDate: {
        fontSize: 12,
        color: colors.textMuted,
    },
    deleteButton: {
        padding: spacing.sm,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textMuted,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    createButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        marginBottom: spacing.xl,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
    },
    modalCancel: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    modalCancelText: {
        color: colors.textMuted,
        fontWeight: '600',
    },
    modalSubmit: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        minWidth: 100,
        alignItems: 'center',
    },
    modalSubmitText: {
        color: 'white',
        fontWeight: 'bold',
    }
});
