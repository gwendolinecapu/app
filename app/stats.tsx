import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useAuth } from '../src/contexts/AuthContext';
import { FrontingService } from '../src/services/fronting';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';
import { FrontingEntry } from '../src/types';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
    const { system, alters } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [weeklyBreakdown, setWeeklyBreakdown] = useState<{ label: string, value: number }[]>([]);
    const [alterStats, setAlterStats] = useState<Record<string, number>>({});
    const [switchCount, setSwitchCount] = useState(0);
    const [totalHours, setTotalHours] = useState(0);

    useEffect(() => {
        if (system) {
            loadData();
        }
    }, [system]);

    const loadData = async () => {
        if (!system) return;
        try {
            const [breakdownData, statsData, historyData] = await Promise.all([
                FrontingService.getWeeklyBreakdown(system.id),
                FrontingService.getWeeklyStats(system.id),
                FrontingService.getHistory(system.id, 100) // Pour compter les switchs
            ]);

            setWeeklyBreakdown(breakdownData);
            setAlterStats(statsData);

            // Calculer total heures
            const totalSeconds = Object.values(statsData).reduce((a, b) => a + b, 0);
            setTotalHours(parseFloat((totalSeconds / 3600).toFixed(1)));

            // Compter switchs cette semaine
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentSwitches = historyData.filter(h => new Date(h.start_time) >= sevenDaysAgo);
            setSwitchCount(recentSwitches.length);

        } catch (error) {
            console.error("Erreur chargement stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Préparer données BarChart
    const barChartData = {
        labels: weeklyBreakdown.map(d => d.label),
        datasets: [{
            data: weeklyBreakdown.map(d => d.value)
        }]
    };

    // Préparer liste détaillée
    const detailedStats = useMemo(() => {
        return Object.entries(alterStats)
            .map(([alterId, seconds]) => {
                const alter = alters.find(a => a.id === alterId);
                return {
                    id: alterId,
                    name: alter?.name || 'Inconnu',
                    color: alter?.color || colors.text,
                    hours: parseFloat((seconds / 3600).toFixed(1)),
                    percentage: totalHours > 0 ? Math.round((parseFloat((seconds / 3600).toFixed(1)) / totalHours) * 100) : 0
                };
            })
            .sort((a, b) => b.hours - a.hours);
    }, [alterStats, alters, totalHours]);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Analyses</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Summary Cards */}
                <View style={styles.cardsRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardValue}>{totalHours}h</Text>
                        <Text style={styles.cardLabel}>Front (7j)</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardValue}>{switchCount}</Text>
                        <Text style={styles.cardLabel}>Switchs (7j)</Text>
                    </View>
                </View>

                {/* Activity Chart */}
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>Activité Hebdomadaire (Heures)</Text>
                    <BarChart
                        data={barChartData}
                        width={width - spacing.lg * 2}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix="h"
                        chartConfig={{
                            backgroundColor: colors.backgroundCard,
                            backgroundGradientFrom: colors.backgroundCard,
                            backgroundGradientTo: colors.backgroundCard,
                            decimalPlaces: 1,
                            color: (opacity = 1) => colors.primary, // Utilise la couleur primaire
                            labelColor: (opacity = 1) => colors.textSecondary,
                            barPercentage: 0.7,
                            propsForBackgroundLines: {
                                strokeDasharray: "", // solid lines
                                stroke: colors.border
                            }
                        }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                        fromZero
                    />
                </View>

                {/* Detailed Breakdown */}
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Répartition par Alter</Text>
                    {detailedStats.map((stat) => (
                        <View key={stat.id} style={styles.statRow}>
                            <View style={[styles.avatarDot, { backgroundColor: stat.color }]}>
                                <Text style={styles.avatarInitial}>{stat.name[0]}</Text>
                            </View>
                            <View style={styles.statInfo}>
                                <View style={styles.statHeader}>
                                    <Text style={styles.statName}>{stat.name}</Text>
                                    <Text style={styles.statPercentage}>{stat.percentage}%</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${stat.percentage}%`, backgroundColor: stat.color }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.statHours}>{stat.hours} heures</Text>
                            </View>
                        </View>
                    ))}
                    {detailedStats.length === 0 && (
                        <Text style={styles.emptyText}>Aucune donnée sur cette période.</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    backButton: {
        padding: spacing.sm,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    title: {
        ...typography.h2,
        fontSize: 20,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',

    },
    cardValue: {
        ...typography.h1,
        fontSize: 32,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    cardLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chartSection: {
        marginBottom: spacing.xl,
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    sectionTitle: {
        ...typography.h3,
        alignSelf: 'flex-start',
        marginBottom: spacing.lg,
        color: colors.text,
    },
    chart: {
        borderRadius: borderRadius.lg,
        marginTop: spacing.sm,
    },
    detailsSection: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    statRow: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        alignItems: 'flex-start',
    },
    avatarDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarInitial: {
        color: '#FFF', // Assuming dark text on light bg or vice versa, white usually safe on colors
        fontWeight: 'bold',
        fontSize: 16,
    },
    statInfo: {
        flex: 1,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        alignItems: 'center',
    },
    statName: {
        ...typography.body,
        fontWeight: '600',
    },
    statPercentage: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        color: colors.text,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: colors.background,
        borderRadius: 4,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    statHours: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});
