import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Alter, Subsystem } from '../../types';
import { SubsystemService } from '../../services/SubsystemService';
import { useAuth } from '../../contexts/AuthContext';

interface SubSystemModalProps {
    visible: boolean;
    onClose: () => void;
    activeSubsystemId: string | null;
    onSelectSubsystem: (subsystem: Subsystem | null) => void;
}

export const SubSystemModal: React.FC<SubSystemModalProps> = ({
    visible,
    onClose,
}) => {
    const { user, alters, refreshAlters } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
    const [loading, setLoading] = useState(false);

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
            console.error('Error loading subsystems:', error);
        } finally {
            setLoading(false);
        }
    };

    // Only show base alters (without subsystem_id) - subsystem alters only appear in their subsystem dashboard
    const baseAlters = useMemo(() => {
        return alters.filter(alter => !alter.subsystem_id);
    }, [alters]);

    // Filter base alters by search query
    const filteredAlters = useMemo(() => {
        if (!searchQuery.trim()) return baseAlters;
        const query = searchQuery.toLowerCase();
        return baseAlters.filter(alter =>
            alter.name.toLowerCase().includes(query) ||
            alter.pronouns?.toLowerCase().includes(query)
        );
    }, [baseAlters, searchQuery]);

    const handleAlterPress = (alter: Alter) => {
        onClose();
        router.push(`/subsystem/${alter.id}` as any);
    };

    const getSubsystemForAlter = (alter: Alter): Subsystem | undefined => {
        return subsystems.find(s => s.id === alter.subsystem_id);
    };

    const renderAlterItem = ({ item }: { item: Alter }) => {
        const subsystem = getSubsystemForAlter(item);

        return (
            <TouchableOpacity
                style={styles.alterItem}
                onPress={() => handleAlterPress(item)}
            >
                <View style={styles.avatarContainer}>
                    {item.avatar_url || item.avatar ? (
                        <Image
                            source={{ uri: item.avatar_url || item.avatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: item.color || colors.primary }]}>
                            <Text style={styles.avatarInitial}>
                                {item.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    {/* Subsystem Badge */}
                    {subsystem && (
                        <View style={[styles.subsystemBadge, { backgroundColor: subsystem.color }]} />
                    )}
                </View>
                <Text style={styles.alterName} numberOfLines={1}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="planet" size={24} color={colors.primary} />
                        <Text style={styles.title}>Sous-systèmes</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color={colors.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un alter..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Instructions */}
                    <Text style={styles.instructions}>
                        Touche un alter pour ouvrir son sous-système
                    </Text>

                    {/* Alters Grid */}
                    <View style={styles.content}>
                        {loading ? (
                            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
                        ) : filteredAlters.length > 0 ? (
                            <FlatList
                                data={filteredAlters}
                                keyExtractor={item => item.id}
                                renderItem={renderAlterItem}
                                numColumns={4}
                                contentContainerStyle={styles.grid}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="search" size={48} color={colors.textMuted} />
                                <Text style={styles.emptyText}>Aucun alter trouvé</Text>
                            </View>
                        )}
                    </View>

                    {/* Legend */}
                    {subsystems.length > 0 && (
                        <View style={styles.legend}>
                            <Text style={styles.legendTitle}>Légende :</Text>
                            <View style={styles.legendItems}>
                                {subsystems.map(sub => (
                                    <View key={sub.id} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: sub.color }]} />
                                        <Text style={styles.legendText}>{sub.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
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
        minHeight: '70%',
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
        padding: spacing.xs,
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        height: 44,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
    },
    instructions: {
        color: colors.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.sm,
    },
    grid: {
        paddingVertical: spacing.md,
    },
    alterItem: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    subsystemBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.background,
    },
    alterName: {
        marginTop: spacing.xs,
        fontSize: 12,
        color: colors.text,
        textAlign: 'center',
        maxWidth: 70,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    legend: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    legendTitle: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    legendItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        color: colors.text,
        fontSize: 12,
    },
});
