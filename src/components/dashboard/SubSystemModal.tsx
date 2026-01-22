import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Subsystem } from '../../types';
import { SubsystemService } from '../../services/SubsystemService';
import { triggerHaptic } from '../../lib/haptics';
import { useAuth } from '../../contexts/AuthContext';

interface SubSystemModalProps {
    visible: boolean;
    onClose: () => void;
    activeSubsystemId: string | null;
    onSelectSubsystem: (subsystem: Subsystem | null) => void;
}

const COLORS = [
    '#7C3AED', '#EC4899', '#3B82F6', '#10B981',
    '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'
];

export const SubSystemModal: React.FC<SubSystemModalProps> = ({
    visible,
    onClose,
    activeSubsystemId,
    onSelectSubsystem,
}) => {
    const { user } = useAuth();
    const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // New Subsystem State
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [creatingLoader, setCreatingLoader] = useState(false);

    useEffect(() => {
        if (visible && user) {
            loadSubsystems();
        }
    }, [visible, user]);

    const loadSubsystems = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const list = await SubsystemService.listSubsystems(user.uid);
            setSubsystems(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim() || !user) return;

        setCreatingLoader(true);
        try {
            await SubsystemService.createSubsystem(
                user.uid,
                newName,
                newColor
            );
            triggerHaptic.success();
            setNewName('');
            setIsCreating(false);
            loadSubsystems();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer le sous-système');
        } finally {
            setCreatingLoader(false);
        }
    };

    const handleSelect = (subsystem: Subsystem | null) => {
        triggerHaptic.selection();
        onSelectSubsystem(subsystem);
        onClose();
    };

    const renderItem = ({ item }: { item: Subsystem }) => {
        const isActive = activeSubsystemId === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    isActive && { backgroundColor: item.color + '15', borderColor: item.color }
                ]}
                onPress={() => handleSelect(item)}
            >
                <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name="planet" size={24} color={item.color} />
                </View>
                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, isActive && { color: item.color, fontWeight: 'bold' }]}>
                        {item.name}
                    </Text>
                    <Text style={styles.itemCount}>
                        {item.alter_count} alter{item.alter_count > 1 ? 's' : ''}
                    </Text>
                </View>
                {isActive && (
                    <Ionicons name="checkmark-circle" size={24} color={item.color} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.title}>Sous-systèmes</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Global View Option */}
                        <TouchableOpacity
                            style={[
                                styles.item,
                                activeSubsystemId === null && styles.activeGlobalItem
                            ]}
                            onPress={() => handleSelect(null)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="people" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={[styles.itemName, activeSubsystemId === null && { color: colors.primary, fontWeight: 'bold' }]}>
                                    Vue Globale
                                </Text>
                                <Text style={styles.itemCount}>
                                    Tous les alters du système
                                </Text>
                            </View>
                            {activeSubsystemId === null && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            )}
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        {loading ? (
                            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
                        ) : (
                            <FlatList
                                data={subsystems}
                                keyExtractor={item => item.id}
                                renderItem={renderItem}
                                contentContainerStyle={styles.list}
                                ListEmptyComponent={
                                    !isCreating ? (
                                        <Text style={styles.emptyText}>Aucun sous-système créé</Text>
                                    ) : null
                                }
                            />
                        )}

                        {/* Creation Form */}
                        {isCreating ? (
                            <View style={styles.createForm}>
                                <Text style={styles.createTitle}>Nouveau sous-système</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nom (ex: Le Dark Side)"
                                    placeholderTextColor={colors.textMuted}
                                    value={newName}
                                    onChangeText={setNewName}
                                    autoFocus
                                />
                                <View style={styles.colorRow}>
                                    {COLORS.map(color => (
                                        <TouchableOpacity
                                            key={color}
                                            style={[
                                                styles.colorCircle,
                                                { backgroundColor: color },
                                                newColor === color && styles.colorSelected
                                            ]}
                                            onPress={() => setNewColor(color)}
                                        />
                                    ))}
                                </View>
                                <View style={styles.formActions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setIsCreating(false)}
                                    >
                                        <Text style={styles.cancelText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.createButton, { backgroundColor: newColor }]}
                                        onPress={handleCreate}
                                        disabled={creatingLoader}
                                    >
                                        {creatingLoader ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text style={styles.createText}>Créer</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setIsCreating(true)}
                            >
                                <Ionicons name="add" size={24} color={colors.text} />
                                <Text style={styles.addText}>Créer un sous-système</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    list: {
        paddingBottom: 100,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeGlobalItem: {
        backgroundColor: colors.primary + '10',
        borderColor: colors.primary,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    itemCount: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: spacing.xl,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        marginTop: spacing.sm,
    },
    addText: {
        marginLeft: spacing.sm,
        color: colors.text,
        fontWeight: '600',
    },
    createForm: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    createTitle: {
        ...typography.h4,
        marginBottom: spacing.md,
        fontSize: 16,
    },
    input: {
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        color: colors.text,
        marginBottom: spacing.md,
        fontSize: 16,
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: spacing.lg,
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: colors.text,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
    },
    cancelButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    cancelText: {
        color: colors.textSecondary,
    },
    createButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.sm,
    },
    createText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
