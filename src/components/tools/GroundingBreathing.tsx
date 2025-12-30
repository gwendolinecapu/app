import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    cancelAnimation,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing } from '../../lib/theme';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.6;

// 4-7-8 Technique
const INHALE_DURATION = 4000;
const HOLD_DURATION = 7000;
const EXHALE_DURATION = 8000;

export const GroundingBreathing = () => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);
    const textOpacity = useSharedValue(1);
    const [phase, setPhase] = React.useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
    const [isActive, setIsActive] = React.useState(true);

    const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
        Haptics.impactAsync(style);
    };

    const startBreathing = useCallback(() => {
        if (!isActive) return;

        // Reset
        scale.value = 1;
        opacity.value = 0.5;

        // INHALE
        setPhase('INHALE');
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Medium);

        scale.value = withTiming(1.5, { duration: INHALE_DURATION, easing: Easing.inOut(Easing.ease) });
        opacity.value = withTiming(0.8, { duration: INHALE_DURATION });

        // HOLD
        setTimeout(() => {
            if (!isActive) return;
            setPhase('HOLD');
            runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);

            // Pulse slightly during hold
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.55, { duration: 1000 }),
                    withTiming(1.5, { duration: 1000 })
                ),
                3, // Approx 7 seconds
                true
            );

            // EXHALE
            setTimeout(() => {
                if (!isActive) return;
                setPhase('EXHALE');
                runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Heavy);

                scale.value = withTiming(1, { duration: EXHALE_DURATION, easing: Easing.inOut(Easing.ease) });
                opacity.value = withTiming(0.5, { duration: EXHALE_DURATION });

                // Loop
                setTimeout(() => {
                    if (isActive) startBreathing();
                }, EXHALE_DURATION);

            }, HOLD_DURATION);

        }, INHALE_DURATION);
    }, [isActive, scale, opacity]);

    useEffect(() => {
        startBreathing();
        return () => {
            setIsActive(false);
            cancelAnimation(scale);
            cancelAnimation(opacity);
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    const getInstruction = () => {
        switch (phase) {
            case 'INHALE': return 'Inspirez... (4s)';
            case 'HOLD': return 'Bloquez... (7s)';
            case 'EXHALE': return 'Expirez... (8s)';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.circleContainer}>
                <Animated.View style={[styles.circle, animatedStyle]} />
                <View style={styles.centerContent}>
                    <Text style={styles.instruction}>{getInstruction()}</Text>
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
