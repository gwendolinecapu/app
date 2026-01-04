/**
 * ShopItemCard.tsx
 * Carte d'item de la boutique avec preview améliorée
 * 
 * Affiche un aperçu réaliste basé sur le type d'item :
 * - Theme: Miniature d'interface avec le thème
 * - Frame: Avatar avec le cadre appliqué
 * - Bubble: Bulle de chat stylisée
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing
} from 'react-native-reanimated';
import { ShopItem, RARITY_COLORS, Rarity } from '../../services/MonetizationTypes';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { ItemPreview } from './ItemPreview';

// Rarity Translations
const RARITY_LABELS: Record<Rarity, string> = {
    common: 'COMMUN',
    rare: 'RARE',
    epic: 'ÉPIQUE',
    legendary: 'LÉGENDAIRE',
    mythic: 'MYTHIQUE',
};

// Mini flocons pour la preview animée du thème Winter
const MiniSnowfall = React.memo(() => {
    const flakes = useMemo(() =>
        Array.from({ length: 8 }).map((_, i) => ({
            key: i,
            left: 5 + (i * 6), // Répartition horizontale
            size: 2 + Math.random() * 2, // 2-4px
            duration: 1500 + Math.random() * 1500,
            delay: i * 200,
        })), []
    );

    return (
        <View style={miniSnowStyles.container}>
            {flakes.map(({ key, left, size, duration, delay }) => (
                <MiniFlake key={key} left={left} size={size} duration={duration} delay={delay} />
            ))}
        </View>
    );
});

const MiniFlake = React.memo(({ left, size, duration, delay }: { left: number; size: number; duration: number; delay: number }) => {
    const translateY = useSharedValue(-5);

    useEffect(() => {
        translateY.value = withDelay(delay, withRepeat(
            withTiming(90, { duration, easing: Easing.linear }),
            -1
        ));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[miniSnowStyles.flake, animatedStyle, { left, width: size, height: size, borderRadius: size / 2 }]} />
    );
});

const miniSnowStyles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    flake: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        opacity: 0.7,
    }
});

interface ShopItemCardProps {
    item: ShopItem;
    onPress: (item: ShopItem) => void;
    isOwned?: boolean;
    isEquipped?: boolean;
    userCredits: number;
    containerStyle?: import('react-native').ViewStyle;
}

export function ShopItemCard({ item, onPress, isOwned, isEquipped, userCredits, containerStyle }: ShopItemCardProps) {
    const canAfford = (item.priceCredits || 0) <= userCredits;
    const isFree = (item.priceCredits || 0) === 0;

    // Rarity Logic
    const rarity = item.rarity || 'common';
    const rarityColor = RARITY_COLORS[rarity];
    const isSpecial = rarity !== 'common';
    const rarityLabel = RARITY_LABELS[rarity];

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isEquipped && styles.containerEquipped,
                isOwned && !isEquipped && styles.containerOwned,
                // Rarity Border for the whole card (optional, user asked for "contour autour de la couleur", but subtle card border is nice too)
                // Let's stick to the preview container for the main "color" border as requested, 
                // but maybe a subtle glow for Mythic?
                containerStyle
            ]}
            onPress={() => onPress(item)}
            activeOpacity={0.8}
        >
            {/* Preview */}
            <View style={[
                styles.previewContainer,
                isSpecial && { borderColor: rarityColor, borderWidth: 2 } // Colored border around preview
            ]}>
                <ItemPreview item={item} size="small" />

                {/* Equipped indicator */}
                {isEquipped && (
                    <View style={styles.equippedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                )}
            </View>

            {/* Details */}
            <View style={styles.details}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

                <View style={styles.priceRow}>
                    {/* Rarity Badge */}
                    {isSpecial ? (
                        <View style={[
                            styles.badge,
                            {
                                backgroundColor: rarityColor + '20', // 20% opacity hex
                                borderColor: rarityColor,
                                borderWidth: 1
                            }
                        ]}>
                            <Text style={[styles.badgeText, { color: rarityColor }]}>
                                {rarityLabel}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }} /> // Spacer if no badge
                    )}

                    {isOwned ? (
                        <View style={styles.ownedBadge}>
                            <Ionicons name="checkmark" size={12} color={colors.success} />
                            <Text style={styles.ownedText}>
                                {isEquipped ? 'Équipé' : 'Acquis'}
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.priceTag, !canAfford && !isFree && styles.priceTagExpensive]}>
                            {isFree ? (
                                <Text style={styles.freeText}>Gratuit</Text>
                            ) : (
                                <>
                                    <Ionicons
                                        name="diamond"
                                        size={12}
                                        color={canAfford ? colors.secondary : colors.error}
                                    />
                                    <Text style={[
                                        styles.priceText,
                                        !canAfford && { color: colors.error }
                                    ]}>
                                        {item.priceCredits}
                                    </Text>
                                </>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    containerEquipped: {
        borderColor: colors.success,
        borderWidth: 2,
    },
    containerOwned: {
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    previewContainer: {
        height: 110,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        // Default border
        borderColor: 'transparent',
        borderBottomWidth: 0,
    },
    equippedBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 2,
    },

    // Details section
    details: {
        padding: spacing.sm,
    },
    name: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        gap: 4, // Add gap
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 8, // Smaller text
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    priceTagExpensive: {
        opacity: 0.7,
    },
    priceText: {
        color: colors.secondary,
        fontWeight: 'bold',
        fontSize: 13,
    },
    freeText: {
        color: colors.success,
        fontWeight: 'bold',
        fontSize: 12,
    },
    ownedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ownedText: {
        color: colors.success,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
