/**
 * ShopItemCard.tsx
 * Carte d'item de la boutique avec preview améliorée
 * 
 * Affiche un aperçu réaliste basé sur le type d'item :
 * - Theme: Miniature d'interface avec le thème
 * - Frame: Avatar avec le cadre appliqué
 * - Bubble: Bulle de chat stylisée
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ShopItem } from '../../services/MonetizationTypes';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { getThemeColors } from '../../lib/cosmetics';

interface ShopItemCardProps {
    item: ShopItem;
    onPress: (item: ShopItem) => void;
    isOwned?: boolean;
    isEquipped?: boolean;
    userCredits: number;
}

export function ShopItemCard({ item, onPress, isOwned, isEquipped, userCredits }: ShopItemCardProps) {
    const canAfford = (item.priceCredits || 0) <= userCredits;
    const isPremium = item.isPremium;
    const isFree = (item.priceCredits || 0) === 0;
    const isAnimated = item.id.includes('anim_');

    // Render preview based on item type
    const renderPreview = () => {
        if (item.type === 'theme') {
            // Theme preview: mini app mockup with ACTUAL theme colors
            const themeColors = getThemeColors(item.id);
            // Fallback to preview color if no theme defined (should not happen for listed themes)
            const bgColor = themeColors?.background || item.preview || '#1a1a2e';
            const cardColor = themeColors?.backgroundCard || 'rgba(255,255,255,0.15)';
            const primaryColor = themeColors?.primary || colors.primary;
            const textColor = themeColors?.text || 'rgba(255,255,255,0.5)';
            const borderColor = themeColors?.border || 'rgba(255,255,255,0.2)';

            return (
                <View style={[styles.themePreview, { backgroundColor: bgColor, borderColor: borderColor }]}>
                    {/* Mini app mockup */}
                    <View style={styles.mockHeader}>
                        <View style={styles.mockStatusBar}>
                            <View style={[styles.mockNotch, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                        </View>
                        {/* Title Bar - simulating active tab or header */}
                        <View style={[styles.mockTitleBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    </View>
                    <View style={styles.mockBody}>
                        {/* Card 1 - representing a post */}
                        <View style={[styles.mockCard1, { backgroundColor: cardColor }]}>
                            {/* Mini text lines */}
                            <View style={{ height: 2, width: '40%', backgroundColor: textColor, opacity: 0.7, marginBottom: 2, borderRadius: 1 }} />
                            <View style={{ height: 2, width: '80%', backgroundColor: textColor, opacity: 0.4, borderRadius: 1 }} />
                        </View>
                        {/* Card 2 */}
                        <View style={[styles.mockCard2, { backgroundColor: cardColor }]} />
                        {/* Card 3 */}
                        <View style={[styles.mockCard3, { backgroundColor: cardColor }]} />
                    </View>

                    {/* Floating Action Button simulation */}
                    <View style={{
                        position: 'absolute',
                        bottom: 16,
                        alignSelf: 'center',
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: primaryColor,
                        shadowColor: primaryColor,
                        shadowOpacity: 0.5,
                        shadowRadius: 2,
                        elevation: 2
                    }} />

                    <View style={[styles.mockTabBar, { backgroundColor: themeColors?.backgroundCard || 'rgba(0,0,0,0.2)' }]}>
                        <View style={[styles.mockTab, { backgroundColor: textColor, opacity: 0.3 }]} />
                        <View style={[styles.mockTab, { backgroundColor: primaryColor }]} />
                        <View style={[styles.mockTab, { backgroundColor: textColor, opacity: 0.3 }]} />
                    </View>

                    {/* Animated indicator */}
                    {isAnimated && (
                        <View style={styles.animatedBadge}>
                            <Text style={styles.animatedText}>✨</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (item.type === 'frame') {
            // Frame preview: avatar with the frame style applied
            const getFrameStyle = () => {
                if (item.id.includes('neon')) {
                    return {
                        borderColor: '#00ff00',
                        shadowColor: '#00ff00',
                        shadowOpacity: 0.8,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 0 },
                    };
                }
                if (item.id.includes('rainbow')) {
                    return { borderColor: '#ff6b6b', borderWidth: 4 };
                }
                if (item.id.includes('double')) {
                    return { borderWidth: 4, borderColor: colors.primary };
                }
                if (item.id.includes('flames')) {
                    return { borderColor: '#ff4500' };
                }
                if (item.id.includes('leaves') || item.id.includes('floral')) {
                    return { borderColor: '#22c55e' };
                }
                if (item.id.includes('gold')) {
                    return { borderColor: '#ffd700' };
                }
                if (item.id.includes('glitch')) {
                    return { borderColor: '#00ffff' };
                }
                if (item.id.includes('galaxy')) {
                    return { borderColor: '#8b5cf6' };
                }
                return { borderColor: colors.border };
            };

            const frameStyle = getFrameStyle();
            const isSquare = item.id.includes('square');

            return (
                <View style={styles.framePreviewContainer}>
                    <View style={[
                        styles.frameCircle,
                        frameStyle,
                        isSquare && { borderRadius: 12 },
                    ]}>
                        <LinearGradient
                            colors={['#3b82f6', '#8b5cf6']}
                            style={[styles.avatarGradient, isSquare && { borderRadius: 8 }]}
                        >
                            <Text style={styles.avatarInitial}>A</Text>
                        </LinearGradient>
                    </View>

                    {/* Type icon */}
                    <View style={styles.typeIcon}>
                        <Ionicons name={item.icon as any || "scan-outline"} size={10} color={colors.text} />
                    </View>

                    {isAnimated && (
                        <View style={styles.animatedBadgeSmall}>
                            <Text style={styles.animatedTextSmall}>✨</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (item.type === 'bubble') {
            // Bubble preview: chat bubble with style applied
            const getBubbleStyle = () => {
                if (item.id.includes('square')) return { borderRadius: 4 };
                if (item.id.includes('round')) return { borderRadius: 20 };
                if (item.id.includes('cloud')) return { borderRadius: 18, borderBottomLeftRadius: 4 };
                if (item.id.includes('pixel')) return { borderRadius: 0 };
                if (item.id.includes('comic')) return { borderRadius: 4, borderWidth: 2, borderColor: '#000' };
                return {};
            };

            const getBubbleColor = (): readonly [string, string] => {
                if (item.id.includes('gradient')) return ['#8b5cf6', '#ec4899'] as const;
                if (item.id.includes('glass')) return ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as const;
                return [colors.primary, colors.primary] as const;
            };

            return (
                <View style={styles.bubblePreviewContainer}>
                    <LinearGradient
                        colors={getBubbleColor()}
                        style={[styles.bubblePreview, getBubbleStyle()]}
                    >
                        <Text style={styles.bubbleText}>Hello!</Text>
                    </LinearGradient>

                    {isAnimated && (
                        <View style={styles.animatedBadgeSmall}>
                            <Text style={styles.animatedTextSmall}>✨</Text>
                        </View>
                    )}
                </View>
            );
        }

        // Generic/Bundle preview
        return (
            <View style={styles.genericPreview}>
                <Ionicons name={item.icon as any || "gift-outline"} size={32} color={colors.primary} />
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isEquipped && styles.containerEquipped,
                isOwned && !isEquipped && styles.containerOwned,
            ]}
            onPress={() => onPress(item)}
            activeOpacity={0.8}
        >
            {/* Preview */}
            <View style={styles.previewContainer}>
                {renderPreview()}

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
        width: '48%',
        marginBottom: spacing.md,
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

    // Theme preview styles
    themePreview: {
        width: 55,
        height: 90,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mockHeader: {
        height: 16,
    },
    mockStatusBar: {
        height: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mockNotch: {
        width: 20,
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 2,
    },
    mockTitleBar: {
        height: 6,
        marginHorizontal: 4,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 2,
    },
    mockBody: {
        flex: 1,
        padding: 4,
        gap: 4,
    },
    mockCard1: {
        height: 14,
        borderRadius: 2,
    },
    mockCard2: {
        height: 10,
        width: '70%',
        borderRadius: 2,
    },
    mockCard3: {
        height: 10,
        width: '50%',
        borderRadius: 2,
    },
    mockTabBar: {
        height: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    mockTab: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    mockTabActive: {
        backgroundColor: 'rgba(255,255,255,0.4)',
    },

    // Frame preview styles
    framePreviewContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    frameCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        padding: 3,
        backgroundColor: colors.background,
    },
    avatarGradient: {
        flex: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    typeIcon: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        padding: 3,
    },

    // Bubble preview styles
    bubblePreviewContainer: {
        alignItems: 'center',
    },
    bubblePreview: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '500',
    },

    // Generic preview
    genericPreview: {
        opacity: 0.7,
    },

    // Badges
    animatedBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    animatedText: {
        fontSize: 12,
    },
    animatedBadgeSmall: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    animatedTextSmall: {
        fontSize: 10,
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
        alignItems: 'center',
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
