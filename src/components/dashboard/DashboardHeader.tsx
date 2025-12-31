import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../lib/theme';
import { router } from 'expo-router';
import { triggerHaptic } from '../../lib/haptics';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DashboardHeaderProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    selectionMode: 'single' | 'multi';
    onModeChange: (mode: 'single' | 'multi') => void;
    hasSelection: boolean;
}

/**
 * DashboardHeader - Handles greeting, universal search, and system modes.
 * Mode Switcher allows toggling between 'Solo' (single tap) and 'Co-Front' (multi-select).
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    searchQuery,
    onSearchChange,
    selectionMode,
    onModeChange,
    hasSelection,
}) => {
    React.useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [hasSelection]);

    return (
        <View style={styles.dashboardHeader}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.title}>Qui est là ?</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.headerIconBtn, { backgroundColor: colors.errorBackground }]}
                        onPress={() => {
                            triggerHaptic.medium();
                            router.push('/tools/grounding');
                        }}
                    >
                        <Ionicons name="medical" size={20} color={colors.error} />
                    </TouchableOpacity>
                    {hasSelection && (
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => {
                                triggerHaptic.light();
                                router.push('/shop');
                            }}
                        >
                            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => {
                            triggerHaptic.light();
                            router.push('/settings');
                        }}
                    >
                        <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Mode Switcher */}
            <View style={styles.modeSwitchContainer}>
                <TouchableOpacity
                    style={[styles.modeButton, selectionMode === 'single' && styles.modeButtonActive]}
                    onPress={() => onModeChange('single')}
                >
                    <Text style={[styles.modeButtonText, selectionMode === 'single' && styles.modeButtonTextActive]}>Solo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, selectionMode === 'multi' && styles.modeButtonActive]}
                    onPress={() => onModeChange('multi')}
                >
                    <Text style={[styles.modeButtonText, selectionMode === 'multi' && styles.modeButtonTextActive]}>Co-Front</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Chercher un alter..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    greeting: {
        ...typography.body,
        color: colors.textSecondary,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        fontSize: 26,
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
    modeSwitchContainer: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundLight,
        borderRadius: 20,
        padding: 4,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 16,
    },
    modeButtonActive: {
        backgroundColor: colors.surface,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    modeButtonText: {
        ...typography.body,
        fontSize: 14,
        color: colors.textSecondary,
    },
    modeButtonTextActive: {
        color: colors.text,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        marginHorizontal: spacing.lg,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: spacing.xs,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.text,
    },
});
