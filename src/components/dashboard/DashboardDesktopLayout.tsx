/**
 * DashboardDesktopLayout - Layout optimisé pour desktop
 * Sidebar vertical + zone de contenu large
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { useResponsive } from '../../hooks/useResponsive';

interface DashboardDesktopLayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
}

export function DashboardDesktopLayout({ sidebar, content }: DashboardDesktopLayoutProps) {
    const { isDesktop } = useResponsive();

    if (!isDesktop) {
        // Sur mobile, afficher le contenu normalement sans sidebar
        return <>{content}</>;
    }

    return (
        <View style={styles.container}>
            {/* Sidebar vertical à gauche */}
            <View style={styles.sidebar}>
                {sidebar}
            </View>

            {/* Zone de contenu principale */}
            <View style={styles.content}>
                {content}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.background,
    },
    sidebar: {
        width: 280,
        backgroundColor: colors.backgroundCard,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingVertical: spacing.lg,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
    },
});
