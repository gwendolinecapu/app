import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { CREDIT_PACKS, PREMIUM_PACKS, CREDIT_ITEMS } from '../../services/MonetizationTypes';
import { useMonetization } from '../../contexts/MonetizationContext';

import { useAuth } from '../../contexts/AuthContext';

interface BankModalProps {
    visible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function BankModal({ visible, onClose }: BankModalProps) {
    const { currentAlter } = useAuth();
    const { purchaseIAP, purchaseItem, credits } = useMonetization();

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

    // Filter credit items for subscriptions/services only (No Ads, Premium days)
    const subscriptionItems = CREDIT_ITEMS.filter(item =>
        item.type === 'ad_free' || item.type === 'premium_days'
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <BlurView intensity={40} tint="dark" style={styles.container}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>BANQUE & SERVICES</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>

                        {/* 1. CREDIT PACKS */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>💎 RECHARGE CRÉDITS</Text>
                            <View style={styles.grid}>
                                {CREDIT_PACKS.map(pack => (
                                    <TouchableOpacity
                                        key={pack.id}
                                        style={styles.card}
                                        onPress={() => handlePurchaseIAP(pack)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={pack.featured ? ['#F59E0B', '#D97706'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                                            style={styles.cardGradient}
                                        >
                                            <Ionicons name="diamond" size={28} color={pack.featured ? '#FFF' : '#F59E0B'} />
                                            <Text style={styles.cardName}>{pack.name}</Text>
                                            <Text style={styles.cardPrice}>{pack.priceFiat} €</Text>
                                            {pack.discount && (
                                                <View style={styles.discountBadge}>
                                                    <Text style={styles.discountText}>-{pack.discount}%</Text>
                                                </View>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 2. PREMIUM */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>👑 ABONNEMENTS PREMIUM</Text>
                            <View style={styles.verticalList}>
                                {PREMIUM_PACKS.map(pack => (
                                    <TouchableOpacity
                                        key={pack.id}
                                        style={styles.wideCard}
                                        onPress={() => handlePurchaseIAP(pack)}
                                    >
                                        <LinearGradient
                                            colors={['#8B5CF6', '#6D28D9']}
                                            style={styles.wideCardGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <View style={styles.wideCardContent}>
                                                <Text style={styles.wideCardName}>{pack.name}</Text>
                                                <Text style={styles.wideCardDesc}>{pack.description}</Text>
                                            </View>
                                            <Text style={styles.wideCardPrice}>{pack.priceFiat} €</Text>
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
                                        style={[styles.card, { height: 140 }]} // Taller for description
                                        onPress={() => handlePurchaseCreditItem(item)}
                                    >
                                        <View style={styles.serviceCard}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name={item.type === 'ad_free' ? 'ban' : 'star'} size={24} color="#FFF" />
                                            </View>
                                            <Text style={styles.serviceName}>{item.name}</Text>
                                            <Text style={styles.servicePrice}>
                                                <Ionicons name="diamond" size={10} color="#F59E0B" /> {item.priceCredits}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                    </ScrollView>
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '85%',
        backgroundColor: '#111827',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1F2937',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: spacing.md,
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    card: {
        width: '30%',
        flexGrow: 1,
        aspectRatio: 0.8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        gap: 8,
    },
    cardName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cardPrice: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
    },
    discountBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderBottomLeftRadius: 8,
    },
    discountText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    verticalList: {
        gap: spacing.md,
    },
    wideCard: {
        height: 70,
        borderRadius: 12,
        overflow: 'hidden',
    },
    wideCardGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
    },
    wideCardContent: {
        flex: 1,
    },
    wideCardName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    wideCardDesc: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    wideCardPrice: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
    },
    // Service Card
    serviceCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    servicePrice: {
        color: '#F59E0B',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
