import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const NUM_FLAKES = 30;

const Flake = ({ index }: { index: number }) => {
    // Randomize initial position and duration
    const startX = Math.random() * width;
    const duration = 3000 + Math.random() * 5000; // 3-8 seconds
    const delay = Math.random() * 3000;
    const size = 10 + Math.random() * 20;

    const translateY = useSharedValue(-50);
    const translateX = useSharedValue(startX);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Fall animation
        translateY.value = withDelay(delay, withRepeat(
            withTiming(height + 50, {
                duration: duration,
                easing: Easing.linear
            }),
            -1 // Infinite
        ));

        // Lateral sway
        translateX.value = withDelay(delay, withRepeat(
            withTiming(startX + (Math.random() * 50 - 25), {
                duration: duration / 2,
                easing: Easing.sin
            }),
            -1,
            true // Reverse
        ));

        // Fade in/out
        opacity.value = withDelay(delay, withRepeat(
            withTiming(1, { duration: 1000 }),
            -1,
            true
        ));

        return () => {
            cancelAnimation(translateY);
            cancelAnimation(translateX);
            cancelAnimation(opacity);
        };
    }, []);

    const style = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { translateX: translateX.value }
            ],
            opacity: 0.8,
        };
    });

    return (
        <Animated.Text style={[styles.flake, style, { fontSize: size }]}>
            ❄️
        </Animated.Text>
    );
};

export const Snowfall = () => {
    return (
        <View style={styles.container} pointerEvents="none">
            {Array.from({ length: NUM_FLAKES }).map((_, i) => (
                <Flake key={i} index={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999, // On top but click-through
    },
    flake: {
        position: 'absolute',
        color: 'white',
        textShadowColor: 'rgba(0, 100, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
    }
});
