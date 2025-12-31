import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
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

/**
 * SystemControlBar - A premium, floating navigation bar for system tools.
 * Provides quick access to internal communication and organization features.
 */
export const SystemControlBar: React.FC<SystemControlBarProps> = ({
    onOpenMenu,
    onConfirmFronting,
    hasSelection
}) => {
    const insets = useSafeAreaInsets();
    const handlePress = (route: string) => {
        triggerHaptic.light();
        router.push(route as any);
    };

    return (
        <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]} >
            <BlurView intensity={80} tint="dark" style={styles.container}>
                <TouchableOpacity
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
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handlePress('/team-chat')}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.label}>Team</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.centerButton, !hasSelection && styles.centerButtonDisabled]}
                    onPress={() => {
                        if (hasSelection) {
                            triggerHaptic.success();
                            onConfirmFronting();
                        } else {
                            triggerHaptic.light();
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.centerIconBg}>
                        <Ionicons
                            name={hasSelection ? "checkmark-circle" : "radio-button-on"}
                            size={28}
                            color="white"
                        />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handlePress('/history')}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="calendar-outline" size={24} color={colors.warning} />
                    </View>
                    <Text style={styles.label}>Suivi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handlePress('/settings')}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.label}>Réglages</Text>
                </TouchableOpacity>
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
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -35,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    centerButtonDisabled: {
        backgroundColor: colors.surface,
        opacity: 0.5,
        shadowOpacity: 0,
    },
    centerIconBg: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
