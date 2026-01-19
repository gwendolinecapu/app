import React from 'react';
import { View, Text, StyleSheet, TextInput, Dimensions } from 'react-native';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../lib/theme';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { ModeIndicator } from './ModeIndicator';
import { AlterWeatherBar } from './AlterWeatherBar';

interface DashboardHeaderProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    selectionMode: 'single' | 'multi';
    onModeChange: (mode: 'single' | 'multi') => void;
    hasSelection: boolean;
    deleteMode: boolean;
    onToggleDeleteMode: () => void;
    onSelectAll?: () => void;
    onOpenCategories?: () => void;
    activeCategory?: string | null;
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
    deleteMode,
    onToggleDeleteMode,
    onSelectAll,
    onOpenCategories,
    activeCategory,
}) => {
    const insets = useSafeAreaInsets(); // Added for insets

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
                    {deleteMode && onSelectAll && (
                        <AnimatedPressable
                            style={styles.selectAllBtn}
                            onPress={onSelectAll}
                        >
                            <Text style={styles.selectAllText}>Tout sélectionner</Text>
                        </AnimatedPressable>
                    )}
                    {onOpenCategories && (
                        <AnimatedPressable
                            style={[
                                styles.headerIconBtn,
                                activeCategory && styles.headerIconBtnCategory
                            ]}
                            onPress={onOpenCategories}
                        >
                            <Ionicons
                                name="pricetags"
                                size={20}
                                color={activeCategory ? 'white' : colors.text}
                            />
                        </AnimatedPressable>
                    )}
                    <AnimatedPressable
                        style={[styles.headerIconBtn, deleteMode && styles.headerIconBtnActive]}
                        onPress={onToggleDeleteMode}
                    >
                        <Ionicons
                            name={deleteMode ? "close" : "trash-outline"}
                            size={22}
                            color={deleteMode ? 'white' : colors.text}
                        />
                    </AnimatedPressable>
                </View>
            </View>

            {/* Alter Weather Bar - Emotion indicators */}
            <AlterWeatherBar />

            {/* Mode Switcher */}
            <View style={styles.modeSwitchContainer}>
                <ModeIndicator selectionMode={selectionMode} />
                <AnimatedPressable
                    containerStyle={styles.modeButton}
                    style={styles.modeButtonInner}
                    onPress={() => onModeChange('single')}
                >
                    <Text style={[styles.modeButtonText, selectionMode === 'single' && styles.modeButtonTextActive]}>Solo</Text>
                </AnimatedPressable>
                <AnimatedPressable
                    containerStyle={styles.modeButton}
                    style={styles.modeButtonInner}
                    onPress={() => onModeChange('multi')}
                >
                    <Text style={[styles.modeButtonText, selectionMode === 'multi' && styles.modeButtonTextActive]}>Co-Front</Text>
                </AnimatedPressable>
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
    headerIconBtnActive: {
        backgroundColor: '#FF3B30', // iOS red
    },
    headerIconBtnCategory: {
        backgroundColor: '#9C27B0', // Purple for categories
    },
    selectAllBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: colors.backgroundLight,
        borderRadius: 20,
        marginRight: 8,
    },
    selectAllText: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
        fontSize: 12,
    },
    modeSwitchContainer: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundLight,
        borderRadius: 24,
        padding: 4,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        position: 'relative',
        height: 48,
        alignItems: 'center',
    },

    modeButton: {
        flex: 1,
        height: '100%',
    },
    modeButtonInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeButtonText: {
        ...typography.body,
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    modeButtonTextActive: {
        color: colors.text,
        fontWeight: '700',
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
