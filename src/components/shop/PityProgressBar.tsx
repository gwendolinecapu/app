/**
 * PityProgressBar.tsx
 *
 * Affiche la progression vers les garanties Epic et Legendary
 * "Légendaire garanti dans X cartes"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated';
import { PityProgress, PITY_CONFIG } from '../../services/MonetizationTypes';

interface PityProgressBarProps {
    pity: PityProgress;
    compact?: boolean; // Version compacte pour la boutique
}

export function PityProgressBar({ pity, compact = false }: PityProgressBarProps) {
    const epicProgress = (PITY_CONFIG.epicGuarantee - (PITY_CONFIG.epicGuarantee - pity.epicCounter)) / PITY_CONFIG.epicGuarantee;
    const legendaryProgress = (PITY_CONFIG.legendaryGuarantee - (PITY_CONFIG.legendaryGuarantee - pity.legendaryCounter)) / PITY_CONFIG.legendaryGuarantee;

    const nextEpic = Math.max(0, PITY_CONFIG.epicGuarantee - pity.epicCounter);
    const nextLegendary = Math.max(0, PITY_CONFIG.legendaryGuarantee - pity.legendaryCounter);

    // Animation de la barre
    const epicWidth = useSharedValue(0);
    const legendaryWidth = useSharedValue(0);

    React.useEffect(() => {
        epicWidth.value = withSpring(epicProgress * 100, { damping: 15 });
        legendaryWidth.value = withSpring(legendaryProgress * 100, { damping: 15 });
    }, [epicProgress, legendaryProgress]);

    const epicBarStyle = useAnimatedStyle(() => ({
        width: `${epicWidth.value}%`,
    }));

    const legendaryBarStyle = useAnimatedStyle(() => ({
        width: `${legendaryWidth.value}%`,
    }));

    // Soft pity indicator (après 45 cartes)
    const inSoftPity = pity.legendaryCounter >= PITY_CONFIG.softPityStart;
    const softPityBonus = inSoftPity
        ? Math.round((pity.legendaryCounter - PITY_CONFIG.softPityStart + 1) * PITY_CONFIG.softPityBonus * 100)
        : 0;

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <View style={styles.compactRow}>
                    <Ionicons name="diamond" size={12} color="#A855F7" />
                    <Text style={styles.compactText}>Epic dans {nextEpic}</Text>
                </View>
                <View style={styles.compactRow}>
                    <Ionicons name="star" size={12} color="#EAB308" />
                    <Text style={styles.compactText}>
                        Légendaire dans {nextLegendary}
                        {inSoftPity && <Text style={styles.softPityCompact}> (+{softPityBonus}%)</Text>}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="gift-outline" size={18} color="#FFF" />
                <Text style={styles.title}>PROCHAINS GARANTIS</Text>
            </View>

            {/* Epic Progress */}
            <View style={styles.progressRow}>
                <View style={styles.labelRow}>
                    <View style={styles.rarityBadge}>
                        <Ionicons name="diamond" size={14} color="#A855F7" />
                        <Text style={styles.rarityLabel}>ÉPIQUE+</Text>
                    </View>
                    <Text style={styles.countText}>
                        dans <Text style={styles.countHighlight}>{nextEpic}</Text> cartes
                    </Text>
                </View>
                <View style={styles.barContainer}>
                    <Animated.View style={[styles.barFill, styles.epicBar, epicBarStyle]} />
                </View>
            </View>

            {/* Legendary Progress */}
            <View style={styles.progressRow}>
                <View style={styles.labelRow}>
                    <View style={[styles.rarityBadge, styles.legendaryBadge]}>
                        <Ionicons name="star" size={14} color="#EAB308" />
                        <Text style={[styles.rarityLabel, { color: '#EAB308' }]}>LÉGENDAIRE+</Text>
                    </View>
                    <Text style={styles.countText}>
                        dans <Text style={[styles.countHighlight, { color: '#EAB308' }]}>{nextLegendary}</Text> cartes
                    </Text>
                </View>
                <View style={styles.barContainer}>
                    <Animated.View style={[styles.barFill, styles.legendaryBar, legendaryBarStyle]}>
                        <LinearGradient
                            colors={['#EAB308', '#F59E0B']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </Animated.View>

                    {/* Soft Pity Marker at 45 cards */}
                    <View style={[styles.softPityMarker, { left: `${(PITY_CONFIG.softPityStart / PITY_CONFIG.legendaryGuarantee) * 100}%` }]}>
                        <View style={styles.softPityLine} />
                    </View>
                </View>

                {/* Soft Pity Indicator */}
                {inSoftPity && (
                    <View style={styles.softPityBadge}>
                        <Ionicons name="trending-up" size={12} color="#10B981" />
                        <Text style={styles.softPityText}>Soft Pity +{softPityBonus}%</Text>
                    </View>
                )}
            </View>

            {/* Total Cards Info */}
            <View style={styles.footer}>
                <Ionicons name="layers-outline" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.footerText}>{pity.totalCards} cartes tirées au total</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    title: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    progressRow: {
        marginBottom: 12,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    rarityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    legendaryBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.2)',
    },
    rarityLabel: {
        color: '#A855F7',
        fontSize: 10,
        fontWeight: 'bold',
    },
    countText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    countHighlight: {
        color: '#A855F7',
        fontWeight: 'bold',
    },
    barContainer: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    epicBar: {
        backgroundColor: '#A855F7',
    },
    legendaryBar: {
        overflow: 'hidden',
    },
    softPityMarker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
    },
    softPityLine: {
        width: 2,
        height: '100%',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
    },
    softPityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    softPityText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    footerText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
    },
    // Compact styles
    compactContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    compactText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
    },
    softPityCompact: {
        color: '#10B981',
        fontWeight: '600',
    },
});

export default PityProgressBar;
