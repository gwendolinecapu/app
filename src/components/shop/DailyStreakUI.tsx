import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMonetization } from '../../contexts/MonetizationContext';
import { LootBoxTier } from '../../services/MonetizationTypes';
import { DailyRewardService } from '../../services/DailyRewardService';
import { colors, spacing, borderRadius } from '../../lib/theme';
import * as Haptics from 'expo-haptics';

interface DailyStreakUIProps {
    alterId?: string;
    onOpenPack: (tier: LootBoxTier) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = 70;

export function DailyStreakUI({ alterId, onOpenPack }: DailyStreakUIProps) {
    const {
        currentStreak, // Updated via context
        claimDailyLogin,
        checkDailyLogin,
        isPremium
    } = useMonetization();

    const [canClaim, setCanClaim] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Initial check
    useEffect(() => {
        checkStatus();
    }, [alterId, currentStreak]);

    const checkStatus = async () => {
        if (alterId) {
            const status = await checkDailyLogin(alterId);
            setCanClaim(status);
        }
    };

    // Calculate window to display (Current - 2 to Current + 4)
    const startDay = Math.max(1, currentStreak - 2);
    const daysToShow = Array.from({ length: 7 }, (_, i) => startDay + i);

    const handleClaim = async () => {
        if (!alterId || !canClaim) return;

        setClaiming(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const reward = await claimDailyLogin(alterId);

            // If reward includes a pack, trigger opening
            if (reward.packTier) {
                setTimeout(() => {
                    onOpenPack(reward.packTier!);
                }, 500);
            } else {
                Alert.alert("Récompense !", `Tu as gagné ${reward.credits} crédits !`);
            }

            setCanClaim(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            console.error(e);
        } finally {
            setClaiming(false);
        }
    };

    const renderDayCard = (day: number) => {
        const config = DailyRewardService.getRewardConfig(day, isPremium);

        // Status logic
        // If canClaim is true:
        //    day < currentStreak + 1: Claimed (Past)
        //    day == currentStreak + 1: Current (Ready)
        //    day > currentStreak + 1: Future (Locked)

        // If canClaim is false (already claimed today):
        //    day <= currentStreak: Claimed
        //    day > currentStreak: Future

        let status: 'claimed' | 'current' | 'locked' = 'locked';

        if (canClaim) {
            if (day < currentStreak + 1) status = 'claimed';
            else if (day === currentStreak + 1) status = 'current';
            else status = 'locked';
        } else {
            if (day <= currentStreak) status = 'claimed';
            else status = 'locked';
        }

        // Visuals
        const isPack = !!config.packTier;
        const isBig = day % 30 === 0 || day === 180;

        let bgColors = ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'];
        let borderColor = 'transparent';

        if (status === 'current') {
            bgColors = ['#F59E0B', '#D97706']; // Active Orange
            borderColor = '#FFFFFF';
        } else if (status === 'claimed') {
            bgColors = ['#10B981', '#059669']; // Success Green
        } else if (isBig) {
            bgColors = ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']; // Purple tint for milestones
            borderColor = '#8B5CF6';
        }

        return (
            <TouchableOpacity
                key={day}
                style={[
                    styles.dayCard,
                    { borderColor },
                    (status === 'current' && canClaim) ? styles.activeCard : {}
                ]}
                activeOpacity={0.8}
                onPress={status === 'current' ? handleClaim : undefined}
                disabled={status !== 'current' || claiming}
            >
                <LinearGradient
                    colors={bgColors as any}
                    style={styles.cardGradient}
                >
                    <Text style={styles.dayText}>J{day}</Text>

                    <View style={styles.iconContainer}>
                        {isPack ? (
                            <Ionicons name="cube" size={20} color="#FFFFFF" />
                        ) : (
                            <Ionicons name="diamond" size={20} color="#FFFFFF" />
                        )}
                    </View>

                    <Text style={styles.amountText}>
                        {isPack ? (config.packTier === 'basic' ? 'Basic' : 'Pack') : config.credits}
                    </Text>

                    {status === 'claimed' && (
                        <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={10} color="white" />
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>RÉCOMPENSES</Text>
                    <Text style={styles.subtitle}>Gagne des crédits et des packs !</Text>
                </View>
                <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={18} color="#F59E0B" />
                    <Text style={styles.streakText}>{currentStreak}</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {daysToShow.map(renderDayCard)}
            </ScrollView>

            {/* Premium Teaser if Free */}
            {!isPremium && (
                <View style={styles.premiumHint}>
                    <Ionicons name="star" size={12} color="#FCD34D" />
                    <Text style={styles.premiumHintText}>Premium : récompenses doublées !</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.5)',
        gap: 6,
    },
    streakText: {
        color: '#F59E0B',
        fontWeight: 'bold',
        fontSize: 16,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: 10,
    },
    dayCard: {
        width: CARD_WIDTH,
        height: 90,
        marginRight: 8,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    activeCard: {
        transform: [{ scale: 1.05 }],
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    cardGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    iconContainer: {
        marginBottom: 4,
    },
    amountText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#059669',
        borderRadius: 6,
        padding: 2,
    },
    premiumHint: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    premiumHintText: {
        color: '#FCD34D',
        fontSize: 10,
        fontWeight: '500',
    }
});
