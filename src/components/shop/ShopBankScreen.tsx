import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../lib/theme';
import { CREDIT_PACKS, CREDIT_ITEMS } from '../../services/MonetizationTypes';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';

export function ShopBankScreen() {
    const { currentAlter } = useAuth();
    const { purchaseIAP, purchaseItem, credits, isPremium, presentPaywall } = useMonetization();

    const handlePurchaseIAP = async (pack: any) => {
        try {
            await purchaseIAP(pack.revenueCatPackageId || pack.priceIAP || pack.id);
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "Impossible d'initier l'achat.");
        }
    };

    const handlePurchaseCreditItem = async (item: any) => {
        if (!currentAlter) return;
        if (credits < item.priceCredits) {
            Alert.alert("Pas assez de crédits", "Tu as besoin de plus de crédits !");
            return;
        }
        const success = await purchaseItem(item, currentAlter.id);
        if (success) {
            Alert.alert("Succès", `Tu as acheté : ${item.name}`);
        }
    };

    const subscriptionItems = CREDIT_ITEMS.filter(item =>
        item.type === 'ad_free' || item.type === 'premium_days'
    );

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* 1. PREMIUM BANNER - Enhanced */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.premiumBanner}
                    onPress={presentPaywall}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={isPremium ? ['#4C1D95', '#1E1B4B'] : ['#7C3AED', '#5B21B6', '#4C1D95']}
                        style={styles.premiumGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Shine effect */}
                        <View style={styles.premiumShine} />

                        <View style={styles.premiumContent}>
                            <View style={styles.premiumHeader}>
                                <View style={styles.premiumIconBg}>
                                    <Ionicons name="diamond" size={20} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={styles.premiumTitle}>PLURAL PREMIUM</Text>
                                    {isPremium && (
                                        <View style={styles.premiumActiveBadge}>
                                            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                            <Text style={styles.premiumActiveText}>Actif</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <Text style={styles.premiumDesc}>
                                {isPremium
                                    ? "Profitez de tous les avantages Premium !"
                                    : "Thèmes animés • Stats avancées • Sans pub"}
                            </Text>
                        </View>
                        <View style={styles.premiumAction}>
                            {isPremium ? (
                                <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.7)" />
                            ) : (
                                <View style={styles.premiumCTA}>
                                    <Text style={styles.premiumCTAText}>Découvrir</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* 2. CREDIT PACKS - Enhanced Grid */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>💎 RECHARGE CRÉDITS</Text>
                    <View style={styles.currentCredits}>
                        <Ionicons name="diamond" size={14} color="#F59E0B" />
                        <Text style={styles.currentCreditsText}>{credits}</Text>
                    </View>
                </View>
                <View style={styles.grid}>
                    {CREDIT_PACKS.map((pack) => (
                        <TouchableOpacity
                            key={pack.id}
                            style={[styles.creditCard, pack.featured && styles.creditCardFeatured]}
                            onPress={() => handlePurchaseIAP(pack)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={pack.featured
                                    ? ['#F59E0B', '#D97706']
                                    : pack.discount
                                        ? ['#10B981', '#059669']
                                        : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                                style={styles.creditGradient}
                            >
                                {/* Popular badge for featured */}
                                {pack.featured && (
                                    <View style={styles.popularBadge}>
                                        <Ionicons name="flame" size={10} color="#FFF" />
                                        <Text style={styles.popularText}>POPULAIRE</Text>
                                    </View>
                                )}

                                {/* Discount badge */}
                                {pack.discount && !pack.featured && (
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountBadgeText}>-{pack.discount}%</Text>
                                    </View>
                                )}

                                <View style={styles.creditIcon}>
                                    <Ionicons
                                        name="diamond"
                                        size={28}
                                        color={pack.featured ? '#FFF' : pack.discount ? '#FFF' : '#F59E0B'}
                                    />
                                </View>

                                <View style={styles.creditInfo}>
                                    <Text style={[
                                        styles.creditAmount,
                                        (pack.featured || !!pack.discount) && { color: '#FFF' }
                                    ]}>
                                        {pack.name.replace(' Crédits', '')}
                                    </Text>
                                    <Text style={[
                                        styles.creditLabel,
                                        (pack.featured || !!pack.discount) && { color: 'rgba(255,255,255,0.8)' }
                                    ]}>
                                        Crédits
                                    </Text>
                                </View>

                                <View style={[
                                    styles.priceTag,
                                    (pack.featured || pack.discount)
                                        ? { backgroundColor: 'rgba(0,0,0,0.25)' }
                                        : { backgroundColor: 'rgba(255,255,255,0.1)' }
                                ]}>
                                    <Text style={styles.priceText}>{pack.priceFiat} €</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 3. SERVICES (Credits) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛡️ SERVICES (CRÉDITS)</Text>
                <View style={styles.grid}>
                    {subscriptionItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.serviceCard}
                            onPress={() => handlePurchaseCreditItem(item)}
                        >
                            <View style={styles.serviceIcon}>
                                <Ionicons name={item.type === 'ad_free' ? 'ban' : 'star'} size={20} color="#FFF" />
                            </View>
                            <View style={styles.serviceContent}>
                                <Text style={styles.serviceName}>{item.name}</Text>
                                <View style={styles.servicePriceRow}>
                                    <Ionicons name="diamond" size={12} color="#F59E0B" />
                                    <Text style={styles.servicePrice}>{item.priceCredits}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Premium Banner
    premiumBanner: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    premiumGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    premiumShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    premiumContent: {
        flex: 1,
        zIndex: 1,
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    premiumIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    premiumActiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    premiumActiveText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '600',
    },
    premiumDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 18,
        marginLeft: 52,
    },
    premiumAction: {
        paddingLeft: 16,
        zIndex: 1,
    },
    premiumCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    premiumCTAText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    // Section Header
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    currentCredits: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    currentCreditsText: {
        color: '#F59E0B',
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Credits
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    creditCard: {
        width: '31%',
        aspectRatio: 0.8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    creditCardFeatured: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    popularBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 3,
    },
    popularText: {
        color: '#FFF',
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    discountBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    discountBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    creditGradient: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    creditIcon: {
        alignItems: 'center',
        marginTop: 8,
    },
    creditInfo: {
        alignItems: 'center',
    },
    creditAmount: {
        color: '#F59E0B',
        fontSize: 18,
        fontWeight: 'bold',
    },
    creditLabel: {
        color: '#6B7280',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    priceTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    priceText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    discountTag: {
        position: 'absolute',
        top: -8,
        right: -30,
        backgroundColor: '#EF4444',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    // Services
    serviceCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    serviceIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceContent: {
        flex: 1,
    },
    serviceName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    servicePriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    servicePrice: {
        color: '#F59E0B',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
