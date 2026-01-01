import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopItem } from '../../services/MonetizationTypes';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { LinearGradient } from 'expo-linear-gradient';

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

    // Helper to render the specific preview based on item type
    const renderPreview = () => {
        if (item.type === 'theme') {
            return (
                <View style={[styles.previewBox, { backgroundColor: item.preview }]}>
                    {/* Mock Interface */}
                    <View style={{ width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 8, borderRadius: 2 }} />
                    <View style={{ width: '60%', height: 8, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 6, borderRadius: 2 }} />

                    {/* Floating circle */}
                    <View style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: 'rgba(255,255,255,0.4)'
                    }} />
                </View>
            );
        }

        if (item.type === 'frame') {
            // Mock Avatar with Frame
            // Since we don't have the actual frame assets loaded here, we simulate
            // We use the item.icon if relevant, or just style borders based on ID logic
            return (
                <View style={styles.avatarPreviewContainer}>
                    <View style={[
                        styles.avatarCircle,
                        // Simulate styles based on name keywords for instant feedback
                        item.id.includes('square') && { borderRadius: 8 },
                        item.id.includes('double') && { borderWidth: 4, borderColor: colors.primaryLight },
                        item.id.includes('neon') && { borderWidth: 2, borderColor: '#00ff00', shadowColor: '#00ff00', shadowOpacity: 0.8, shadowRadius: 10 },
                    ]}>
                        <Ionicons name="person" size={24} color={colors.textSecondary} />
                    </View>
                    {/* Overlay Icon */}
                    <View style={styles.typeIconBadge}>
                        <Ionicons name={item.icon as any || "scan-outline"} size={12} color={colors.text} />
                    </View>
                </View>
            )
        }

        if (item.type === 'bubble') {
            return (
                <View style={[
                    styles.bubblePreview,
                    item.id.includes('square') && { borderRadius: 4 },
                    item.id.includes('round') && { borderRadius: 16 },
                    item.id.includes('cloud') && { borderRadius: 20, borderBottomLeftRadius: 0 }, // Rough cloud approx
                ]}>
                    <Text style={{ fontSize: 10, color: colors.text }}>Hello!</Text>
                </View>
            );
        }

        return (
            <View style={styles.genericPreview}>
                <Ionicons name={item.icon as any || "cube-outline"} size={32} color={colors.textSecondary} />
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={[styles.container, isEquipped && styles.containerEquipped]}
            onPress={() => onPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.previewContainer}>
                {renderPreview()}

                {isPremium && (
                    <View style={styles.premiumBadge}>
                        <Ionicons name="diamond" size={10} color="#FFF" />
                    </View>
                )}
            </View>

            <View style={styles.details}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

                <View style={styles.priceRow}>
                    {isOwned ? (
                        <View style={styles.ownedBadge}>
                            <Ionicons name="checkmark" size={12} color={colors.success} />
                            <Text style={styles.ownedText}>{isEquipped ? 'Équipé' : 'Acquis'}</Text>
                        </View>
                    ) : (
                        <View style={[styles.priceTag, !canAfford && styles.priceTagTooExpensive]}>
                            <Text style={[styles.priceText, !canAfford && { color: colors.error }]}>
                                {item.priceCredits}
                            </Text>
                            <Ionicons name="diamond-outline" size={12} color={canAfford ? colors.secondary : colors.error} />
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
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        width: '48%', // 2 columns with gap
        marginBottom: spacing.md,
    },
    containerEquipped: {
        borderColor: colors.success,
        borderWidth: 2,
    },
    previewContainer: {
        height: 100,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    previewBox: {
        width: 60,
        height: 80,
        borderRadius: 6,
        padding: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarPreviewContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border,
    },
    typeIconBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: colors.backgroundCard,
        borderRadius: 8,
        padding: 2,
    },
    bubblePreview: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderBottomLeftRadius: 2,
        maxWidth: '80%',
    },
    genericPreview: {
        opacity: 0.5,
    },
    premiumBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: colors.secondary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        justifyContent: 'space-between',
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    priceTagTooExpensive: {
        opacity: 0.8,
    },
    priceText: {
        color: colors.secondary,
        fontWeight: 'bold',
        fontSize: 13,
    },
    ownedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ownedText: {
        color: colors.success,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
