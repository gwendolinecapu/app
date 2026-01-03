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
import { ShopItem } from '../../services/MonetizationTypes';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { ItemPreview } from './ItemPreview';

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
    const isPremium = item.isPremium;
    const isFree = (item.priceCredits || 0) === 0;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isEquipped && styles.containerEquipped,
                isOwned && !isEquipped && styles.containerOwned,
                containerStyle
            ]}
            onPress={() => onPress(item)}
            activeOpacity={0.8}
        >
            {/* Preview */}
            <View style={styles.previewContainer}>
                <ItemPreview item={item} size="small" />

                {/* Premium badge */}
                {isPremium && (
                    <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                    </View>
                )}

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
                    {/* Badges Container */}
                    <View style={styles.badgesContainer}>
                        {item.isAnimated && (
                            <View style={[styles.badge, styles.luxeBadge]}>
                                <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                                <Text style={styles.badgeText}>LUXE</Text>
                            </View>
                        )}
                        {item.isPremium && !item.isAnimated && (
                            <View style={[styles.badge, styles.badgePremium]}>
                                <Ionicons name="diamond" size={10} color="#FFD700" />
                                <Text style={[styles.badgeText, { color: '#FFD700' }]}>PREMIUM</Text>
                            </View>
                        )}
                    </View>
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
        // Width is now controlled by parent via containerStyle prop
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
    },
    premiumBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    luxeBadge: {
        backgroundColor: '#8B5CF6', // Purple for Animated/Luxe
    },
    badgePremium: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    badgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
