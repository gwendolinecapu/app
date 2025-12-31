import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    interpolate,
} from 'react-native-reanimated';
import { colors } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

export const BackgroundBubbles = () => {
    const anim1 = useSharedValue(0);
    const anim2 = useSharedValue(0);

    useEffect(() => {
        anim1.value = withRepeat(withSequence(withTiming(1, { duration: 15000 }), withTiming(0, { duration: 15000 })), -1, true);
        anim2.value = withRepeat(withSequence(withTiming(1, { duration: 20000 }), withTiming(0, { duration: 20000 })), -1, true);
    }, []);

    const circle1Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(anim1.value, [0, 1], [-width * 0.2, width * 0.1]) },
            { translateY: interpolate(anim1.value, [0, 1], [-height * 0.1, height * 0.1]) },
        ],
    }));

    const circle2Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(anim2.value, [0, 1], [width * 0.1, -width * 0.1]) },
            { translateY: interpolate(anim2.value, [0, 1], [height * 0.1, -height * 0.1]) },
        ],
    }));

    return (
        <View style={styles.backgroundCircles}>
            <Animated.View style={[styles.circle, styles.circle1, circle1Style]} />
            <Animated.View style={[styles.circle, styles.circle2, circle2Style]} />
        </View>
    )
}

const styles = StyleSheet.create({
    backgroundCircles: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
        overflow: 'hidden',
        backgroundColor: colors.background, // Ensure background color is set behind bubbles
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.1,
    },
    circle1: {
        width: width * 1.5,
        height: width * 1.5,
        backgroundColor: colors.primary,
        top: -width * 0.5,
        right: -width * 0.5,
    },
    circle2: {
        width: width,
        height: width,
        backgroundColor: colors.secondary,
        bottom: -width * 0.2,
        left: -width * 0.2,
    },
});
