import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';
import { router } from 'expo-router';

/**
 * SystemControlBar - A premium, floating navigation bar for system tools.
 * Provides quick access to internal communication and organization features.
 */
export const SystemControlBar: React.FC = () => {
    const handlePress = (route: string) => {
        triggerHaptic.light();
        router.push(route as any);
    };

    return (
        <View style={styles.wrapper}>
            <BlurView intensity={80} tint="dark" style={styles.container}>
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
                    style={styles.menuItem}
                    onPress={() => handlePress('/(tabs)/dashboard')} // Placeholder or specific tasks route
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="list-outline" size={24} color={colors.success} />
                    </View>
                    <Text style={styles.label}>Tâches</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.centerButton}
                    onPress={() => triggerHaptic.medium()}
                >
                    <View style={styles.centerIconBg}>
                        <Ionicons name="stats-chart" size={26} color="white" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handlePress('/(tabs)/dashboard')} // Placeholder or calendar route
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="calendar-outline" size={24} color={colors.warning} />
                    </View>
                    <Text style={styles.label}>Calendrier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handlePress('/settings')}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.label}>Profil</Text>
                </TouchableOpacity>
            </BlurView>
        </View>
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
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -30, // Légère surélévation
        borderWidth: 5,
        borderColor: colors.background,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    centerIconBg: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
