import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSuccessAnimation } from '../../contexts/SuccessAnimationContext';

const confettiAnimation = require('../../../assets/animations/confetti.json');

let successAnimationRef: { play: () => void } | null = null;

export function triggerSuccessAnimation() {
    if (successAnimationRef) {
        successAnimationRef.play();
    }
}

export function SuccessAnimation() {
    const { isPlaying, play } = useSuccessAnimation();
    const animationRef = useRef<LottieView>(null);

    useEffect(() => {
        successAnimationRef = { play };
        return () => {
            successAnimationRef = null;
        };
    }, [play]);

    useEffect(() => {
        if (isPlaying) {
            animationRef.current?.play();
        }
    }, [isPlaying]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isPlaying ? 1 : 0, { duration: 200 }),
            transform: [{ scale: withTiming(isPlaying ? 1 : 0.8, { duration: 300 }) }],
        };
    }, [isPlaying]);

    // We don't return null immediately to allow for the opacity fade-out animation
    // The pointerEvents="none" ensures it doesn't block interactions when invisible
    return (
        <Animated.View
            style={[styles.container, animatedStyle]}
            pointerEvents="none"
        >
            <LottieView
                ref={animationRef}
                source={confettiAnimation}
                loop={false}
                style={styles.lottie}
                resizeMode="cover"
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: '100%',
        height: '100%',
    },
});