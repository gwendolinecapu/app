import React, { useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop, Path, ClipPath, G } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    interpolate,
    Easing,
    cancelAnimation,
    useAnimatedProps,
    SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LootBoxTier, Rarity } from '../../services/MonetizationTypes';
import LootBoxService from '../../services/LootBoxService';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface R6AlphaPackProps {
    tier: LootBoxTier;
    spoilerRarity?: Rarity;
    onOpen: () => void;
    size?: number;
}

const { width } = Dimensions.get('window');
const DEFAULT_SIZE = width * 0.65; // Slightly larger for better detail

// Configuration des tiers (Couleurs plus riches)
const TIER_CONFIG: Record<LootBoxTier, {
    baseColor: string;
    accentColor: string;
    glowColor: string;
    metallic: string[];
    textureColor: string;
}> = {
    basic: {
        baseColor: '#374151',
        accentColor: '#9CA3AF',
        glowColor: '#9CA3AF',
        metallic: ['#1F2937', '#374151', '#4B5563', '#374151', '#1F2937'],
        textureColor: '#111827',
    },
    standard: {
        baseColor: '#1E3A8A',
        accentColor: '#60A5FA',
        glowColor: '#3B82F6',
        metallic: ['#172554', '#1E40AF', '#3B82F6', '#1E40AF', '#172554'],
        textureColor: '#0F172A',
    },
    elite: {
        baseColor: '#92400E',
        accentColor: '#FCD34D',
        glowColor: '#F59E0B',
        metallic: ['#451a03', '#92400E', '#F59E0B', '#92400E', '#451a03'],
        textureColor: '#2A1000',
    },
};

// Points d'un hexagone
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

// Crack Path Generator (Organic Lightning Style)
const generateCrackPath = (size: number, centerX: number, centerY: number) => {
    const points: { x: number, y: number }[] = [];
    const startY = centerY - size * 0.7;
    const endY = centerY + size * 0.7;

    let currentX = centerX;
    let currentY = startY;

    points.push({ x: currentX, y: currentY });

    while (currentY < endY) {
        const stepY = 15 + Math.random() * 20;
        const deviationX = (Math.random() - 0.5) * 40; // More chaos

        currentY += stepY;
        currentX += deviationX;

        // Keep within bounds roughly
        if (Math.abs(currentX - centerX) > size * 0.3) {
            currentX = centerX + (currentX - centerX) * 0.5;
        }

        points.push({ x: currentX, y: currentY });
    }

    // Build path
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }

    // Add some random branches
    for (let i = 2; i < points.length - 2; i += 2) {
        if (Math.random() > 0.5) {
            const p = points[i];
            const branchLen = 20 + Math.random() * 30;
            const angle = (Math.random() - 0.5) * Math.PI; // -90 to 90 degrees roughly
            const branchX = p.x + Math.sin(angle) * branchLen;
            const branchY = p.y + Math.cos(angle) * branchLen;
            d += ` M ${p.x} ${p.y} L ${branchX} ${branchY}`;
        }
    }

    return d;
};

// Particle Component
const DebrisParticle = React.memo(({
    isActive,
    color,
    size,
    x,
    y
}: {
    isActive: SharedValue<number>,
    color: string,
    size: number,
    x: number,
    y: number
}) => {
    const style = useAnimatedStyle(() => {
        const progress = isActive.value;
        return {
            transform: [
                { translateX: interpolate(progress, [0, 1], [0, (Math.random() - 0.5) * 100]) },
                { translateY: interpolate(progress, [0, 1], [0, (Math.random() - 0.5) * 100 + 50]) },
                { rotate: `${interpolate(progress, [0, 1], [0, Math.random() * 360])}deg` },
                { scale: interpolate(progress, [0, 0.2, 1], [0, 1, 0]) }
            ],
            opacity: interpolate(progress, [0, 0.1, 0.8, 1], [0, 1, 1, 0]),
        };
    });

    return (
        <Animated.View
            style={[
                styles.particle,
                { left: x, top: y, width: size, height: size, backgroundColor: color },
                style
            ]}
        />
    );
});

export default function R6AlphaPack({ tier, spoilerRarity, onOpen, size = DEFAULT_SIZE }: R6AlphaPackProps) {
    const config = TIER_CONFIG[tier];
    const rarityColor = spoilerRarity ? LootBoxService.getRarityColor(spoilerRarity) : config.glowColor;
    const center = size / 2;
    const hexSize = size * 0.45;

    // Animation values
    const rotation = useSharedValue(0);
    const floatY = useSharedValue(0);
    const holdProgress = useSharedValue(0);
    const shake = useSharedValue(0);
    const glowIntensity = useSharedValue(0.4);
    const crackProgress = useSharedValue(0);
    const explode = useSharedValue(0);

    const isHolding = useSharedValue(false);
    const holdStartTime = React.useRef<number | null>(null);
    const holdCheckInterval = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const hasOpened = React.useRef(false);

    // Crack paths
    const crackPath = useMemo(() => generateCrackPath(size, center, center), [size, center]);

    // Debris
    const debris = useMemo(() => Array.from({ length: 20 }).map(() => ({
        x: center + (Math.random() - 0.5) * size * 0.6,
        y: center + (Math.random() - 0.5) * size * 0.6,
        size: 2 + Math.random() * 6,
        color: Math.random() > 0.5 ? config.accentColor : config.baseColor
    })), [center, size, config]);

    // Idle
    useEffect(() => {
        rotation.value = withRepeat(withTiming(360, { duration: 25000, easing: Easing.linear }), -1, false);
        floatY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
                withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
        glowIntensity.value = withRepeat(withSequence(withTiming(0.6, { duration: 1500 }), withTiming(0.4, { duration: 1500 })), -1, true);

        return () => {
            if (holdCheckInterval.current) clearInterval(holdCheckInterval.current);
            cancelAnimation(rotation);
            cancelAnimation(floatY);
            cancelAnimation(glowIntensity);
        };
    }, []);

    const triggerHoldHaptic = useCallback((progress: number) => {
        if (progress % 0.1 < 0.02) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, []);

    const handlePressIn = useCallback(() => {
        if (hasOpened.current) return;
        isHolding.value = true;
        holdStartTime.current = Date.now();

        // Stop rotation
        cancelAnimation(rotation);

        // Shake it
        shake.value = withRepeat(withSequence(withTiming(2, { duration: 40 }), withTiming(-2, { duration: 40 })), -1, true);

        holdCheckInterval.current = setInterval(() => {
            if (!holdStartTime.current || hasOpened.current) return;
            const elapsed = Date.now() - holdStartTime.current;
            const progress = Math.min(elapsed / 1500, 1); // 1.5s to open

            holdProgress.value = progress;
            crackProgress.value = progress;
            glowIntensity.value = 0.4 + progress * 0.6;
            triggerHoldHaptic(progress);

            if (progress >= 1 && !hasOpened.current) {
                hasOpened.current = true;
                if (holdCheckInterval.current) clearInterval(holdCheckInterval.current);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Explode
                shake.value = 0;
                explode.value = withTiming(1, { duration: 400 });
                setTimeout(onOpen, 300);
            }
        }, 30);
    }, [onOpen, triggerHoldHaptic]);

    const handlePressOut = useCallback(() => {
        if (hasOpened.current) return;
        isHolding.value = false;
        holdStartTime.current = null;
        if (holdCheckInterval.current) clearInterval(holdCheckInterval.current);

        holdProgress.value = withTiming(0, { duration: 300 });
        crackProgress.value = withTiming(0, { duration: 300 });
        shake.value = withTiming(0, { duration: 200 });
        // Resume rotation
        rotation.value = withRepeat(withTiming(rotation.value + 360, { duration: 25000, easing: Easing.linear }), -1, false);
    }, []);

    // Animated Props
    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: floatY.value },
            { rotate: `${rotation.value}deg` },
            { translateX: shake.value },
            { scale: interpolate(explode.value, [0, 0.5, 1], [1, 1.2, 0]) }, // Scale up then poof
        ],
        opacity: interpolate(explode.value, [0, 0.8, 1], [1, 1, 0]),
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowIntensity.value,
        transform: [{ scale: 1 + holdProgress.value * 0.1 }]
    }));

    const crackProp = useAnimatedProps(() => ({
        strokeDashoffset: (1 - crackProgress.value) * 300, // Approx length
        strokeOpacity: crackProgress.value > 0.1 ? 1 : 0,
        strokeWidth: 2 + crackProgress.value * 4,
    }));

    const tearStripStyle = useAnimatedStyle(() => ({
        opacity: holdProgress.value,
        width: interpolate(holdProgress.value, [0, 1], [2, 10]),
    }));

    const instructionStyle = useAnimatedStyle(() => ({
        opacity: 1 - holdProgress.value,
    }));

    const crackGlowProps = useAnimatedProps(() => ({
        strokeDasharray: [300, 300],
        strokeDashoffset: (1 - crackProgress.value) * 300,
    }));

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <View style={[styles.container, { width: size, height: size }]}>

                {/* Background Glow */}
                <Animated.View style={[styles.outerGlow, { width: size * 1.2, height: size * 1.2, borderRadius: size * 0.6, backgroundColor: rarityColor }, glowStyle]} />

                {/* Debris Particles */}
                {debris.map((p, i) => <DebrisParticle key={i} {...p} isActive={explode} />)}

                <Animated.View style={[styles.hexContainer, containerStyle]}>
                    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <Defs>
                            <LinearGradient id="faceGrad" x1="0" y1="0" x2="1" y2="1">
                                {config.metallic.map((c, i) => <Stop key={i} offset={i / (config.metallic.length - 1)} stopColor={c} />)}
                            </LinearGradient>
                            <LinearGradient id="rimGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="rgba(255,255,255,0.7)" />
                                <Stop offset="0.5" stopColor="rgba(255,255,255,0)" />
                                <Stop offset="1" stopColor="rgba(0,0,0,0.5)" />
                            </LinearGradient>
                        </Defs>

                        {/* Back Shadow */}
                        <Polygon points={getHexagonPoints(hexSize + 4, center, center + 4)} fill="rgba(0,0,0,0.5)" />

                        {/* Main Hex Body */}
                        <Polygon points={getHexagonPoints(hexSize, center, center)} fill="url(#faceGrad)" stroke={config.accentColor} strokeWidth={4} />

                        {/* Inner Bevel/Rim */}
                        <Polygon points={getHexagonPoints(hexSize * 0.85, center, center)} fill="none" stroke="url(#rimGrad)" strokeWidth={3} opacity={0.6} />

                        {/* Center Detail */}
                        <Polygon points={getHexagonPoints(hexSize * 0.3, center, center)} fill={config.textureColor} stroke={config.accentColor} strokeWidth={1} />

                        {/* Crack Effect */}
                        <ClipPath id="clipHex">
                            <Polygon points={getHexagonPoints(hexSize, center, center)} />
                        </ClipPath>

                        <G clipPath="url(#clipHex)">
                            {/* Crack Glow Below */}
                            <AnimatedPath
                                d={crackPath}
                                stroke={rarityColor}
                                strokeWidth={8}
                                fill="none"
                                strokeLinecap="round"
                                strokeOpacity={0.6}
                                animatedProps={crackGlowProps}
                            />
                            {/* Crack Line */}
                            <AnimatedPath
                                d={crackPath}
                                stroke="#FFF"
                                fill="none"
                                strokeLinecap="round"
                                animatedProps={crackProp}
                                strokeDasharray={[300, 300]}
                            />
                        </G>
                    </Svg>

                    {/* Tear Strip Glow Overlay */}
                    <Animated.View style={[
                        styles.tearStrip,
                        { backgroundColor: rarityColor, height: size * 0.6, left: center - 1 }, // Centered roughly
                        tearStripStyle
                    ]} />
                </Animated.View>

                {/* Instruction Text */}
                <Animated.Text style={[styles.instruction, instructionStyle]}>
                    MAINTENIR
                </Animated.Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    outerGlow: { position: 'absolute', opacity: 0.5 },
    hexContainer: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    particle: { position: 'absolute', borderRadius: 2 },
    tearStrip: { position: 'absolute', borderRadius: 4, zIndex: 15 },
    instruction: {
        position: 'absolute', bottom: -40, color: 'white', fontWeight: 'bold', letterSpacing: 4, fontSize: 14, opacity: 0.8,
        textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4
    }
});
