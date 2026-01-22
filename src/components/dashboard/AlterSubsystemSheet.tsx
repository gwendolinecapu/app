import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Alter, Subsystem } from '../../types';
import { SubsystemService } from '../../services/SubsystemService';
import { triggerHaptic } from '../../lib/haptics';
import { useAuth } from '../../contexts/AuthContext';

interface AlterSubsystemSheetProps {
    visible: boolean;
    onClose: () => void;
    alter: Alter | null;
    subsystems: Subsystem[];
    onAssign: (alterId: string, subsystemId: string | null) => Promise<void>;
    onCreateSubsystem: () => void;
}

const COLORS = [
    '#7C3AED', '#EC4899', '#3B82F6', '#10B981',
    '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'
];

export const AlterSubsystemSheet: React.FC<AlterSubsystemSheetProps> = ({
    visible,
    onClose,
    alter,
    subsystems,
    onAssign,
    onCreateSubsystem,
}) => {
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLORS[0]);
    const { user } = useAuth();

    if (!alter) return null;

    const currentSubsystem = subsystems.find(s => s.id === alter.subsystem_id);

    const handleAssign = async (subsystemId: string | null) => {
        setLoading(true);
        try {
            await onAssign(alter.id, subsystemId);
            triggerHaptic.success();
            onClose();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'assigner l\'alter');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAndAssign = async () => {
        if (!newName.trim() || !user) return;

        setLoading(true);
        try {
            const newId = await SubsystemService.createSubsystem(
                user.uid,
                newName.trim(),
                newColor
            );
            await onAssign(alter.id, newId);
            triggerHaptic.success();
            setNewName('');
            setIsCreating(false);
            onClose();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer le sous-système');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={styles.sheet}>
                    {/* Header with Alter Info */}
                    <View style={styles.sheetHeader}>
                        <View style={styles.alterInfo}>
                            {alter.avatar_url || alter.avatar ? (
                                <Image
                                    source={{ uri: alter.avatar_url || alter.avatar }}
                                    style={styles.alterAvatar}
                                />
                            ) : (
                                <View style={[styles.alterAvatar, { backgroundColor: alter.color || colors.primary }]}>
                                    <Text style={styles.alterInitial}>{alter.name.charAt(0)}</Text>
                                </View>
                            )}
                            <View>
                                <Text style={styles.alterName}>{alter.name}</Text>
                                <Text style={styles.sheetSubtitle}>Assigner à un sous-système</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Current Subsystem */}
                    {currentSubsystem && (
                        <View style={styles.currentSection}>
                            <Text style={styles.sectionLabel}>Actuel</Text>
                            <View style={[styles.currentBadge, { backgroundColor: currentSubsystem.color + '20' }]}>
                                <View style={[styles.colorDot, { backgroundColor: currentSubsystem.color }]} />
                                <Text style={[styles.currentName, { color: currentSubsystem.color }]}>
                                    {currentSubsystem.name}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Subsystems List */}
                    <View style={styles.listSection}>
                        <Text style={styles.sectionLabel}>Choisir un sous-système</Text>

                        {subsystems.length > 0 ? (
                            <FlatList
                                data={subsystems}
                                keyExtractor={item => item.id}
                                style={styles.list}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.subsystemItem,
                                            alter.subsystem_id === item.id && styles.subsystemItemActive
                                        ]}
                                        onPress={() => handleAssign(item.id)}
                                        disabled={loading}
                                    >
                                        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                                        <Text style={styles.subsystemName}>{item.name}</Text>
                                        {alter.subsystem_id === item.id && (
                                            <Ionicons name="checkmark" size={20} color={item.color} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            <Text style={styles.emptyText}>Aucun sous-système créé</Text>
                        )}
                    </View>

                    {/* Create New */}
                    {isCreating ? (
                        <View style={styles.createForm}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom du sous-système"
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
                                <TouchableOpacity onPress={() => setIsCreating(false)}>
                                    <Text style={styles.cancelText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.createBtn, { backgroundColor: newColor }]}
                                    onPress={handleCreateAndAssign}
                                    disabled={loading || !newName.trim()}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.createText}>Créer et assigner</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setIsCreating(true)}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                            <Text style={styles.addText}>Créer un nouveau sous-système</Text>
                        </TouchableOpacity>
                    )}

                    {/* Remove from Subsystem */}
                    {currentSubsystem && (
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleAssign(null)}
                            disabled={loading}
                        >
                            <Ionicons name="remove-circle-outline" size={20} color="#FF5252" />
                            <Text style={styles.removeText}>Retirer du sous-système</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    alterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    alterAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alterInitial: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    alterName: {
        ...typography.h3,
        color: colors.text,
        fontSize: 18,
    },
    sheetSubtitle: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    closeBtn: {
        padding: spacing.xs,
    },
    currentSection: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
    },
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        alignSelf: 'flex-start',
        gap: spacing.sm,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    currentName: {
        fontWeight: '600',
    },
    listSection: {
        padding: spacing.md,
        maxHeight: 200,
    },
    list: {
        maxHeight: 150,
    },
    subsystemItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.xs,
        gap: spacing.sm,
    },
    subsystemItemActive: {
        borderWidth: 1,
        borderColor: colors.primary,
    },
    subsystemName: {
        flex: 1,
        color: colors.text,
        fontWeight: '500',
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
        paddingVertical: spacing.md,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        gap: spacing.sm,
    },
    addText: {
        color: colors.primary,
        fontWeight: '600',
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        gap: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    removeText: {
        color: '#FF5252',
        fontWeight: '600',
    },
    createForm: {
        padding: spacing.md,
        marginHorizontal: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
    },
    input: {
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        color: colors.text,
        marginBottom: spacing.md,
    },
    colorRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: spacing.md,
    },
    colorCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: colors.text,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cancelText: {
        color: colors.textSecondary,
    },
    createBtn: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.sm,
    },
    createText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
