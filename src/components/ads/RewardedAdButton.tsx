/**
 * RewardedAdButton.tsx
 * Bouton pour regarder une pub reward et gagner des récompenses
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { useMonetization } from '../../contexts/MonetizationContext';
import { CREDIT_REWARDS } from '../../services/MonetizationTypes';

type RewardType = 'credits' | 'ad_free' | 'premium';

interface RewardedAdButtonProps {
    /** Type de récompense à afficher */
    rewardType?: RewardType;
    /** Style compact (sans description) */
    compact?: boolean;
    /** Callback après visionnage réussi */
    onRewarded?: (amount: number) => void;
}

export function RewardedAdButton({
    rewardType = 'credits',
    compact = false,
    onRewarded,
}: RewardedAdButtonProps) {
    const {
        canWatchRewardAd,
        rewardAdsRemaining,
        adFreeProgress,
        premiumProgress,
        watchRewardAd,
        isAdFree,
    } = useMonetization();

    const [loading, setLoading] = useState(false);

    const handlePress = async () => {
        if (!canWatchRewardAd || loading) return;

        setLoading(true);
        try {
            const result = await watchRewardAd();

            if (result.completed) {
                onRewarded?.(result.rewardAmount);

                // Notification de succès
                if (result.rewardType === 'ad_free') {
                    Alert.alert('🎉 Félicitations !', '7 jours sans pub débloqués !');
                } else if (result.rewardType === 'premium') {
                    Alert.alert('⭐ Incroyable !', '7 jours premium débloqués !');
                }
            }
        } catch (error) {
            console.error('[RewardedAdButton] Error:', error);
            Alert.alert('Erreur', 'Impossible de charger la vidéo. Réessayez plus tard.');
        } finally {
            setLoading(false);
        }
    };

    // Si déjà ad-free et on demande ce type, ne pas afficher
    if (rewardType === 'ad_free' && isAdFree) {
        return null;
    }

    // Données selon le type
    const getContent = () => {
        switch (rewardType) {
            case 'ad_free':
                return {
                    icon: 'eye-off',
                    title: `${adFreeProgress.current}/${adFreeProgress.needed} pour 7j sans pub`,
                    subtitle: 'Regarder une vidéo',
                    color: '#10B981',
                };
            case 'premium':
                return {
                    icon: 'star',
                    title: `${premiumProgress.current}/${premiumProgress.needed} pour 7j premium`,
                    subtitle: 'Regarder une vidéo',
                    color: '#F59E0B',
                };
            default:
                return {
                    icon: 'film',
                    title: `+${CREDIT_REWARDS.REWARD_AD} crédits`,
                    subtitle: compact ? undefined : `${rewardAdsRemaining} vidéos disponibles`,
                    color: colors.primary,
                };
        }
    };

    const content = getContent();

    if (compact) {
        return (
            <TouchableOpacity
                style={[
                    styles.compactButton,
                    { backgroundColor: content.color },
                    !canWatchRewardAd && styles.disabled,
                ]}
                onPress={handlePress}
                disabled={!canWatchRewardAd || loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons name={content.icon as any} size={16} color="#fff" />
                        <Text style={styles.compactText}>{content.title}</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { borderColor: content.color },
                !canWatchRewardAd && styles.disabled,
            ]}
            onPress={handlePress}
            disabled={!canWatchRewardAd || loading}
            activeOpacity={0.8}
        >
            <View style={[styles.iconContainer, { backgroundColor: content.color }]}>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name={content.icon as any} size={24} color="#fff" />
                )}
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: content.color }]}>{content.title}</Text>
                {content.subtitle && (
                    <Text style={styles.subtitle}>{content.subtitle}</Text>
                )}
            </View>

            <Ionicons
                name="play-circle"
                size={28}
                color={canWatchRewardAd ? content.color : colors.textMuted}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 2,
        gap: spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    disabled: {
        opacity: 0.5,
    },
    compactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: 6,
    },
    compactText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
});

export default RewardedAdButton;
