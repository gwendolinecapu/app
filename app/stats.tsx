import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
    const { alters, currentAlter } = useAuth();

    // Mock data for demonstration
    const frontTimeData = useMemo(() => alters.map(alter => ({
        id: alter.id,
        name: alter.name,
        color: alter.color,
        hours: Math.floor(Math.random() * 24),
        percentage: Math.floor(Math.random() * 100),
    })), [alters]);

    const totalHours = frontTimeData.reduce((sum, alter) => sum + alter.hours, 0);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Statistiques</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Cette semaine</Text>
                <View style={styles.summaryStats}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{totalHours}h</Text>
                        <Text style={styles.summaryLabel}>Temps total</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{alters.length}</Text>
                        <Text style={styles.summaryLabel}>Alters actifs</Text>
                    </View>
                </View>
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Temps de front</Text>

                <View style={styles.barChart}>
                    {frontTimeData.map((alter, index) => (
                        <View key={alter.id} style={styles.barContainer}>
                            <View style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${alter.percentage}%`,
                                            backgroundColor: alter.color,
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.barLabel}>{alter.name.substring(0, 3)}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Details */}
            <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Détails par alter</Text>

                {frontTimeData.map((alter) => (
                    <View key={alter.id} style={styles.detailItem}>
                        <View style={[styles.detailAvatar, { backgroundColor: alter.color }]}>
                            <Text style={styles.detailAvatarText}>
                                {alter.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.detailInfo}>
                            <Text style={styles.detailName}>{alter.name}</Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${alter.percentage}%`,
                                            backgroundColor: alter.color,
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                        <Text style={styles.detailTime}>{alter.hours}h</Text>
                    </View>
                ))}
            </View>

            {/* Time Tracking Info */}
            <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                    Le temps de front est calculé automatiquement quand vous changez d'alter en front.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    title: {
        ...typography.h2,
    },
    summaryCard: {
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    summaryTitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryNumber: {
        ...typography.h1,
        color: colors.primary,
    },
    summaryLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: colors.border,
    },
    chartCard: {
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    chartTitle: {
        ...typography.body,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 150,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        width: 30,
        height: 120,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.sm,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: borderRadius.sm,
    },
    barLabel: {
        ...typography.caption,
        marginTop: spacing.xs,
    },
    detailsCard: {
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    detailsTitle: {
        ...typography.body,
        fontWeight: 'bold',
        marginBottom: spacing.md,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    detailAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailAvatarText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    detailInfo: {
        flex: 1,
        marginHorizontal: spacing.md,
    },
    detailName: {
        ...typography.bodySmall,
        fontWeight: '600',
        marginBottom: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: colors.backgroundLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    detailTime: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: spacing.md,
    },
    infoText: {
        ...typography.caption,
        flex: 1,
        color: colors.textSecondary,
    },
});
