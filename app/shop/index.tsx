/**
 * Atelier - Personnalisation & Style (Discord Style)
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { ShopItem } from '../../src/services/MonetizationTypes';
import { SHOP_ITEMS } from '../../src/services/ShopData';

// Types for shop items
type ShopCategory = 'themes' | 'frames' | 'bubbles';

const { width } = Dimensions.get('window');

export default function ShopScreen() {
    const router = useRouter();
    const {
        credits,
        addCredits,
        isPremium,
        purchaseItem,
        presentPaywall,
        loading
    } = useMonetization();
    const [activeCategory, setActiveCategory] = useState<ShopCategory>('themes');
    const [adLoading, setAdLoading] = useState(false);

    const getCategoryItems = (): ShopItem[] => {
        return SHOP_ITEMS[activeCategory] || [];
    };

    const handlePurchase = async (item: ShopItem) => {
        triggerHaptic.selection();

        if (item.isPremium && !isPremium) {
            Alert.alert(
                "Réservé au Premium",
                "Cet objet est exclusif aux membres Plural Connect Premium. Profitez-en pour passer au niveau supérieur !",
                [
                    { text: "Plus tard", style: "cancel" },
                    { text: "Voir les offres", onPress: () => presentPaywall() }
                ]
            );
            return;
        }

        if (item.isPremium && isPremium) {
            // Already owned/unlocked by premium logic, but let's simulate 'equip' or 'purchase for 0' if needed
            // For now, assume it's "Free with Premium" so we just confirm
            Alert.alert("Premium", "Cet objet est inclus dans votre abonnement !");
            // Logic to equip would go here
            return;
        }

        // Credit Purchase
        const success = await purchaseItem(item);
        if (success) {
            triggerHaptic.success();
            Alert.alert("Succès", `Vous avez obtenu : ${item.name}`);
        } else {
            triggerHaptic.error();
            // Alert handled by context usually, but safety check
        }
    };

    const handleWatchAd = async () => {
        triggerHaptic.selection();
        setAdLoading(true);
        // Simulate Ad
        setTimeout(() => {
            setAdLoading(false);
            addCredits(50, 'reward_ad');
            triggerHaptic.success();
            Alert.alert("Récompense", "Merci d'avoir regardé ! +50 crédits ajoutés.");
        }, 2000);
    };

    const renderCategoryTab = (category: ShopCategory, label: string) => (
        <TouchableOpacity
            style={[styles.categoryTab, activeCategory === category && styles.categoryTabActive]}
            onPress={() => {
                triggerHaptic.light();
                setActiveCategory(category);
            }}
        >
            <Text style={[
                styles.categoryTabText,
                activeCategory === category && styles.categoryTabTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderItem = (item: ShopItem) => {
        const isUnlocked = item.isPremium && isPremium;

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handlePurchase(item)}
                activeOpacity={0.9}
                disabled={loading}
            >
                <View style={[styles.itemPreview, { backgroundColor: item.preview?.startsWith('#') ? item.preview : '#333' }]}>
                    {item.type === 'frame' && <Text style={{ fontSize: 40 }}>👤</Text>}
                    {item.type === 'bubble' && <Text style={{ fontSize: 30 }}>💬</Text>}
                    {/* Overlay Frame/Preview if needed */}
                    {item.type === 'frame' && <Text style={{ position: 'absolute', fontSize: 60 }}>{item.preview}</Text>}
                    {item.type === 'bubble' && <Text style={{ position: 'absolute', fontSize: 20 }}>{item.preview}</Text>}
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>

                    <View style={styles.priceRow}>
                        {item.isPremium ? (
                            <View style={[styles.badge, isUnlocked ? styles.badgeOwned : styles.badgePremium]}>
                                <Ionicons name="diamond" size={10} color="white" />
                                <Text style={styles.badgeText}>{isUnlocked ? "Inclus" : "Premium"}</Text>
                            </View>
                        ) : (
                            <View style={styles.badge}>
                                <Ionicons name="star" size={10} color={colors.primary} />
                                <Text style={[styles.badgeText, { color: colors.primary }]}>{item.priceCredits}</Text>
                            </View>
                        )}
                        {item.isPremium && !isPremium && (
                            <Text style={styles.priceSub}>ou {item.priceCredits * 2}★</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Header */}
                <SafeAreaView edges={['top']} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.creditsPill}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.creditsText}>{credits}</Text>
                    </View>
                </SafeAreaView>

                {/* Premium Banner (Nitro Style) */}
                <TouchableOpacity onPress={() => presentPaywall()} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#5865F2', '#EB459E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.premiumBanner}
                    >
                        <View style={styles.bannerContent}>
                            <View>
                                <Text style={styles.bannerTitle}>Plural Premium</Text>
                                <Text style={styles.bannerSubtitle}>Débloquez tout. Exprimez-vous.</Text>
                            </View>
                            <View style={styles.bannerButton}>
                                <Text style={styles.bannerButtonText}>Voir les offres</Text>
                            </View>
                        </View>
                        {/* Abstract Shapes (Circles) */}
                        <View style={[styles.shape, { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', top: -20, right: -20 }]} />
                        <View style={[styles.shape, { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', bottom: 10, left: 20 }]} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Categories */}
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
                        {renderCategoryTab('themes', 'Thèmes')}
                        {renderCategoryTab('frames', 'Cadres')}
                        {renderCategoryTab('bubbles', 'Bulles')}
                    </ScrollView>
                </View>

                {/* Items Grid */}
                <View style={styles.grid}>
                    {getCategoryItems().map(renderItem)}
                </View>

                {/* Rewarded Ad CTA */}
                <TouchableOpacity style={styles.adCard} onPress={handleWatchAd} disabled={adLoading}>
                    <LinearGradient
                        colors={['#23272A', '#2C2F33']}
                        style={styles.adGradient}
                    >
                        <View style={styles.adIcon}>
                            <Ionicons name={adLoading ? "hourglass" : "videocam"} size={24} color={colors.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.adTitle}>Besoin de crédits ?</Text>
                            <Text style={styles.adSubtitle}>Regarder une pub pour +50★</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#202225', // Discord Dark
    },
    scrollContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    creditsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    creditsText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    premiumBanner: {
        margin: spacing.md,
        height: 140,
        borderRadius: 16,
        padding: spacing.lg,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 4,
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
    },
    bannerButton: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        elevation: 5,
    },
    bannerButtonText: {
        color: '#5865F2',
        fontWeight: 'bold',
        fontSize: 12,
    },
    shape: {
        position: 'absolute',
    },
    tabsContainer: {
        marginBottom: spacing.md,
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#2F3136',
    },
    categoryTabActive: {
        backgroundColor: '#5865F2',
    },
    categoryTabText: {
        color: '#B9BBBE',
        fontWeight: '600',
    },
    categoryTabTextActive: {
        color: '#FFF',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: spacing.md,
    },
    itemCard: {
        width: (width - spacing.md * 3) / 2, // 2 columns
        backgroundColor: '#2F3136',
        borderRadius: 12,
        overflow: 'hidden',
    },
    itemPreview: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        padding: spacing.sm,
    },
    itemName: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    itemDesc: {
        color: '#72767D',
        fontSize: 10,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    badgePremium: {
        backgroundColor: '#EB459E',
    },
    badgeOwned: {
        backgroundColor: '#3BA55C',
    },
    badgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 10,
    },
    priceSub: {
        color: '#72767D',
        fontSize: 10,
    },
    adCard: {
        margin: spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: spacing.xl,
    },
    adGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    adIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#202225',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    adSubtitle: {
        color: '#B9BBBE',
        fontSize: 12,
    },
});

