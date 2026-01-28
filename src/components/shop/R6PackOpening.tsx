import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withSpring,
    withDelay,
    FadeIn,
    FadeOut,
    FadeInUp,
    Easing,
    cancelAnimation,
    SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// ...

// Gesture for swipe
const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-10, 10]) // Ignore vertical scrolls if any
    .onEnd((e) => {
        if (e.translationX < -50) {
            // Swipe Left -> Next
            runOnJS(handleNextCard)();
        }
    }), [handleNextCard]);

// ...

{/* PHASE: REVEALING - Révélation des cartes */ }
{
    phase === 'revealing' && currentCard && (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                key={`${currentPackIndex}-${currentCardIndex}`}
                entering={SlideInRight.springify()}
                style={styles.revealContainer}
            >
                <R6ItemReveal
                    item={currentCard.item}
                    isNew={currentCard.isNew}
                    isShiny={currentCard.isShiny}
                    dustValue={currentCard.dustValue}
                />

                {/* Indicateur de progression */}
                import SummaryGrid from './SummaryGrid';
                import LootBoxService, {PackResult, CardResult} from '../../services/LootBoxService';
                import {LootBoxTier, Rarity} from '../../services/MonetizationTypes';
                import {useMonetization} from '../../contexts/MonetizationContext';

                interface R6PackOpeningProps {
                    visible: boolean;
                tier: LootBoxTier;
                packCount?: number;
    onClose: () => void;
}

                type OpeningPhase = 'idle' | 'revealing' | 'summary';

                const {width, height} = Dimensions.get('window');

                // Configuration des tiers
                const TIER_CONFIG: Record<LootBoxTier, {
                    name: string;
                primaryColor: string;
                secondaryColor: string;
                bgGradient: string[];
}> = {
                    basic: {
                    name: 'BASIC',
                primaryColor: '#9CA3AF',
                secondaryColor: '#4B5563',
                bgGradient: ['#0F0F0F', '#1A1A1A', '#0F0F0F'],
    },
                standard: {
                    name: 'STANDARD',
                primaryColor: '#60A5FA',
                secondaryColor: '#2563EB',
                bgGradient: ['#0A0F1A', '#0F1A2E', '#0A0F1A'],
    },
                elite: {
                    name: 'ELITE',
                primaryColor: '#FCD34D',
                secondaryColor: '#D97706',
                bgGradient: ['#1A150A', '#451a03', '#000000'],
    },
};

// Helper pour la meilleure rareté
const getBestRarity = (cards: CardResult[]): Rarity => {
    return cards.reduce((best, card) => {
        const bestVal = LootBoxService.getRarityValue(best);
                const cardVal = LootBoxService.getRarityValue(card.item.rarity || 'common');
        return cardVal > bestVal ? (card.item.rarity || 'common') : best;
    }, 'common' as Rarity);
};

                // Particule de fond flottante
                const BackgroundParticle = React.memo(({
                    delay,
                    x,
                    color,
}: {
                    delay: number;
                x: number;
                color: string;
}) => {
    const translateY = useSharedValue(height + 20);
                const opacity = useSharedValue(0);

    useEffect(() => {
        const animate = () => {
                    translateY.value = height + 20;
                opacity.value = 0;

                translateY.value = withDelay(delay, withTiming(-20, {duration: 8000, easing: Easing.linear }));
                opacity.value = withDelay(delay, withSequence(
                withTiming(0.4, {duration: 1000 }),
                withDelay(5000, withTiming(0, {duration: 2000 }))
                ));
        };

                animate();
                const interval = setInterval(animate, 8000 + delay);

        return () => {
                    clearInterval(interval);
                cancelAnimation(translateY);
                cancelAnimation(opacity);
        };
    }, []);

    const style = useAnimatedStyle(() => ({
                    transform: [{translateY: translateY.value }],
                opacity: opacity.value,
                left: x,
    }));

                return (
                <Animated.View style={[styles.bgParticle, { backgroundColor: color }, style]} />
                );
});

                export default function R6PackOpening({visible, tier, packCount = 1, onClose}: R6PackOpeningProps) {
    const {ownedItems, addToInventory, addDust} = useMonetization();
                const config = TIER_CONFIG[tier];

                // États
                const [phase, setPhase] = useState<OpeningPhase>('idle');
                    const [currentPackIndex, setCurrentPackIndex] = useState(0);
                    const [currentCardIndex, setCurrentCardIndex] = useState(0);
                    const [allResults, setAllResults] = useState<PackResult[]>([]);
                    const [rewardsSaved, setRewardsSaved] = useState(false);

                    // Animation values
                    const bgOpacity = useSharedValue(0);
                    const contentScale = useSharedValue(0.8);

                    // Pack et cartes actuels
                    const currentResult = allResults[currentPackIndex];
                    const currentCard = currentResult?.cards[currentCardIndex];
    const currentBestRarity = useMemo(() => {
        if (!currentResult) return undefined;
                    return getBestRarity(currentResult.cards);
    }, [currentResult]);

    // Particules de fond
    const bgParticles = useMemo(() =>
                    Array.from({length: 20 }, (_, i) => ({
                        x: Math.random() * width,
                    delay: Math.random() * 5000,
                    color: i % 2 === 0 ? config.primaryColor : 'rgba(255,255,255,0.3)',
        })), [tier]);

    // Initialisation
    useEffect(() => {
        if (visible && packCount > 0) {
                        // Reset
                        setPhase('idle');
                    setCurrentPackIndex(0);
                    setCurrentCardIndex(0);
                    setRewardsSaved(false);

                    // Pré-générer les résultats
                    const results: PackResult[] = [];
                    let currentOwnedItems = [...ownedItems];

                    for (let i = 0; i < packCount; i++) {
                const result = LootBoxService.openPack(tier, currentOwnedItems);
                    results.push(result);
                result.cards.forEach(card => {
                    if (card.isNew) {
                        currentOwnedItems.push(card.item.id);
                    }
                });
            }
                    setAllResults(results);

                    // Animation d'entrée
                    bgOpacity.value = withTiming(1, {duration: 500 });
                    contentScale.value = withTiming(1, {duration: 400, easing: Easing.out(Easing.cubic) });
        } else {
                        bgOpacity.value = 0;
                    contentScale.value = 0.8;
        }
    }, [visible, packCount, tier]);

    // Cleanup
    useEffect(() => {
        return () => {
                        cancelAnimation(bgOpacity);
                    cancelAnimation(contentScale);
        };
    }, []);

    // Sauvegarder les récompenses
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

    // Ouverture du pack
    const handlePackOpen = useCallback(() => {
                        setPhase('revealing');
                    setCurrentCardIndex(0);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    // Passage à la carte suivante ou au pack suivant
    const handleNextCard = useCallback(() => {
        if (!currentResult) return;

                    if (currentCardIndex < currentResult.cards.length - 1) {
                        // Carte suivante
                        setCurrentCardIndex(prev => prev + 1);
        } else if (currentPackIndex < packCount - 1) {
                        // Pack suivant
                        setCurrentPackIndex(prev => prev + 1);
                    setCurrentCardIndex(0);
                    setPhase('idle');
        } else {
                        // Fin - aller au récap
                        saveAllRewards();
                    setPhase('summary');
        }
    }, [currentResult, currentCardIndex, currentPackIndex, packCount, saveAllRewards]);

    // Skip all
    const handleSkipAll = useCallback(() => {
                        saveAllRewards();
                    setPhase('summary');
    }, [saveAllRewards]);

    // Fermer
    const handleClose = useCallback(() => {
                        saveAllRewards();
                    onClose();
    }, [saveAllRewards, onClose]);

    const bgStyle = useAnimatedStyle(() => ({
                        opacity: bgOpacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
                        transform: [{scale: contentScale.value }],
    }));

                    if (!visible) return null;

    const isLastCard = currentResult && currentCardIndex >= currentResult.cards.length - 1;
    const isLastPack = currentPackIndex >= packCount - 1;

                    return (
                    <Modal transparent animationType="fade" visible={visible}>
                        <Animated.View style={[styles.container, bgStyle]}>
                            {/* Fond gradient sombre */}
                            <LinearGradient
                                colors={config.bgGradient as any}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                            />

                            {/* Particules de fond */}
                            {bgParticles.map((p, i) => (
                                <BackgroundParticle key={i} x={p.x} delay={p.delay} color={p.color} />
                            ))}

                            {/* Vignette overlay */}
                            <View style={styles.vignette} />

                            <SafeAreaView style={styles.safeArea}>
                                {/* Header */}
                                <View style={styles.header}>
                                    {/* Compteur de packs */}
                                    {packCount > 1 && phase !== 'summary' && (
                                        <View style={[styles.packCounter, { borderColor: config.primaryColor }]}>
                                            <Ionicons name="cube" size={14} color={config.primaryColor} />
                                            <Text style={[styles.packCounterText, { color: config.primaryColor }]}>
                                                {currentPackIndex + 1}/{packCount}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Tier badge */}
                                    <View style={[styles.tierBadge, { backgroundColor: config.primaryColor }]}>
                                        <Text style={styles.tierText}>{config.name}</Text>
                                    </View>

                                    {/* Skip button */}
                                    {phase !== 'summary' && (
                                        <TouchableOpacity style={styles.skipButton} onPress={handleSkipAll}>
                                            <Ionicons name="play-forward" size={16} color="rgba(255,255,255,0.7)" />
                                            <Text style={styles.skipText}>SKIP</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Close button */}
                                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                        <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
                                    </TouchableOpacity>
                                </View>

                                <Animated.View style={[styles.content, contentStyle]}>
                                    {/* PHASE: IDLE - Pack prêt à ouvrir */}
                                    {phase === 'idle' && (
                                        <Animated.View
                                            entering={FadeIn}
                                            exiting={FadeOut}
                                            style={styles.packContainer}
                                        >
                                            <R6AlphaPack
                                                tier={tier}
                                                spoilerRarity={currentBestRarity}
                                                onOpen={handlePackOpen}
                                            />
                                        </Animated.View>
                                    )}

                                    {/* PHASE: REVEALING - Révélation des cartes */}
                                    {phase === 'revealing' && currentCard && (
                                        <Animated.View
                                            key={`${currentPackIndex}-${currentCardIndex}`}
                                            entering={SlideInRight.springify()}
                                            style={styles.revealContainer}
                                        >
                                            <R6ItemReveal
                                                item={currentCard.item}
                                                isNew={currentCard.isNew}
                                                isShiny={currentCard.isShiny}
                                                dustValue={currentCard.dustValue}
                                            />
                                            {/* Overlay invisible pour détecter le swipe si GestureDetector trop complexe à intégrer rapidement */}
                                            <View
                                                style={StyleSheet.absoluteFill}
                                                onTouchEnd={(e) => {
                                                    // Simple heuristic: if tap on right side -> next
                                                    if (e.nativeEvent.locationX > width * 0.7) {
                                                        handleNextCard();
                                                    }
                                                }}
                                            />

                                            {/* Indicateur de progression */}
                                            {currentResult && (
                                                <View style={styles.progressIndicator}>
                                                    {currentResult.cards.map((_, i) => (
                                                        <View
                                                            key={i}
                                                            style={[
                                                                styles.progressDot,
                                                                i <= currentCardIndex && styles.progressDotActive,
                                                                { backgroundColor: i <= currentCardIndex ? config.primaryColor : 'rgba(255,255,255,0.3)' }
                                                            ]}
                                                        />
                                                    ))}
                                                </View>
                                            )}

                                            {/* Bouton suivant */}
                                            <Animated.View entering={FadeInUp.delay(800)}>
                                                <TouchableOpacity
                                                    style={[styles.nextButton, { backgroundColor: config.primaryColor }]}
                                                    onPress={handleNextCard}
                                                >
                                                    <Text style={styles.nextButtonText}>
                                                        {isLastCard && isLastPack
                                                            ? (packCount > 1 ? 'VOIR LE RÉCAP' : 'TERMINER')
                                                            : isLastCard
                                                                ? 'PACK SUIVANT'
                                                                : 'SUIVANT'
                                                        }
                                                    </Text>
                                                    <Ionicons
                                                        name={isLastCard && isLastPack ? 'checkmark' : 'arrow-forward'}
                                                        size={18}
                                                        color={tier === 'elite' ? '#000' : '#FFF'}
                                                    />
                                                </TouchableOpacity>
                                            </Animated.View>
                                        </Animated.View>
                                    )}

                                    {/* PHASE: SUMMARY - Récapitulatif */}
                                    {phase === 'summary' && allResults.length > 0 && (
                                        <Animated.View entering={FadeIn} style={styles.summaryContainer}>
                                            <SummaryGrid
                                                allResults={allResults}
                                                onClose={handleClose}
                                            />
                                        </Animated.View>
                                    )}
                                </Animated.View>
                            </SafeAreaView>
                        </Animated.View>
                    </Modal>
                    );
}

                    const styles = StyleSheet.create({
                        container: {
                        flex: 1,
                    backgroundColor: '#000',
    },
                    vignette: {
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: 'transparent',
                    borderWidth: 0, // Removed solid border
                    // Use a radial gradient if possible later, for now just dark overlay
                    backgroundColor: 'rgba(0,0,0,0.3)',
    },
                    bgParticle: {
                        position: 'absolute',
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
    },
                    safeArea: {
                        flex: 1,
    },
                    header: {
                        flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    gap: 12,
    },
                    packCounter: {
                        flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 16,
                    gap: 6,
                    marginRight: 'auto',
    },
                    packCounterText: {
                        fontSize: 14,
                    fontWeight: 'bold',
    },
                    tierBadge: {
                        paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
    },
                    tierText: {
                        color: '#000',
                    fontSize: 12,
                    fontWeight: '900',
                    letterSpacing: 1,
    },
                    skipButton: {
                        flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    gap: 4,
    },
                    skipText: {
                        color: 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    fontWeight: 'bold',
    },
                    closeButton: {
                        padding: 4,
    },
                    content: {
                        flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
    },
                    packContainer: {
                        alignItems: 'center',
                    justifyContent: 'center',
    },
                    revealContainer: {
                        alignItems: 'center',
                    justifyContent: 'center',
                    gap: 20,
    },
                    progressIndicator: {
                        flexDirection: 'row',
                    gap: 8,
                    marginTop: 20,
    },
                    progressDot: {
                        width: 8,
                    height: 8,
                    borderRadius: 4,
    },
                    progressDotActive: {
                        transform: [{scale: 1.2 }],
    },
                    nextButton: {
                        flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 30,
                    paddingVertical: 14,
                    borderRadius: 25,
                    gap: 10,
                    marginTop: 10,
    },
                    nextButtonText: {
                        color: '#000',
                    fontSize: 16,
                    fontWeight: 'bold',
                    letterSpacing: 1,
    },
                    summaryContainer: {
                        flex: 1,
                    width: '100%',
                    paddingTop: 20,
    },
});
