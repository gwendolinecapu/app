/**
 * DesktopSidebar - Menu latéral pour la version desktop
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: string;
    onPress?: () => void;
    active?: boolean;
}

interface DesktopSidebarProps {
    systemName?: string;
    userEmail?: string;
    onMenuItemPress?: (item: string) => void;
}

export function DesktopSidebar({ systemName, userEmail, onMenuItemPress }: DesktopSidebarProps) {
    const menuItems: MenuItem[] = [
        { icon: 'grid', label: 'Dashboard', route: '/(tabs)/dashboard', active: true },
        { icon: 'people', label: 'Alters', route: '/(tabs)/alters' },
        { icon: 'chatbubbles', label: 'Team', route: '/(tabs)/team' },
        { icon: 'bar-chart', label: 'Historique', route: '/(tabs)/history' },
        { icon: 'calendar', label: 'Journal', route: '/(tabs)/journal' },
        { icon: 'heart', label: 'Émotions', route: '/(tabs)/emotions' },
        { icon: 'settings', label: 'Réglages', route: '/settings' },
    ];

    const handleItemPress = (item: MenuItem) => {
        if (item.route) {
            router.push(item.route as any);
        }
        if (item.onPress) {
            item.onPress();
        }
        if (onMenuItemPress) {
            onMenuItemPress(item.label);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header avec système */}
            <View style={styles.header}>
                <View style={styles.systemInfo}>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.systemName}>
                        {systemName || 'Système'}
                    </Text>
                    {userEmail && (
                        <Text style={styles.userEmail}>{userEmail}</Text>
                    )}
                </View>
            </View>

            {/* Menu items */}
            <View style={styles.menu}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.menuItem,
                            item.active && styles.menuItemActive
                        ]}
                        onPress={() => handleItemPress(item)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={item.icon}
                            size={22}
                            color={item.active ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[
                            styles.menuLabel,
                            item.active && styles.menuLabelActive
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.footerButton}
                    onPress={() => router.push('/settings/profile')}
                >
                    <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.footerText}>Mon profil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    systemInfo: {
        gap: spacing.xs,
    },
    greeting: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    systemName: {
        ...typography.h3,
        color: colors.primary,
    },
    userEmail: {
        ...typography.caption,
        color: colors.textMuted,
    },
    menu: {
        flex: 1,
        paddingTop: spacing.lg,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    menuItemActive: {
        backgroundColor: colors.primaryLight + '20',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    menuLabel: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    menuLabelActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    footerText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
});
