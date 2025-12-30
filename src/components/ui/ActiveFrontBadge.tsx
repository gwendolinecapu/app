import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../lib/theme';

// =====================================================
// ACTIVE FRONT BADGE
// Badge indiquant qu'un alter est actuellement en front
// Utilisé dans les posts et profils
// =====================================================

interface ActiveFrontBadgeProps {
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    style?: any;
}

export const ActiveFrontBadge = ({ size = 'medium', showLabel = false, style }: ActiveFrontBadgeProps) => {
    const sizeConfig = {
        small: { icon: 10, badge: 16, fontSize: 9 },
        medium: { icon: 12, badge: 20, fontSize: 10 },
        large: { icon: 16, badge: 28, fontSize: 12 },
    };

    const config = sizeConfig[size];

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.badge, { width: showLabel ? 'auto' : config.badge, height: config.badge, borderRadius: config.badge / 2 }]}>
                <View style={[styles.pulse, { width: config.badge, height: config.badge, borderRadius: config.badge / 2 }]} />
                <View style={styles.innerBadge}>
                    <Ionicons name="radio-button-on" size={config.icon} color="white" />
                </View>
                {showLabel && (
                    <Text style={[styles.label, { fontSize: config.fontSize }]}>En front</Text>
                )}
            </View>
        </View>
    );
};

// Badge overlay pour avatar
interface FrontIndicatorProps {
    isFronting: boolean;
    children: React.ReactNode;
}

export const FrontIndicator = ({ isFronting, children }: FrontIndicatorProps) => {
    return (
        <View style={styles.indicatorContainer}>
            {children}
            {isFronting && (
                <View style={styles.indicatorBadge}>
                    <View style={styles.indicatorDot} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Container for positioning
    },
    badge: {
        backgroundColor: '#22C55E', // Green-500
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    pulse: {
        position: 'absolute',
        backgroundColor: '#22C55E',
        opacity: 0.3,
        // Animation would be added with Animated API
    },
    innerBadge: {
        // Icon container
    },
    label: {
        color: 'white',
        fontWeight: '700',
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // For FrontIndicator
    indicatorContainer: {
        position: 'relative',
    },
    indicatorBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22C55E',
    },
});
