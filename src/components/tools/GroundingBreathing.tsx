import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, AppState } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    cancelAnimation,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../../lib/theme';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.6;

const INHALE_DURATION = 4000;
const HOLD_DURATION = 7000;
const EXHALE_DURATION = 8000;

const PHASES = {
    INHALE: { text: 'Inspirez... (4s)', haptic: Haptics.ImpactFeedbackStyle.Medium },
    HOLD: { text: 'Bloquez... (7s)', haptic: Haptics.ImpactFeedbackStyle.Light },
    EXHALE: { text: 'Expirez... (8s)', haptic: Haptics.ImpactFeedbackStyle.Heavy },
};

export const GroundingBreathing = () => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);
    const [phase, setPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
    const isMounted = useRef(true);
    const animationTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isMounted.current = true;
        const handleAppStateChange = (nextAppState: any) => {
            if (nextAppState === 'active') {
                isMounted.current = true;
                startAnimationCycle();
            } else {
                isMounted.current = false;
                if (animationTimeout.current) clearTimeout(animationTimeout.current);
                cancelAnimation(scale);
                cancelAnimation(opacity);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        startAnimationCycle();

        return () => {
            isMounted.current = false;
            if (animationTimeout.current) clearTimeout(animationTimeout.current);
            subscription.remove();
            cancelAnimation(scale);
            cancelAnimation(opacity);
        };
    }, []);

    const animatePhase = (
        currentPhase: 'INHALE' | 'HOLD' | 'EXHALE',
        scaleTo: number,
        opacityTo: number,
        duration: number,
        nextPhase: () => void
    ) => {
        if (!isMounted.current) return;

        runOnJS(setPhase)(currentPhase);
        runOnJS(Haptics.impactAsync)(PHASES[currentPhase].haptic);

        scale.value = withTiming(scaleTo, { duration, easing: Easing.inOut(Easing.ease) });
        opacity.value = withTiming(opacityTo, { duration, easing: Easing.inOut(Easing.ease) });

        animationTimeout.current = setTimeout(nextPhase, duration);
    };
    
    const startAnimationCycle = () => {
        if (!isMounted.current) return;
        
        scale.value = 1;
        opacity.value = 0.5;

        const exhaleStep = () => animatePhase('EXHALE', 1, 0.5, EXHALE_DURATION, startAnimationCycle);
        const holdStep = () => animatePhase('HOLD', 1.5, 0.9, HOLD_DURATION, exhaleStep);
        const inhaleStep = () => animatePhase('INHALE', 1.5, 0.8, INHALE_DURATION, holdStep);
        
        inhaleStep();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.circleContainer}>
                <Animated.View style={[styles.circle, animatedStyle]} />
                <View style={styles.centerContent}>
                    <Text style={styles.instruction}>{PHASES[phase].text}</Text>
                </View>
            </View>
            <View style={styles.footer}>
                <Text style={styles.subtitle}>Technique 4-7-8 pour calmer l'anxiété</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    circleContainer: {
        width: CIRCLE_SIZE * 1.5,
        height: CIRCLE_SIZE * 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    circle: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        backgroundColor: colors.primary,
        position: 'absolute',
    },
    centerContent: {
        zIndex: 1,
        alignItems: 'center',
    },
    instruction: {
        ...typography.h2,
        color: colors.text,
        textAlign: 'center',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    footer: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    subtitle: {
        ...typography.body,
        textAlign: 'center',
        color: colors.textSecondary,
        opacity: 0.8,
    },
});