import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography } from '../../lib/theme';

export type StatusType = 'beta' | 'alpha' | 'coming-soon' | 'new';

interface StatusBadgeProps {
    status: StatusType;
    containerStyle?: any;
}

const BADGE_CONFIG = {
    'beta': { color: '#3B82F6', label: 'BETA' }, // Blue
    'alpha': { color: '#F59E0B', label: 'ALPHA' }, // Orange
    'coming-soon': { color: '#6B7280', label: 'BIENTÔT' }, // Grey
    'new': { color: '#10B981', label: 'NOUVEAU' }, // Green
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, containerStyle }) => {
    const config = BADGE_CONFIG[status];

    if (!config) return null;

    return (
        <View style={[
            styles.badge,
            { backgroundColor: `${config.color}20`, borderColor: config.color }, // 20% opacity bg
            containerStyle
        ]}>
            <Text style={[styles.text, { color: config.color }]}>
                {config.label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});
