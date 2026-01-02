import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { AnimatedPressable } from './AnimatedPressable';
import { ThemeColors } from '../../lib/cosmetics';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;

    style?: ViewStyle;
    image?: React.ReactNode; // Optional custom image/illustration
    themeColors?: ThemeColors | null;
}

export const EmptyState = ({
    icon = 'cube-outline',
    title,
    message,
    actionLabel,
    onAction,
    style,
    image,
    themeColors
}: EmptyStateProps) => {
    return (
        <View style={[styles.container, style]}>
            <View style={[styles.iconContainer, themeColors && { backgroundColor: themeColors.backgroundCard }]}>
                {image ? image : (
                    <Ionicons name={icon} size={64} color={themeColors?.textSecondary || colors.textMuted} />
                )}
            </View>
            <Text style={[styles.title, themeColors && { color: themeColors.text }]}>{title}</Text>
            {message && <Text style={[styles.message, themeColors && { color: themeColors.textSecondary }]}>{message}</Text>}

            {actionLabel && onAction && (
                <AnimatedPressable
                    onPress={onAction}
                    style={[styles.button, themeColors && { backgroundColor: themeColors.primary, shadowColor: themeColors.primary }]}
                >
                    <Text style={[styles.buttonText, themeColors && { color: themeColors.background }]}>{actionLabel}</Text>
                </AnimatedPressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        minHeight: 300,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: borderRadius.full,
        backgroundColor: colors.backgroundLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h3,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        ...typography.button,
        color: '#FFFFFF',
    }
});
