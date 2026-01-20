import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withSpring,
    withDelay,
    runOnJS,
    FadeIn,
    FadeOut,
    Easing,
    cancelAnimation,
    interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import BoosterPack from './BoosterPack';
import CardReveal from './CardReveal';
import LootBoxService, { PackResult } from '../../services/LootBoxService';
import { LootBoxTier } from '../../services/MonetizationTypes';
import { useMonetization } from '../../contexts/MonetizationContext';

interface LootBoxOpeningProps {
    visible: boolean;
    tier: LootBoxTier;
    onClose: () => void;
}

const { width, height } = Dimensions.get('window');

// Tier-based theme configuration
const TIER_THEME: Record<LootBoxTier, {
    primaryColor: string;
    secondaryColor: string;
    rayColors: string[];
    particleCount: number;
}> = {
    basic: {
        primaryColor: '#9CA3AF',
        secondaryColor: '#4B5563',
        rayColors: ['rgba(156, 163, 175, 0.3)', 'transparent'],
        particleCount: 8,
    },
    standard: {
        primaryColor: '#60A5FA',
        secondaryColor: '#2563EB',
        rayColors: ['rgba(96, 165, 250, 0.4)', 'transparent'],
        particleCount: 12,
    },
    elite: {
        primaryColor: '#FCD34D',
        secondaryColor: '#D97706',
        rayColors: ['rgba(252, 211, 77, 0.5)', 'transparent'],
        particleCount: 20,
    },
};

// Animated particle component for burst effect
const Particle = React.memo(({
    delay,
    angle,
    color,
    distance
}: {
    delay: number;
    angle: number;
    color: string;
    distance: number;
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
        const scale = interpolate(progress.value, [0, 0.5, 1], [0, 1.2, 0.5]);

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
        <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />
    );
});

// Animated ray component for background
const AnimatedRay = React.memo(({
    index,
    totalRays,
    color
}: {
    index: number;
    totalRays: number;
    color: string;
}) => {
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 2000 }),
                withTiming(0.2, { duration: 2000 })
            ),
            -1,
            true
        );

        return () => {
            cancelAnimation(rotation);
            cancelAnimation(opacity);
        };
    }, []);

    const baseAngle = (360 / totalRays) * index;

    const style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${baseAngle + rotation.value}deg` }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.ray, style]}>
            <LinearGradient
                colors={[color, 'transparent']}
                style={styles.rayGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
        </Animated.View>
    );
});

export default function LootBoxOpening({ visible, tier, onClose }: LootBoxOpeningProps) {
    const { ownedItems, addToInventory, addDust } = useMonetization();
    const theme = TIER_THEME[tier];

    const [phase, setPhase] = useState<'pack' | 'cards' | 'summary'>('pack');
    const [result, setResult] = useState<PackResult | null>(null);
    const [cardsRevealedCount, setCardsRevealedCount] = useState(0);
    const [showParticles, setShowParticles] = useState(false);
    const phaseTransitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animation values
    const backgroundOpacity = useSharedValue(0);
    const rayScale = useSharedValue(0);
    const burstScale = useSharedValue(0);

    // Generate particles for burst effect
    const particles = useMemo(() => {
        return Array.from({ length: theme.particleCount }, (_, i) => ({
            angle: (Math.PI * 2 / theme.particleCount) * i + Math.random() * 0.5,
            delay: Math.random() * 100,
            distance: 100 + Math.random() * 150,
            color: Math.random() > 0.5 ? theme.primaryColor : theme.secondaryColor,
        }));
    }, [tier]);

    // Reset when opening
    useEffect(() => {
        if (visible) {
            setPhase('pack');
            setResult(null);
            setCardsRevealedCount(0);
            setShowParticles(false);

            // Animate background elements in
            backgroundOpacity.value = withTiming(1, { duration: 500 });
            rayScale.value = withDelay(200, withSpring(1, { damping: 12 }));
        } else {
            backgroundOpacity.value = 0;
            rayScale.value = 0;
            burstScale.value = 0;
        }
    }, [visible]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (phaseTransitionTimeoutRef.current) {
                clearTimeout(phaseTransitionTimeoutRef.current);
            }
            cancelAnimation(backgroundOpacity);
            cancelAnimation(rayScale);
            cancelAnimation(burstScale);
        };
    }, []);

    const handlePackOpen = useCallback(() => {
        const packResult = LootBoxService.openPack(tier, ownedItems);
        setResult(packResult);

        // Trigger burst effect
        setShowParticles(true);
        burstScale.value = withSequence(
            withSpring(1.5, { damping: 8 }),
            withTiming(0, { duration: 300 })
        );

        // Enhanced haptics
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Persist rewards
        const saveRewards = async () => {
            for (const card of packResult.cards) {
                if (card.isNew) {
                    await addToInventory(card.item.id);
                }
            }
            if (packResult.totalDust > 0) {
                await addDust(packResult.totalDust);
            }
        };
        saveRewards();

        // Transition to Cards phase with delay for burst animation
        phaseTransitionTimeoutRef.current = setTimeout(() => {
            setPhase('cards');
            setShowParticles(false);
        }, 800);
    }, [tier, ownedItems, addToInventory, addDust]);

    const handleCardFlip = () => {
        setCardsRevealedCount(prev => prev + 1);
    };

    const handleFinish = () => {
        onClose();
    };

    const backgroundStyle = useAnimatedStyle(() => ({
        opacity: backgroundOpacity.value,
    }));

    const raysContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rayScale.value }],
    }));

    const burstStyle = useAnimatedStyle(() => ({
        transform: [{ scale: burstScale.value }],
        opacity: interpolate(burstScale.value, [0, 1, 1.5], [0, 1, 0]),
    }));

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <BlurView intensity={90} tint="dark" style={styles.absoluteFill}>

                {/* Animated Background Rays */}
                <Animated.View style={[styles.raysContainer, backgroundStyle, raysContainerStyle]}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <AnimatedRay
                            key={i}
                            index={i}
                            totalRays={12}
                            color={theme.rayColors[0]}
                        />
                    ))}
                </Animated.View>

                {/* Burst Effect */}
                {showParticles && (
                    <Animated.View style={[styles.burstContainer, burstStyle]}>
                        {particles.map((p, i) => (
                            <Particle
                                key={i}
                                angle={p.angle}
                                delay={p.delay}
                                distance={p.distance}
                                color={p.color}
                            />
                        ))}
                    </Animated.View>
                )}

                <SafeAreaView style={styles.container}>
                    {/* Header / Close */}
                    {phase !== 'pack' && (
                        <TouchableOpacity style={styles.closeButton} onPress={handleFinish}>
                            <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    )}

                    {/* PHASE 1: BOOSTER PACK */}
                    {phase === 'pack' && (
                        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.centerContent}>
                            <Text style={[styles.instructionText, { color: theme.primaryColor }]}>
                                GLISSEZ POUR OUVRIR
                            </Text>
                            <BoosterPack tier={tier} onOpen={handlePackOpen} />
                        </Animated.View>
                    )}

                    {/* PHASE 2: CARDS REVEAL - Supercell Style */}
                    {phase === 'cards' && result && (
                        <Animated.View entering={FadeIn.delay(300)} style={styles.cardsContainer}>
                            {/* Progress indicator */}
                            <View style={styles.progressContainer}>
                                {result.cards.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.progressDot,
                                            i < cardsRevealedCount && styles.progressDotRevealed,
                                            i === cardsRevealedCount && styles.progressDotActive,
                                        ]}
                                    />
                                ))}
                            </View>

                            <Text style={[styles.congratsText, { textShadowColor: theme.primaryColor }]}>
                                {cardsRevealedCount === result.cards.length
                                    ? `🎉 ${result.cards.length} OBJETS OBTENUS !`
                                    : `TOUCHEZ POUR RÉVÉLER (${cardsRevealedCount + 1}/${result.cards.length})`
                                }
                            </Text>

                            {/* Single card display - Centered */}
                            <View style={styles.singleCardContainer}>
                                {result.cards.map((card, index) => (
                                    <View
                                        key={`${card.item.id}-${index}`}
                                        style={[
                                            styles.cardWrapper,
                                            // Hide cards that aren't the current one
                                            index !== cardsRevealedCount && styles.hiddenCard
                                        ]}
                                    >
                                        <CardReveal
                                            item={card.item}
                                            isNew={card.isNew}
                                            dustValue={card.dustValue}
                                            delay={0} // No stagger, show immediately
                                            onFlip={handleCardFlip}
                                            autoFlip={index === 0} // First card auto-flips
                                            isActive={index === cardsRevealedCount}
                                        />
                                    </View>
                                ))}
                            </View>

                            {/* Summary / Continue Button - Only show when all revealed */}
                            {cardsRevealedCount >= result.cards.length && (
                                <Animated.View entering={FadeIn.delay(500)} style={styles.footer}>
                                    {result.totalDust > 0 && (
                                        <View style={styles.dustSummary}>
                                            <Ionicons name="flash" size={16} color="#FCD34D" />
                                            <Text style={styles.dustSummaryText}>+{result.totalDust} Poussière</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.finishButton, { backgroundColor: theme.primaryColor }]}
                                        onPress={handleFinish}
                                    >
                                        <Text style={[styles.finishButtonText, { color: tier === 'elite' ? '#000' : '#FFF' }]}>
                                            TOUT RÉCUPÉRER ✨
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </Animated.View>
                    )}

                </SafeAreaView>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 50,
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 30,
        letterSpacing: 2,
        opacity: 0.8,
    },
    cardsContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    congratsText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    cardsScroll: {
        alignItems: 'center',
        paddingHorizontal: width * 0.15, // Center first card
        paddingBottom: 20,
    },
    cardWrapper: {
        marginHorizontal: 10,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
        width: '100%',
    },
    dustSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.5)',
    },
    dustSummaryText: {
        color: '#FCD34D',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    finishButton: {
        backgroundColor: 'white',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    finishButtonText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
    // NEW: Animation styles
    raysContainer: {
        position: 'absolute',
        width: width * 2,
        height: height * 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ray: {
        position: 'absolute',
        width: 20,
        height: height * 1.5,
        transformOrigin: 'center bottom',
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
    particle: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    // NEW: Supercell-style card reveal
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        gap: 8,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressDotRevealed: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    progressDotActive: {
        backgroundColor: '#FCD34D',
        transform: [{ scale: 1.3 }],
    },
    singleCardContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    hiddenCard: {
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none',
    },
});
