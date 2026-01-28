import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    interpolate,
    Easing,
    FadeIn,
    useAnimatedProps,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ShopItem } from '../../services/MonetizationTypes';
import LootBoxService from '../../services/LootBoxService';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface R6ItemRevealProps {
    item: ShopItem;
    isNew: boolean;
    isShiny?: boolean;
    dustValue?: number;
    onComplete?: () => void;
}

const { width } = Dimensions.get('window');
const REVEAL_SIZE = width * 0.75;

// Configuration par rareté - plus intense pour les raretés supérieures
const RARITY_CONFIG: Record<string, {
    particles: number;
    burstIntensity: number;
    hasRays: boolean;
    hasSparks: boolean;
    ringCount: number;
    glowSize: number;
}> = {
    common: { particles: 6, burstIntensity: 0.5, hasRays: false, hasSparks: false, ringCount: 1, glowSize: 1 },
    uncommon: { particles: 10, burstIntensity: 0.6, hasRays: false, hasSparks: false, ringCount: 1, glowSize: 1.1 },
    rare: { particles: 14, burstIntensity: 0.75, hasRays: true, hasSparks: false, ringCount: 2, glowSize: 1.2 },
    epic: { particles: 20, burstIntensity: 0.9, hasRays: true, hasSparks: true, ringCount: 2, glowSize: 1.3 },
    legendary: { particles: 28, burstIntensity: 1.1, hasRays: true, hasSparks: true, ringCount: 3, glowSize: 1.4 },
    mythic: { particles: 36, burstIntensity: 1.3, hasRays: true, hasSparks: true, ringCount: 3, glowSize: 1.5 },
};

// Anneau de lumière animé
const LightRing = React.memo(({
    delay,
    color,
    size,
}: {
    delay: number;
    color: string;
    size: number;
}) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        r: interpolate(progress.value, [0, 1], [0, size]),
        strokeOpacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.8, 0]),
        strokeWidth: interpolate(progress.value, [0, 1], [8, 2]),
    }));

    return (
        <Svg width={REVEAL_SIZE * 2} height={REVEAL_SIZE * 2} style={styles.ringSvg}>
            <AnimatedCircle
                cx={REVEAL_SIZE}
                cy={REVEAL_SIZE}
                fill="none"
                stroke={color}
                animatedProps={animatedProps}
            />
        </Svg>
    );
});

// Particule de burst avec trail
const BurstParticle = React.memo(({
    angle,
    delay,
    distance,
    color,
    size,
}: {
    angle: number;
    delay: number;
    distance: number;
    color: string;
    size: number;
}) => {
    const progress = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
        opacity.value = withDelay(delay + 300, withTiming(0, { duration: 400 }));
    }, []);

    const style = useAnimatedStyle(() => {
        const x = Math.cos(angle) * distance * progress.value;
        const y = Math.sin(angle) * distance * progress.value;
        const scale = interpolate(progress.value, [0, 0.2, 1], [0, 1.2, 0.2]);

        return {
            transform: [
                { translateX: x },
                { translateY: y },
                { scale },
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                styles.burstParticle,
                {
                    backgroundColor: color,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    shadowColor: color,
                    shadowOpacity: 0.8,
                    shadowRadius: size,
                },
                style,
            ]}
        />
    );
});

// Rayon lumineux style R6
const LightRay = React.memo(({
    angle,
    color,
    delay,
}: {
    angle: number;
    color: string;
    delay: number;
}) => {
    const opacity = useSharedValue(0);
    const scaleY = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(delay, withSequence(
            withTiming(0.5, { duration: 150 }),
            withTiming(0.2, { duration: 500 }),
            withTiming(0, { duration: 350 })
        ));
        scaleY.value = withDelay(delay, withSequence(
            withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
            withTiming(0.7, { duration: 350 })
        ));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${angle}deg` },
            { scaleY: scaleY.value },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.lightRay, style]}>
            <LinearGradient
                colors={[color, `${color}60`, 'transparent']}
                style={styles.rayGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
        </Animated.View>
    );
});

// Sparkle effet étoile
const Sparkle = React.memo(({
    delay,
    x,
    y,
    color,
}: {
    delay: number;
    x: number;
    y: number;
    color: string;
}) => {
    const scale = useSharedValue(0);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        scale.value = withDelay(delay, withSequence(
            withTiming(1.2, { duration: 150, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 350 })
        ));
        rotation.value = withDelay(delay, withTiming(90, { duration: 600 }));
        opacity.value = withDelay(delay + 350, withTiming(0, { duration: 150 }));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: x },
            { translateY: y },
            { scale: scale.value },
            { rotate: `${rotation.value}deg` },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.sparkle, style]}>
            <Ionicons name="sparkles" size={18} color={color} />
        </Animated.View>
    );
});

export default function R6ItemReveal({ item, isNew, isShiny, dustValue, onComplete }: R6ItemRevealProps) {
    const rarity = item.rarity || 'common';
    const rarityColor = LootBoxService.getRarityColor(rarity);
    const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;

    // Animation values
    const haloScale = useSharedValue(0);
    const haloOpacity = useSharedValue(0);
    const itemScale = useSharedValue(0);
    const itemOpacity = useSharedValue(0);
    const flashOpacity = useSharedValue(0);
    const glowPulse = useSharedValue(1);
    const cardRotation = useSharedValue(0);

    useEffect(() => {
        // Flash initial
        flashOpacity.value = withSequence(
            withTiming(0.9, { duration: 80 }),
            withTiming(0, { duration: 350 })
        );

        // Halo expansion - fluide
        haloScale.value = withTiming(config.glowSize, { duration: 400, easing: Easing.out(Easing.cubic) });
        haloOpacity.value = withSequence(
            withTiming(1, { duration: 150 }),
            withDelay(500, withTiming(0.5, { duration: 300 }))
        );

        // Item apparition - fluide sans rebond
        itemScale.value = withDelay(180, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
        itemOpacity.value = withDelay(180, withTiming(1, { duration: 250 }));

        // Léger effet de rotation 3D pour mythic/legendary
        if (['legendary', 'mythic'].includes(rarity)) {
            cardRotation.value = withDelay(600, withSequence(
                withTiming(2, { duration: 400 }),
                withTiming(-2, { duration: 400 }),
                withTiming(0, { duration: 300 })
            ));
        }

        // Glow pulsing subtil
        if (['legendary', 'mythic', 'epic'].includes(rarity)) {
            glowPulse.value = withDelay(700, withSequence(
                withTiming(1.08, { duration: 500 }),
                withTiming(1, { duration: 500 })
            ));
        }

        // Haptics selon rareté
        Haptics.notificationAsync(
            rarity === 'legendary' || rarity === 'mythic'
                ? Haptics.NotificationFeedbackType.Success
                : rarity === 'epic'
                    ? Haptics.NotificationFeedbackType.Warning
                    : Haptics.NotificationFeedbackType.Success
        );

        // Callback de complétion
        const timeout = setTimeout(() => {
            onComplete?.();
        }, 1400);

        return () => clearTimeout(timeout);
    }, []);

    const haloStyle = useAnimatedStyle(() => ({
        transform: [{ scale: haloScale.value * glowPulse.value }],
        opacity: haloOpacity.value,
    }));

    const itemStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: itemScale.value },
            { rotateY: `${cardRotation.value}deg` },
        ],
        opacity: itemOpacity.value,
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    // Générer les particules de burst
    const burstParticles = useMemo(() => Array.from({ length: config.particles }, (_, i) => ({
        angle: (Math.PI * 2 / config.particles) * i + Math.random() * 0.2,
        delay: Math.random() * 150,
        distance: 70 + Math.random() * 80 * config.burstIntensity,
        size: 3 + Math.random() * 5,
    })), [config]);

    // Générer les rayons
    const rays = useMemo(() => config.hasRays ? Array.from({ length: 6 }, (_, i) => ({
        angle: (360 / 6) * i,
        delay: 80 + i * 25,
    })) : [], [config]);

    // Générer les sparkles
    const sparkles = useMemo(() => config.hasSparks ? Array.from({ length: 5 }, () => ({
        x: (Math.random() - 0.5) * REVEAL_SIZE * 0.7,
        y: (Math.random() - 0.5) * REVEAL_SIZE * 0.7,
        delay: 250 + Math.random() * 400,
    })) : [], [config]);

    // Anneaux de lumière
    const rings = useMemo(() => Array.from({ length: config.ringCount }, (_, i) => ({
        delay: i * 100,
        size: 60 + i * 40,
    })), [config]);

    return (
        <View style={styles.container}>
            {/* Flash blanc initial */}
            <Animated.View style={[styles.flash, { backgroundColor: rarityColor }, flashStyle]} />

            {/* Anneaux de lumière */}
            {rings.map((ring, i) => (
                <LightRing key={i} delay={ring.delay} color={rarityColor} size={ring.size} />
            ))}

            {/* Rayons lumineux */}
            {rays.map((ray, i) => (
                <LightRay key={i} angle={ray.angle} color={rarityColor} delay={ray.delay} />
            ))}

            {/* Halo de la couleur de rareté */}
            <Animated.View style={[styles.haloContainer, haloStyle]}>
                <LinearGradient
                    colors={[`${rarityColor}80`, `${rarityColor}40`, `${rarityColor}00`]}
                    style={styles.halo}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 0.5, y: 0 }}
                />
            </Animated.View>

            {/* Particules de burst */}
            <View style={styles.burstContainer}>
                {burstParticles.map((p, i) => (
                    <BurstParticle
                        key={i}
                        angle={p.angle}
                        delay={p.delay}
                        distance={p.distance}
                        color={i % 3 === 0 ? '#FFF' : rarityColor}
                        size={p.size}
                    />
                ))}
            </View>

            {/* Sparkles */}
            {sparkles.map((s, i) => (
                <Sparkle key={i} x={s.x} y={s.y} delay={s.delay} color={rarityColor} />
            ))}

            {/* Item reveal */}
            <Animated.View style={[styles.itemContainer, itemStyle]}>
                {/* Glow derrière l'item */}
                <View style={[styles.itemGlow, { backgroundColor: rarityColor }]} />

                {/* Carte de l'item */}
                <View style={[styles.itemCard, { borderColor: rarityColor }]}>
                    {/* Badge rareté en haut */}
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                        <Text style={[styles.rarityText, { color: rarity === 'legendary' || rarity === 'mythic' ? '#000' : '#FFF' }]}>
                            {rarity.toUpperCase()}
                        </Text>
                    </View>

                    {/* Accent line */}
                    <View style={[styles.accentLine, { backgroundColor: rarityColor }]} />

                    {/* Preview de l'item */}
                    <View style={styles.previewContainer}>
                        {item.preview && item.preview.startsWith('#') ? (
                            <View style={[styles.colorPreview, { backgroundColor: item.preview, borderColor: `${rarityColor}60` }]}>
                                <View style={[styles.colorInner, { backgroundColor: item.preview }]} />
                            </View>
                        ) : (
                            <View style={[styles.iconContainer, { backgroundColor: `${rarityColor}20` }]}>
                                <Ionicons
                                    name={(item.icon as any) || 'cube'}
                                    size={70}
                                    color={rarityColor}
                                />
                            </View>
                        )}
                    </View>

                    {/* Nom de l'item */}
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={[styles.itemType, { color: `${rarityColor}99` }]}>{item.type}</Text>

                    {/* Badges */}
                    <View style={styles.badgesRow}>
                        {isNew && (
                            <Animated.View entering={FadeIn.delay(700).duration(200)} style={styles.newBadge}>
                                <Ionicons name="star" size={10} color="#FFF" />
                                <Text style={styles.newText}>NOUVEAU</Text>
                            </Animated.View>
                        )}
                        {isShiny && (
                            <Animated.View entering={FadeIn.delay(800).duration(200)} style={styles.shinyBadge}>
                                <Ionicons name="sparkles" size={10} color="#FFF" />
                                <Text style={styles.shinyText}>SHINY</Text>
                            </Animated.View>
                        )}
                    </View>

                    {/* Dust si doublon */}
                    {dustValue && dustValue > 0 && (
                        <Animated.View entering={FadeIn.delay(900).duration(200)} style={styles.dustContainer}>
                            <Ionicons name="flash" size={14} color="#FCD34D" />
                            <Text style={styles.dustText}>+{dustValue}</Text>
                        </Animated.View>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: REVEAL_SIZE,
        height: REVEAL_SIZE * 1.35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flash: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
    },
    ringSvg: {
        position: 'absolute',
        left: -REVEAL_SIZE / 2,
        top: -REVEAL_SIZE / 2 + REVEAL_SIZE * 0.675,
    },
    haloContainer: {
        position: 'absolute',
        width: REVEAL_SIZE * 1.4,
        height: REVEAL_SIZE * 1.4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    halo: {
        width: '100%',
        height: '100%',
        borderRadius: REVEAL_SIZE,
    },
    lightRay: {
        position: 'absolute',
        width: 24,
        height: REVEAL_SIZE * 0.9,
        alignItems: 'center',
    },
    rayGradient: {
        width: '100%',
        height: '100%',
    },
    burstContainer: {
        position: 'absolute',
        width: 1,
        height: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    burstParticle: {
        position: 'absolute',
    },
    sparkle: {
        position: 'absolute',
    },
    itemContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemGlow: {
        position: 'absolute',
        width: REVEAL_SIZE * 0.85,
        height: REVEAL_SIZE * 1.15,
        borderRadius: 24,
        opacity: 0.25,
    },
    itemCard: {
        width: REVEAL_SIZE * 0.82,
        backgroundColor: '#111827',
        borderRadius: 20,
        borderWidth: 2,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    rarityBadge: {
        position: 'absolute',
        top: -14,
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    rarityText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    accentLine: {
        width: '60%',
        height: 2,
        borderRadius: 1,
        marginTop: 16,
        marginBottom: 12,
        opacity: 0.6,
    },
    previewContainer: {
        width: 110,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    colorPreview: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: {
        color: '#FFF',
        fontSize: 19,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    itemType: {
        fontSize: 13,
        textTransform: 'capitalize',
        marginBottom: 14,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    newBadge: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    newText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    shinyBadge: {
        backgroundColor: '#DB2777',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    shinyText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 18,
        gap: 6,
    },
    dustText: {
        color: '#FCD34D',
        fontSize: 15,
        fontWeight: '700',
    },
});
