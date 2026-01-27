import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    interpolate,
    Easing,
    cancelAnimation,
    useAnimatedProps,
    SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LootBoxTier, Rarity } from '../../services/MonetizationTypes';
import LootBoxService from '../../services/LootBoxService';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

interface R6AlphaPackProps {
    tier: LootBoxTier;
    spoilerRarity?: Rarity;
    onOpen: () => void;
    size?: number;
}

const { width } = Dimensions.get('window');
const DEFAULT_SIZE = width * 0.55;

// Configuration des tiers
const TIER_CONFIG: Record<LootBoxTier, {
    baseColor: string;
    accentColor: string;
    glowColor: string;
    metallic: string[];
}> = {
    basic: {
        baseColor: '#4B5563',
        accentColor: '#9CA3AF',
        glowColor: '#6B7280',
        metallic: ['#374151', '#4B5563', '#6B7280', '#4B5563', '#374151'],
    },
    standard: {
        baseColor: '#1E40AF',
        accentColor: '#3B82F6',
        glowColor: '#60A5FA',
        metallic: ['#1E3A8A', '#2563EB', '#3B82F6', '#2563EB', '#1E3A8A'],
    },
    elite: {
        baseColor: '#B45309',
        accentColor: '#F59E0B',
        glowColor: '#FCD34D',
        metallic: ['#92400E', '#D97706', '#F59E0B', '#D97706', '#92400E'],
    },
};

// Générer les points d'un hexagone
const getHexagonPoints = (size: number, centerX: number, centerY: number): string => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = centerX + size * Math.cos(angle);
        const y = centerY + size * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return points.join(' ');
};

// Particule orbitale
const OrbitalParticle = React.memo(({
    index,
    total,
    orbitRadius,
    color,
    holdProgress,
}: {
    index: number;
    total: number;
    orbitRadius: number;
    color: string;
    holdProgress: SharedValue<number>;
}) => {
    const baseAngle = (Math.PI * 2 / total) * index;
    const rotation = useSharedValue(baseAngle);
    const particleOpacity = useSharedValue(0.3);

    useEffect(() => {
        // Rotation continue
        rotation.value = withRepeat(
            withTiming(baseAngle + Math.PI * 2, { duration: 8000, easing: Easing.linear }),
            -1,
            false
        );
        // Pulse d'opacité
        particleOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1500 }),
                withTiming(0.2, { duration: 1500 })
            ),
            -1,
            true
        );

        return () => {
            cancelAnimation(rotation);
            cancelAnimation(particleOpacity);
        };
    }, []);

    const style = useAnimatedStyle(() => {
        const currentAngle = rotation.value;
        // L'orbite se resserre quand on maintient
        const currentRadius = orbitRadius * (1 - holdProgress.value * 0.3);
        const x = Math.cos(currentAngle) * currentRadius;
        const y = Math.sin(currentAngle) * currentRadius;
        // Les particules deviennent plus brillantes et grandes quand on maintient
        const scale = 1 + holdProgress.value * 1.5;
        const opacity = particleOpacity.value + holdProgress.value * 0.5;

        return {
            transform: [
                { translateX: x },
                { translateY: y },
                { scale },
            ],
            opacity: Math.min(opacity, 1),
        };
    });

    return (
        <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />
    );
});

export default function R6AlphaPack({ tier, spoilerRarity, onOpen, size = DEFAULT_SIZE }: R6AlphaPackProps) {
    const config = TIER_CONFIG[tier];
    const rarityColor = spoilerRarity ? LootBoxService.getRarityColor(spoilerRarity) : config.glowColor;

    // Animation values
    const rotation = useSharedValue(0);
    const floatY = useSharedValue(0);
    const holdProgress = useSharedValue(0);
    const shake = useSharedValue(0);
    const glowIntensity = useSharedValue(0.3);
    const pulseScale = useSharedValue(1);
    const isHolding = useSharedValue(false);

    const holdStartTime = React.useRef<number | null>(null);
    const holdCheckInterval = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const hasOpened = React.useRef(false);

    // Idle animations
    useEffect(() => {
        // Rotation lente
        rotation.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );
        // Flottement
        floatY.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        // Pulse subtil de la lueur
        glowIntensity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 2000 }),
                withTiming(0.3, { duration: 2000 })
            ),
            -1,
            true
        );

        return () => {
            cancelAnimation(rotation);
            cancelAnimation(floatY);
            cancelAnimation(glowIntensity);
            cancelAnimation(holdProgress);
            cancelAnimation(shake);
            cancelAnimation(pulseScale);
            if (holdCheckInterval.current) {
                clearInterval(holdCheckInterval.current);
            }
        };
    }, []);

    // Haptic feedback pendant le hold
    const triggerHoldHaptic = useCallback((progress: number) => {
        if (progress > 0.25 && progress < 0.3) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (progress > 0.5 && progress < 0.55) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (progress > 0.75 && progress < 0.8) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    }, []);

    const handlePressIn = useCallback(() => {
        if (hasOpened.current) return;

        isHolding.value = true;
        holdStartTime.current = Date.now();

        // Shake progressif
        shake.value = withRepeat(
            withSequence(
                withTiming(3, { duration: 50 }),
                withTiming(-3, { duration: 50 })
            ),
            -1,
            true
        );

        // Check progress periodically
        holdCheckInterval.current = setInterval(() => {
            if (!holdStartTime.current || hasOpened.current) return;

            const elapsed = Date.now() - holdStartTime.current;
            const progress = Math.min(elapsed / 2000, 1); // 2 secondes pour ouvrir

            holdProgress.value = progress;
            triggerHoldHaptic(progress);

            // Intensifier la lueur avec la progression
            glowIntensity.value = 0.3 + progress * 0.7;

            // Scale pulse qui s'accélère
            if (progress > 0.5) {
                pulseScale.value = withSequence(
                    withTiming(1.05, { duration: 100 }),
                    withTiming(1, { duration: 100 })
                );
            }

            // Ouverture !
            if (progress >= 1 && !hasOpened.current) {
                hasOpened.current = true;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                if (holdCheckInterval.current) {
                    clearInterval(holdCheckInterval.current);
                }

                // Animation finale d'explosion
                shake.value = 0;
                pulseScale.value = withSequence(
                    withTiming(1.15, { duration: 150 }),
                    withTiming(0, { duration: 200 })
                );
                glowIntensity.value = withTiming(1.5, { duration: 150 });

                setTimeout(() => {
                    onOpen();
                }, 200);
            }
        }, 50);
    }, [triggerHoldHaptic, onOpen]);

    const handlePressOut = useCallback(() => {
        if (hasOpened.current) return;

        isHolding.value = false;
        holdStartTime.current = null;

        if (holdCheckInterval.current) {
            clearInterval(holdCheckInterval.current);
        }

        // Reset animations
        holdProgress.value = withTiming(0, { duration: 300 });
        shake.value = withTiming(0, { duration: 200 });
        glowIntensity.value = withTiming(0.3, { duration: 300 });
        pulseScale.value = withTiming(1, { duration: 200 });
    }, []);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: floatY.value },
            { rotate: `${rotation.value}deg` },
            { translateX: shake.value },
            { scale: pulseScale.value },
        ],
    }));

    const glowStyle = useAnimatedStyle(() => {
        // Transition de couleur vers la rareté spoilée quand on maintient
        const glowOpacity = glowIntensity.value;

        return {
            opacity: glowOpacity,
            transform: [{ scale: 1 + holdProgress.value * 0.3 }],
        };
    });

    const innerGlowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(holdProgress.value, [0, 0.5, 1], [0, 0.5, 1]),
    }));

    const progressRingStyle = useAnimatedStyle(() => ({
        opacity: holdProgress.value > 0 ? 1 : 0,
        transform: [{ scale: 1 + holdProgress.value * 0.1 }],
    }));

    const hexSize = size * 0.4;
    const center = size / 2;

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <View style={[styles.container, { width: size, height: size }]}>
                {/* Lueur externe */}
                <Animated.View
                    style={[
                        styles.outerGlow,
                        {
                            width: size * 1.4,
                            height: size * 1.4,
                            borderRadius: size * 0.7,
                            backgroundColor: rarityColor,
                        },
                        glowStyle,
                    ]}
                />

                {/* Particules orbitales */}
                <View style={styles.particlesContainer}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <OrbitalParticle
                            key={i}
                            index={i}
                            total={8}
                            orbitRadius={size * 0.45}
                            color={i % 2 === 0 ? rarityColor : config.accentColor}
                            holdProgress={holdProgress}
                        />
                    ))}
                </View>

                {/* Pack hexagonal */}
                <Animated.View style={[styles.hexContainer, containerStyle]}>
                    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <Defs>
                            {/* Gradient métallique */}
                            <LinearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                {config.metallic.map((color, i) => (
                                    <Stop
                                        key={i}
                                        offset={`${(i / (config.metallic.length - 1)) * 100}%`}
                                        stopColor={color}
                                    />
                                ))}
                            </LinearGradient>
                            {/* Highlight */}
                            <LinearGradient id="highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                <Stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                                <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </LinearGradient>
                            {/* Rarity glow */}
                            <RadialGradient id="rarityGlow" cx="50%" cy="50%" r="50%">
                                <Stop offset="0%" stopColor={rarityColor} stopOpacity="0.8" />
                                <Stop offset="100%" stopColor={rarityColor} stopOpacity="0" />
                            </RadialGradient>
                        </Defs>

                        {/* Lueur de rareté interne (apparaît au hold) */}
                        <AnimatedPolygon
                            points={getHexagonPoints(hexSize * 0.9, center, center)}
                            fill="url(#rarityGlow)"
                            animatedProps={useAnimatedProps(() => ({
                                opacity: interpolate(holdProgress.value, [0, 0.5, 1], [0, 0.3, 0.8]),
                            }))}
                        />

                        {/* Hexagone principal */}
                        <Polygon
                            points={getHexagonPoints(hexSize, center, center)}
                            fill="url(#metalGrad)"
                            stroke={config.accentColor}
                            strokeWidth={2}
                        />

                        {/* Highlight */}
                        <Polygon
                            points={getHexagonPoints(hexSize * 0.95, center, center)}
                            fill="url(#highlight)"
                        />

                        {/* Hexagone intérieur (détail) */}
                        <Polygon
                            points={getHexagonPoints(hexSize * 0.6, center, center)}
                            fill="none"
                            stroke={config.accentColor}
                            strokeWidth={1}
                            opacity={0.5}
                        />

                        {/* Point central */}
                        <Polygon
                            points={getHexagonPoints(hexSize * 0.15, center, center)}
                            fill={config.accentColor}
                        />
                    </Svg>

                    {/* Lueur interne qui s'intensifie */}
                    <Animated.View
                        style={[
                            styles.innerGlow,
                            { backgroundColor: rarityColor },
                            innerGlowStyle,
                        ]}
                    />
                </Animated.View>

                {/* Anneau de progression */}
                <Animated.View style={[styles.progressRing, progressRingStyle]}>
                    <Svg width={size * 1.1} height={size * 1.1} viewBox={`0 0 ${size * 1.1} ${size * 1.1}`}>
                        <Polygon
                            points={getHexagonPoints(hexSize * 1.15, size * 0.55, size * 0.55)}
                            fill="none"
                            stroke={rarityColor}
                            strokeWidth={3}
                            strokeDasharray={`${hexSize * 6 * (holdProgress.value)} ${hexSize * 6}`}
                            opacity={0.8}
                        />
                    </Svg>
                </Animated.View>

                {/* Instruction */}
                <Animated.Text
                    style={[
                        styles.instruction,
                        useAnimatedStyle(() => ({
                            opacity: interpolate(holdProgress.value, [0, 0.2], [0.6, 0]),
                        })),
                    ]}
                >
                    MAINTENIR POUR OUVRIR
                </Animated.Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerGlow: {
        position: 'absolute',
    },
    particlesContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    hexContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerGlow: {
        position: 'absolute',
        width: '60%',
        height: '60%',
        borderRadius: 100,
        opacity: 0,
    },
    progressRing: {
        position: 'absolute',
    },
    instruction: {
        position: 'absolute',
        bottom: -30,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});
