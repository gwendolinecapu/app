import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { FrontingService } from '../../src/services/fronting';
import { colors, spacing, typography, borderRadius, alterColors } from '../../src/lib/theme';
import { FrontingEntry, Alter } from '../../src/types';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function FrontingHistoryScreen() {
    const { system, alters } = useAuth();
    const [history, setHistory] = useState<FrontingEntry[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (system) {
            loadData();
        }
    }, [system]);

    const loadData = async () => {
        if (!system) return;
        try {
            const [historyData, statsData] = await Promise.all([
                FrontingService.getHistory(system.id),
                FrontingService.getWeeklyStats(system.id)
            ]);

            // Join with alter data
            const enrichedHistory = historyData.map(entry => ({
                ...entry,
                alter: alters.find(a => a.id === entry.alter_id)
            }));

            setHistory(enrichedHistory);
            setStats(statsData);
        } catch (error) {
            console.error("Error loading fronting data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "En cours";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getChartData = () => {
        const data = Object.keys(stats).map(alterId => {
            const alter = alters.find(a => a.id === alterId);
            const seconds = stats[alterId];
            return {
                name: alter?.name || 'Inconnu',
                population: Math.round(seconds / 60), // en minutes pour l'affichage
                color: alter?.color || colors.primary,
                legendFontColor: colors.textSecondary,
                legendFontSize: 12
            };
        });

        // Filtrer les valeurs nulles ou très petites pour le graph
        return data.filter(d => d.population > 0).sort((a, b) => b.population - a.population);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historique de Front</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* Stats Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Cette Semaine</Text>
                            <View style={styles.chartContainer}>
                                {Object.keys(stats).length > 0 ? (
                                    <PieChart
                                        data={getChartData()}
                                        width={width - 40}
                                        height={220}
                                        chartConfig={{
                                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                        }}
                                        accessor={"population"}
                                        backgroundColor={"transparent"}
                                        paddingLeft={"15"}
                                        absolute
                                    />
                                ) : (
                                    <Text style={styles.emptyText}>Pas assez de données pour le graphique.</Text>
                                )}
                            </View>
                        </View>

                        {/* History List */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Historique Récent</Text>
                            {history.length === 0 ? (
                                <Text style={styles.emptyText}>Aucun changement enregistré.</Text>
                            ) : (
                                history.map((entry) => (
                                    <View key={entry.id} style={styles.historyItem}>
                                        <View style={[styles.avatar, { backgroundColor: entry.alter?.color || colors.primary }]}>
                                            <Text style={styles.avatarText}>
                                                {entry.alter?.name.charAt(0).toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyName}>{entry.alter?.name || 'Alter supprimé'}</Text>
                                            <Text style={styles.historyTime}>{formatDate(entry.start_time)}</Text>
                                        </View>
                                        <Text style={styles.durationBadge}>
                                            {formatDuration(entry.duration)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
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
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    headerTitle: {
        ...typography.h3,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
        color: colors.primaryLight,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        marginBottom: spacing.sm,
        borderRadius: borderRadius.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    historyInfo: {
        flex: 1,
    },
    historyName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    historyTime: {
        ...typography.caption,
    },
    durationBadge: {
        ...typography.bodySmall,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: spacing.md,
    },
});
