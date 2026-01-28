import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, Pressable, Dimensions, Vibration } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
    withSequence,
    withRepeat,
    withDelay,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics';
import LootBoxService from '../../services/LootBoxService';
import { ShopItem, Rarity } from '../../services/MonetizationTypes';
import { ItemPreview } from './ItemPreview';

interface CardRevealProps {
    item: ShopItem;
    isNew: boolean;
    dustValue?: number;
    delay?: number;
    onFlip?: () => void;
    autoFlip?: boolean; // NEW: Auto-flip après le delay (style Supercell)
    isActive?: boolean; // NEW: Card is currently in focus for reveal
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

// R6 STYLE: Rarity effects plus sobres
// Wobble réservé Legendary/Mythic, sparkles one-shot, moins de screen shake
const RARITY_EFFECTS: Record<string, {
    glowIntensity: number;
    bounceStrength: number;
    wobbleAmount: number;
    sparkles: boolean;       // One-shot, pas loop
    screenShake: boolean;
    hapticStyle: 'light' | 'medium' | 'heavy' | 'success';
}> = {
    common: { glowIntensity: 0, bounceStrength: 12, wobbleAmount: 0, sparkles: false, screenShake: false, hapticStyle: 'light' },
    uncommon: { glowIntensity: 0, bounceStrength: 11, wobbleAmount: 0, sparkles: false, screenShake: false, hapticStyle: 'light' },
    rare: { glowIntensity: 0.4, bounceStrength: 10, wobbleAmount: 0, sparkles: false, screenShake: false, hapticStyle: 'medium' },
    epic: { glowIntensity: 0.6, bounceStrength: 8, wobbleAmount: 0, sparkles: true, screenShake: false, hapticStyle: 'heavy' },
    legendary: { glowIntensity: 0.8, bounceStrength: 6, wobbleAmount: 5, sparkles: true, screenShake: true, hapticStyle: 'success' },
    mythic: { glowIntensity: 1, bounceStrength: 5, wobbleAmount: 8, sparkles: true, screenShake: true, hapticStyle: 'success' },
};

export default function CardReveal({ item, isNew, dustValue, delay = 0, onFlip, autoFlip = false, isActive = true }: CardRevealProps) {
    const [flipped, setFlipped] = useState(false);
    const hapticTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoFlipTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Animation Values
    const rotation = useSharedValue(180);
    const scale = useSharedValue(0);
    const glowOpacity = useSharedValue(0);
    const wobble = useSharedValue(0);
    const floatY = useSharedValue(0);
    const sparkleRotation = useSharedValue(0);
    const cardScale = useSharedValue(1);
    const pulseScale = useSharedValue(1); // NEW: Pulse animation for active card

    const rarity = item.rarity || 'common';
    const rarityColor = LootBoxService.getRarityColor(rarity);
    const effects = RARITY_EFFECTS[rarity] || RARITY_EFFECTS.common;
    const isSpecial = ['rare', 'epic', 'legendary', 'mythic'].includes(rarity);

    useEffect(() => {
        // Entrance animation with staggered delay
        scale.value = withSequence(
            withTiming(0, { duration: delay }),
            withSpring(1.1, { damping: 8 }),
            withSpring(1, { damping: 12 })
        );

        // Gentle idle float for unflipped cards
        floatY.value = withRepeat(
            withSequence(
                withTiming(-3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        return () => {
            cancelAnimation(floatY);
            cancelAnimation(sparkleRotation);
            cancelAnimation(pulseScale);
            if (autoFlipTimeoutRef.current) {
                clearTimeout(autoFlipTimeoutRef.current);
            }
        };
    }, []);

    // NEW: Auto-flip logic for first card
    useEffect(() => {
        if (autoFlip && !flipped && isActive) {
            autoFlipTimeoutRef.current = setTimeout(() => {
                handleFlip();
            }, delay + 500); // Wait for entrance animation + 500ms
        }

        return () => {
            if (autoFlipTimeoutRef.current) {
                clearTimeout(autoFlipTimeoutRef.current);
            }
        };
    }, [autoFlip, isActive]);

    // NEW: Pulse animation for active card waiting to be tapped
    useEffect(() => {
        if (isActive && !flipped && !autoFlip) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 600 }),
                    withTiming(1, { duration: 600 })
                ),
                -1,
                true
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 200 });
        }
    }, [isActive, flipped]);

    // R6 STYLE: Trigger effects when flipped (one-shot, pas de loops)
    useEffect(() => {
        if (flipped) {
            // Glow fade-in puis stable (pas de pulse loop)
            if (isSpecial) {
                glowOpacity.value = withTiming(effects.glowIntensity, { duration: 400 });
            }

            // R6 STYLE: Sparkle one-shot (une seule rotation puis stop)
            if (effects.sparkles) {
                sparkleRotation.value = withTiming(180, {
                    duration: 600,
                    easing: Easing.out(Easing.cubic)
                });
            }

            // Wobble uniquement pour Legendary/Mythic (plus smooth)
            if (effects.wobbleAmount > 0) {
                wobble.value = withSequence(
                    withTiming(effects.wobbleAmount, { duration: 80 }),
                    withTiming(-effects.wobbleAmount * 0.5, { duration: 80 }),
                    withTiming(effects.wobbleAmount * 0.2, { duration: 80 }),
                    withTiming(0, { duration: 100 })
                );
            }

            // Scale bounce sobre pour legendary/mythic
            if (rarity === 'legendary' || rarity === 'mythic') {
                cardScale.value = withSequence(
                    withSpring(1.06, { damping: 8 }),
                    withSpring(1, { damping: 10 })
                );
            }
        }
    }, [flipped]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (hapticTimeoutRef.current) {
                clearTimeout(hapticTimeoutRef.current);
            }
        };
    }, []);

    const handleFlip = () => {
        if (flipped) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Enhanced flip with bounce
        rotation.value = withSpring(0, {
            damping: effects.bounceStrength,
            stiffness: 80,
            mass: 0.8
        }, () => {
            if (onFlip) runOnJS(onFlip)();
        });
        setFlipped(true);

        // Heavy haptics for legendary
        if (rarity === 'legendary' || rarity === 'mythic') {
            hapticTimeoutRef.current = setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (effects.screenShake) {
                    Vibration.vibrate([0, 50, 30, 50]);
                }
            }, 200);
        } else if (rarity === 'epic') {
            hapticTimeoutRef.current = setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 200);
        }
    };

    const frontStyle = useAnimatedStyle(() => ({
        transform: [
            { rotateY: `${rotation.value}deg` },
            { rotate: `${wobble.value}deg` }
        ],
        opacity: interpolate(rotation.value, [90, 270], [1, 0]),
        zIndex: flipped ? 1 : 0,
    }));

    const backStyle = useAnimatedStyle(() => ({
        transform: [
            { rotateY: `${rotation.value + 180}deg` },
            { translateY: floatY.value }
        ],
        opacity: interpolate(rotation.value, [90, 270], [0, 1]),
        zIndex: flipped ? 0 : 1,
    }));

    const containerScaleStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value * cardScale.value * pulseScale.value }
        ]
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: 1 + glowOpacity.value * 0.1 }]
    }));

    const sparkleStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${sparkleRotation.value}deg` }],
        opacity: effects.sparkles && flipped ? 0.8 : 0
    }));

    return (
        <Animated.View style={[styles.wrapper, containerScaleStyle]}>
            <Pressable onPress={handleFlip} style={styles.cardContainer}>

                {/* BACK OF CARD */}
                <Animated.View style={[styles.face, styles.backFace, backStyle]}>
                    <LinearGradient
                        colors={['#1F2937', '#111827']}
                        style={styles.gradient}
                    >
                        {/* Animated sparkle pattern for back */}
                        <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
                            <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', top: 20, left: 20 }} />
                            <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', bottom: 30, right: 25 }} />
                            <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.12)" style={{ position: 'absolute', top: 40, right: 40 }} />
                        </Animated.View>
                        <Ionicons name="help-circle" size={48} color="rgba(255,255,255,0.25)" />
                        <Text style={styles.tapHint}>TOUCHER</Text>
                        <View style={styles.patternOverlay} />
                    </LinearGradient>
                    <View style={styles.border} />
                </Animated.View>

                {/* FRONT OF CARD */}
                <Animated.View style={[styles.face, styles.frontFace, frontStyle]}>
                    {/* Rarity Glow Border */}
                    <Animated.View style={[styles.glowBorder, { borderColor: rarityColor, shadowColor: rarityColor }, glowStyle]} />

                    {/* Additional outer glow for legendary */}
                    {(rarity === 'legendary' || rarity === 'mythic') && (
                        <Animated.View style={[styles.outerGlow, { backgroundColor: rarityColor }, glowStyle]} />
                    )}

                    <View style={[styles.frontContent, { borderColor: rarityColor }]}>
                        {/* Header: Rarity & Name */}
                        <View style={styles.header}>
                            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                                <Text style={styles.rarityText}>{rarity.toUpperCase()}</Text>
                            </View>
                            {isNew && (
                                <View style={styles.newBadge}>
                                    <Text style={styles.newText}>NEW</Text>
                                </View>
                            )}
                        </View>

                        {/* Image / Preview - Utilise ItemPreview pour afficher la vraie preview */}
                        <View style={styles.imageContainer}>
                            <ItemPreview item={item} size="medium" />
                        </View>

                        {/* Footer: Name & Details */}
                        <View style={styles.footer}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemType}>{item.type}</Text>

                            {dustValue ? (
                                <View style={styles.dustContainer}>
                                    <Ionicons name="flash" size={12} color="#FCD34D" />
                                    <Text style={styles.dustText}>+{dustValue} Dust</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginHorizontal: 10,
    },
    cardContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    face: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 16,
        backfaceVisibility: 'hidden', // Crucial for 3D flip
    },
    backFace: {
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#374151',
    },
    frontFace: {
        backgroundColor: 'white',
        borderRadius: 16,
    },
    gradient: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // Could add a pattern image here
    },
    border: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
    },
    frontContent: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 4, // Rarity Color Border
        overflow: 'hidden',
        backgroundColor: '#F9FAFB',
    },
    glowBorder: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderWidth: 4,
        borderRadius: 20,
        opacity: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
    },
    rarityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    rarityText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    newBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    imageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    colorPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    footer: {
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    itemType: {
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    dustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    dustText: {
        fontSize: 12,
        color: '#D97706',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    // NEW: Enhanced animation styles
    sparkleContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    tapHint: {
        marginTop: 10,
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
    },
    outerGlow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        borderRadius: 30,
        opacity: 0.3,
        zIndex: -1,
    },
});
