/**
 * CreditBalance.tsx
 * Affichage du solde de crédits (pour le header)
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { useMonetization } from '../../contexts/MonetizationContext';

interface CreditBalanceProps {
    /** Style compact (badge) */
    compact?: boolean;
    /** Afficher l'icône + pour ajouter */
    showAdd?: boolean;
    /** Callback au tap */
    onPress?: () => void;
}

export function CreditBalance({
    compact = false,
    showAdd = true,
    onPress,
}: CreditBalanceProps) {
    const router = useRouter();
    const { credits } = useMonetization();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            // Navigation vers la boutique
            router.push('/shop' as any);
        }
    };

    // Format du nombre (1234 -> 1,234)
    const formatCredits = (amount: number): string => {
        return amount.toLocaleString('fr-FR');
    };

    if (compact) {
        return (
            <TouchableOpacity
                style={styles.compactContainer}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.compactCredits}>{formatCredits(credits)}</Text>
                {showAdd && (
                    <View style={styles.compactAdd}>
                        <Ionicons name="add" size={12} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.coinContainer}>
                <Text style={styles.coinIconLarge}>🪙</Text>
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.label}>Mes Crédits</Text>
                <Text style={styles.credits}>{formatCredits(credits)}</Text>
            </View>

            {showAdd && (
                <TouchableOpacity style={styles.addButton} onPress={handlePress}>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // Version complète
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    coinContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinIconLarge: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    credits: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    addButton: {
        padding: spacing.xs,
    },

    // Version compacte (header)
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    coinIcon: {
        fontSize: 14,
    },
    compactCredits: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F59E0B',
    },
    compactAdd: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 2,
    },
});

export default CreditBalance;
