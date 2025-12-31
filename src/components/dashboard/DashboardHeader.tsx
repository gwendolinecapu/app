import React from 'react';
import { View, Text, StyleSheet, TextInput, Dimensions } from 'react-native';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../lib/theme';
import { router } from 'expo-router';
import { triggerHaptic } from '../../lib/haptics';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolateColor
} from 'react-native-reanimated';

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
                    {/* Icons removed as per user request */}
                </View>
            </View>

            {/* Mode Switcher */}
            <View style={styles.modeSwitchContainer}>
                <Animated.View
                    style={[
                        styles.modeIndicator,
                        useAnimatedStyle(() => ({
                            transform: [{ translateX: withSpring(selectionMode === 'single' ? 0 : (Dimensions.get('window').width - spacing.lg * 2 - 8) / 2) }]
                        }))
                    ]}
                />
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
    modeIndicator: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: '50%',
        height: 40,
        backgroundColor: colors.surface,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
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
