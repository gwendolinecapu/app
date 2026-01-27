import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolate,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    cancelAnimation,
    interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LootBoxTier, Rarity } from '../../services/MonetizationTypes';
import LootBoxService from '../../services/LootBoxService';
import PackTearEffect from './PackTearEffect';

interface BoosterPackProps {
    tier: LootBoxTier;
    onOpen: () => void;
    spoilerRarity?: Rarity;  // Rareté à spoiler via la lueur (style R6)
}

const { width } = Dimensions.get('window');
const PACK_WIDTH = width * 0.7;
const PACK_HEIGHT = PACK_WIDTH * 1.4;

const TIER_CONFIG: Record<LootBoxTier, {
    colors: string[],
    glowColor: string,
    icon: string,
    label: string,
    shimmerSpeed: number
}> = {
    basic: {
        colors: ['#9CA3AF', '#4B5563'],
        glowColor: 'rgba(156, 163, 175, 0.4)',
        icon: 'cube-outline',
        label: 'BASIC',
        shimmerSpeed: 3000
    },
    standard: {
        colors: ['#60A5FA', '#2563EB'],
        glowColor: 'rgba(96, 165, 250, 0.5)',
        icon: 'layers-outline',
        label: 'STANDARD',
        shimmerSpeed: 2500
    },
    elite: {
        colors: ['#FCD34D', '#F59E0B', '#D97706'],
        glowColor: 'rgba(252, 211, 77, 0.6)',
        icon: 'star',
        label: 'ELITE',
        shimmerSpeed: 2000
    }
};

export default React.memo(function BoosterPack({ tier, onOpen, spoilerRarity }: BoosterPackProps) {
    const config = TIER_CONFIG[tier];
    const [opened, setOpened] = useState(false);
    const [isOpening, setIsOpening] = useState(false);

    // Couleur de lueur basée sur la rareté spoilée (style R6)
    const spoilerGlowColor = useMemo(() => {
        if (!spoilerRarity) return config.glowColor;
        return LootBoxService.getRarityColor(spoilerRarity);
    }, [spoilerRarity, config.glowColor]);

    // Animation values
    const tearProgress = useSharedValue(0);
    const packOpenScale = useSharedValue(1);
    const packOpacity = useSharedValue(1);

    // NEW: Enhanced animations
    const floatY = useSharedValue(0);
    const floatRotate = useSharedValue(0);
    const shimmerX = useSharedValue(-PACK_WIDTH);
    const shake = useSharedValue(0);
    const glowScale = useSharedValue(1);
    const flashOpacity = useSharedValue(0);
    const rarityGlowIntensity = useSharedValue(0); // Pour la transition de couleur de lueur

    // STYLE R6: Animation idle sobre - seulement float, pas de shimmer constant
    useEffect(() => {
        // Gentle floating up and down (seule animation idle)
        floatY.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Pas de rotation en idle (plus sobre)
        // Pas de shimmer constant (sera déclenché au glissement)
        // Pas de glow pulsant constant

        return () => {
            cancelAnimation(floatY);
            cancelAnimation(floatRotate);
            cancelAnimation(shimmerX);
            cancelAnimation(glowScale);
        };
    }, [tier]);

    // Track milestones for haptics (R6 style: precise ticks)
    const lastMilestone = useSharedValue(0);

    const pan = Gesture.Pan()
        .onChange((event) => {
            if (opened) return;
            const progress = (event.translationX + PACK_WIDTH / 2) / PACK_WIDTH;
            tearProgress.value = Math.max(0, Math.min(1, progress));

            // Shake intensity based on progress (subtle)
            shake.value = interpolate(progress, [0, 0.5, 0.7], [0, 2, 5]);

            // R6 STYLE: Haptic tick at precise milestones (25%, 50%, 70%)
            const milestones = [0.25, 0.50, 0.70];
            for (const milestone of milestones) {
                if (progress >= milestone && lastMilestone.value < milestone) {
                    runOnJS(Haptics.impactAsync)(
                        milestone >= 0.7
                            ? Haptics.ImpactFeedbackStyle.Medium
                            : Haptics.ImpactFeedbackStyle.Light
                    );
                    lastMilestone.value = milestone;
                }
            }

            // Déclencher shimmer à partir de 30%
            if (progress > 0.3 && shimmerX.value < 0) {
                shimmerX.value = withTiming(PACK_WIDTH * 2, { duration: config.shimmerSpeed });
            }

            // R6 STYLE: Lueur de rareté qui s'intensifie à partir de 40%
            if (progress > 0.4 && spoilerRarity) {
                rarityGlowIntensity.value = interpolate(progress, [0.4, 0.7], [0, 1]);
            }

            // Déclencher glow à partir de 50% (toutes les raretés spéciales)
            if (progress > 0.5) {
                const isSpecialRarity = spoilerRarity && ['epic', 'legendary', 'mythic'].includes(spoilerRarity);
                glowScale.value = withTiming(isSpecialRarity ? 1.12 : 1.08, { duration: 300 });
            }
        })
        .onEnd(() => {
            if (tearProgress.value > 0.7 && !isOpening) {
                runOnJS(setIsOpening)(true);
                tearProgress.value = withTiming(1, { duration: 200 });
                runOnJS(setOpened)(true);
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);

                // R6 STYLE: Rim-light effect (bords seulement, pas flash plein écran)
                flashOpacity.value = withSequence(
                    withTiming(0.7, { duration: 80 }),  // Plus subtil
                    withTiming(0, { duration: 250 })
                );

                // Glow burst pour Elite
                if (tier === 'elite') {
                    glowScale.value = withSequence(
                        withSpring(1.3, { damping: 5 }),
                        withTiming(1, { duration: 200 })
                    );
                }

                // Opening sequence sobre (moins de bounce)
                packOpenScale.value = withSequence(
                    withSpring(1.08, { damping: 10 }),  // Moins exagéré
                    withTiming(1.02, { duration: 100 }),
                    withSpring(1.05, { damping: 12 })
                );
                packOpacity.value = withTiming(0, { duration: 350 }, () => {
                    runOnJS(onOpen)();
                });
            } else {
                tearProgress.value = withSpring(0);
                shake.value = withTiming(0, { duration: 200 });
                lastMilestone.value = 0; // Reset milestones
                shimmerX.value = -PACK_WIDTH; // Reset shimmer
                if (tier === 'elite') {
                    glowScale.value = withTiming(1, { duration: 200 });
                }
            }
        });

    const topPieceStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(tearProgress.value, [0, 1], [0, PACK_WIDTH], Extrapolate.CLAMP) },
            { rotate: `${interpolate(tearProgress.value, [0, 1], [0, 20])}deg` },
            { translateY: interpolate(tearProgress.value, [0.5, 1], [0, -30]) }
        ],
        opacity: interpolate(tearProgress.value, [0.8, 1], [1, 0])
    }));

    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: packOpenScale.value },
            { translateY: floatY.value },
            { rotate: `${floatRotate.value}deg` },
            { translateX: shake.value * (Math.random() > 0.5 ? 1 : -1) }
        ],
        opacity: packOpacity.value
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerX.value }]
    }));

    // R6 STYLE: La lueur change de couleur selon la rareté spoilée
    const glowStyle = useAnimatedStyle(() => {
        // Interpoler la couleur entre la couleur du tier et celle de la rareté
        const glowColor = spoilerRarity
            ? interpolateColor(
                tearProgress.value,
                [0, 0.4, 0.6],
                [config.glowColor, config.glowColor, spoilerGlowColor]
            )
            : config.glowColor;

        // Intensité de la lueur basée sur la rareté
        const baseOpacity = tier === 'elite' ? 0.6 : 0.3;
        const rarityBoost = spoilerRarity && ['legendary', 'mythic'].includes(spoilerRarity) ? 0.3 : 0;
        const intensityMultiplier = interpolate(tearProgress.value, [0, 0.5, 0.7], [1, 1.2, 1.5]);

        return {
            transform: [{ scale: glowScale.value }],
            opacity: (baseOpacity + rarityBoost) * intensityMultiplier,
            backgroundColor: glowColor,
        };
    });

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
        // R6 STYLE: Flash de la couleur de rareté à l'ouverture
        backgroundColor: spoilerRarity ? spoilerGlowColor : 'white',
    }));

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.container, containerStyle]}>
                {/* Glow effect behind pack - R6 style with rarity color */}
                <Animated.View style={[styles.glowEffect, glowStyle]} />

                {/* R6 STYLE: Effet de déchirure avec lueur */}
                <PackTearEffect
                    tearProgress={tearProgress}
                    glowColor={spoilerGlowColor}
                    width={PACK_WIDTH}
                    height={PACK_HEIGHT}
                />

                {/* Main Body of the Pack */}
                <View style={styles.packBody}>
                    <LinearGradient
                        colors={config.colors as any}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Shimmer overlay */}
                        <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.shimmerGradient}
                            />
                        </Animated.View>

                        <View style={styles.packContent}>
                            <Ionicons name={config.icon as any} size={64} color="white" style={styles.icon} />
                            <Text style={styles.label}>{config.label}</Text>
                            <Text style={styles.subLabel}>BOOSTER PACK</Text>

                            <View style={styles.ripHint}>
                                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.ripText}>GLISSER POUR DÉCHIRER</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Tear Strip */}
                <Animated.View style={[styles.tearStrip, topPieceStyle]}>
                    <LinearGradient
                        colors={[config.colors[0], '#ffffff', config.colors[0]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.stripGradient}
                    >
                        <View style={styles.serratedEdge} />
                    </LinearGradient>
                </Animated.View>

                {/* Flash overlay on open */}
                <Animated.View style={[styles.flashOverlay, flashStyle]} />
            </Animated.View>
        </GestureDetector>
    );
});

const styles = StyleSheet.create({
    container: {
        width: PACK_WIDTH,
        height: PACK_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    packBody: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    gradient: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packContent: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
    },
    label: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
        fontStyle: 'italic',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 4,
        marginTop: 5,
    },
    ripHint: {
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ripText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    tearStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40, // Height of the tear strip
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    stripGradient: {
        flex: 1,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        justifyContent: 'flex-end',
    },
    serratedEdge: {
        height: 4,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.2)',
    },
    // NEW: Enhanced animation styles
    glowEffect: {
        position: 'absolute',
        width: PACK_WIDTH * 1.3,
        height: PACK_HEIGHT * 1.3,
        borderRadius: 30,
        zIndex: -1,
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: PACK_WIDTH,
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
    },
    shimmerGradient: {
        width: PACK_WIDTH * 0.5,
        height: '100%',
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        // backgroundColor est maintenant défini dynamiquement via flashStyle (couleur de rareté)
        borderRadius: 12,
        zIndex: 100,
        pointerEvents: 'none',
    },
});
