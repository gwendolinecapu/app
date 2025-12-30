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

// Types for shop items
type ShopCategory = 'themes' | 'frames' | 'bubbles';

interface ShopItem {
    id: string;
    name: string;
    price: number;
    preview: string; // Color or emoji for preview
    isPremium?: boolean;
}

// Sample data - would come from Firestore in production
const THEMES: ShopItem[] = [
    { id: 'theme_midnight', name: 'Minuit', price: 0, preview: '#1a1a2e' },
    { id: 'theme_pastel', name: 'Pastel Dream', price: 150, preview: '#ffeef2', isPremium: true },
    { id: 'theme_neon', name: 'Néon City', price: 200, preview: '#0ff0fc', isPremium: true },
    { id: 'theme_forest', name: 'Forêt', price: 100, preview: '#2d5a27' },
];

const FRAMES: ShopItem[] = [
    { id: 'frame_none', name: 'Classique', price: 0, preview: '⭕' },
    { id: 'frame_rainbow', name: 'Arc-en-ciel', price: 100, preview: '🌈' },
    { id: 'frame_stars', name: 'Étoiles', price: 150, preview: '✨', isPremium: true },
    { id: 'frame_hearts', name: 'Cœurs', price: 75, preview: '💕' },
];

const BUBBLES: ShopItem[] = [
    { id: 'bubble_default', name: 'Standard', price: 0, preview: '💬' },
    { id: 'bubble_cloud', name: 'Nuage', price: 50, preview: '☁️' },
    { id: 'bubble_pixel', name: 'Pixel Art', price: 120, preview: '🎮', isPremium: true },
    { id: 'bubble_glow', name: 'Lumineux', price: 180, preview: '💡', isPremium: true },
];

export default function ShopScreen() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState<ShopCategory>('themes');
    const [userCredits] = useState(250); // Would come from user data

    const getCategoryItems = (): ShopItem[] => {
        switch (activeCategory) {
            case 'themes': return THEMES;
            case 'frames': return FRAMES;
            case 'bubbles': return BUBBLES;
        }
    };

    const handlePurchase = (item: ShopItem) => {
        triggerHaptic.selection();
        if (item.price === 0) {
            // Free item - apply immediately
            triggerHaptic.success();
        } else if (userCredits >= item.price) {
            // Purchase logic would go here
            triggerHaptic.success();
        } else {
            // Not enough credits
            triggerHaptic.error();
        }
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

    const renderItem = (item: ShopItem) => (
        <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => handlePurchase(item)}
            activeOpacity={0.8}
        >
            <View style={[styles.itemPreview, { backgroundColor: item.preview.startsWith('#') ? item.preview : colors.backgroundLight }]}>
                {!item.preview.startsWith('#') && (
                    <Text style={styles.itemPreviewEmoji}>{item.preview}</Text>
                )}
                {item.isPremium && (
                    <View style={styles.premiumBadge}>
                        <Ionicons name="diamond" size={12} color="#FFD700" />
                    </View>
                )}
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.priceContainer}>
                {item.price === 0 ? (
                    <Text style={styles.freeText}>Gratuit</Text>
                ) : (
                    <>
                        <Ionicons name="star" size={14} color={colors.primary} />
                        <Text style={styles.priceText}>{item.price}</Text>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Atelier</Text>
                <View style={styles.creditsContainer}>
                    <Ionicons name="star" size={16} color={colors.primary} />
                    <Text style={styles.creditsText}>{userCredits}</Text>
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
                {renderCategoryTab('themes', 'color-palette-outline', 'Thèmes')}
                {renderCategoryTab('frames', 'image-outline', 'Cadres')}
                {renderCategoryTab('bubbles', 'chatbubble-outline', 'Bulles')}
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
});

