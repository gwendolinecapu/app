/**
 * Atelier - Personnalisation & Style
 * Boutique de cosmétiques (Thèmes, Cadres d'avatar, Bulles de chat)
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { PREMIUM_PACKS, CREDIT_PACKS } from '../../src/services/MonetizationTypes';
import { ShopItem } from '../../src/services/MonetizationTypes';

// Types for shop items
type ShopCategory = 'premium' | 'options' | 'themes' | 'frames' | 'bubbles';

// Helper to fix type issues with hardcoded data
const createItem = (data: any): ShopItem => data as ShopItem;

// Sample data - would come from Firestore in production
const THEMES: ShopItem[] = [
    createItem({ id: 'theme_midnight', name: 'Minuit', priceCredits: 0, preview: '#1a1a2e', type: 'theme' }),
    createItem({ id: 'theme_pastel', name: 'Pastel Dream', priceCredits: 150, preview: '#ffeef2', isPremium: true, type: 'theme' }),
    createItem({ id: 'theme_neon', name: 'Néon City', priceCredits: 200, preview: '#0ff0fc', isPremium: true, type: 'theme' }),
    createItem({ id: 'theme_forest', name: 'Forêt', priceCredits: 100, preview: '#2d5a27', type: 'theme' }),
];

const FRAMES: ShopItem[] = [
    createItem({ id: 'frame_none', name: 'Classique', priceCredits: 0, preview: '⭕', type: 'frame' }),
    createItem({ id: 'frame_rainbow', name: 'Arc-en-ciel', priceCredits: 100, preview: '🌈', type: 'frame' }),
    createItem({ id: 'frame_stars', name: 'Étoiles', priceCredits: 150, preview: '✨', isPremium: true, type: 'frame' }),
    createItem({ id: 'frame_hearts', name: 'Cœurs', priceCredits: 75, preview: '💕', type: 'frame' }),
];

const BUBBLES: ShopItem[] = [
    createItem({ id: 'bubble_default', name: 'Standard', priceCredits: 0, preview: '💬', type: 'bubble' }),
    createItem({ id: 'bubble_cloud', name: 'Nuage', priceCredits: 50, preview: '☁️', type: 'bubble' }),
    createItem({ id: 'bubble_pixel', name: 'Pixel Art', priceCredits: 120, preview: '🎮', isPremium: true, type: 'bubble' }),
    createItem({ id: 'bubble_glow', name: 'Lumineux', priceCredits: 180, preview: '💡', isPremium: true, type: 'bubble' }),
];

export default function ShopScreen() {
    const router = useRouter();
    const {
        credits,
        isPremium,
        purchaseIAP,
        restorePurchases,
        purchaseItem,
        loading
    } = useMonetization();
    const [activeCategory, setActiveCategory] = useState<ShopCategory>('premium');

    const getCategoryItems = (): any[] => {
        switch (activeCategory) {
            case 'premium': return PREMIUM_PACKS;
            case 'options': return CREDIT_PACKS;
            case 'themes': return THEMES;
            case 'frames': return FRAMES;
            case 'bubbles': return BUBBLES;
        }
    };

    const handlePurchase = async (item: ShopItem) => {
        triggerHaptic.selection();

        if (activeCategory === 'premium' || activeCategory === 'options') {
            // Handle IAP
            const iapId = item.revenueCatPackageId || item.priceIAP;
            if (iapId) {
                const success = await purchaseIAP(iapId);
                if (success) triggerHaptic.success();
                else triggerHaptic.error();
            }
            return;
        }

        // Handle Credit Purchase (Decorations)
        const success = await purchaseItem(item);
        if (success) {
            triggerHaptic.success();
        } else {
            triggerHaptic.error();
        }
    };

    const handleRestore = async () => {
        triggerHaptic.selection();
        await restorePurchases();
    };

    const renderCategoryTab = (category: ShopCategory, icon: string, label: string) => (
        <TouchableOpacity
            style={[styles.categoryTab, activeCategory === category && styles.categoryTabActive]}
            onPress={() => {
                triggerHaptic.light();
                setActiveCategory(category);
            }}
        >
            <Ionicons
                name={icon as any}
                size={20}
                color={activeCategory === category ? colors.primary : colors.textMuted}
            />
            <Text style={[
                styles.categoryTabText,
                activeCategory === category && styles.categoryTabTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderItem = (item: any) => {
        // Adapt display based on category
        const isIAP = activeCategory === 'premium' || activeCategory === 'options';
        const priceDisplay = isIAP ? `${item.priceFiat}€` : item.price === 0 ? 'Gratuit' : item.price;
        const iconName = isIAP ? (activeCategory === 'premium' ? 'diamond' : 'star') : 'brush'; // naive

        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, item.featured && styles.itemCardFeatured]}
                onPress={() => handlePurchase(item as ShopItem)}
                activeOpacity={0.8}
                disabled={loading}
            >
                {item.featured && <View style={styles.featuredBadge}><Text style={styles.featuredText}>Top</Text></View>}

                <View style={[styles.itemPreview, { backgroundColor: item.preview?.startsWith('#') ? item.preview : colors.backgroundLight }]}>
                    {/* Naive preview logic */}
                    {activeCategory === 'premium' ?
                        <Ionicons name="diamond" size={32} color={colors.primary} /> :
                        activeCategory === 'options' ?
                            <Ionicons name="star" size={32} color="#FFD700" /> :
                            (!item.preview?.startsWith('#') && <Text style={styles.itemPreviewEmoji}>{item.preview}</Text>)
                    }
                </View>

                <Text style={styles.itemName}>{item.name}</Text>

                <View style={styles.priceContainer}>
                    {!isIAP && item.price > 0 && <Ionicons name="star" size={14} color={colors.primary} />}
                    <Text style={[styles.priceText, isIAP && { fontSize: 14 }]}>
                        {priceDisplay}
                    </Text>
                    {item.duration === 30 && <Text style={{ fontSize: 10, color: colors.textMuted }}>/mois</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Boutique</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                        <Text style={styles.restoreButtonText}>Restaurer</Text>
                    </TouchableOpacity>
                    <View style={styles.creditsContainer}>
                        <Ionicons name="star" size={16} color={colors.primary} />
                        <Text style={styles.creditsText}>{credits}</Text>
                    </View>
                </View>
            </View>

            {/* Daily Reward Banner */}
            <TouchableOpacity style={styles.dailyRewardBanner} activeOpacity={0.9}>
                <View style={styles.dailyRewardIcon}>
                    <Ionicons name="gift" size={24} color="#fff" />
                </View>
                <View style={styles.dailyRewardContent}>
                    <Text style={styles.dailyRewardTitle}>Récompense quotidienne</Text>
                    <Text style={styles.dailyRewardSubtitle}>+25 crédits disponibles !</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Category Tabs */}
            <View style={styles.categoryTabs}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                    {renderCategoryTab('premium', 'diamond', 'Premium')}
                    {renderCategoryTab('options', 'add-circle', 'Crédits')}
                    {renderCategoryTab('themes', 'color-palette-outline', 'Thèmes')}
                    {renderCategoryTab('frames', 'image-outline', 'Cadres')}
                    {renderCategoryTab('bubbles', 'chatbubble-outline', 'Bulles')}
                </ScrollView>
            </View>

            {/* Items Grid */}
            <ScrollView
                style={styles.itemsContainer}
                contentContainerStyle={styles.itemsGrid}
                showsVerticalScrollIndicator={false}
            >
                {getCategoryItems().map(renderItem)}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        padding: spacing.xs,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    creditsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    creditsText: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    dailyRewardBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.primary + '40',
    },
    dailyRewardIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    dailyRewardContent: {
        flex: 1,
    },
    dailyRewardTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    dailyRewardSubtitle: {
        ...typography.caption,
        color: colors.primary,
    },
    categoryTabs: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        gap: spacing.xs,
    },
    categoryTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        gap: 6,
    },
    categoryTabActive: {
        backgroundColor: colors.primary + '20',
    },
    categoryTabText: {
        ...typography.caption,
        color: colors.textMuted,
        fontWeight: '500',
    },
    categoryTabTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    itemsContainer: {
        flex: 1,
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.sm,
    },
    itemCard: {
        width: '47%',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        alignItems: 'center',
    },
    itemPreview: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    itemPreviewEmoji: {
        fontSize: 36,
    },
    premiumBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.backgroundCard,
        borderRadius: 10,
        padding: 4,
    },
    itemName: {
        ...typography.body,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    freeText: {
        ...typography.caption,
        color: colors.success,
        fontWeight: '600',
    },
    priceText: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.text,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    restoreButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    restoreButtonText: {
        ...typography.caption,
        color: colors.textMuted,
        textDecorationLine: 'underline',
    },
    itemCardFeatured: {
        borderColor: colors.primary,
        borderWidth: 1.5,
        backgroundColor: colors.backgroundCard,
    },
    featuredBadge: {
        position: 'absolute',
        top: -8,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 10,
    },
    featuredText: {
        ...typography.caption,
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

