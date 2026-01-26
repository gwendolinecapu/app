import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LootBoxTier, PACK_TIERS, Rarity } from '../../services/MonetizationTypes';
import { colors, spacing } from '../../lib/theme';

interface DropRateModalProps {
    visible: boolean;
    tier: LootBoxTier;
    onClose: () => void;
}

const RARITY_COLORS: Record<Rarity, string[]> = {
    common: ['#9CA3AF', '#6B7280'],
    rare: ['#60A5FA', '#3B82F6'],
    epic: ['#A78BFA', '#8B5CF6'],
    legendary: ['#FBBF24', '#F59E0B'],
    mythic: ['#EC4899', '#DB2777'],
};

const RARITY_LABELS: Record<Rarity, string> = {
    common: 'Commune',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire',
    mythic: 'Mythique',
};

export default function DropRateModal({ visible, tier, onClose }: DropRateModalProps) {
    const pack = PACK_TIERS[tier];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>📊 Taux de Drop</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Pack Info */}
                        <View style={styles.packInfo}>
                            <Text style={styles.packName}>{pack.name}</Text>
                            <Text style={styles.packPrice}>{pack.price} Crédits</Text>
                        </View>

                        {/* Card Count Probabilities */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nombre de Cartes</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>
                                    • Minimum : <Text style={styles.bold}>{pack.cardCount.min} cartes</Text>
                                </Text>
                                <Text style={styles.infoText}>
                                    • Maximum : <Text style={styles.bold}>{pack.cardCount.max} cartes</Text>
                                </Text>
                            </View>

                            <View style={styles.probSection}>
                                {Object.entries(pack.cardCount.probabilities).map(([count, prob]) => (
                                    <View key={count} style={styles.probRow}>
                                        <Text style={styles.probLabel}>{count} carte{parseInt(count) > 1 ? 's' : ''}</Text>
                                        <View style={styles.probBarContainer}>
                                            <View style={[styles.probBar, { width: `${prob * 100}%` }]} />
                                        </View>
                                        <Text style={styles.probValue}>{(prob * 100).toFixed(1)}%</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Rarity Drop Rates */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Taux de Rareté</Text>

                            {(Object.entries(pack.dropRates) as [Rarity, number][])
                                .sort(([_, a], [__, b]) => b - a)
                                .map(([rarity, rate]) => (
                                    <View key={rarity} style={styles.rarityRow}>
                                        <LinearGradient
                                            colors={(RARITY_COLORS[rarity] || ['#6B7280', '#374151']) as any}
                                            style={styles.rarityBadge}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.rarityLabel}>{RARITY_LABELS[rarity] || rarity}</Text>
                                        </LinearGradient>

                                        <View style={styles.rarityBarContainer}>
                                            <View
                                                style={[
                                                    styles.rarityBar,
                                                    {
                                                        width: `${Math.max(rate * 100, 2)}%`, // Min width for visibility
                                                        backgroundColor: RARITY_COLORS[rarity]?.[0] || '#9CA3AF'
                                                    }
                                                ]}
                                            />
                                        </View>

                                        <Text style={styles.rarityValue}>{(rate * 100).toFixed(1)}%</Text>
                                    </View>
                                ))}
                        </View>

                        {/* Guarantees */}
                        {pack.rarityGuarantees && pack.rarityGuarantees.minRarity && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>✨ Garanties</Text>
                                <View style={styles.guaranteeBox}>
                                    <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                                    <Text style={styles.guaranteeText}>
                                        Au moins <Text style={styles.bold}>{pack.rarityGuarantees.count || 1}</Text> carte{' '}
                                        <Text style={styles.bold}>{RARITY_LABELS[pack.rarityGuarantees.minRarity]}</Text> ou supérieure
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={{ height: 40 }} /> {/* Bottom Spacer */}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    container: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
        backgroundColor: '#1F2937',
        borderRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        backgroundColor: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    packInfo: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    packName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: spacing.xs,
    },
    packPrice: {
        fontSize: 16,
        color: '#F59E0B',
        fontWeight: 'bold',
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: spacing.md,
    },
    infoBox: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        marginBottom: spacing.md,
    },
    infoText: {
        color: '#D1D5DB',
        fontSize: 14,
        marginBottom: spacing.xs,
    },
    bold: {
        fontWeight: '900',
        color: '#FFF',
    },
    probSection: {
        gap: spacing.sm,
    },
    probRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    probLabel: {
        width: 80,
        color: '#D1D5DB',
        fontSize: 14,
        fontWeight: '600',
    },
    probBarContainer: {
        flex: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    probBar: {
        height: '100%',
        backgroundColor: '#60A5FA',
        borderRadius: 10,
    },
    probValue: {
        width: 50,
        textAlign: 'right',
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rarityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    rarityBadge: {
        width: 100,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    rarityLabel: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    rarityBarContainer: {
        flex: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    rarityBar: {
        height: '100%',
        borderRadius: 12,
    },
    rarityValue: {
        width: 60,
        textAlign: 'right',
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    guaranteeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        gap: spacing.md,
    },
    guaranteeText: {
        flex: 1,
        color: '#D1D5DB',
        fontSize: 14,
    },
    legalNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    legalText: {
        flex: 1,
        fontSize: 12,
        color: '#9CA3AF',
        lineHeight: 18,
    },
});
