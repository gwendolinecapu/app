import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * SystemControlBar - A premium, floating navigation bar for system tools.
 * Provides quick access to internal communication and organization features.
 */
interface SystemControlBarProps {
    onOpenMenu: () => void;
    onConfirmFronting: () => void;
    hasSelection: boolean;
}

export const SystemControlBar: React.FC<SystemControlBarProps> = ({
    onOpenMenu,
    onConfirmFronting,
    hasSelection
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]} >
            <BlurView intensity={80} tint="dark" style={styles.container}>
                <AnimatedPressable
                    style={styles.menuItem}
                    onPress={() => {
                        triggerHaptic.medium();
                        onOpenMenu();
                    }}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="apps-outline" size={24} color="white" />
                    </View>
                    <Text style={styles.label}>Menu</Text>
                </AnimatedPressable>

                <AnimatedPressable
                    style={styles.menuItem}
                    onPress={() => router.push('/team-chat')}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.label}>Team</Text>
                </AnimatedPressable>

                <AnimatedPressable
                    style={[
                        styles.centerButton,
                        hasSelection && styles.centerButtonActive
                    ]}
                    onPress={() => {
                        if (hasSelection) {
                            triggerHaptic.success();
                            onConfirmFronting();
                        }
                    }}
                    scaleMin={0.9}
                >
                    <View style={styles.centerIconBg}>
                        <Ionicons
                            name={hasSelection ? "checkmark" : "add"}
                            size={32}
                            color="white"
                        />
                    </View>
                </AnimatedPressable>

                <AnimatedPressable
                    style={styles.menuItem}
                    onPress={() => router.push('/history')}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="stats-chart-outline" size={24} color={colors.warning} />
                    </View>
                    <Text style={styles.label}>Historique</Text>
                </AnimatedPressable>

                <AnimatedPressable
                    style={styles.menuItem}
                    onPress={() => router.push('/settings')}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.label}>Réglages</Text>
                </AnimatedPressable>
            </BlurView>
        </View >
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        zIndex: 100,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: 72,
        borderRadius: 36,
        overflow: 'hidden',
        paddingHorizontal: 12,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(22, 53, 96, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    menuItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    iconWrapper: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        ...typography.tiny,
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
    },
    centerButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -12, // Lowered for integration
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    centerButtonActive: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    centerButtonDisabled: {
        opacity: 0.6,
    },
    centerIconBg: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
