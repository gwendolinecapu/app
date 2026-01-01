/**
 * FeaturedCarousel.tsx
 * Carrousel d'articles en vedette pour la boutique
 * 
 * Affiche :
 * - Article du jour (promo)
 * - Items de saison
 * - Nouveautés
 * - Collections mises en avant
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { ShopItem } from '../../services/MonetizationTypes';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width minus padding

// Featured item avec métadonnées supplémentaires
interface FeaturedItem {
    item: ShopItem;
    badge?: string;          // "PROMO", "NOUVEAU", "LIMITÉ"
    discount?: number;       // Pourcentage de réduction
    endDate?: Date;         // Date de fin de la promo
    gradient?: [string, string]; // Couleurs du gradient
}

// Items en vedette (mock data - would come from backend)
const FEATURED_ITEMS: FeaturedItem[] = [
    {
        item: {
            id: 'theme_cyberpunk',
            name: 'Cyberpunk',
            priceCredits: 200,
            preview: '#ff00ff',
            type: 'theme',
            isPremium: true,
            description: 'Néons et haute technologie.'
        },
        badge: '🔥 POPULAIRE',
        gradient: ['#ff00ff', '#00ffff'],
    },
    {
        item: {
            id: 'theme_anim_aurora',
            name: 'Aurore Boréale',
            priceCredits: 1000,
            preview: '#00ff9d',
            type: 'theme',
            isPremium: true,
            description: 'Lueurs nordiques vivantes.'
        },
        badge: '✨ ANIMÉ',
        discount: 20,
        gradient: ['#00ff9d', '#4b0082'],
    },
    {
        item: {
            id: 'frame_anim_galaxy_spin',
            name: 'Galaxie',
            priceCredits: 1200,
            preview: '#4b0082',
            type: 'frame',
            isPremium: true,
            description: 'Rotation cosmique infinie.'
        },
        badge: '🌟 NOUVEAU',
        gradient: ['#1a1a2e', '#4b0082'],
    },
    {
        item: {
            id: 'bundle_winter',
            name: 'Pack Hiver',
            priceCredits: 300,
            preview: '#a5f2f3',
            type: 'bundle',
            description: 'Thème + Cadre + Bulle assortis'
        },
        badge: '🎁 BUNDLE -30%',
        discount: 30,
        gradient: ['#a5f2f3', '#4facfe'],
    },
];

interface FeaturedCarouselProps {
    onItemPress?: (item: ShopItem) => void;
    userCredits?: number;
}

export function FeaturedCarousel({ onItemPress, userCredits = 0 }: FeaturedCarouselProps) {
    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Auto-scroll toutes les 5 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % FEATURED_ITEMS.length;
            scrollToIndex(nextIndex);
        }, 5000);

        return () => clearInterval(interval);
    }, [activeIndex]);

    const scrollToIndex = (index: number) => {
        // Animation de fade
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0.7,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        scrollRef.current?.scrollTo({
            x: index * CARD_WIDTH,
            animated: true,
        });
        setActiveIndex(index);
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / CARD_WIDTH);
        if (index !== activeIndex && index >= 0 && index < FEATURED_ITEMS.length) {
            setActiveIndex(index);
        }
    };

    const calculateDiscountedPrice = (price: number, discount?: number): number => {
        if (!discount) return price;
        return Math.round(price * (1 - discount / 100));
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>✨ En Vedette</Text>
                <View style={styles.dots}>
                    {FEATURED_ITEMS.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => scrollToIndex(index)}
                            style={styles.dotTouchArea}
                        >
                            <View
                                style={[
                                    styles.dot,
                                    activeIndex === index && styles.dotActive,
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Carousel */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    decelerationRate="fast"
                    snapToInterval={CARD_WIDTH}
                    contentContainerStyle={styles.scrollContent}
                >
                    {FEATURED_ITEMS.map((featured, index) => (
                        <TouchableOpacity
                            key={featured.item.id}
                            style={styles.card}
                            onPress={() => onItemPress?.(featured.item)}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={featured.gradient || ['#1a1a2e', '#16213e']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                {/* Badge */}
                                {featured.badge && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{featured.badge}</Text>
                                    </View>
                                )}

                                {/* Content */}
                                <View style={styles.cardContent}>
                                    {/* Preview Circle */}
                                    <View style={[styles.previewCircle, { borderColor: featured.item.preview }]}>
                                        {featured.item.type === 'theme' && (
                                            <View style={[styles.previewInner, { backgroundColor: featured.item.preview }]} />
                                        )}
                                        {featured.item.type === 'frame' && (
                                            <Ionicons name="scan-outline" size={32} color={featured.item.preview} />
                                        )}
                                        {featured.item.type === 'bundle' && (
                                            <Ionicons name="gift-outline" size={32} color="#FFD700" />
                                        )}
                                    </View>

                                    {/* Info */}
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardName}>{featured.item.name}</Text>
                                        <Text style={styles.cardDescription}>{featured.item.description}</Text>

                                        {/* Price */}
                                        <View style={styles.priceContainer}>
                                            {featured.discount ? (
                                                <>
                                                    <Text style={styles.originalPrice}>
                                                        {featured.item.priceCredits}
                                                    </Text>
                                                    <View style={styles.discountedPriceContainer}>
                                                        <Ionicons name="diamond" size={14} color="#FFD700" />
                                                        <Text style={styles.discountedPrice}>
                                                            {calculateDiscountedPrice(featured.item.priceCredits || 0, featured.discount)}
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <View style={styles.regularPriceContainer}>
                                                    <Ionicons name="diamond" size={14} color={colors.secondary} />
                                                    <Text style={styles.regularPrice}>
                                                        {featured.item.priceCredits}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* CTA Button */}
                                    <TouchableOpacity
                                        style={[
                                            styles.ctaButton,
                                            userCredits < calculateDiscountedPrice(featured.item.priceCredits || 0, featured.discount || 0) && styles.ctaButtonDisabled,
                                        ]}
                                        onPress={() => onItemPress?.(featured.item)}
                                    >
                                        <Text style={styles.ctaText}>
                                            {userCredits >= calculateDiscountedPrice(featured.item.priceCredits || 0, featured.discount || 0)
                                                ? 'Acheter'
                                                : 'Voir'}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>

                                {/* Premium Badge */}
                                {featured.item.isPremium && (
                                    <View style={styles.premiumBadge}>
                                        <Ionicons name="star" size={12} color="#FFD700" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    dots: {
        flexDirection: 'row',
        gap: 6,
    },
    dotTouchArea: {
        padding: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        backgroundColor: colors.primary,
        width: 20,
    },
    scrollContent: {
        paddingRight: 16,
    },
    card: {
        width: CARD_WIDTH,
        marginRight: 16,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    cardGradient: {
        padding: spacing.lg,
        minHeight: 160,
    },
    badge: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    premiumBadge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 6,
        borderRadius: borderRadius.full,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    previewCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    previewInner: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    cardInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    cardName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: spacing.sm,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    originalPrice: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textDecorationLine: 'line-through',
    },
    discountedPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    discountedPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    regularPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    regularPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: 6,
    },
    ctaButtonDisabled: {
        opacity: 0.6,
    },
    ctaText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 13,
    },
});
