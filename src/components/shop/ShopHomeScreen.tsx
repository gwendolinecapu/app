import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, spacing } from '../../lib/theme';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { LootBoxService } from '../../services/LootBoxService';
import CreditService from '../../services/CreditService';
import { ShopItem, ShopItemType, COSMETIC_ITEMS, LootBoxTier, PACK_TIERS } from '../../services/MonetizationTypes';
import { ShopItemCard } from './ShopItemCard';
import { ShopItemModal } from './ShopItemModal';
import LootBoxOpening from './LootBoxOpening';
import DropRateModal from './DropRateModal';

const { width } = Dimensions.get('window');

export function ShopHomeScreen() {
    const {
        credits,
        isPremium,
        canWatchRewardAd,
        watchRewardAd,
        ownedItems,
        equippedItems,
        purchaseItem,
        equipItem,
        currentAlter
    } = useMonetization();

    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });
    const [loadingAd, setLoadingAd] = useState(false);

    // LootBox State
    const [openingTier, setOpeningTier] = useState<LootBoxTier | null>(null);
    const [lootBoxVisible, setLootBoxVisible] = useState(false);
    const [dropRateVisible, setDropRateVisible] = useState(false);
    const [dropRateTier, setDropRateTier] = useState<LootBoxTier>('basic');

    // Item Modal State
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Timer Logic
    const updateCountdown = useCallback(() => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ hours, minutes });
    }, []);

    useEffect(() => {
        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, [updateCountdown]);

    const dailyItems = useMemo(() => LootBoxService.getDailyItems(), []);

    const handleBuyPack = async (tier: LootBoxTier) => {
        const pack = PACK_TIERS[tier];
        if (!currentAlter) return;

        if (credits < pack.price) {
            Alert.alert("Pas assez de crédits", `Il te manque ${pack.price - credits} crédits !`);
            return;
        }

        try {
            // @ts-ignore
            const success = await CreditService.deductCredits(
                currentAlter.id,
                pack.price,
                'purchase_lootbox'
            );

            if (success) {
                setOpeningTier(tier);
                setLootBoxVisible(true);
            } else {
                Alert.alert("Erreur", "La transaction a échoué.");
            }
        } catch (e) {
            console.error("Purchase error", e);
            Alert.alert("Erreur", "Erreur lors de l'achat.");
        }
    };

    const handleWatchAd = async () => {
        if (!canWatchRewardAd || loadingAd) return;
        setLoadingAd(true);
        try {
            await watchRewardAd('current_user');
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAd(false);
        }
    };

    const handleItemPress = (item: ShopItem) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const isOwned = (id: string) => ownedItems.includes(id);
    const isEquipped = (id: string, type: ShopItemType) => equippedItems[type] === id;

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* 1. FEATURED HERO (Top Pack) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>PACKS EXTENSION</Text>
                    <View style={styles.badgeNew}>
                        <Text style={styles.badgeNewText}>SERIE 1</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boosterRow}>
                    {(['basic', 'standard', 'elite'] as LootBoxTier[]).map(tier => {
                        const pack = PACK_TIERS[tier];
                        const visuals = {
                            basic: { color: ['#9CA3AF', '#4B5563'], icon: 'cube-outline' },
                            standard: { color: ['#60A5FA', '#2563EB'], icon: 'layers-outline' },
                            elite: { color: ['#FCD34D', '#D97706'], icon: 'star' }
                        }[tier];

                        return (
                            <TouchableOpacity
                                key={tier}
                                style={styles.boosterCard}
                                onPress={() => handleBuyPack(tier)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={visuals.color as any}
                                    style={styles.boosterGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.boosterIcon}>
                                        <Ionicons name={visuals.icon as any} size={32} color="white" />
                                    </View>
                                    <Text style={styles.boosterName}>{pack.name}</Text>
                                    <Text style={styles.boosterCards}>{pack.cardCount.min}-{pack.cardCount.max} Cartes</Text>

                                    <TouchableOpacity
                                        style={styles.dropRateBtn}
                                        onPress={() => {
                                            setDropRateTier(tier);
                                            setDropRateVisible(true);
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
                                        <Text style={styles.dropRateBtnText}>Taux</Text>
                                    </TouchableOpacity>

                                    <View style={styles.boosterPrice}>
                                        <Ionicons name="diamond" size={12} color="white" />
                                        <Text style={styles.boosterPriceText}>{pack.price}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* 2. DAILY ITEMS */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>FLASH QUOTIDIEN</Text>
                <View style={styles.timerBadge}>
                    <Ionicons name="time-outline" size={12} color="#AAA" />
                    <Text style={styles.timerText}>
                        {timeLeft.hours}H {timeLeft.minutes.toString().padStart(2, '0')}M
                    </Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyScroll}>
                {/* AD CARD */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleWatchAd}
                    disabled={!canWatchRewardAd || loadingAd}
                    style={styles.adCard}
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

                        {loadingAd && (
                            <View style={styles.adOverlay}>
                                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                                <Ionicons name="hourglass-outline" size={32} color="#FFF" />
                            </View>
                        )}

                        {!canWatchRewardAd && !loadingAd && (
                            <View style={styles.adOverlay}>
                                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                                <Ionicons name="checkmark-circle" size={40} color="#FFF" />
                                <Text style={styles.adOverlayText}>REVIENS DEMAIN</Text>
                            </View>
                        )}
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
                                avatarUrl={currentAlter?.avatar_url}
                            />
                        </View>
                    </Animated.View>
                ))}
            </ScrollView>

            <View style={{ height: 100 }} />

            {/* MODALS */}
            <ShopItemModal
                visible={modalVisible}
                item={selectedItem}
                userCredits={credits}
                isOwned={selectedItem ? isOwned(selectedItem.id) : false}
                isEquipped={selectedItem ? isEquipped(selectedItem.id, selectedItem.type) : false}
                isPremiumUser={isPremium}
                onClose={() => setModalVisible(false)}
                onPurchase={async (item) => {
                    if (!currentAlter) return false;
                    const s = await purchaseItem(item, currentAlter.id);
                    if (s) setModalVisible(false);
                    return s;
                }}
                onEquip={async (item) => {
                    await equipItem(item.id, item.type);
                    setModalVisible(false);
                }}
            />

            {openingTier && (
                <LootBoxOpening
                    visible={lootBoxVisible}
                    tier={openingTier}
                    onClose={() => {
                        setLootBoxVisible(false);
                        setOpeningTier(null);
                    }}
                />
            )}

            <DropRateModal
                visible={dropRateVisible}
                tier={dropRateTier}
                onClose={() => setDropRateVisible(false)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    badgeNew: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeNewText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    timerText: {
        color: '#FFF',
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },
    boosterRow: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
    },
    boosterCard: {
        width: 130,
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
    },
    boosterGradient: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    boosterIcon: {
        marginTop: 10,
    },
    boosterName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    boosterCards: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
    },
    dropRateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    dropRateBtnText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
    },
    boosterPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        width: '100%',
        justifyContent: 'center',
    },
    boosterPriceText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    dailyScroll: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        paddingRight: 40,
    },
    adCard: {
        width: 140,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 4,
        backgroundColor: '#10B981',
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
        backgroundColor: 'rgba(0,0,0,0.3)',
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
    adOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 10,
        gap: 8,
    },
    adOverlayText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 8,
    },
});
