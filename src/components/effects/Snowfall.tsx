import React, { useEffect, useMemo } from 'react';
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
const NUM_FLAKES = 60; // Plus de flocons

// Composant flocon optimisé - utilise des cercles simples au lieu d'emojis
const Flake = React.memo(({ startX, size, duration, delay, sway }: {
    startX: number;
    size: number;
    duration: number;
    delay: number;
    sway: number;
}) => {
    const translateY = useSharedValue(-20);
    const translateX = useSharedValue(0);

    useEffect(() => {
        // Animation de chute
        translateY.value = withDelay(delay, withRepeat(
            withTiming(height + 20, {
                duration,
                easing: Easing.linear
            }),
            -1
        ));

        // Légère oscillation latérale
        translateX.value = withDelay(delay, withRepeat(
            withTiming(sway, {
                duration: duration / 3,
                easing: Easing.inOut(Easing.sin)
            }),
            -1,
            true
        ));

        return () => {
            cancelAnimation(translateY);
            cancelAnimation(translateX);
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value }
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.flake,
                animatedStyle,
                {
                    left: startX,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    opacity: 0.4 + (size / 20), // Plus gros = plus opaque
                }
            ]}
        />
    );
});

export const Snowfall = () => {
    // Pré-calculer les propriétés des flocons pour éviter les re-renders
    const flakes = useMemo(() => {
        return Array.from({ length: NUM_FLAKES }).map((_, i) => ({
            key: i,
            startX: Math.random() * width,
            size: 3 + Math.random() * 6, // 3-9px (beaucoup plus petit!)
            duration: 4000 + Math.random() * 6000, // 4-10 secondes
            delay: Math.random() * 4000,
            sway: 15 + Math.random() * 20, // oscillation 15-35px
        }));
    }, []);

    return (
        <View style={styles.container} pointerEvents="none">
            {flakes.map((props) => (
                <Flake {...props} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    flake: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        // Effet de lueur subtil
        shadowColor: '#87CEEB',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
    }
});
