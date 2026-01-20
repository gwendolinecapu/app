import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, Pressable, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
    withSequence,
    withRepeat,
    useAnimatedReaction
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LootBoxService from '../../services/LootBoxService';
import { ShopItem, Rarity } from '../../services/MonetizationTypes';

interface CardRevealProps {
    item: ShopItem;
    isNew: boolean;
    dustValue?: number;
    delay?: number; // Delay before appearing
    onFlip?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export default function CardReveal({ item, isNew, dustValue, delay = 0, onFlip }: CardRevealProps) {
    const [flipped, setFlipped] = useState(false);

    // Animation Values
    const rotation = useSharedValue(180); // Start at 180 (Back facing user)
    const scale = useSharedValue(0);
    const glowOpacity = useSharedValue(0);

    const rarity = item.rarity || 'common';
    const rarityColor = LootBoxService.getRarityColor(rarity);
    const isSpecial = ['rare', 'epic', 'legendary', 'mythic'].includes(rarity);

    useEffect(() => {
        // Entrance Application
        scale.value = withSequence(
            withTiming(0, { duration: delay }), // Wait
            withSpring(1, { damping: 12 })     // Pop in
        );
    }, []);

    // Trigger shiny effect for special cards
    useEffect(() => {
        if (flipped && isSpecial) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 1000 }),
                    withTiming(0.4, { duration: 1000 })
                ),
                -1,
                true
            );
        }
    }, [flipped]);

    const handleFlip = () => {
        if (flipped) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        rotation.value = withSpring(0, { damping: 15, stiffness: 90 }, () => {
            if (onFlip) runOnJS(onFlip)();
        });
        setFlipped(true);

        // Heavy haptics for legendary
        if (rarity === 'legendary' || rarity === 'mythic') {
            setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 200);
        }
    };

    const frontStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotateY: `${rotation.value}deg` }
            ],
            opacity: interpolate(rotation.value, [90, 270], [1, 0]),
            zIndex: flipped ? 1 : 0,
        };
    });

    const backStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotateY: `${rotation.value + 180}deg` } // Offset so it matches
            ],
            opacity: interpolate(rotation.value, [90, 270], [0, 1]),
            zIndex: flipped ? 0 : 1,
        };
    });

    const containerScaleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: glowOpacity.value
        };
    });

    return (
        <Animated.View style={[styles.wrapper, containerScaleStyle]}>
            <Pressable onPress={handleFlip} style={styles.cardContainer}>

                {/* BACK OF CARD */}
                <Animated.View style={[styles.face, styles.backFace, backStyle]}>
                    <LinearGradient
                        colors={['#1F2937', '#111827']}
                        style={styles.gradient}
                    >
                        <Ionicons name="sparkles" size={48} color="rgba(255,255,255,0.2)" />
                        <View style={styles.patternOverlay} />
                    </LinearGradient>
                    <View style={styles.border} />
                </Animated.View>

                {/* FRONT OF CARD */}
                <Animated.View style={[styles.face, styles.frontFace, frontStyle]}>
                    {/* Rarity Glow Border */}
                    <Animated.View style={[styles.glowBorder, { borderColor: rarityColor }, glowStyle]} />

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

                        {/* Image / Preview */}
                        <View style={styles.imageContainer}>
                            {item.preview && item.preview.startsWith('#') ? (
                                <View style={[styles.colorPreview, { backgroundColor: item.preview }]} />
                            ) : (
                                <Ionicons name={item.icon as any || "cube"} size={80} color="#374151" />
                            )}
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
});
