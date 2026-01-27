import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { spacing } from '../../lib/theme';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { LootBoxService } from '../../services/LootBoxService';
import CreditService from '../../services/CreditService';
import { ShopItem, ShopItemType, LootBoxTier, PACK_TIERS, PITY_CONFIG } from '../../services/MonetizationTypes';
import { ShopItemCard } from './ShopItemCard';
import { ShopItemModal } from './ShopItemModal';
import R6PackOpening from './R6PackOpening';
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
        pityProgress,
    } = useMonetization();
    const { currentAlter } = useAuth();

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
            {/* HERO BANNER / WELCOME */}
            <View style={styles.heroSection}>
                <Text style={styles.heroWelcome}>Bienvenue dans la</Text>
                <Text style={styles.heroTitle}>Boutique Plural</Text>
                <Text style={styles.heroSubtitle}>Personnalisez votre expérience</Text>
            </View>

            {/* 1. EXTENSION PACKS (Redesigned) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>PACKS D'EXTENSION</Text>
                    <TouchableOpacity style={styles.infoBadge} onPress={() => { setDropRateTier('basic'); setDropRateVisible(true); }}>
                        <Ionicons name="information-circle" size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.infoText}>Probabilités</Text>
                    </TouchableOpacity>
                </View>

                {/* PITY WIDGET */}
                <View style={styles.pityContainer}>
                    <View style={styles.pityRow}>
                        <View style={styles.pityInfo}>
                            <Text style={styles.pityLabel}>Prochain ÉPIQUE</Text>
                            <Text style={styles.pityValue}>
                                {Math.max(0, PITY_CONFIG.epicGuarantee - pityProgress.epicCounter)} ouvertures
                            </Text>
                        </View>
                        <View style={styles.pityBarBg}>
                            <View
                                style={[
                                    styles.pityBarFill,
                                    { width: `${(pityProgress.epicCounter / PITY_CONFIG.epicGuarantee) * 100}%`, backgroundColor: '#A855F7' }
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.pityRow}>
                        <View style={styles.pityInfo}>
                            <Text style={styles.pityLabel}>Prochain LÉGENDAIRE</Text>
                            <Text style={styles.pityValue}>
                                {Math.max(0, PITY_CONFIG.legendaryGuarantee - pityProgress.legendaryCounter)} ouvertures
                            </Text>
                        </View>
                        <View style={styles.pityBarBg}>
                            <View
                                style={[
                                    styles.pityBarFill,
                                    { width: `${(pityProgress.legendaryCounter / PITY_CONFIG.legendaryGuarantee) * 100}%`, backgroundColor: '#EAB308' }
                                ]}
                            />
                        </View>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boosterRow}>
                    {(['basic', 'standard', 'elite'] as LootBoxTier[]).map(tier => {
                        const pack = PACK_TIERS[tier];
                        const visuals = {
                            basic: {
                                color: ['#3F3F46', '#18181B'],
                                borderColor: '#52525B',
                                icon: 'cube-outline',
                                glow: 'transparent',
                                label: 'BASIQUE',
                                labelColor: '#A1A1AA'
                            },
                            standard: {
                                color: ['#3B82F6', '#1D4ED8'],
                                borderColor: '#60A5FA',
                                icon: 'diamond',
                                glow: 'rgba(59, 130, 246, 0.4)',
                                label: 'STANDARD',
                                labelColor: '#93C5FD'
                            },
                            elite: {
                                color: ['#F59E0B', '#B45309'],
                                borderColor: '#FBBF24',
                                icon: 'star',
                                glow: 'rgba(245, 158, 11, 0.5)',
                                label: 'ELITE',
                                labelColor: '#FDE68A'
                            }
                        }[tier];

                        return (
                            <TouchableOpacity
                                key={tier}
                                style={[styles.boosterCard, { borderColor: visuals.borderColor, shadowColor: visuals.borderColor }]}
                                onPress={() => handleBuyPack(tier)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={visuals.color as any}
                                    style={styles.boosterGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {/* Shine effect for premium feel */}
                                    {tier !== 'basic' && (
                                        <View style={styles.shineOverlay} />
                                    )}

                                    <View style={styles.boosterHeader}>
                                        <Text style={[styles.boosterTier, { color: visuals.labelColor }]}>{visuals.label}</Text>
                                        {tier === 'elite' && <Ionicons name="flame" size={12} color="#FBBF24" />}
                                    </View>

                                    <View style={styles.boosterCenter}>
                                        <View style={[styles.boosterIconCircle, {
                                            borderColor: visuals.borderColor,
                                            shadowColor: visuals.borderColor,
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: tier === 'basic' ? 0 : 0.8,
                                            shadowRadius: 12,
                                        }]}>
                                            <Ionicons name={visuals.icon as any} size={32} color="#FFF" />
                                        </View>
                                        <Text style={styles.boosterName}>{pack.name.replace(' Pack', '')}</Text>
                                        <Text style={styles.boosterCards}>{pack.cardCount.min}-{pack.cardCount.max} Cartes</Text>
                                        {tier === 'elite' && (
                                            <Text style={[styles.boosterCards, { color: '#FBBF24', fontSize: 10, marginTop: -4 }]}>
                                                +10% DUST • 5% SHINY
                                            </Text>
                                        )}
                                    </View>

                                    <View style={[styles.boosterPriceBtn, tier === 'elite' && { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                                        <Ionicons name="diamond" size={12} color={tier === 'elite' ? '#FBBF24' : '#FCD34D'} />
                                        <Text style={[styles.boosterPriceText, tier === 'elite' && { color: '#FBBF24' }]}>{pack.price}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* 2. DAILY FLASH (Redesigned) */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>FLASH QUOTIDIEN</Text>
                    <Text style={styles.sectionSubtitle}>Mise à jour dans {timeLeft.hours}h {timeLeft.minutes}m</Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyScroll}>
                {/* AD CARD (Redesigned) */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleWatchAd}
                    disabled={!canWatchRewardAd || loadingAd}
                    style={styles.adCardNew}
                >
                    <LinearGradient
                        colors={canWatchRewardAd ? ['#10B981', '#059669'] : ['#374151', '#1F2937']}
                        style={styles.adGradientNew}
                    >
                        <View style={styles.adContentNew}>
                            {canWatchRewardAd ? (
                                <>
                                    <View style={styles.adIconCircle}>
                                        <Ionicons name="play" size={24} color="#10B981" />
                                    </View>
                                    <View>
                                        <Text style={styles.adTitleNew}>Cadeau Gratuit</Text>
                                        <Text style={styles.adSubNew}>Regarder une pub</Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={[styles.adIconCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                        <Ionicons name="time-outline" size={24} color="#6B7280" />
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={[styles.adTitleNew, { color: '#6B7280', fontSize: 14 }]}>Déjà récupéré</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                                            <Ionicons name="refresh" size={14} color="#9CA3AF" />
                                            <Text style={[styles.adSubNew, { color: '#9CA3AF' }]}>Demain</Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>

                        {canWatchRewardAd && (
                            <View style={styles.adRewardBadge}>
                                <Ionicons name="diamond" size={12} color="#FFD700" />
                                <Text style={styles.adRewardTextNew}>+50</Text>
                            </View>
                        )}

                        {loadingAd && (
                            <View style={styles.loadingOverlay}>
                                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                                <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
                                    <Ionicons name="sync" size={24} color="#FFF" />
                                </Animated.View>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* ITEMS */}
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

            <View style={{ height: 120 }} />

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
                <R6PackOpening
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
    heroSection: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    heroWelcome: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(255, 158, 11, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
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
    sectionSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    infoText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
    },
    boosterRow: {
        paddingHorizontal: spacing.md,
        gap: spacing.lg,
        paddingBottom: 20, // space for shadows
    },
    boosterCard: {
        width: 140,
        height: 200,
        borderRadius: 20,
        borderWidth: 1,
        // Shadow handled by style prop in render
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
    boosterGradient: {
        flex: 1,
        borderRadius: 19, // inner radius
        padding: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    boosterHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    boosterTier: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    boosterCenter: {
        alignItems: 'center',
        gap: 8,
    },
    boosterIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        marginBottom: 4,
    },
    boosterName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    boosterCards: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    boosterPriceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    boosterPriceText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    shineOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderTopLeftRadius: 19,
        borderTopRightRadius: 19,
    },
    dailyScroll: {
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        paddingRight: 40,
    },
    pityContainer: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        gap: 8,
    },
    pityRow: {
        gap: 4,
    },
    pityInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pityLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    pityValue: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    pityBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    pityBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    adCardNew: {
        width: 160,
        height: 220, // Match ShopItemCard height
        borderRadius: 16,
        overflow: 'hidden',
    },
    adGradientNew: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    adContentNew: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    adIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    adTitleNew: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    adSubNew: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        textAlign: 'center',
    },
    adRewardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    adRewardTextNew: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
});
