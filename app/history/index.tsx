/**
 * Écran History - Historique Unifié avec Statistiques Avancées
 * 
 * NAVIGATION PAR ONGLETS:
 * - Résumé: Vue d'ensemble avec cartes de stats et insights
 * - Front: Historique de front avec timeline et graphiques
 * - Émotions: Courbe d'évolution et distribution émotionnelle
 * 
 * FILTRES DE PÉRIODE:
 * 7j / 30j / 90j / Année / Tout
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../src/contexts/AuthContext';
import { FrontingService } from '../../src/services/fronting';
import { EmotionService } from '../../src/services/emotions';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { EmotionType, EMOTION_EMOJIS, EMOTION_LABELS } from '../../src/types';

const { width } = Dimensions.get('window');

// Types pour les onglets et périodes
type TabType = 'summary' | 'front' | 'emotions';
type PeriodType = '7d' | '30d' | '90d' | '1y' | 'all';

const PERIOD_DAYS: Record<PeriodType, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
    'all': 9999,
};

const PERIOD_LABELS: Record<PeriodType, string> = {
    '7d': '7j',
    '30d': '30j',
    '90d': '90j',
    '1y': 'Année',
    'all': 'Tout',
};

export default function HistoryScreen() {
    const { system, alters, currentAlter } = useAuth();

    const params = useLocalSearchParams<{ tab: TabType }>();

    // États UI
    const [activeTab, setActiveTab] = useState<TabType>(params.tab || 'summary');
    const [period, setPeriod] = useState<PeriodType>('7d');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Données Front
    const [frontStats, setFrontStats] = useState<Record<string, number>>({});
    const [dailyBreakdown, setDailyBreakdown] = useState<{ date: string; hours: number; switches: number }[]>([]);
    const [switchCount, setSwitchCount] = useState<{ current: number; previous: number; trend: 'up' | 'down' | 'stable' }>({ current: 0, previous: 0, trend: 'stable' });
    const [topAlters, setTopAlters] = useState<{ alterId: string; hours: number; percentage: number }[]>([]);

    // Données Émotions
    const [emotionTrend, setEmotionTrend] = useState<{ date: string; value: number; count: number }[]>([]);
    const [emotionDistribution, setEmotionDistribution] = useState<{ type: EmotionType; label: string; count: number; percentage: number }[]>([]);
    const [moodAverage, setMoodAverage] = useState<{ average: number; trend: 'up' | 'down' | 'stable'; previousAverage: number }>({ average: 0, trend: 'stable', previousAverage: 0 });
    const [patterns, setPatterns] = useState<string[]>([]);
    const [emotionSummary, setEmotionSummary] = useState<{ totalEntries: number; avgIntensity: number; dominantEmotion: EmotionType | null; moodScore: number }>({ totalEntries: 0, avgIntensity: 0, dominantEmotion: null, moodScore: 50 });

    // Animation pour les onglets
    const [tabAnimation] = useState(new Animated.Value(0));

    // Charger les données
    const loadData = useCallback(async () => {
        if (!system) return;

        try {
            const days = PERIOD_DAYS[period];

            // Charger données Front
            const [statsData, breakdownData, switchData, topData] = await Promise.all([
                FrontingService.getStatsForPeriod(system.id, days),
                FrontingService.getDailyBreakdown(system.id, Math.min(days, 30)), // Max 30 points pour le graphique
                FrontingService.getSwitchCount(system.id, days),
                FrontingService.getTopAlters(system.id, days, 5)
            ]);

            setFrontStats(statsData);
            setDailyBreakdown(breakdownData);
            setSwitchCount(switchData);
            setTopAlters(topData);

            // Charger données Émotions (si alter sélectionné)
            if (currentAlter) {
                const [trendData, distData, moodData, patternData, summaryData] = await Promise.all([
                    EmotionService.getEmotionsTrend(currentAlter.id, Math.min(days, 30)),
                    EmotionService.getEmotionsDistribution(currentAlter.id, days),
                    EmotionService.getMoodAverage(currentAlter.id, days),
                    EmotionService.detectPatterns(currentAlter.id),
                    EmotionService.getSummaryStats(currentAlter.id, days)
                ]);

                setEmotionTrend(trendData);
                setEmotionDistribution(distData);
                setMoodAverage(moodData);
                setPatterns(patternData);
                setEmotionSummary(summaryData);
            }
        } catch (error) {
            console.error('Erreur chargement historique:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [system, currentAlter, period]);

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Animation tab switch
    const switchTab = (tab: TabType) => {
        const tabIndex = tab === 'summary' ? 0 : tab === 'front' ? 1 : 2;
        Animated.spring(tabAnimation, {
            toValue: tabIndex,
            useNativeDriver: true,
            friction: 8,
        }).start();
        setActiveTab(tab);
    };

    // Calculer les heures totales de front
    const totalHours = useMemo(() => {
        const totalSeconds = Object.values(frontStats).reduce((a, b) => a + b, 0);
        return parseFloat((totalSeconds / 3600).toFixed(1));
    }, [frontStats]);

    // Préparer données pour le LineChart
    const lineChartData = useMemo(() => ({
        labels: dailyBreakdown.slice(-7).map(d => {
            const date = new Date(d.date);
            return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()];
        }),
        datasets: [{
            data: dailyBreakdown.slice(-7).map(d => d.hours || 0),
            strokeWidth: 3,
        }]
    }), [dailyBreakdown]);

    // Préparer données PieChart pour les émotions
    const emotionPieData = useMemo(() => {
        const emotionColors: Record<EmotionType, string> = {
            happy: '#FFD93D',
            excited: '#FF6B6B',
            calm: '#6BCB77',
            confused: '#9B59B6',
            tired: '#A0AEC0',
            anxious: '#F39C12',
            sad: '#3498DB',
            angry: '#E74C3C',
        };

        return emotionDistribution.slice(0, 5).map(e => ({
            name: EMOTION_EMOJIS[e.type],
            population: e.count,
            color: emotionColors[e.type] || colors.primary,
            legendFontColor: colors.textSecondary,
            legendFontSize: 12
        }));
    }, [emotionDistribution]);

    // Render stat card
    const renderStatCard = (icon: string, value: string | number, label: string, trend?: 'up' | 'down' | 'stable', color?: string) => (
        <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
                <Text style={styles.statIcon}>{icon}</Text>
                {trend && (
                    <Ionicons
                        name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
                        size={16}
                        color={trend === 'up' ? '#22C55E' : trend === 'down' ? '#EF4444' : colors.textMuted}
                    />
                )}
            </View>
            <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    // Render insight card (style Spotify Wrapped)
    const renderInsightCard = (insight: string, index: number) => (
        <LinearGradient
            key={index}
            colors={[colors.primary + '30', colors.primary + '10']}
            style={styles.insightCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={styles.insightText}>{insight}</Text>
        </LinearGradient>
    );

    // Render l'onglet Résumé
    const renderSummaryTab = () => (
        <View style={styles.tabContent}>
            {/* Cartes de stats principales */}
            <View style={styles.statsRow}>
                {renderStatCard('⏱️', `${totalHours}h`, 'Temps Front', undefined, colors.primary)}
                {renderStatCard('🔄', switchCount.current, 'Switchs', switchCount.trend)}
            </View>

            <View style={styles.statsRow}>
                {renderStatCard(
                    emotionSummary.dominantEmotion ? EMOTION_EMOJIS[emotionSummary.dominantEmotion] : '💜',
                    emotionSummary.moodScore,
                    'Score Humeur',
                    moodAverage.trend
                )}
                {renderStatCard('📝', emotionSummary.totalEntries, 'Entrées', undefined)}
            </View>

            {/* Graphique d'activité */}
            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>📈 Activité</Text>
                {dailyBreakdown.length > 0 ? (
                    <LineChart
                        data={lineChartData}
                        width={width - spacing.lg * 2 - spacing.md * 2}
                        height={180}
                        chartConfig={{
                            backgroundColor: colors.backgroundCard,
                            backgroundGradientFrom: colors.backgroundCard,
                            backgroundGradientTo: colors.backgroundCard,
                            decimalPlaces: 1,
                            color: (opacity = 1) => colors.primary,
                            labelColor: () => colors.textSecondary,
                            propsForDots: {
                                r: '4',
                                strokeWidth: '2',
                                stroke: colors.primary
                            },
                            propsForBackgroundLines: {
                                stroke: colors.border,
                                strokeDasharray: '5,5'
                            }
                        }}
                        bezier
                        style={styles.chart}
                    />
                ) : (
                    <Text style={styles.emptyText}>Pas assez de données</Text>
                )}
            </View>

            {/* Insights */}
            {patterns.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Insights</Text>
                    {patterns.map((insight, i) => renderInsightCard(insight, i))}
                </View>
            )}
        </View>
    );

    // Render l'onglet Front
    const renderFrontTab = () => (
        <View style={styles.tabContent}>
            {/* Top Alters */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏆 Top Alters</Text>
                {topAlters.map((alter, index) => {
                    const alterData = alters.find(a => a.id === alter.alterId);
                    return (
                        <View key={alter.alterId} style={styles.topAlterRow}>
                            <View style={styles.topAlterRank}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <View style={[styles.alterAvatar, { backgroundColor: alterData?.color || colors.primary }]}>
                                <Text style={styles.alterInitial}>{alterData?.name?.[0] || '?'}</Text>
                            </View>
                            <View style={styles.alterInfo}>
                                <Text style={styles.alterName}>{alterData?.name || 'Inconnu'}</Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${alter.percentage}%`, backgroundColor: alterData?.color || colors.primary }]} />
                                </View>
                            </View>
                            <View style={styles.alterStats}>
                                <Text style={styles.alterHours}>{alter.hours}h</Text>
                                <Text style={styles.alterPercentage}>{alter.percentage}%</Text>
                            </View>
                        </View>
                    );
                })}
                {topAlters.length === 0 && (
                    <Text style={styles.emptyText}>Aucune donnée de front</Text>
                )}
            </View>

            {/* Graphique journalier */}
            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>📊 Heures par jour</Text>
                {dailyBreakdown.length > 0 ? (
                    <BarChart
                        data={{
                            labels: dailyBreakdown.slice(-7).map(d => {
                                const date = new Date(d.date);
                                return ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()];
                            }),
                            datasets: [{ data: dailyBreakdown.slice(-7).map(d => d.hours || 0) }]
                        }}
                        width={width - spacing.lg * 2 - spacing.md * 2}
                        height={200}
                        yAxisLabel=""
                        yAxisSuffix="h"
                        chartConfig={{
                            backgroundColor: colors.backgroundCard,
                            backgroundGradientFrom: colors.backgroundCard,
                            backgroundGradientTo: colors.backgroundCard,
                            decimalPlaces: 1,
                            color: () => colors.primary,
                            labelColor: () => colors.textSecondary,
                            barPercentage: 0.6,
                            propsForBackgroundLines: {
                                stroke: colors.border
                            }
                        }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                        fromZero
                    />
                ) : (
                    <Text style={styles.emptyText}>Pas assez de données</Text>
                )}
            </View>
        </View>
    );

    // Render l'onglet Émotions
    const renderEmotionsTab = () => (
        <View style={styles.tabContent}>
            {/* Stats émotionnelles */}
            <View style={styles.statsRow}>
                {renderStatCard(
                    emotionSummary.dominantEmotion ? EMOTION_EMOJIS[emotionSummary.dominantEmotion] : '💜',
                    emotionSummary.dominantEmotion ? EMOTION_LABELS[emotionSummary.dominantEmotion] : '-',
                    'Dominante'
                )}
                {renderStatCard('📊', moodAverage.average.toFixed(1), 'Intensité moy.', moodAverage.trend)}
            </View>

            {/* Distribution */}
            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>🎯 Distribution</Text>
                {emotionPieData.length > 0 ? (
                    <PieChart
                        data={emotionPieData}
                        width={width - spacing.lg * 2 - spacing.md * 2}
                        height={180}
                        chartConfig={{
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                ) : (
                    <Text style={styles.emptyText}>Aucune émotion enregistrée</Text>
                )}
            </View>

            {/* Liste des émotions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Répartition</Text>
                {emotionDistribution.map(emotion => (
                    <View key={emotion.type} style={styles.emotionRow}>
                        <Text style={styles.emotionEmoji}>{EMOTION_EMOJIS[emotion.type]}</Text>
                        <View style={styles.emotionInfo}>
                            <Text style={styles.emotionLabel}>{emotion.label}</Text>
                            <View style={styles.emotionProgressBar}>
                                <View style={[styles.emotionProgressFill, { width: `${emotion.percentage}%` }]} />
                            </View>
                        </View>
                        <Text style={styles.emotionCount}>{emotion.count}x ({emotion.percentage}%)</Text>
                    </View>
                ))}
                {emotionDistribution.length === 0 && (
                    <Text style={styles.emptyText}>Aucune émotion sur cette période</Text>
                )}
            </View>

            {/* Insights émotionnels */}
            {patterns.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Patterns détectés</Text>
                    {patterns.map((insight, i) => renderInsightCard(insight, i))}
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Historique</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Onglets */}
            <View style={styles.tabsContainer}>
                {(['summary', 'front', 'emotions'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => switchTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'summary' ? '📊 Résumé' : tab === 'front' ? '🔄 Front' : '💜 Émotions'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Filtres de période */}
            <View style={styles.periodFilters}>
                {(['7d', '30d', '90d', '1y', 'all'] as PeriodType[]).map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodButton, period === p && styles.periodButtonActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                            {PERIOD_LABELS[p]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Contenu */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {activeTab === 'summary' && renderSummaryTab()}
                {activeTab === 'front' && renderFrontTab()}
                {activeTab === 'emotions' && renderEmotionsTab()}
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
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        padding: spacing.sm,
    },
    refreshButton: {
        padding: spacing.sm,
    },
    title: {
        ...typography.h2,
        fontSize: 20,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.backgroundCard,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFF',
    },
    periodFilters: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    periodButton: {
        flex: 1,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.backgroundCard,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: colors.primary + '30',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    periodText: {
        ...typography.caption,
        color: colors.textMuted,
    },
    periodTextActive: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },
    tabContent: {
        paddingHorizontal: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    statIcon: {
        fontSize: 24,
    },
    statValue: {
        ...typography.h2,
        fontSize: 28,
        color: colors.text,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    section: {
        marginBottom: spacing.lg,
    },
    chartSection: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
    },
    chart: {
        borderRadius: borderRadius.md,
        marginVertical: spacing.sm,
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: spacing.lg,
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    insightText: {
        ...typography.body,
        flex: 1,
        color: colors.text,
    },
    topAlterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    topAlterRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    rankText: {
        ...typography.bodySmall,
        fontWeight: 'bold',
        color: colors.primary,
    },
    alterAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    alterInitial: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    alterInfo: {
        flex: 1,
    },
    alterName: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    alterStats: {
        alignItems: 'flex-end',
    },
    alterHours: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.primary,
    },
    alterPercentage: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emotionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    emotionEmoji: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    emotionInfo: {
        flex: 1,
    },
    emotionLabel: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: 4,
    },
    emotionProgressBar: {
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    emotionProgressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    emotionCount: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
});
