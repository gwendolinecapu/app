import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../../lib/theme';

interface BadgeProps {
    label: string;
    color?: string;
    variant?: 'solid' | 'outline' | 'subtle';
    size?: 'sm' | 'md';
}

export function Badge({ label, color = colors.primary, variant = 'solid', size = 'sm' }: BadgeProps) {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'outline': return 'transparent';
            case 'subtle': return `${color}20`; // 20% opacity
            default: return color;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'outline': return color;
            case 'subtle': return color;
            default: return '#FFFFFF';
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return color;
        return 'transparent';
    };

    const styles = StyleSheet.create({
        container: {
            paddingHorizontal: size === 'sm' ? 6 : 8,
            paddingVertical: size === 'sm' ? 2 : 4,
            borderRadius: borderRadius.sm,
            backgroundColor: getBackgroundColor(),
            borderWidth: 1,
            borderColor: getBorderColor(),
            alignSelf: 'flex-start',
        },
        text: {
            ...typography.caption,
            fontSize: size === 'sm' ? 10 : 12,
            color: getTextColor(),
            fontWeight: '600',
        },
    });

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{label}</Text>
        </View>
    );
}
