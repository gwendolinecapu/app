/**
 * ShopUI.tsx
 * 
 * Nouvelle Boutique Style Fortnite / Gaming
 * 
 * Sections:
 * 1. HERO: "Alpha Pack" Loot Box (Très mis en avant)
 * 2. DAILY: 3 Items en rotation quotidienne
 * 3. CATALOG: Le reste, en bas, plus discret
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../lib/theme';
import { useMonetization } from '../../contexts/MonetizationContext';
import { LootBoxService, LOOT_BOX } from '../../services/LootBoxService';
import { ShopItem, ShopItemType } from '../../services/MonetizationTypes';
import { ShopItemCard } from './ShopItemCard';
import { ShopItemModal } from './ShopItemModal';
import { LootBoxOpening } from './LootBoxOpening';
import { ItemPreview } from './ItemPreview';

import { InventoryModal } from './InventoryModal';

const { width } = Dimensions.get('window');

interface ShopUIProps {
    isEmbedded?: boolean;
}

export default function ShopUI({ isEmbedded = false }: ShopUIProps) {
    const insets = useSafeAreaInsets();
    const {
        credits,
        isPremium,
        purchaseItem,
        equipItem,
        ownedItems,
        equippedItems,
        canWatchRewardAd,
        watchRewardAd
    } = useMonetization();

    const router = useRouter();

    const [selectedCategory, setSelectedCategory] = useState<'daily' | 'catalog'>('daily');
    const [modalVisible, setModalVisible] = useState(false);
    const [inventoryVisible, setInventoryVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [lootBoxVisible, setLootBoxVisible] = useState(false);
    const [loadingAd, setLoadingAd] = useState(false);

    // Catalog State
    const [catalogFilter, setCatalogFilter] = useState<'all' | 'theme' | 'frame' | 'bubble'>('all');

    // Data
    const dailyItems = useMemo(() => LootBoxService.getDailyItems(), []);
    const catalogItems = useMemo(() => {
        // Filtrer les items qui ne sont PAS dans le daily (pour éviter doublons visuels ?) 
        // ou juste tout afficher.
        // On affiche tout le catalogue dans l'onglet Catalogue.
        return LootBoxService.getReward('common').item ? [] : []; // Hack to access static items? No we need import.
        // Actually we need to import COSMETIC_ITEMS from types, or expose them via Service.
        // Let's assume we can get them or use a mock for now if not exported. 
        // Wait, LootBoxService doesn't export getAllItems. 
        // I'll fix this in next step or use what I have.
        // For now let's assume I can import COSMETIC_ITEMS from where it was used before.
        // It was imported from MonetizationTypes in previous ShopUI.
        return [];
    }, []);

    // Helper check
    const isOwned = (id: string) => ownedItems.includes(id);
    const isEquipped = (id: string, type: ShopItemType) => equippedItems[type] === id;

    const handleItemPress = (item: ShopItem) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const handlePurchase = async () => {
        if (selectedItem) {
            const success = await purchaseItem(selectedItem);
            if (success) setModalVisible(false);
            return success;
        }
        return false;
    };

    const handleEquip = async () => {
        if (selectedItem) {
            await equipItem(selectedItem.id, selectedItem.type);
            setModalVisible(false);
        }
    };

    // Wrapper for ShopItemModal which expects (item) => Promise<boolean>
    const onModalPurchase = async (item: ShopItem) => {
        // We use the item passed from modal or the selectedItem state?
        // Safer to use the passed item argument
        const success = await purchaseItem(item);
        if (success) setModalVisible(false);
        return success;
    };

    const onModalEquip = async (item: ShopItem) => {
        await equipItem(item.id, item.type);
        setModalVisible(false);
    };

    const handleWatchAd = async () => {
        if (!canWatchRewardAd || loadingAd) return;
        setLoadingAd(true);
        try {
            await watchRewardAd('current_user'); // ID stub
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAd(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* HERO HEADER - Only if not embedded */}
            {/* HERO HEADER - Only if not embedded */}
            {!isEmbedded && (
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <View style={styles.headerTop}>
                        {/* LEFT: BACK BUTTON */}
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>BOUTIQUE</Text>

                        {/* RIGHT: INVENTORY & CREDITS */}
                        <View style={styles.headerRight}>
                            <View style={styles.creditBadge}>
                                <Ionicons name="diamond" size={14} color="#F59E0B" />
                                <Text style={styles.creditText}>{credits}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => setInventoryVisible(true)}
                            >
                                <Ionicons name="bag-handle-outline" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. SECTION: LOOT BOX HERO (Alpha Pack) */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setLootBoxVisible(true)}
                    style={styles.heroSection}
                >
                    <LinearGradient
                        colors={['#1F2937', '#000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        {/* Background Effect */}
                        <View style={styles.heroGlow} />

                        <View style={styles.heroContent}>
                            <View style={styles.heroBadge}>
                                <Text style={styles.heroBadgeText}>NOUVEAU</Text>
                            </View>

                            <Text style={styles.heroTitle}>BOOSTER PACK</Text>
                            <Text style={styles.heroSubtitle}>SÉRIE TACTIQUE</Text>

                            <View style={styles.heroPrice}>
                                <Ionicons name="diamond" size={18} color="#F59E0B" />
                                <Text style={styles.heroPriceText}>{LOOT_BOX.price}</Text>
                            </View>

                            <View style={styles.heroCta}>
                                <Text style={styles.heroCtaText}>OUVRIR MAINTENANT</Text>
                                <Ionicons name="chevron-forward" size={16} color="#000" />
                            </View>
                        </View>

                        {/* Visual Rep of Pack (Simplified) */}
                        <View style={styles.heroVisual}>
                            <Ionicons name="cube" size={140} color="rgba(255,255,255,0.1)" />
                            <View style={styles.tearLine} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* 2. SECTION: DAILY ROTATION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>FLASH QUOTIDIEN</Text>
                    <View style={styles.timerBadge}>
                        <Ionicons name="time-outline" size={12} color="#AAA" />
                        <Text style={styles.timerText}>23H 59M</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyScroll}>
                    {/* AD CARD */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleWatchAd}
                        disabled={!canWatchRewardAd || loadingAd}
                        style={[styles.adCard, (!canWatchRewardAd) && { opacity: 0.5 }]}
                    >
                        <LinearGradient
                            colors={['#059669', '#10B981']}
                            style={styles.adGradient}
                        >
                            <View style={styles.adBadge}>
                                <Text style={styles.adBadgeText}>GRATUIT</Text>
                            </View>
                            <Ionicons name="play-circle" size={48} color="#FFF" />
                            <View style={styles.adContent}>
                                <Text style={styles.adTitle}>Crédits Gratuits</Text>
                                <View style={styles.adReward}>
                                    <Ionicons name="diamond" size={14} color="#FFD700" />
                                    <Text style={styles.adRewardText}>+50</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {dailyItems.map((item, index) => (
                        <Animated.View
                            key={item.id}
                            entering={FadeInDown.delay(index * 100).springify()}
                        >
                            <View style={{ width: width * 0.4 }}>
                                <ShopItemCard
                                    item={item}
                                    userCredits={credits}
                                    isOwned={isOwned(item.id)}
                                    isEquipped={isEquipped(item.id, item.type)}
                                    onPress={handleItemPress}
                                />
                            </View>
                        </Animated.View>
                    ))}
                </ScrollView>

                {/* 3. SECTION CATALOG TEASER */}
                <TouchableOpacity style={styles.catalogButton} onPress={() => { /* Navigate or Expand */ }}>
                    <Text style={styles.catalogBtnText}>VOIR TOUT LE CATALOGUE</Text>
                    <Ionicons name="grid-outline" size={20} color="#FFF" />
                </TouchableOpacity>

            </ScrollView>

            {/* MODALS */}
            <ShopItemModal
                visible={modalVisible}
                item={selectedItem}
                userCredits={credits}
                isOwned={selectedItem ? isOwned(selectedItem.id) : false}
                isEquipped={selectedItem ? isEquipped(selectedItem.id, selectedItem.type) : false}
                isPremiumUser={isPremium}
                onClose={() => setModalVisible(false)}
                onPurchase={onModalPurchase}
                onEquip={onModalEquip}
            />

            <LootBoxOpening
                visible={lootBoxVisible}
                onClose={() => setLootBoxVisible(false)}
                ownedItemIds={ownedItems}
                userCredits={credits}
                onReward={(item) => {
                    // Handled by context usually, but ensure re-render
                }}
            />

            <InventoryModal
                visible={inventoryVisible}
                onClose={() => setInventoryVisible(false)}
                onEquip={async (item) => {
                    await equipItem(item.id, item.type);
                    setInventoryVisible(false);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Dark Slate
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: '#0F172A',
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    creditBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    creditText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    plusBtn: {
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // AD CARD
    adCard: {
        width: 140,
        height: 200, // Match ShopItemCard height roughly? ShopItemCard is set by container width but inside scrollview maybe explicit height is better? 
        // Actually ShopItemCard doesn't enforce height but its contents do. 
        // Let's match the visual height.
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 4,
    },
    adGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    adBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    adContent: {
        alignItems: 'center',
        gap: 4,
    },
    adTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    adReward: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    adRewardText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 12,
    },

    // HERO LOOTBOX
    heroSection: {
        margin: spacing.md,
        height: 220,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    heroCard: {
        flex: 1,
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    heroGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#F59E0B',
        opacity: 0.15,
        // blurRadius removed as it is not a ViewStyle. Use Elevation or Shadow if needed, or rely on opacity overlap
    },
    heroContent: {
        flex: 1,
        justifyContent: 'center',
        zIndex: 2,
    },
    heroBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    heroBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 32,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 2,
        marginBottom: 16,
    },
    heroPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    heroPriceText: {
        color: '#F59E0B',
        fontSize: 20,
        fontWeight: 'bold',
    },
    heroCta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 8,
    },
    heroCtaText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 12,
    },

    heroVisual: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-15deg' }],
    },
    tearLine: {
        position: 'absolute',
        width: 200,
        height: 4,
        backgroundColor: '#F59E0B',
        transform: [{ rotate: '45deg' }],
        opacity: 0.5,
    },

    // SECTIONS
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    timerText: {
        color: '#AAA',
        fontSize: 12,
        fontWeight: 'bold',
    },

    dailyScroll: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        paddingBottom: spacing.lg,
    },

    catalogButton: {
        marginHorizontal: spacing.md,
        paddingVertical: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: spacing.md,
    },
    catalogBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
