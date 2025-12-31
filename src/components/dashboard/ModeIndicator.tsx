import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing } from '../../lib/theme';

interface ModeIndicatorProps {
    selectionMode: 'single' | 'multi';
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ selectionMode }) => {
    const windowWidth = Dimensions.get('window').width;
    // Calculate width: screen width - horizontal margin (lg * 2) - padding (4 * 2) / 2
    // DashboardHeader styles: marginHorizontal: spacing.lg, padding: 4
    const availableWidth = windowWidth - (spacing.lg * 2) - 8;
    const indicatorWidth = availableWidth / 2;

    const translateX = useSharedValue(selectionMode === 'single' ? 0 : indicatorWidth);

    useEffect(() => {
        translateX.value = withSpring(selectionMode === 'single' ? 0 : indicatorWidth, {
            damping: 15,
            stiffness: 150,
        });
    }, [selectionMode, indicatorWidth]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    return (
        <Animated.View
            style={[
                styles.modeIndicator,
                animatedStyle
            ]}
        />
    );
};

const styles = StyleSheet.create({
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
});
