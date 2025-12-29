/**
 * Shop Screen - Coming Soon (Requires Development Build for Ads)
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

export default function ShopScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Boutique</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Coming Soon */}
            <View style={styles.content}>
                <Ionicons name="construct" size={80} color={colors.primary} />
                <Text style={styles.comingSoonTitle}>Bientôt disponible</Text>
                <Text style={styles.comingSoonText}>
                    La boutique nécessite une version de développement pour fonctionner avec les publicités.
                </Text>
                <Text style={styles.comingSoonNote}>
                    Cette fonctionnalité sera disponible dans la prochaine mise à jour.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        padding: spacing.xs,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    comingSoonTitle: {
        ...typography.h1,
        color: colors.text,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    comingSoonText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    comingSoonNote: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
