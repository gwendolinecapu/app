import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, Dimensions, SafeAreaView , Platform } from 'react-native';
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
    FadeInDown,
    FadeInUp,
    Easing,
    cancelAnimation,
    interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import BoosterPack from './BoosterPack';
import CardReveal from './CardReveal';
import SummaryGrid from './SummaryGrid';
import LootBoxService, { PackResult, CardResult } from '../../services/LootBoxService';
import { LootBoxTier, Rarity } from '../../services/MonetizationTypes';
import { useMonetization } from '../../contexts/MonetizationContext';

interface LootBoxOpeningProps {
    visible: boolean;
    tier: LootBoxTier;
    packCount?: number;  // Nombre de packs à ouvrir (default: 1)
    onClose: () => void;
}

// Phases du flow multi-packs
type OpeningPhase = 'count' | 'opening' | 'cards' | 'summary';

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
        rayColors: ['rgba(156, 163, 175, 0.15)', 'transparent'],
        particleCount: 5,
    },
    standard: {
        primaryColor: '#60A5FA',
        secondaryColor: '#2563EB',
        rayColors: ['rgba(96, 165, 250, 0.2)', 'transparent'],
        particleCount: 8,
    },
    elite: {
        primaryColor: '#FCD34D',
        secondaryColor: '#D97706',
        rayColors: ['rgba(252, 211, 77, 0.25)', 'transparent'],
        particleCount: 15,
    },
};

// Helper: Extraire la meilleure rareté d'un pack
const getBestRarity = (cards: CardResult[]): Rarity => {
    return cards.reduce((best, card) => {
        const bestVal = LootBoxService.getRarityValue(best);
        const cardVal = LootBoxService.getRarityValue(card.item.rarity || 'common');
        return cardVal > bestVal ? (card.item.rarity || 'common') : best;
    }, 'common' as Rarity);
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

// Composant pour l'écran de comptage initial
const PackCountScreen = React.memo(({
    packCount,
    tier,
    theme,
    onStart,
}: {
    packCount: number;
    tier: LootBoxTier;
    theme: typeof TIER_THEME.basic;
    onStart: () => void;
}) => {
    return (
        <Animated.View entering={FadeIn} style={styles.countScreen}>
            {/* Packs empilés visuellement */}
            <View style={styles.stackedPacks}>
                {Array.from({ length: Math.min(packCount, 5) }).map((_, i) => (
                    <Animated.View
                        key={i}
                        entering={FadeInDown.delay(i * 100).springify()}
                        style={[
                            styles.stackedPackItem,
                            {
                                transform: [
                                    { translateY: -i * 8 },
                                    { rotate: `${(i - 2) * 3}deg` },
                                ],
                                zIndex: 5 - i,
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={TIER_THEME[tier].rayColors as any}
                            style={styles.stackedPackGradient}
                        >
                            <Ionicons name="cube" size={40} color={theme.primaryColor} />
                        </LinearGradient>
                    </Animated.View>
                ))}
            </View>

            {/* Nombre de packs */}
            <Animated.Text
                entering={FadeInUp.delay(300).springify()}
                style={[styles.packCountText, { color: theme.primaryColor }]}
            >
                {packCount} PACK{packCount > 1 ? 'S' : ''}
            </Animated.Text>

            <Animated.Text
                entering={FadeInUp.delay(400).springify()}
                style={styles.packCountSubtext}
            >
                Prêt à ouvrir
            </Animated.Text>

            {/* Bouton démarrer */}
            <Animated.View entering={FadeInUp.delay(500).springify()}>
                <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: theme.primaryColor }]}
                    onPress={onStart}
                >
                    <Text style={[styles.startButtonText, { color: tier === 'elite' ? '#000' : '#FFF' }]}>
                        COMMENCER
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={tier === 'elite' ? '#000' : '#FFF'} />
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
});

export default function LootBoxOpening({ visible, tier, packCount = 1, onClose }: LootBoxOpeningProps) {
    const { ownedItems, addToInventory, addDust } = useMonetization();
    const theme = TIER_THEME[tier];

    // État multi-packs
    const [phase, setPhase] = useState<OpeningPhase>('count');
    const [currentPackIndex, setCurrentPackIndex] = useState(0);
    const [allResults, setAllResults] = useState<PackResult[]>([]);
    const [cardsRevealedCount, setCardsRevealedCount] = useState(0);
    const [showParticles, setShowParticles] = useState(false);
    const [rewardsSaved, setRewardsSaved] = useState(false);

    const phaseTransitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pack actuel et sa meilleure rareté (pour la lueur R6)
    const currentResult = allResults[currentPackIndex];
    const currentBestRarity = useMemo(() => {
        if (!currentResult) return undefined;
        return getBestRarity(currentResult.cards);
    }, [currentResult]);

    // Animation values
    const backgroundOpacity = useSharedValue(0);
    const rayScale = useSharedValue(0);
    const burstScale = useSharedValue(0);
    const packSlideX = useSharedValue(0);

    // Generate particles for burst effect
    const particles = useMemo(() => {
        return Array.from({ length: theme.particleCount }, (_, i) => ({
            angle: (Math.PI * 2 / theme.particleCount) * i + Math.random() * 0.5,
            delay: Math.random() * 100,
            distance: 100 + Math.random() * 150,
            color: Math.random() > 0.5 ? theme.primaryColor : theme.secondaryColor,
        }));
    }, [tier]);

    // Pré-générer tous les packs à l'ouverture
    useEffect(() => {
        if (visible && packCount > 0) {
            // Reset state
            setPhase(packCount > 1 ? 'count' : 'opening');
            setCurrentPackIndex(0);
            setCardsRevealedCount(0);
            setShowParticles(false);
            setRewardsSaved(false);
            packSlideX.value = 0;

            // Pré-générer tous les résultats
            const results: PackResult[] = [];
            let currentOwnedItems = [...ownedItems];

            for (let i = 0; i < packCount; i++) {
                const result = LootBoxService.openPack(tier, currentOwnedItems);
                results.push(result);
                // Ajouter les nouveaux items à la liste pour éviter les doublons inter-packs
                result.cards.forEach(card => {
                    if (card.isNew) {
                        currentOwnedItems.push(card.item.id);
                    }
                });
            }
            setAllResults(results);

            // Animate background elements in
            backgroundOpacity.value = withTiming(1, { duration: 500 });
            rayScale.value = withDelay(200, withSpring(1, { damping: 12 }));
        } else {
            backgroundOpacity.value = 0;
            rayScale.value = 0;
            burstScale.value = 0;
        }
    }, [visible, packCount, tier, ownedItems]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (phaseTransitionTimeoutRef.current) {
                clearTimeout(phaseTransitionTimeoutRef.current);
            }
            cancelAnimation(backgroundOpacity);
            cancelAnimation(rayScale);
            cancelAnimation(burstScale);
            cancelAnimation(packSlideX);
        };
    }, []);

    // Sauvegarder tous les rewards
    const saveAllRewards = useCallback(async () => {
        if (rewardsSaved) return;
        setRewardsSaved(true);

        for (const result of allResults) {
            for (const card of result.cards) {
                if (card.isNew) {
                    await addToInventory(card.item.id, card.isShiny);
                }
            }
            if (result.totalDust > 0) {
                await addDust(result.totalDust);
            }
        }
    }, [allResults, addToInventory, addDust, rewardsSaved]);

    // Démarrer l'ouverture (depuis l'écran de comptage)
    const handleStart = useCallback(() => {
        setPhase('opening');
    }, []);

    // Quand un pack est ouvert
    const handlePackOpen = useCallback(() => {
        // Trigger burst effect
        setShowParticles(true);
        burstScale.value = withSequence(
            withSpring(1.5, { damping: 8 }),
            withTiming(0, { duration: 300 })
        );

        // Enhanced haptics
        if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
        }

        // Transition to Cards phase with delay for burst animation
        phaseTransitionTimeoutRef.current = setTimeout(() => {
            setPhase('cards');
            setShowParticles(false);
            setCardsRevealedCount(0);
        }, 500);
    }, []);

    // Quand une carte est retournée
    const handleCardFlip = useCallback(() => {
        setCardsRevealedCount(prev => prev + 1);
    }, []);

    // Passer au pack suivant
    const handleNextPack = useCallback(() => {
        if (currentPackIndex < packCount - 1) {
            // Animation de slide
            packSlideX.value = withTiming(-width, { duration: 300 }, () => {
                runOnJS(setCurrentPackIndex)(currentPackIndex + 1);
                runOnJS(setCardsRevealedCount)(0);
                runOnJS(setPhase)('opening');
                packSlideX.value = 0;
            });
        } else {
            // Dernier pack, aller au récap
            saveAllRewards();
            setPhase('summary');
        }
    }, [currentPackIndex, packCount, saveAllRewards]);

    // Skip tout et aller au récap
    const handleSkipAll = useCallback(() => {
        saveAllRewards();
        setPhase('summary');
    }, [saveAllRewards]);

    // Fermer le modal
    const handleFinish = useCallback(() => {
        saveAllRewards();
        onClose();
    }, [saveAllRewards, onClose]);

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

    const packContainerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: packSlideX.value }],
    }));

    if (!visible) return null;

    const allCardsRevealed = currentResult && cardsRevealedCount >= currentResult.cards.length;
    const isLastPack = currentPackIndex >= packCount - 1;

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
                    {/* Header / Controls */}
                    <View style={styles.headerControls}>
                        {/* Compteur de packs */}
                        {packCount > 1 && phase !== 'count' && phase !== 'summary' && (
                            <View style={styles.packCounter}>
                                <Text style={styles.packCounterText}>
                                    Pack {currentPackIndex + 1}/{packCount}
                                </Text>
                            </View>
                        )}

                        {/* Bouton Skip All */}
                        {phase !== 'summary' && phase !== 'count' && (
                            <TouchableOpacity
                                style={styles.skipAllButton}
                                onPress={handleSkipAll}
                            >
                                <Ionicons name="play-forward" size={14} color="#FFF" />
                                <Text style={styles.skipAllText}>SKIP TOUT</Text>
                            </TouchableOpacity>
                        )}

                        {/* Bouton Close */}
                        {phase !== 'opening' && (
                            <TouchableOpacity style={styles.closeButton} onPress={handleFinish}>
                                <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* PHASE: PACK COUNT (multi-packs) */}
                    {phase === 'count' && (
                        <PackCountScreen
                            packCount={packCount}
                            tier={tier}
                            theme={theme}
                            onStart={handleStart}
                        />
                    )}

                    {/* PHASE: PACK OPENING */}
                    {phase === 'opening' && (
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={[styles.centerContent, packContainerStyle]}
                        >
                            <Text style={[styles.instructionText, { color: theme.primaryColor }]}>
                                GLISSEZ POUR OUVRIR
                            </Text>
                            <BoosterPack
                                tier={tier}
                                onOpen={handlePackOpen}
                                spoilerRarity={currentBestRarity}
                            />
                        </Animated.View>
                    )}

                    {/* PHASE: CARDS REVEAL */}
                    {phase === 'cards' && currentResult && (
                        <Animated.View entering={FadeIn.delay(300)} style={styles.cardsContainer}>
                            {/* Progress indicator */}
                            <View style={styles.progressContainer}>
                                {currentResult.cards.map((_, i) => (
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
                                {allCardsRevealed
                                    ? `🎉 ${currentResult.cards.length} OBJETS OBTENUS !`
                                    : `TOUCHEZ POUR RÉVÉLER (${cardsRevealedCount + 1}/${currentResult.cards.length})`
                                }
                            </Text>

                            {/* Single card display - Centered */}
                            <View style={styles.singleCardContainer}>
                                {currentResult.cards.map((card, index) => (
                                    <View
                                        key={`${card.item.id}-${index}`}
                                        style={[
                                            styles.cardWrapper,
                                            index !== cardsRevealedCount && styles.hiddenCard
                                        ]}
                                    >
                                        <CardReveal
                                            item={card.item}
                                            isNew={card.isNew}
                                            dustValue={card.dustValue}
                                            delay={0}
                                            onFlip={handleCardFlip}
                                            autoFlip={index === 0}
                                            isActive={index === cardsRevealedCount}
                                        />
                                    </View>
                                ))}
                            </View>

                            {/* Actions après révélation de toutes les cartes */}
                            {allCardsRevealed && (
                                <Animated.View entering={FadeIn.delay(500)} style={styles.footer}>
                                    {currentResult.totalDust > 0 && (
                                        <View style={styles.dustSummary}>
                                            <Ionicons name="flash" size={16} color="#FCD34D" />
                                            <Text style={styles.dustSummaryText}>+{currentResult.totalDust} Poussière</Text>
                                        </View>
                                    )}

                                    {/* Bouton suivant ou récap */}
                                    <TouchableOpacity
                                        style={[styles.finishButton, { backgroundColor: theme.primaryColor }]}
                                        onPress={handleNextPack}
                                    >
                                        <Text style={[styles.finishButtonText, { color: tier === 'elite' ? '#000' : '#FFF' }]}>
                                            {isLastPack
                                                ? (packCount > 1 ? 'VOIR LE RÉCAP' : 'TOUT RÉCUPÉRER ✨')
                                                : `PACK SUIVANT (${currentPackIndex + 2}/${packCount})`
                                            }
                                        </Text>
                                        {!isLastPack && (
                                            <Ionicons
                                                name="arrow-forward"
                                                size={18}
                                                color={tier === 'elite' ? '#000' : '#FFF'}
                                                style={{ marginLeft: 8 }}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </Animated.View>
                    )}

                    {/* PHASE: SUMMARY (récap final) */}
                    {phase === 'summary' && allResults.length > 0 && (
                        <Animated.View entering={FadeIn} style={styles.summaryContainer}>
                            <SummaryGrid
                                allResults={allResults}
                                onClose={handleFinish}
                            />
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
    headerControls: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 50,
        gap: 12,
    },
    packCounter: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 'auto',
    },
    packCounterText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    skipAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    skipAllText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    closeButton: {
        marginLeft: 4,
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 30,
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
    // Animation styles
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
    // Card reveal styles
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
    // Pack count screen styles
    countScreen: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    stackedPacks: {
        height: 150,
        width: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    stackedPackItem: {
        position: 'absolute',
        width: 100,
        height: 140,
        borderRadius: 12,
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    stackedPackGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packCountText: {
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    packCountSubtext: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 8,
        marginBottom: 40,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    // Summary container
    summaryContainer: {
        flex: 1,
        width: '100%',
        paddingTop: 60,
    },
});
