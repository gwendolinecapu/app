/**
 * DailyRewardCard.tsx
 *
 * Carte de récompense quotidienne avec design moderne et animations.
 * Affiche l'état du streak et permet de réclamer la récompense du jour.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
    FadeIn,
    interpolate,
} from 'react-native-reanimated';
import { useMonetization } from '../../contexts/MonetizationContext';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext';
import { DailyReward } from '../../services/MonetizationTypes';
import * as Haptics from 'expo-haptics';

interface DailyRewardCardProps {
    alterId?: string;
    compact?: boolean;
}

// Animated Flame
const AnimatedFlame = React.memo(({ size = 20 }: { size?: number }) => {
    const flicker = useSharedValue(1);

    useEffect(() => {
        flicker.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 150 }),
                withTiming(0.9, { duration: 150 }),
                withTiming(1.1, { duration: 100 })
            ),
            -1,
            true
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: flicker.value }],
    }));

    return (
        <Animated.View style={style}>
            <Text style={{ fontSize: size }}>🔥</Text>
        </Animated.View>
    );
});

// Animated Gift Icon
const AnimatedGift = React.memo(() => {
    const bounce = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        bounce.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        rotate.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 200 }),
                withTiming(5, { duration: 200 }),
                withTiming(0, { duration: 200 })
            ),
            -1
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateY: bounce.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));

    return (
        <Animated.View style={style}>
            <Ionicons name="gift" size={32} color="#FFFFFF" />
        </Animated.View>
    );
});

// Pulse effect for claim button
const PulseRing = React.memo(() => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        scale.value = withRepeat(
            withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
            -1
        );
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 100 }),
                withTiming(0, { duration: 1400 })
            ),
            -1
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.pulseRing, style]} />
    );
});

export function DailyRewardCard({ alterId, compact = false }: DailyRewardCardProps) {
    const {
        checkDailyLogin,
        claimDailyLogin,
        currentStreak,
    } = useMonetization();
    const { currentAlter } = useAuth();

    const effectiveAlterId = alterId || currentAlter?.id || 'default';

    const [canClaim, setCanClaim] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [reward, setReward] = useState<DailyReward | null>(null);

    const cardScale = useSharedValue(1);
    const shine = useSharedValue(0);

    useEffect(() => {
        checkStatus();
    }, [effectiveAlterId]);

    useEffect(() => {
        if (canClaim) {
            // Shine animation when can claim
            shine.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 2000 }),
                    withTiming(0, { duration: 0 })
                ),
                -1
            );
        }
    }, [canClaim]);

    const checkStatus = async () => {
        const status = await checkDailyLogin(effectiveAlterId);
        setCanClaim(status);
    };

    const handleClaim = async () => {
        setClaiming(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Scale animation on press
        cardScale.value = withSequence(
            withSpring(0.95, { damping: 10 }),
            withSpring(1, { damping: 8 })
        );

        try {
            const result = await claimDailyLogin(effectiveAlterId);
            setReward(result);
            setCanClaim(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to claim daily reward', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setClaiming(false);
        }
    };

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }));

    const shineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shine.value, [0, 1], [-150, 150]) }],
        opacity: canClaim ? 0.2 : 0,
    }));

    // Reward claimed state
    if (reward) {
        return (
            <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        <View style={styles.iconWrapper}>
                            <Ionicons name="checkmark-circle" size={36} color="#FFFFFF" />
                        </View>
                        <View style={styles.textContent}>
                            <Text style={styles.title}>Récompense récupérée !</Text>
                            <View style={styles.rewardInfo}>
                                <View style={styles.rewardBadge}>
                                    <Ionicons name="diamond" size={14} color="#FFFFFF" />
                                    <Text style={styles.rewardAmount}>+{reward.credits}</Text>
                                </View>
                                <View style={styles.streakBadge}>
                                    <AnimatedFlame size={14} />
                                    <Text style={styles.streakText}>{reward.day} jours</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    }

    // Already claimed today state
    if (!canClaim) {
        return (
            <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
                <View style={styles.claimedCard}>
                    <View style={styles.content}>
                        <View style={[styles.iconWrapper, styles.iconWrapperMuted]}>
                            <Ionicons name="time-outline" size={28} color="rgba(255,255,255,0.5)" />
                        </View>
                        <View style={styles.textContent}>
                            <Text style={styles.titleMuted}>À demain !</Text>
                            <View style={styles.streakDisplay}>
                                <AnimatedFlame size={16} />
                                <Text style={styles.streakInfo}>
                                    Série actuelle : <Text style={styles.streakHighlight}>{currentStreak}</Text> jours
                                </Text>
                            </View>
                        </View>
                        <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={16} color="#10B981" />
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    }

    // Can claim state
    return (
        <Animated.View entering={FadeIn.duration(300)} style={[styles.container, cardAnimatedStyle]}>
            <TouchableOpacity
                onPress={handleClaim}
                disabled={claiming}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#F59E0B', '#EA580C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    {/* Shine effect */}
                    <Animated.View style={[styles.shineEffect, shineStyle]} />

                    {/* Pulse rings */}
                    <View style={styles.pulseContainer}>
                        <PulseRing />
                    </View>

                    <View style={styles.content}>
                        <View style={styles.iconWrapper}>
                            <AnimatedGift />
                        </View>

                        <View style={styles.textContent}>
                            <Text style={styles.title}>Cadeau Quotidien</Text>
                            <Text style={styles.subtitle}>Récupère tes cristaux gratuits !</Text>
                            <View style={styles.streakPreview}>
                                <AnimatedFlame size={14} />
                                <Text style={styles.streakPreviewText}>
                                    Jour {currentStreak + 1}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.claimButton}>
                            {claiming ? (
                                <ActivityIndicator color="#F59E0B" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.claimText}>Récupérer</Text>
                                    <Ionicons name="arrow-forward" size={14} color="#F59E0B" />
                                </>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        overflow: 'hidden',
    },
    claimedCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.xl,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    iconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapperMuted: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    textContent: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    titleMuted: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 6,
    },
    rewardInfo: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    rewardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    rewardAmount: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    streakText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    streakDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    streakInfo: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
    },
    streakHighlight: {
        color: '#F59E0B',
        fontWeight: '800',
    },
    streakPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    streakPreviewText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    checkBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    claimButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: 6,
    },
    claimText: {
        color: '#F59E0B',
        fontWeight: '800',
        fontSize: 13,
    },
    shineEffect: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        backgroundColor: 'rgba(255,255,255,0.4)',
        transform: [{ skewX: '-20deg' }],
    },
    pulseContainer: {
        position: 'absolute',
        right: 20,
        top: '50%',
        marginTop: -20,
    },
    pulseRing: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
});
