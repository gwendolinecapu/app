import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
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

export default function LootBoxOpening({ visible, tier, onClose }: LootBoxOpeningProps) {
    const { ownedItems, addToInventory, addDust } = useMonetization();

    const [phase, setPhase] = useState<'pack' | 'cards' | 'summary'>('pack');
    const [result, setResult] = useState<PackResult | null>(null);
    const [cardsRevealedCount, setCardsRevealedCount] = useState(0);

    // Reset when opening
    useEffect(() => {
        if (visible) {
            setPhase('pack');
            setResult(null);
            setCardsRevealedCount(0);
        }
    }, [visible]);

    const handlePackOpen = useCallback(() => {
        // 1. Generate Result
        const packResult = LootBoxService.openPack(tier, ownedItems);
        setResult(packResult);

        // 2. Persist Rewards (Async but don't block UI transition)
        const saveRewards = async () => {
            // Give items
            for (const card of packResult.cards) {
                if (card.isNew) {
                    await addToInventory(card.item.id);
                }
            }
            // Give dust
            if (packResult.totalDust > 0) {
                await addDust(packResult.totalDust);
            }
        };
        saveRewards();

        // 3. Transition to Cards phase
        setTimeout(() => {
            setPhase('cards');
        }, 500);
    }, [tier, ownedItems, addToInventory, addDust]);

    const handleCardFlip = () => {
        setCardsRevealedCount(prev => prev + 1);
    };

    const handleFinish = () => {
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <BlurView intensity={90} tint="dark" style={styles.absoluteFill}>
                <SafeAreaView style={styles.container}>

                    {/* Header / Close (only if stuck) - Only show after pack is opened to prevent 'paid but closed' scenario */}
                    {phase !== 'pack' && (
                        <TouchableOpacity style={styles.closeButton} onPress={handleFinish}>
                            <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    )}

                    {/* PHASE 1: BOOSTER PACK */}
                    {phase === 'pack' && (
                        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.centerContent}>
                            <Text style={styles.instructionText}>GLISSEZ POUR OUVRIR</Text>
                            <BoosterPack tier={tier} onOpen={handlePackOpen} />
                        </Animated.View>
                    )}

                    {/* PHASE 2: CARDS REVEAL */}
                    {phase === 'cards' && result && (
                        <Animated.View entering={FadeIn.delay(300)} style={styles.cardsContainer}>
                            <Text style={styles.congratsText}>
                                {result.cards.length} OBJETS DÉCOUVERTS !
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.cardsScroll}
                                snapToInterval={width * 0.7} // approx card width + margin
                                decelerationRate="fast"
                            >
                                {result.cards.map((card, index) => (
                                    <View key={`${card.item.id}-${index}`} style={styles.cardWrapper}>
                                        <CardReveal
                                            item={card.item}
                                            isNew={card.isNew}
                                            dustValue={card.dustValue}
                                            delay={index * 200} // Staggered entrance
                                            onFlip={handleCardFlip}
                                        // Auto flip logic could happen here if desired
                                        />
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Summary / Continue Button */}
                            {cardsRevealedCount >= 0 && ( // Always show button for UX, or show only when all revealed?
                                <Animated.View entering={FadeIn.delay(1000)} style={styles.footer}>
                                    {result.totalDust > 0 && (
                                        <View style={styles.dustSummary}>
                                            <Ionicons name="flash" size={16} color="#FCD34D" />
                                            <Text style={styles.dustSummaryText}>+{result.totalDust} Poussière</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                                        <Text style={styles.finishButtonText}>TOUT RÉCUPÉRER</Text>
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
    }
});
