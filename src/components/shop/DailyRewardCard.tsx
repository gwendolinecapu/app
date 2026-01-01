import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMonetization } from '../../contexts/MonetizationContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext';

interface DailyRewardCardProps {
    alterId?: string;
}

export function DailyRewardCard({ alterId }: DailyRewardCardProps) {
    const {
        checkDailyLogin,
        claimDailyLogin,
        currentStreak,
        loading: contextLoading
    } = useMonetization();

    // If we can't identify the claimer, we likely shouldn't show this or should show a generic view
    // But for now, we'll hide it if no alterId
    if (!alterId) return null;

    const [canClaim, setCanClaim] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [reward, setReward] = useState<{ amount: number, streak: number } | null>(null);

    useEffect(() => {
        checkStatus();
    }, [alterId]);

    const checkStatus = async () => {
        const status = await checkDailyLogin(alterId);
        setCanClaim(status);
    };

    const handleClaim = async () => {
        setClaiming(true);
        try {
            const result = await claimDailyLogin(alterId);
            setReward(result);
            setCanClaim(false);
        } catch (error) {
            console.error('Failed to claim daily reward', error);
        } finally {
            setClaiming(false);
        }
    };

    if (reward) {
        return (
            <LinearGradient
                colors={[colors.success, '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Récompense récupérée !</Text>
                        <Text style={styles.subtitle}>
                            +{reward.amount}💎 • Série {reward.streak} jours 🔥
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        );
    }

    if (!canClaim) {
        // Optionnel : Afficher un état "Déjà récupéré" ou juste masquer
        // Pour l'engagement, on montre "Reviens demain"
        return (
            <View style={[styles.container, styles.claimedContainer]}>
                <View style={styles.content}>
                    <Ionicons name="time-outline" size={24} color={colors.textSecondary} />
                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: colors.textSecondary }]}>À demain !</Text>
                        <Text style={styles.subtitle}>Série actuelle : {currentStreak} jours 🔥</Text>
                    </View>
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={16} color={colors.background} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#F59E0B', '#F97316']} // Orange aesthetic for "Daily/Fire"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <TouchableOpacity
                style={styles.touchable}
                onPress={handleClaim}
                disabled={claiming}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="gift" size={28} color="#FFFFFF" />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Cadeau Quotidien</Text>
                        <Text style={styles.subtitle}>
                            Récupère tes cristaux gratuits !
                        </Text>
                    </View>

                    <View style={styles.actionButton}>
                        {claiming ? (
                            <ActivityIndicator color={colors.primary} size="small" />
                        ) : (
                            <Text style={styles.actionText}>Récupérer</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        marginVertical: spacing.sm,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    claimedContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    touchable: {
        padding: spacing.md,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md, // Add padding here if not using touchable wrapper for claimed state
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    actionText: {
        color: '#F97316',
        fontWeight: 'bold',
        fontSize: 12,
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
