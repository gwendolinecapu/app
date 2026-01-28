/**
 * DailyStreakUI.tsx
 *
 * Composant amélioré pour afficher le calendrier des récompenses quotidiennes
 * avec animations, effets visuels et design moderne.
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    withDelay,
    Easing,
    FadeIn,
    FadeInRight,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';
import { useMonetization } from '../../contexts/MonetizationContext';
import { LootBoxTier } from '../../services/MonetizationTypes';
import { DailyRewardService } from '../../services/DailyRewardService';
import { colors, spacing, borderRadius } from '../../lib/theme';
import * as Haptics from 'expo-haptics';

interface DailyStreakUIProps {
    alterId?: string;
    onOpenPack: (tier: LootBoxTier) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = 72;
const CARD_HEIGHT = 110;

// Animated Flame Component
const AnimatedFlame = React.memo(({ size = 24, intensity = 1 }: { size?: number; intensity?: number }) => {
    const flicker = useSharedValue(1);
    const sway = useSharedValue(0);

    useEffect(() => {
        // Flame flicker
        flicker.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 150 + Math.random() * 100 }),
                withTiming(0.95, { duration: 150 + Math.random() * 100 }),
                withTiming(1.05, { duration: 100 })
            ),
            -1,
            true
        );

        // Subtle sway
        sway.value = withRepeat(
            withSequence(
                withTiming(-3, { duration: 300, easing: Easing.inOut(Easing.ease) }),
                withTiming(3, { duration: 300, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const flameStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: flicker.value * intensity },
            { rotate: `${sway.value}deg` },
        ],
    }));

    return (
        <Animated.View style={flameStyle}>
            <Text style={{ fontSize: size }}>🔥</Text>
        </Animated.View>
    );
});

// Streak Badge with glow effect
const StreakBadge = React.memo(({ streak, canClaim }: { streak: number; canClaim: boolean }) => {
    const glowPulse = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (canClaim) {
            glowPulse.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        }
    }, [canClaim]);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(glowPulse.value, [0, 1], [0.3, 0.8]),
        transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.15]) }],
    }));

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const streakLevel = streak < 7 ? 'starter' : streak < 30 ? 'warming' : streak < 100 ? 'blazing' : 'inferno';
    const levelColors = {
        starter: ['#F59E0B', '#D97706'],
        warming: ['#F97316', '#EA580C'],
        blazing: ['#EF4444', '#DC2626'],
        inferno: ['#A855F7', '#7C3AED'],
    };

    return (
        <View style={styles.streakBadgeContainer}>
            {/* Glow effect */}
            <Animated.View style={[styles.streakGlow, { backgroundColor: levelColors[streakLevel][0] }, glowStyle]} />

            <Animated.View style={badgeStyle}>
                <LinearGradient
                    colors={levelColors[streakLevel] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.streakBadge}
                >
                    <AnimatedFlame size={20} intensity={streak > 30 ? 1.2 : 1} />
                    <View style={styles.streakTextContainer}>
                        <Text style={styles.streakNumber}>{streak}</Text>
                        <Text style={styles.streakLabel}>JOURS</Text>
                    </View>
                </LinearGradient>
            </Animated.View>
        </View>
    );
});

// Day Card Component
const DayCard = React.memo(({
    day,
    status,
    config,
    index,
    onClaim,
    onInfo,
    claiming,
}: {
    day: number;
    status: 'claimed' | 'current' | 'locked';
    config: { credits: number; packTier?: LootBoxTier; isPremium: boolean };
    index: number;
    onClaim: () => void;
    onInfo: (day: number, status: string) => void;
    claiming: boolean;
}) => {
    const scale = useSharedValue(1);
    const shine = useSharedValue(0);

    const isPack = !!config.packTier;
    const isMilestone = day % 7 === 0;
    const isBigMilestone = day === 30 || day === 60 || day === 90 || day === 180;

    useEffect(() => {
        if (status === 'current') {
            // Pulse animation for current day
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

            // Shine effect
            shine.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1500 }),
                    withTiming(0, { duration: 0 })
                ),
                -1
            );
        }
    }, [status]);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const shineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shine.value, [0, 1], [-80, 80]) }],
        opacity: status === 'current' ? 0.3 : 0,
    }));

    // Card colors based on status
    let gradientColors: [string, string] = ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'];
    let borderColor = 'rgba(255,255,255,0.1)';
    let iconColor = 'rgba(255,255,255,0.5)';

    if (status === 'current') {
        gradientColors = ['#F59E0B', '#D97706'];
        borderColor = '#FCD34D';
        iconColor = '#FFFFFF';
    } else if (status === 'claimed') {
        gradientColors = ['#10B981', '#059669'];
        borderColor = '#34D399';
        iconColor = '#FFFFFF';
    } else if (isBigMilestone) {
        gradientColors = ['rgba(168, 85, 247, 0.25)', 'rgba(139, 92, 246, 0.1)'];
        borderColor = '#A855F7';
        iconColor = '#A855F7';
    } else if (isMilestone) {
        gradientColors = ['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)'];
        borderColor = '#3B82F6';
        iconColor = '#3B82F6';
    }

    return (
        <Animated.View
            entering={FadeInRight.delay(index * 50).duration(300)}
            style={cardAnimatedStyle}
        >
            <TouchableOpacity
                style={[styles.dayCard, { borderColor }]}
                activeOpacity={0.8}
                onPress={() => status === 'current' ? onClaim() : onInfo(day, status)}
                disabled={claiming}
            >
                <LinearGradient
                    colors={gradientColors}
                    style={styles.cardGradient}
                >
                    {/* Shine effect */}
                    <Animated.View style={[styles.shineEffect, shineStyle]} />

                    {/* Day number */}
                    <View style={styles.dayHeader}>
                        <Text style={[styles.dayText, status === 'locked' && styles.lockedText]}>
                            J{day}
                        </Text>
                        {isBigMilestone && (
                            <View style={styles.milestoneBadge}>
                                <Ionicons name="star" size={10} color="#FCD34D" />
                            </View>
                        )}
                    </View>

                    {/* Reward icon */}
                    <View style={[styles.iconContainer, isPack && styles.packIconContainer]}>
                        {isPack ? (
                            <Ionicons name="gift" size={26} color={iconColor} />
                        ) : (
                            <Ionicons name="diamond" size={24} color={iconColor} />
                        )}
                    </View>

                    {/* Reward amount */}
                    <Text style={[styles.amountText, status === 'locked' && styles.lockedText]}>
                        {isPack ? (
                            config.packTier === 'basic' ? 'Basic' :
                            config.packTier === 'standard' ? 'Standard' :
                            config.packTier === 'elite' ? 'Elite' : 'Pack'
                        ) : (
                            `+${config.credits}`
                        )}
                    </Text>

                    {/* Status indicator */}
                    {status === 'claimed' && (
                        <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                    )}

                    {status === 'current' && (
                        <View style={styles.claimIndicator}>
                            <Text style={styles.claimText}>TAP</Text>
                        </View>
                    )}

                    {status === 'locked' && (
                        <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.3)" />
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
});

// Progress Bar Component
const ProgressBar = React.memo(({ currentDay, nextMilestone }: { currentDay: number; nextMilestone: number }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        const prevMilestone = Math.floor((currentDay - 1) / 7) * 7;
        const progressValue = (currentDay - prevMilestone) / (nextMilestone - prevMilestone);
        progress.value = withSpring(Math.min(progressValue, 1), { damping: 15 });
    }, [currentDay]);

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressStyle]}>
                    <LinearGradient
                        colors={['#F59E0B', '#EF4444']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.progressGradient}
                    />
                </Animated.View>
            </View>
            <View style={styles.progressLabels}>
                <Text style={styles.progressText}>Jour {currentDay}</Text>
                <Text style={styles.progressText}>→ Jour {nextMilestone}</Text>
            </View>
        </View>
    );
});

export function DailyStreakUI({ alterId, onOpenPack }: DailyStreakUIProps) {
    const {
        currentStreak,
        claimDailyLogin,
        checkDailyLogin,
        isPremium
    } = useMonetization();

    const [canClaim, setCanClaim] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const packOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        checkStatus();
    }, [alterId, currentStreak]);

    useEffect(() => {
        return () => {
            if (packOpenTimeoutRef.current) {
                clearTimeout(packOpenTimeoutRef.current);
            }
        };
    }, []);

    const checkStatus = async () => {
        if (alterId) {
            const status = await checkDailyLogin(alterId);
            setCanClaim(status);
        }
    };

    // Calculate days to show (Current - 2 to Current + 5)
    const daysToShow = useMemo(() => {
        const startDay = Math.max(1, currentStreak - 2);
        return Array.from({ length: 8 }, (_, i) => startDay + i);
    }, [currentStreak]);

    // Calculate next milestone
    const nextMilestone = useMemo(() => {
        const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
        return milestones.find(m => m > currentStreak) || currentStreak + 7;
    }, [currentStreak]);

    const handleClaim = async () => {
        if (!alterId || !canClaim || claiming) return;

        setClaiming(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            const reward = await claimDailyLogin(alterId);

            if (reward.packTier) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                packOpenTimeoutRef.current = setTimeout(() => {
                    onOpenPack(reward.packTier!);
                }, 500);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    "🎉 Récompense !",
                    `Tu as gagné ${reward.credits} 💎\n\nSérie : ${reward.day} jours 🔥`,
                    [{ text: "Super !" }]
                );
            }

            setCanClaim(false);
        } catch (e) {
            console.error(e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setClaiming(false);
        }
    };

    const handleDayInfo = (day: number, status: string) => {
        const config = DailyRewardService.getRewardConfig(day, isPremium);
        const rewardText = config.packTier
            ? `Pack ${config.packTier}`
            : `${config.credits} crédits`;

        Alert.alert(
            `Jour ${day}`,
            status === 'claimed'
                ? `✅ Déjà récupéré !\nRécompense : ${rewardText}`
                : `🔒 Continue ta série pour débloquer !\nRécompense : ${rewardText}`,
            [{ text: "OK" }]
        );
    };

    const getDayStatus = (day: number): 'claimed' | 'current' | 'locked' => {
        if (canClaim) {
            if (day < currentStreak + 1) return 'claimed';
            if (day === currentStreak + 1) return 'current';
            return 'locked';
        } else {
            if (day <= currentStreak) return 'claimed';
            return 'locked';
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            {/* Header with Streak Badge */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>RÉCOMPENSES QUOTIDIENNES</Text>
                    <Text style={styles.subtitle}>
                        {canClaim ? "🎁 Récompense disponible !" : "Reviens demain !"}
                    </Text>
                </View>
                <StreakBadge streak={currentStreak} canClaim={canClaim} />
            </View>

            {/* Progress to next milestone */}
            <ProgressBar currentDay={currentStreak} nextMilestone={nextMilestone} />

            {/* Days Carousel */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={CARD_WIDTH + 10}
                decelerationRate="fast"
            >
                {daysToShow.map((day, index) => (
                    <DayCard
                        key={day}
                        day={day}
                        status={getDayStatus(day)}
                        config={DailyRewardService.getRewardConfig(day, isPremium)}
                        index={index}
                        onClaim={handleClaim}
                        onInfo={handleDayInfo}
                        claiming={claiming}
                    />
                ))}
            </ScrollView>

            {/* Premium Teaser */}
            {!isPremium && (
                <Animated.View entering={FadeIn.delay(500).duration(300)} style={styles.premiumBanner}>
                    <LinearGradient
                        colors={['rgba(234, 179, 8, 0.15)', 'rgba(234, 179, 8, 0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.premiumGradient}
                    >
                        <Ionicons name="star" size={16} color="#FCD34D" />
                        <Text style={styles.premiumText}>
                            Premium : récompenses <Text style={styles.premiumBold}>x2</Text> !
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#FCD34D" />
                    </LinearGradient>
                </Animated.View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    headerLeft: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1.5,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },

    // Streak Badge
    streakBadgeContainer: {
        position: 'relative',
    },
    streakGlow: {
        position: 'absolute',
        top: -5,
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 25,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    streakTextContainer: {
        alignItems: 'center',
    },
    streakNumber: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 18,
        lineHeight: 20,
    },
    streakLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Progress Bar
    progressContainer: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressGradient: {
        flex: 1,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    progressText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
    },

    // Scroll Content
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: 10,
    },

    // Day Card
    dayCard: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginRight: 10,
        borderRadius: 16,
        borderWidth: 2,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 6,
    },
    shineEffect: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: [{ skewX: '-20deg' }],
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
    },
    lockedText: {
        color: 'rgba(255,255,255,0.4)',
    },
    milestoneBadge: {
        backgroundColor: 'rgba(252, 211, 77, 0.3)',
        borderRadius: 6,
        padding: 2,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    packIconContainer: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
    },
    amountText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#059669',
        borderRadius: 8,
        padding: 3,
    },
    claimIndicator: {
        position: 'absolute',
        bottom: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    claimText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    lockOverlay: {
        position: 'absolute',
        top: 6,
        right: 6,
    },

    // Premium Banner
    premiumBanner: {
        marginHorizontal: spacing.md,
        marginTop: spacing.sm,
        borderRadius: 12,
        overflow: 'hidden',
    },
    premiumGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
    },
    premiumText: {
        color: '#FCD34D',
        fontSize: 12,
        fontWeight: '500',
    },
    premiumBold: {
        fontWeight: '800',
    },
});
