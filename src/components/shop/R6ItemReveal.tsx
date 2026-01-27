import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    interpolate,
    Easing,
    FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ShopItem } from '../../services/MonetizationTypes';
import LootBoxService from '../../services/LootBoxService';

interface R6ItemRevealProps {
    item: ShopItem;
    isNew: boolean;
    isShiny?: boolean;
    dustValue?: number;
    onComplete?: () => void;
}

const { width } = Dimensions.get('window');
const REVEAL_SIZE = width * 0.7;

// Configuration par rareté
const RARITY_CONFIG: Record<string, {
    particles: number;
    burstIntensity: number;
    hasRays: boolean;
    hasSparks: boolean;
}> = {
    common: { particles: 8, burstIntensity: 0.6, hasRays: false, hasSparks: false },
    uncommon: { particles: 12, burstIntensity: 0.7, hasRays: false, hasSparks: false },
    rare: { particles: 16, burstIntensity: 0.8, hasRays: true, hasSparks: false },
    epic: { particles: 24, burstIntensity: 1, hasRays: true, hasSparks: true },
    legendary: { particles: 32, burstIntensity: 1.2, hasRays: true, hasSparks: true },
    mythic: { particles: 40, burstIntensity: 1.5, hasRays: true, hasSparks: true },
};

// Particule de burst
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
        progress.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
        opacity.value = withDelay(delay + 400, withTiming(0, { duration: 400 }));
    }, []);

    const style = useAnimatedStyle(() => {
        const x = Math.cos(angle) * distance * progress.value;
        const y = Math.sin(angle) * distance * progress.value;
        const scale = interpolate(progress.value, [0, 0.3, 1], [0, 1, 0.3]);

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
                { backgroundColor: color, width: size, height: size, borderRadius: size / 2 },
                style,
            ]}
        />
    );
});

// Rayon lumineux
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
            withTiming(0.6, { duration: 200 }),
            withTiming(0.3, { duration: 600 }),
            withTiming(0, { duration: 400 })
        ));
        scaleY.value = withDelay(delay, withSequence(
            withTiming(1.1, { duration: 200, easing: Easing.out(Easing.cubic) }),
            withTiming(0.8, { duration: 400 })
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
                colors={[color, 'transparent']}
                style={styles.rayGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
        </Animated.View>
    );
});

// Sparkle effect
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
            withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 400 })
        ));
        rotation.value = withDelay(delay, withTiming(180, { duration: 800 }));
        opacity.value = withDelay(delay + 400, withTiming(0, { duration: 200 }));
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
            <Ionicons name="sparkles" size={16} color={color} />
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

    useEffect(() => {
        // Flash initial
        flashOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 400 })
        );

        // Halo expansion
        haloScale.value = withSequence(
            withTiming(1.3, { duration: 250, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 200 })
        );
        haloOpacity.value = withSequence(
            withTiming(1, { duration: 150 }),
            withDelay(600, withTiming(0.6, { duration: 400 }))
        );

        // Item apparition
        itemScale.value = withDelay(200, withSequence(
            withTiming(1.1, { duration: 200, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 150 })
        ));
        itemOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));

        // Glow pulsing
        if (['legendary', 'mythic', 'epic'].includes(rarity)) {
            glowPulse.value = withDelay(800, withSequence(
                withTiming(1.1, { duration: 600 }),
                withTiming(1, { duration: 600 })
            ));
        }

        // Haptics
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
        }, 1500);

        return () => clearTimeout(timeout);
    }, []);

    const haloStyle = useAnimatedStyle(() => ({
        transform: [{ scale: haloScale.value * glowPulse.value }],
        opacity: haloOpacity.value,
    }));

    const itemStyle = useAnimatedStyle(() => ({
        transform: [{ scale: itemScale.value }],
        opacity: itemOpacity.value,
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    // Générer les particules de burst
    const burstParticles = Array.from({ length: config.particles }, (_, i) => ({
        angle: (Math.PI * 2 / config.particles) * i + Math.random() * 0.3,
        delay: Math.random() * 200,
        distance: 80 + Math.random() * 100 * config.burstIntensity,
        size: 4 + Math.random() * 6,
    }));

    // Générer les rayons
    const rays = config.hasRays ? Array.from({ length: 8 }, (_, i) => ({
        angle: (360 / 8) * i,
        delay: 100 + i * 30,
    })) : [];

    // Générer les sparkles
    const sparkles = config.hasSparks ? Array.from({ length: 6 }, (_, i) => ({
        x: (Math.random() - 0.5) * REVEAL_SIZE * 0.8,
        y: (Math.random() - 0.5) * REVEAL_SIZE * 0.8,
        delay: 300 + Math.random() * 500,
    })) : [];

    return (
        <View style={styles.container}>
            {/* Flash blanc initial */}
            <Animated.View style={[styles.flash, { backgroundColor: rarityColor }, flashStyle]} />

            {/* Rayons lumineux */}
            {rays.map((ray, i) => (
                <LightRay key={i} angle={ray.angle} color={rarityColor} delay={ray.delay} />
            ))}

            {/* Halo de la couleur de rareté */}
            <Animated.View style={[styles.haloContainer, haloStyle]}>
                <LinearGradient
                    colors={[rarityColor, `${rarityColor}00`]}
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
                        color={i % 3 === 0 ? 'white' : rarityColor}
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
                    {/* Badge rareté */}
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                        <Text style={styles.rarityText}>{rarity.toUpperCase()}</Text>
                    </View>

                    {/* Preview de l'item */}
                    <View style={styles.previewContainer}>
                        {item.preview && item.preview.startsWith('#') ? (
                            <View style={[styles.colorPreview, { backgroundColor: item.preview }]} />
                        ) : (
                            <Ionicons
                                name={(item.icon as any) || 'cube'}
                                size={80}
                                color={rarityColor}
                            />
                        )}
                    </View>

                    {/* Nom de l'item */}
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemType}>{item.type}</Text>

                    {/* Badges */}
                    <View style={styles.badgesRow}>
                        {isNew && (
                            <Animated.View entering={FadeIn.delay(800)} style={styles.newBadge}>
                                <Text style={styles.newText}>NOUVEAU</Text>
                            </Animated.View>
                        )}
                        {isShiny && (
                            <Animated.View entering={FadeIn.delay(900)} style={styles.shinyBadge}>
                                <Ionicons name="sparkles" size={12} color="#FFF" />
                                <Text style={styles.shinyText}>SHINY</Text>
                            </Animated.View>
                        )}
                    </View>

                    {/* Dust si doublon */}
                    {dustValue && dustValue > 0 && (
                        <Animated.View entering={FadeIn.delay(1000)} style={styles.dustContainer}>
                            <Ionicons name="flash" size={14} color="#FCD34D" />
                            <Text style={styles.dustText}>+{dustValue} Poussière</Text>
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
        height: REVEAL_SIZE * 1.4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flash: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
    },
    haloContainer: {
        position: 'absolute',
        width: REVEAL_SIZE * 1.5,
        height: REVEAL_SIZE * 1.5,
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
        width: 30,
        height: REVEAL_SIZE,
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
        width: REVEAL_SIZE * 0.9,
        height: REVEAL_SIZE * 1.2,
        borderRadius: 20,
        opacity: 0.3,
    },
    itemCard: {
        width: REVEAL_SIZE * 0.85,
        backgroundColor: '#1F2937',
        borderRadius: 16,
        borderWidth: 3,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    rarityBadge: {
        position: 'absolute',
        top: -12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rarityText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    previewContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 15,
    },
    colorPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    itemName: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    itemType: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textTransform: 'capitalize',
        marginBottom: 12,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    newBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    newText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    shinyBadge: {
        backgroundColor: '#EC4899',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    shinyText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    dustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    dustText: {
        color: '#FCD34D',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
