import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';
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
            {/* 1. PREMIUM BANNER */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.premiumBanner}
                    onPress={presentPaywall}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={isPremium ? ['#4C1D95', '#2E1065'] : ['#8B5CF6', '#6D28D9']}
                        style={styles.premiumGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.premiumContent}>
                            <View style={styles.premiumHeader}>
                                <Ionicons name="star" size={24} color="#FFD700" />
                                <Text style={styles.premiumTitle}>PLURAL PREMIUM</Text>
                            </View>
                            <Text style={styles.premiumDesc}>
                                {isPremium
                                    ? "Vous êtes membre Premium. Profitez de tous les avantages !"
                                    : "Débloquez les thèmes animés, les statistiques avancées et supprimez les pubs."}
                            </Text>
                        </View>
                        <View style={styles.premiumAction}>
                            <Ionicons name="chevron-forward" size={24} color="#FFF" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* 2. CREDIT PACKS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💎 RECHARGE CRÉDITS</Text>
                <View style={styles.grid}>
                    {CREDIT_PACKS.map(pack => (
                        <TouchableOpacity
                            key={pack.id}
                            style={styles.creditCard}
                            onPress={() => handlePurchaseIAP(pack)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={pack.featured ? ['#F59E0B', '#D97706'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                style={styles.creditGradient}
                            >
                                <View style={styles.creditIcon}>
                                    <Ionicons name="diamond" size={24} color={pack.featured ? '#FFF' : '#F59E0B'} />
                                    {pack.discount && <View style={styles.discountTag}><Text style={styles.discountText}>-{pack.discount}%</Text></View>}
                                </View>

                                <View style={styles.creditInfo}>
                                    <Text style={[styles.creditAmount, pack.featured && { color: '#FFF' }]}>{pack.name.replace(' Crédits', '')}</Text>
                                    <Text style={[styles.creditLabel, pack.featured && { color: 'rgba(255,255,255,0.8)' }]}>Crédits</Text>
                                </View>

                                <View style={[styles.priceTag, pack.featured ? { backgroundColor: 'rgba(0,0,0,0.2)' } : { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
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
        marginBottom: spacing.md,
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
    },
    premiumContent: {
        flex: 1,
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    premiumTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    premiumDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        lineHeight: 18,
    },
    premiumAction: {
        paddingLeft: 16,
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
