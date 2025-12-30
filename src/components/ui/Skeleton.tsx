import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { colors } from '../../lib/theme';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    variant?: 'rect' | 'circle' | 'text';
    style?: StyleProp<ViewStyle>;
    borderRadius?: number;
}

export const Skeleton = ({ width, height, variant = 'rect', style, borderRadius }: SkeletonProps) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const getBorderRadius = () => {
        if (borderRadius) return borderRadius;
        if (variant === 'circle') return 999;
        if (variant === 'text') return 4;
        return 8; // Default rect radius
    };

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height: variant === 'text' ? (height || 16) : height,
                    borderRadius: getBorderRadius(),
                },
                style,
                animatedStyle,
            ]}
        />
    );
};

// Pre-defined skeletons for common use cases
export const SkeletonFeed = () => (
    <View style={styles.feedContainer}>
        <View style={styles.header}>
            <Skeleton variant="circle" width={40} height={40} />
            <View style={{ marginLeft: 12 }}>
                <Skeleton variant="text" width={120} height={16} style={{ marginBottom: 4 }} />
                <Skeleton variant="text" width={80} height={12} />
            </View>
        </View>
        <Skeleton variant="rect" width="100%" height={200} style={{ marginVertical: 12 }} />
        <View style={{ gap: 8 }}>
            <Skeleton variant="text" width="90%" height={14} />
            <Skeleton variant="text" width="70%" height={14} />
        </View>
    </View>
);

export const SkeletonProfile = () => (
    <View style={styles.profileContainer}>
        <Skeleton variant="rect" width="100%" height={150} style={{ marginBottom: -50 }} />
        <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
            <Skeleton variant="circle" width={100} height={100} style={{ borderWidth: 4, borderColor: colors.background }} />
            <Skeleton variant="text" width={150} height={24} style={{ marginTop: 12, marginBottom: 8 }} />
            <Skeleton variant="text" width={200} height={16} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: colors.backgroundLight, // Using backgroundLight as base grey
    },
    feedContainer: {
        padding: 16,
        backgroundColor: colors.backgroundCard,
        marginBottom: 16,
        borderRadius: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileContainer: {
        marginBottom: 16,
    }
});
