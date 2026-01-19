/**
 * LootBoxOpening.tsx
 * 
 * Design: "Tactical Booster" (Style R6 Siege / TCG)
 * 
 * Concept :
 * - Un "Booster Pack" scellé au centre.
 * - 5 Taps pour essayer de "déchirer" le paquet jusqu'au bout.
 * - Le "Tear" (déchirure) centrale brille de la couleur de la rareté.
 * - Plus on upgrade, plus la déchirure s'agrandit et brille fort.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LootBoxService, LOOT_BOX, REFUND_VALUES } from '../../services/LootBoxService';
import { Rarity, ShopItem } from '../../services/MonetizationTypes';
import { ItemPreview } from './ItemPreview';

const { width, height } = Dimensions.get('window');
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

interface Props {
    visible: boolean;
    onClose: () => void;
    ownedItemIds: string[];
    userCredits: number;
    onReward: (item: ShopItem) => void;
    onPurchase?: () => Promise<boolean>;
    onReplay?: () => Promise<boolean>;
}

type Phase = 'intro' | 'gameplay' | 'opening' | 'revealed';
const MAX_TAPS = 5;

export const LootBoxOpening = ({
    visible,
    onClose,
    ownedItemIds,
    userCredits,
    onReward,
    onPurchase,
    onReplay
}: Props) => {
    const [phase, setPhase] = useState<Phase>('intro');
    const [currentRarity, setCurrentRarity] = useState<Rarity>('common');
    const [tapsRemaining, setTapsRemaining] = useState(MAX_TAPS);
    const [reward, setReward] = useState<{ item: ShopItem, isNew: boolean } | null>(null);
    const [processing, setProcessing] = useState(false);

    // Anim Values
    const progress = useSharedValue(0); // 0..4
    const scale = useSharedValue(1);
    const shake = useSharedValue(0);
    const tearHeight = useSharedValue(0); // 0% to 100%
    const packOpen = useSharedValue(0); // 0 (closed) -> 1 (open split)
    const contentOpacity = useSharedValue(1);

    // Reset
    useEffect(() => {
        if (visible) {
            setPhase('intro');
            setCurrentRarity('common');
            setTapsRemaining(MAX_TAPS);
            setReward(null);
            setProcessing(false);

            progress.value = 0;
            scale.value = 1;
            tearHeight.value = 0.1; // Small initial tear
            packOpen.value = 0;
            contentOpacity.value = 1;
        }
    }, [visible]);

    // ========== GAMEPLAY ==========
    const handleAction = useCallback(async () => {
        if (processing) return;

        if (phase === 'intro') {
            if (onPurchase) {
                setProcessing(true);
                const success = await onPurchase();
                setProcessing(false);
                if (!success) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    return;
                }
            }

            setPhase('gameplay');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            return;
        }

        if (phase === 'gameplay' && tapsRemaining > 0) {
            // Logic
            const newTaps = tapsRemaining - 1;
            setTapsRemaining(newTaps);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scale.value = withSequence(withTiming(0.95, { duration: 50 }), withTiming(1, { duration: 150 }));

            // Upgrade Roll
            const nextRarity = LootBoxService.tryUpgrade(currentRarity);

            if (nextRarity) {
                // Success
                setCurrentRarity(nextRarity);
                const targetP = ['common', 'rare', 'epic', 'legendary', 'mythic'].indexOf(nextRarity);

                progress.value = withTiming(targetP, { duration: 400 });
                tearHeight.value = withSpring(0.2 + (targetP * 0.15)); // Tear gets bigger

                shake.value = withSequence(withTiming(5), withTiming(-5), withTiming(0));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                // Fail
                shake.value = withSequence(withTiming(2), withTiming(-2), withTiming(0));
            }

            // End Check
            if (newTaps === 0 || nextRarity === 'mythic') {
                setTimeout(() => openPack(nextRarity || currentRarity), 400);
            }
        }
    }, [phase, tapsRemaining, currentRarity, processing]);

    const handleReplay = async () => {
        if (processing || !onReplay) return;

        setProcessing(true);
        const success = await onReplay();
        setProcessing(false);

        if (success) {
            // Reset for new game
            setPhase('gameplay'); // Skip intro for speed
            setCurrentRarity('common');
            setTapsRemaining(MAX_TAPS);
            setReward(null);

            // Reset anims
            progress.value = 0;
            scale.value = 1;
            tearHeight.value = 0.1;
            packOpen.value = 0;
            contentOpacity.value = 1;

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // Open
    const openPack = async (finalRarity: Rarity) => {
        setPhase('opening');

        // Split open animation
        packOpen.value = withSpring(1, { damping: 12 });
        tearHeight.value = withTiming(1, { duration: 200 }); // Full flash

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const result = LootBoxService.getReward(finalRarity, ownedItemIds);
        setReward(result);

        setTimeout(() => {
            setPhase('revealed');
            onReward(result.item);
        }, 600);
    };

    // ========== STYLES ==========

    // Rarity Color Map
    const getRarityColor = (p: number) => {
        'worklet';
        return interpolateColor(
            p,
            [0, 1, 2, 3, 4],
            ['#9CA3AF', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444']
        );
    };

    const tearStyle = useAnimatedStyle(() => ({
        height: `${tearHeight.value * 100}%`,
        backgroundColor: getRarityColor(progress.value),
        shadowColor: getRarityColor(progress.value),
        shadowOpacity: interpolate(tearHeight.value, [0, 1], [0.5, 1]),
        shadowRadius: interpolate(tearHeight.value, [0, 1], [10, 30]),
    }));

    const packWrapperStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: shake.value }
        ]
    }));

    // Left side of pack opens left, right opens right
    const packLeftStyle = useAnimatedStyle(() => {
        const rotateVal = interpolate(packOpen.value, [0, 1], [0, -15]);
        return {
            transform: [
                { translateX: interpolate(packOpen.value, [0, 1], [0, -100]) },
                { rotate: `${rotateVal}deg` }
            ],
            opacity: interpolate(packOpen.value, [0, 1], [1, 0]),
        };
    });

    const packRightStyle = useAnimatedStyle(() => {
        const rotateVal = interpolate(packOpen.value, [0, 1], [0, 15]);
        return {
            transform: [
                { translateX: interpolate(packOpen.value, [0, 1], [0, 100]) },
                { rotate: `${rotateVal}deg` }
            ],
            opacity: interpolate(packOpen.value, [0, 1], [1, 0]),
        };
    });

    // Glow emerging from center
    const centerGlowStyle = useAnimatedStyle(() => ({
        opacity: packOpen.value,
        transform: [{ scale: interpolate(packOpen.value, [0, 1], [0.5, 2]) }],
        backgroundColor: getRarityColor(progress.value),
    }));

    const rarityName = LootBoxService.getRarityName(currentRarity);
    const rarityColor = LootBoxService.getRarityColor(currentRarity);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <BlurView intensity={90} tint="dark" style={styles.container}>

                {/* HEADER */}
                <AnimatedView style={[styles.header, { opacity: contentOpacity }]}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>BOOSTER PACK</Text>
                    </View>
                    <AnimatedText style={[styles.rarityTitle, { color: rarityColor }]}>
                        {rarityName.toUpperCase()}
                    </AnimatedText>

                    {/* Taps as "Security Strips" */}
                    {phase === 'gameplay' && (
                        <View style={styles.stripsContainer}>
                            {Array.from({ length: MAX_TAPS }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.strip,
                                        i < tapsRemaining ? styles.stripActive : styles.stripBroken
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </AnimatedView>

                {/* PACK AREA */}
                {phase !== 'revealed' && (
                    <TouchableOpacity activeOpacity={1} onPress={handleAction}>
                        <AnimatedView style={[styles.packContainer, packWrapperStyle]}>

                            {/* Inner Burst Light */}
                            <AnimatedView style={[styles.burstLight, centerGlowStyle] as any} />

                            {/* Left Half */}
                            <AnimatedView style={[styles.packHalf, styles.packLeft, packLeftStyle] as any}>
                                <LinearGradient
                                    colors={['#1F2937', '#111827', '#030712']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                {/* Crimp Top */}
                                <View style={styles.crimpTop} />
                                {/* Detail Lines */}
                                <View style={[styles.decorLine, { top: 60 }]} />
                                <View style={[styles.decorLine, { top: 70, width: 30 }]} />

                                <View style={{ position: 'absolute', bottom: 40, left: 15 }}>
                                    <Text style={styles.techText}>SERIES_01</Text>
                                    <Text style={styles.techText}>CL_ASSIFIED</Text>
                                </View>

                                <View style={styles.stripePattern} />
                            </AnimatedView>

                            {/* Right Half */}
                            <AnimatedView style={[styles.packHalf, styles.packRight, packRightStyle] as any}>
                                <LinearGradient
                                    colors={['#1F2937', '#111827', '#030712']}
                                    start={{ x: 1, y: 0 }} // Mirrored lighting
                                    end={{ x: 0, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                {/* Crimp Top */}
                                <View style={styles.crimpTop} />

                                <View style={[styles.decorLine, { top: 60, right: 0 }]} />
                                <View style={[styles.decorLine, { top: 70, width: 30, right: 0 }]} />

                                {/* Barcode Faux */}
                                <View style={styles.barcodeBox}>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <View key={i} style={{ width: Math.random() > 0.5 ? 2 : 4, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                                    ))}
                                </View>
                            </AnimatedView>

                            {/* Central Tear Strip - Zipper Look */}
                            <AnimatedView style={[styles.tearStrip, tearStyle]}>
                                <View style={styles.zipperPattern}>
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <View key={i} style={styles.zipperDash} />
                                    ))}
                                </View>
                                {/* Pull Arrows */}
                                <View style={styles.pullArrows}>
                                    <Ionicons name="chevron-down" size={12} color="rgba(0,0,0,0.5)" />
                                    <Ionicons name="chevron-down" size={12} color="rgba(0,0,0,0.5)" />
                                    <Ionicons name="chevron-down" size={12} color="rgba(0,0,0,0.5)" />
                                </View>
                            </AnimatedView>

                            {/* Intro Trigger */}
                            {phase === 'intro' && (
                                <View style={styles.introOverlay}>
                                    <View style={styles.introBadge}>
                                        <Ionicons name="lock-closed" size={16} color="#000" />
                                        <Text style={styles.openText}>OUVRIR</Text>
                                    </View>
                                    <Text style={styles.priceText}>{LOOT_BOX.price} CR</Text>

                                    <View style={styles.dropRatesContainer}>
                                        <Text style={styles.dropRatesTitle}>PROBABILITÉS</Text>
                                        <View style={styles.dropRatesRow}>
                                            <View style={[styles.dropRateBadge, { backgroundColor: '#9CA3AF' }]}>
                                                <Text style={styles.dropRateText}>70%</Text>
                                            </View>
                                            <View style={[styles.dropRateBadge, { backgroundColor: '#3B82F6' }]}>
                                                <Text style={styles.dropRateText}>21%</Text>
                                            </View>
                                            <View style={[styles.dropRateBadge, { backgroundColor: '#8B5CF6' }]}>
                                                <Text style={styles.dropRateText}>6.3%</Text>
                                            </View>
                                            <View style={[styles.dropRateBadge, { backgroundColor: '#F59E0B' }]}>
                                                <Text style={styles.dropRateText}>1.9%</Text>
                                            </View>
                                            <View style={[styles.dropRateBadge, { backgroundColor: '#EF4444' }]}>
                                                <Text style={styles.dropRateText}>0.8%</Text>
                                            </View>
                                        </View>
                                        <View style={styles.dropRatesLabels}>
                                            <Text style={styles.dropRateLabel}>COM</Text>
                                            <Text style={styles.dropRateLabel}>RAR</Text>
                                            <Text style={styles.dropRateLabel}>EPQ</Text>
                                            <Text style={styles.dropRateLabel}>LEG</Text>
                                            <Text style={styles.dropRateLabel}>MYT</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </AnimatedView>
                    </TouchableOpacity>
                )}

                {/* REVEALED */}
                {phase === 'revealed' && reward && (
                    <AnimatedView style={styles.rewardContainer}>
                        <ItemPreview item={reward.item} size="large" />

                        {reward.isNew ? (
                            <>
                                <Text style={[styles.rewardRarity, { color: rarityColor }]}>
                                    {rarityName.toUpperCase()} DE DINGUE !
                                </Text>
                                <Text style={styles.rewardName}>{reward.item.name}</Text>

                                <TouchableOpacity
                                    style={[styles.collectBtn, { backgroundColor: rarityColor }]}
                                    onPress={() => {
                                        onClose();
                                        onReward(reward.item); // Trigger standard callback which might open detailed view or just equip
                                    }}
                                >
                                    <Text style={styles.collectText}>ÉQUIPER</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.collectBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FFF', marginTop: 12 }]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.collectText}>STOCKER & FERMER</Text>
                                </TouchableOpacity>

                                {onReplay && (
                                    <TouchableOpacity
                                        style={[styles.collectBtn, { backgroundColor: '#3B82F6', marginTop: 12 }]}
                                        onPress={handleReplay}
                                        disabled={processing}
                                    >
                                        <Text style={styles.collectText}>RELANCER ({LOOT_BOX.price} CR)</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <>
                                <View style={styles.duplicateBadge}>
                                    <Ionicons name="repeat" size={16} color="#F59E0B" />
                                    <Text style={styles.duplicateText}>DÉJÀ POSSÉDÉ</Text>
                                </View>

                                <Text style={styles.rewardName}>{reward.item.name}</Text>

                                <View style={styles.refundBox}>
                                    <Text style={styles.refundTitle}>CONVERTI EN</Text>
                                    <Text style={styles.refundAmount}>+{REFUND_VALUES[currentRarity]} CR</Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.collectBtn, { backgroundColor: '#333' }]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.collectText}>RÉCUPÉRER</Text>
                                </TouchableOpacity>

                                {onReplay && (
                                    <TouchableOpacity
                                        style={[styles.collectBtn, { backgroundColor: '#3B82F6', marginTop: 12 }]}
                                        onPress={handleReplay}
                                        disabled={processing}
                                    >
                                        <Text style={styles.collectText}>RELANCER ({LOOT_BOX.price} CR)</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </AnimatedView>
                )}

                {/* Close */}
                {phase === 'intro' && (
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}

            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { position: 'absolute', top: 100, alignItems: 'center', zIndex: 20 },
    badge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
    badgeText: { color: '#AAA', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    rarityTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },

    stripsContainer: { flexDirection: 'row', marginTop: 16, gap: 4 },
    strip: { width: 40, height: 6, borderRadius: 2, backgroundColor: '#333' },
    stripActive: { backgroundColor: '#4ADE80' },
    stripBroken: { backgroundColor: '#1F2937' },

    packContainer: {
        width: 260,
        height: 380,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },

    // Halves
    packHalf: {
        position: 'absolute',
        width: 130, // Half of 260
        height: 380,
        backgroundColor: '#171717',
        overflow: 'hidden',
        // metallic sheen handled by Gradient
    },
    packLeft: {
        left: 0,
        borderTopLeftRadius: 24,
        borderBottomLeftRadius: 24,
        borderRightWidth: 1,
        borderColor: 'rgba(0,0,0,0.5)',
    },
    packRight: {
        right: 0,
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        borderLeftWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Highlight edge
    },

    // Details
    crimpTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    decorLine: {
        position: 'absolute',
        left: 0,
        width: 60,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    techText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    stripePattern: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.03)',
        transform: [{ skewX: '-20deg' }],
    },
    barcodeBox: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        flexDirection: 'row',
        gap: 2,
        alignItems: 'flex-end',
    },

    // Tear Strip
    tearStrip: {
        position: 'absolute',
        width: 14, // Wider strip
        height: '100%',
        zIndex: 10,
        alignItems: 'center',
        paddingVertical: 20,
    },
    zipperPattern: {
        flex: 1,
        justifyContent: 'space-between',
        width: 2,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginVertical: 10,
    },
    zipperDash: {
        width: 6,
        height: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginLeft: -2,
    },
    pullArrows: {
        position: 'absolute',
        top: '50%',
        gap: 2,
    },

    burstLight: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        zIndex: -1,
    },

    // Intro Overlay
    introOverlay: { position: 'absolute', bottom: 40, alignItems: 'center', zIndex: 20, width: '100%' },
    introBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 8 },
    openText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    priceText: { color: '#FFF', marginTop: 8, fontWeight: 'bold', fontSize: 14 },

    dropRatesContainer: { marginTop: 16, alignItems: 'center', width: '100%' },
    dropRatesTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
    dropRatesRow: { flexDirection: 'row', gap: 6 },
    dropRatesLabels: { flexDirection: 'row', gap: 6, marginTop: 4 },
    dropRateBadge: {
        width: 42,
        height: 24,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 }
    },
    dropRateText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    dropRateLabel: { width: 42, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 'bold' },

    // Reward
    rewardContainer: { alignItems: 'center', width: '100%' },
    rewardRarity: { fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
    rewardName: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginVertical: 8 },
    collectBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 8, marginTop: 32 },
    collectText: { color: '#FFF', fontWeight: '900' },

    closeBtn: { position: 'absolute', top: 60, right: 20, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },

    // Duplicate
    duplicateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
    duplicateText: { color: '#F59E0B', fontSize: 12, fontWeight: 'bold' },
    refundBox: { alignItems: 'center', marginTop: 12 },
    refundTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
    refundAmount: { color: '#F59E0B', fontSize: 32, fontWeight: '900' },
});
