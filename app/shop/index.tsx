/**
 * Shop Screen - Boutique de crédits et décorations
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { CreditBalance } from '../../src/components/CreditBalance';
import { RewardedAdButton } from '../../src/components/ads';
import {
    ShopItem,
    Decoration,
    RARITY_COLORS,
    DecorationRarity,
} from '../../src/services/MonetizationTypes';
import { DECORATIONS_CATALOG } from '../../src/services/DecorationService';

type Tab = 'credits' | 'premium' | 'decorations';

export default function ShopScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('credits');
    const {
        credits,
        shopItems,
        creditPacks,
        purchaseItem,
        ownedDecorations,
        purchaseDecoration,
        canClaimDaily,
        currentStreak,
        claimDailyLogin,
        isAdFree,
        isPremium,
        tier,
    } = useMonetization();

    // ==================== DAILY CLAIM ====================

    const handleClaimDaily = async () => {
        const result = await claimDailyLogin();
        if (result.amount > 0) {
            let message = `+${result.amount} crédits ! Streak: ${result.streak} jours`;
            if (result.streakBonus > 0) {
                message += `\n🎉 Bonus streak: +${result.streakBonus} crédits !`;
            }
            Alert.alert('Bonus quotidien', message);
        }
    };

    // ==================== PURCHASE ====================

    const handlePurchaseItem = async (item: ShopItem) => {
        if (!item.priceCredits) return;

        if (credits < item.priceCredits) {
            Alert.alert('Crédits insuffisants', 'Gagne des crédits ou achète des packs !');
            return;
        }

        Alert.alert(
            'Confirmer l\'achat',
            `Acheter ${item.name} pour ${item.priceCredits} crédits ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Acheter',
                    onPress: async () => {
                        const success = await purchaseItem(item);
                        if (success) {
                            Alert.alert('Achat réussi !', `${item.name} activé.`);
                        }
                    },
                },
            ]
        );
    };

    const handlePurchaseDecoration = async (decoration: Decoration) => {
        if (credits < decoration.priceCredits) {
            Alert.alert('Crédits insuffisants', 'Gagne des crédits ou achète des packs !');
            return;
        }

        Alert.alert(
            'Confirmer l\'achat',
            `Acheter ${decoration.name} pour ${decoration.priceCredits} crédits ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Acheter',
                    onPress: async () => {
                        const success = await purchaseDecoration(decoration.id);
                        if (success) {
                            Alert.alert('Achat réussi !', `${decoration.name} ajouté à ta collection.`);
                        }
                    },
                },
            ]
        );
    };

    // ==================== RENDER TABS ====================

    const renderCreditsTab = () => (
        <>
            {/* Bonus quotidien */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎁 Bonus Quotidien</Text>

                <TouchableOpacity
                    style={[
                        styles.dailyCard,
                        !canClaimDaily && styles.dailyCardClaimed,
                    ]}
                    onPress={handleClaimDaily}
                    disabled={!canClaimDaily}
                >
                    <View style={styles.dailyLeft}>
                        <Text style={styles.dailyIcon}>📅</Text>
                        <View>
                            <Text style={styles.dailyTitle}>
                                {canClaimDaily ? 'Récupère tes crédits !' : 'Déjà récupéré'}
                            </Text>
                            <Text style={styles.dailySubtitle}>
                                {isPremium ? '+25 crédits' : '+10 crédits'} · Streak: {currentStreak}j
                            </Text>
                        </View>
                    </View>
                    {canClaimDaily && (
                        <View style={styles.claimButton}>
                            <Text style={styles.claimText}>Claim</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Regarder des pubs */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📺 Gagner des crédits</Text>
                <RewardedAdButton rewardType="credits" />
            </View>

            {/* Packs IAP */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💳 Acheter des crédits</Text>
                {creditPacks.map(pack => (
                    <TouchableOpacity
                        key={pack.id}
                        style={[styles.packCard, pack.featured && styles.packFeatured]}
                        onPress={() => {
                            Alert.alert('Achat en cours...', 'Les achats in-app seront configurés prochainement.');
                        }}
                    >
                        <View style={styles.packLeft}>
                            <Text style={styles.packName}>{pack.name}</Text>
                            <Text style={styles.packDesc}>{pack.description}</Text>
                        </View>
                        <View style={styles.packRight}>
                            {pack.discount && (
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>-{pack.discount}%</Text>
                                </View>
                            )}
                            <Text style={styles.packPrice}>{pack.priceFiat}€</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );

    const renderPremiumTab = () => (
        <>
            {/* Statut actuel */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⭐ Ton statut</Text>
                <View style={styles.statusCard}>
                    <Text style={styles.statusTier}>
                        {tier === 'premium' ? '👑 Premium' : tier === 'trial' ? '🎉 Période d\'essai' : '🆓 Gratuit'}
                    </Text>
                    {isAdFree && (
                        <View style={styles.statusBadge}>
                            <Ionicons name="eye-off" size={14} color="#10B981" />
                            <Text style={styles.statusBadgeText}>Sans pub</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Sans pub via reward */}
            {!isAdFree && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🚫 Enlever les pubs</Text>
                    <RewardedAdButton rewardType="ad_free" />
                </View>
            )}

            {/* Premium via reward */}
            {!isPremium && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⭐ Débloquer Premium</Text>
                    <RewardedAdButton rewardType="premium" />
                </View>
            )}

            {/* Achats avec crédits */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🪙 Avec tes crédits</Text>
                {shopItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.itemCard}
                        onPress={() => handlePurchaseItem(item)}
                    >
                        <View style={styles.itemLeft}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDesc}>{item.description}</Text>
                        </View>
                        <View style={styles.itemPrice}>
                            <Text style={styles.coinEmoji}>🪙</Text>
                            <Text style={styles.itemPriceText}>{item.priceCredits}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );

    const renderDecorationsTab = () => {
        // Grouper par rareté
        const byRarity = {
            legendary: DECORATIONS_CATALOG.filter(d => d.rarity === 'legendary' && d.priceCredits > 0),
            epic: DECORATIONS_CATALOG.filter(d => d.rarity === 'epic' && d.priceCredits > 0),
            rare: DECORATIONS_CATALOG.filter(d => d.rarity === 'rare' && d.priceCredits > 0),
            common: DECORATIONS_CATALOG.filter(d => d.rarity === 'common' && d.priceCredits > 0),
        };

        const renderRaritySection = (rarity: DecorationRarity, decorations: Decoration[]) => (
            <View style={styles.section} key={rarity}>
                <View style={styles.rarityHeader}>
                    <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                    <Text style={[styles.sectionTitle, { color: RARITY_COLORS[rarity] }]}>
                        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </Text>
                </View>

                {decorations.map(deco => {
                    const owned = ownedDecorations.some(d => d.id === deco.id);

                    return (
                        <TouchableOpacity
                            key={deco.id}
                            style={[
                                styles.decoCard,
                                { borderColor: RARITY_COLORS[deco.rarity] },
                                owned && styles.decoCardOwned,
                            ]}
                            onPress={() => !owned && handlePurchaseDecoration(deco)}
                            disabled={owned}
                        >
                            <View style={styles.decoLeft}>
                                <View style={[styles.decoPreview, { borderColor: RARITY_COLORS[deco.rarity] }]}>
                                    <Text style={styles.decoIcon}>✨</Text>
                                </View>
                                <View>
                                    <Text style={styles.decoName}>{deco.name}</Text>
                                    <Text style={styles.decoDesc}>{deco.description}</Text>
                                </View>
                            </View>

                            {owned ? (
                                <View style={styles.ownedBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    <Text style={styles.ownedText}>Possédé</Text>
                                </View>
                            ) : (
                                <View style={styles.decoPrice}>
                                    <Text style={styles.coinEmoji}>🪙</Text>
                                    <Text style={styles.decoPriceText}>{deco.priceCredits}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        );

        return (
            <>
                {renderRaritySection('legendary', byRarity.legendary)}
                {renderRaritySection('epic', byRarity.epic)}
                {renderRaritySection('rare', byRarity.rare)}
                {renderRaritySection('common', byRarity.common)}
            </>
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
                <CreditBalance compact />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {(['credits', 'premium', 'decorations'] as Tab[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Ionicons
                            name={
                                tab === 'credits' ? 'cash' :
                                    tab === 'premium' ? 'star' : 'color-palette'
                            }
                            size={18}
                            color={activeTab === tab ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'credits' ? 'Crédits' :
                                tab === 'premium' ? 'Premium' : 'Décos'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'credits' && renderCreditsTab()}
                {activeTab === 'premium' && renderPremiumTab()}
                {activeTab === 'decorations' && renderDecorationsTab()}
                <View style={{ height: 40 }} />
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
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.backgroundCard,
        gap: 6,
    },
    tabActive: {
        backgroundColor: `${colors.primary}20`,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    tabText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.md,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.sm,
    },

    // Daily Card
    dailyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    dailyCardClaimed: {
        borderColor: colors.border,
        opacity: 0.6,
    },
    dailyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    dailyIcon: {
        fontSize: 28,
    },
    dailyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    dailySubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    claimButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    claimText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    // Pack Cards
    packCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    packFeatured: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    packLeft: {
        flex: 1,
    },
    packName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    packDesc: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    packRight: {
        alignItems: 'flex-end',
    },
    discountBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginBottom: 4,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    packPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },

    // Item Cards
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemLeft: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    itemDesc: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    itemPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    coinEmoji: {
        fontSize: 16,
    },
    itemPriceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F59E0B',
    },

    // Status Card
    statusCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
    },
    statusTier: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },

    // Decorations
    rarityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    rarityDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    decoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 2,
    },
    decoCardOwned: {
        opacity: 0.7,
    },
    decoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    decoPreview: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
    },
    decoIcon: {
        fontSize: 18,
    },
    decoName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    decoDesc: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    decoPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    decoPriceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F59E0B',
    },
    ownedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ownedText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
    },
});
