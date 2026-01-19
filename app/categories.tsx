import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Modal,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { RoleService, ROLE_COLORS, ROLE_PRESETS } from '../src/services/RoleService';
import { Role } from '../src/types';
import { triggerHaptic } from '../src/lib/haptics';

export default function CategoriesScreen() {
    const insets = useSafeAreaInsets();
    const { user, alters } = useAuth();

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPresetsModal, setShowPresetsModal] = useState(false);

    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleColor, setNewRoleColor] = useState(ROLE_COLORS[0]);
    const [newRoleDescription, setNewRoleDescription] = useState('');

    // Fetch roles
    const fetchRoles = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const data = await RoleService.fetchRoles(user.uid);
            setRoles(data);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Get alters count per role
    const getAlterCountForRole = (roleId: string) => {
        return alters.filter(alter => alter.role_ids?.includes(roleId)).length;
    };

    // Create role
    const handleCreateRole = async () => {
        if (!newRoleName.trim() || !user?.uid) return;

        const roleId = await RoleService.createRole(
            user.uid,
            newRoleName,
            newRoleColor,
            newRoleDescription
        );

        if (roleId) {
            setNewRoleName('');
            setNewRoleColor(ROLE_COLORS[0]);
            setNewRoleDescription('');
            setShowAddModal(false);
            fetchRoles();
            triggerHaptic.success();
        } else {
            Alert.alert('Erreur', 'Impossible de créer la catégorie');
        }
    };

    // Create from preset
    const handleCreateFromPreset = async (preset: typeof ROLE_PRESETS[0]) => {
        if (!user?.uid) return;

        const roleId = await RoleService.createRole(
            user.uid,
            preset.name,
            preset.color,
            preset.description
        );

        if (roleId) {
            setShowPresetsModal(false);
            fetchRoles();
            triggerHaptic.success();
        }
    };

    // Delete role
    const handleDeleteRole = (role: Role) => {
        Alert.alert(
            'Supprimer la catégorie',
            `Voulez-vous supprimer "${role.name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await RoleService.deleteRole(role.id);
                        if (success) {
                            fetchRoles();
                            triggerHaptic.success();
                        }
                    }
                }
            ]
        );
    };

    const renderRoleItem = ({ item }: { item: Role }) => {
        const alterCount = getAlterCountForRole(item.id);

        return (
            <View style={styles.roleItem}>
                <View style={[styles.roleColor, { backgroundColor: item.color }]} />
                <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>{item.name}</Text>
                    {item.description && (
                        <Text style={styles.roleDescription} numberOfLines={1}>
                            {item.description}
                        </Text>
                    )}
                </View>
                <View style={styles.roleActions}>
                    <View style={styles.roleCount}>
                        <Text style={styles.roleCountText}>{alterCount}</Text>
                        <Ionicons name="people" size={16} color={colors.textSecondary} />
                    </View>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteRole(item)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Catégories</Text>
                <TouchableOpacity
                    onPress={() => setShowPresetsModal(true)}
                    style={styles.presetButton}
                >
                    <Ionicons name="flash" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                    Les catégories permettent de classer vos alters (ex: Protecteur, Little, Host...)
                </Text>
            </View>

            {/* Roles List */}
            <FlatList
                data={roles}
                keyExtractor={item => item.id}
                renderItem={renderRoleItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="pricetags-outline" size={64} color={colors.textSecondary} />
                        <Text style={styles.emptyTitle}>Aucune catégorie</Text>
                        <Text style={styles.emptySubtitle}>
                            Créez des catégories pour organiser vos alters
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => setShowPresetsModal(true)}
                        >
                            <Ionicons name="flash" size={18} color="white" />
                            <Text style={styles.emptyButtonText}>Créer depuis les modèles</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>

            {/* Add Modal */}
            <Modal visible={showAddModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nouvelle Catégorie</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nom de la catégorie"
                            placeholderTextColor={colors.textSecondary}
                            value={newRoleName}
                            onChangeText={setNewRoleName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Description (optionnel)"
                            placeholderTextColor={colors.textSecondary}
                            value={newRoleDescription}
                            onChangeText={setNewRoleDescription}
                        />

                        <Text style={styles.inputLabel}>Couleur</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                            {ROLE_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        newRoleColor === color && styles.colorSelected
                                    ]}
                                    onPress={() => setNewRoleColor(color)}
                                />
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: newRoleColor }]}
                                onPress={handleCreateRole}
                            >
                                <Text style={styles.confirmButtonText}>Créer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Presets Modal */}
            <Modal visible={showPresetsModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                        <Text style={styles.modalTitle}>Modèles de Catégories</Text>
                        <Text style={styles.modalSubtitle}>
                            Catégories courantes inspirées de Simply Plural
                        </Text>

                        <ScrollView style={styles.presetsList}>
                            {ROLE_PRESETS.map((preset, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.presetItem}
                                    onPress={() => handleCreateFromPreset(preset)}
                                >
                                    <View style={[styles.presetColor, { backgroundColor: preset.color }]} />
                                    <View style={styles.presetInfo}>
                                        <Text style={styles.presetName}>{preset.name}</Text>
                                        <Text style={styles.presetDescription}>{preset.description}</Text>
                                    </View>
                                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowPresetsModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text,
    },
    presetButton: {
        padding: spacing.xs,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.primary}15`,
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    infoText: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: 13,
    },
    list: {
        padding: spacing.md,
    },
    roleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    roleColor: {
        width: 40,
        height: 40,
        borderRadius: 12,
        marginRight: spacing.md,
    },
    roleInfo: {
        flex: 1,
    },
    roleName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    roleDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    roleCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    roleCountText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    roleActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        marginTop: spacing.lg,
        gap: spacing.xs,
    },
    emptyButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        marginBottom: spacing.xs,
    },
    colorPicker: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: spacing.sm,
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    presetsList: {
        maxHeight: 400,
    },
    presetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    presetColor: {
        width: 32,
        height: 32,
        borderRadius: 8,
        marginRight: spacing.md,
    },
    presetInfo: {
        flex: 1,
    },
    presetName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    presetDescription: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    closeButton: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    closeButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
