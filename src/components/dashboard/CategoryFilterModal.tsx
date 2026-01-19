import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Alter } from '../../types';
import { triggerHaptic } from '../../lib/haptics';
import { ROLE_PRESETS } from '../../services/RoleService';

// Mapping of role names to colors
const getRoleColor = (roleName: string): string => {
    // Check if it matches a preset
    const preset = ROLE_PRESETS.find(p =>
        p.name.toLowerCase() === roleName.toLowerCase()
    );
    if (preset) return preset.color;

    // Generate a color based on the role name hash
    const colors = [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3',
        '#F38181', '#AA96DA', '#74B9FF', '#FD79A8',
        '#00B894', '#E17055', '#A29BFE', '#636E72'
    ];
    let hash = 0;
    for (let i = 0; i < roleName.length; i++) {
        hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

interface DynamicCategory {
    name: string;
    color: string;
    alters: Alter[];
}

interface CategoryFilterModalProps {
    visible: boolean;
    onClose: () => void;
    systemId: string;
    alters: Alter[];
    onSelectCategory: (categoryId: string | null) => void;
    onSelectAlter: (alter: Alter) => void;
    activeCategory: string | null;
}

export const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({
    visible,
    onClose,
    alters,
    onSelectCategory,
    onSelectAlter,
    activeCategory,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);

    // Extract unique roles from alters' custom_fields (majorRole only)
    const categories = useMemo(() => {
        const roleMap = new Map<string, Alter[]>();

        alters.forEach(alter => {
            const customFields = alter.custom_fields || [];

            // Get majorRole field ONLY
            const majorRoleField = customFields.find(f =>
                f.label.toLowerCase() === 'majorrole'
            );
            if (majorRoleField?.value) {
                // Split by comma for multiple roles
                const roles = majorRoleField.value.split(',').map(r => r.trim()).filter(r => r);
                roles.forEach(roleName => {
                    if (!roleMap.has(roleName)) {
                        roleMap.set(roleName, []);
                    }
                    if (!roleMap.get(roleName)!.find(a => a.id === alter.id)) {
                        roleMap.get(roleName)!.push(alter);
                    }
                });
            }
        });

        // Convert to array and sort by alter count
        const result: DynamicCategory[] = [];
        roleMap.forEach((alterList, roleName) => {
            result.push({
                name: roleName,
                color: getRoleColor(roleName),
                alters: alterList,
            });
        });

        // Sort by number of alters (descending)
        return result.sort((a, b) => b.alters.length - a.alters.length);
    }, [alters]);

    // Reset selection when modal closes
    React.useEffect(() => {
        if (!visible) {
            setSelectedCategory(null);
        }
    }, [visible]);

    const handleSelectCategory = (category: DynamicCategory) => {
        triggerHaptic.selection();
        setSelectedCategory(category);
    };

    const handleSelectAlter = (alter: Alter) => {
        triggerHaptic.selection();
        onSelectCategory(selectedCategory?.name || null);
        onSelectAlter(alter);
        onClose();
    };

    const handleClearFilter = () => {
        triggerHaptic.light();
        setSelectedCategory(null);
        onSelectCategory(null);
        onClose();
    };

    const renderCategoryItem = ({ item }: { item: DynamicCategory }) => {
        return (
            <TouchableOpacity
                style={styles.roleItem}
                onPress={() => handleSelectCategory(item)}
            >
                <View style={[styles.roleColor, { backgroundColor: item.color }]} />
                <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>{item.name}</Text>
                    <Text style={styles.roleDescription}>
                        {item.alters.length} alter{item.alters.length > 1 ? 's' : ''}
                    </Text>
                </View>
                <View style={styles.roleCount}>
                    <Text style={styles.roleCountText}>{item.alters.length}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderAlterBubble = ({ item }: { item: Alter }) => {
        const bgColor = item.color || colors.primary;

        return (
            <TouchableOpacity
                style={styles.alterBubble}
                onPress={() => handleSelectAlter(item)}
            >
                <View style={[styles.bubble, { backgroundColor: bgColor }]}>
                    {item.avatar_url || item.avatar ? (
                        <Image
                            source={{ uri: item.avatar_url || item.avatar }}
                            style={styles.bubbleImage}
                        />
                    ) : (
                        <Text style={styles.bubbleInitial}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
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
                        {selectedCategory ? (
                            <TouchableOpacity
                                onPress={() => setSelectedCategory(null)}
                                style={styles.backBtn}
                            >
                                <Ionicons name="chevron-back" size={24} color={colors.text} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.backBtn} />
                        )}
                        <Text style={styles.title}>
                            {selectedCategory ? selectedCategory.name : 'Catégories'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {selectedCategory ? (
                        // Alters Grid
                        <View style={styles.content}>
                            {selectedCategory.alters.length > 0 ? (
                                <FlatList
                                    key="alters-grid"
                                    data={selectedCategory.alters}
                                    keyExtractor={item => item.id}
                                    renderItem={renderAlterBubble}
                                    numColumns={4}
                                    contentContainerStyle={styles.altersGrid}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                                    <Text style={styles.emptyText}>
                                        Aucun alter dans cette catégorie
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        // Categories List
                        <View style={styles.content}>
                            {categories.length > 0 ? (
                                <FlatList
                                    key="categories-list"
                                    data={categories}
                                    keyExtractor={item => item.name}
                                    renderItem={renderCategoryItem}
                                    contentContainerStyle={styles.list}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="pricetags-outline" size={48} color={colors.textSecondary} />
                                    <Text style={styles.emptyText}>
                                        Aucune catégorie trouvée
                                    </Text>
                                    <Text style={styles.emptyHint}>
                                        Ajoutez des rôles (Hôte, Protecteur...) dans le profil de vos alters
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Clear Filter Button */}
                    {activeCategory && !selectedCategory && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={handleClearFilter}
                        >
                            <Ionicons name="close-circle" size={18} color="white" />
                            <Text style={styles.clearButtonText}>Effacer le filtre</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: '50%',
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
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
    altersGrid: {
        padding: spacing.md,
    },
    alterBubble: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    bubble: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
    },
    bubbleInitial: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
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
        paddingVertical: spacing.xxl,
    },
    emptyText: {
        color: colors.textSecondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    emptyHint: {
        color: colors.textMuted,
        fontSize: 12,
        marginTop: spacing.xs,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B',
        paddingVertical: spacing.md,
        gap: spacing.xs,
        marginHorizontal: spacing.md,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.md,
    },
    clearButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default CategoryFilterModal;
