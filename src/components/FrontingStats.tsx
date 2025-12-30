import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const FrontingStats = () => {
    const { user, alters } = useAuth();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);
    const [totalSwitches, setTotalSwitches] = useState(0);

    useEffect(() => {
        if (!user) return;
        fetchStats();
    }, [user, alters]);

    const fetchStats = async () => {
        try {
            // Fetch last 50 switches for stats
            const q = query(
                collection(db, 'front_history'),
                where('system_id', '==', user?.uid),
                orderBy('started_at', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const history = snapshot.docs.map(doc => doc.data());

            setTotalSwitches(history.length);

            if (history.length === 0) {
                setLoading(false);
                return;
            }

            // Aggregate counts by alter_id
            const counts: { [key: string]: number } = {};
            history.forEach((entry: any) => {
                const id = entry.alter_id;
                counts[id] = (counts[id] || 0) + 1;
            });

            // Format for PieChart
            const data = Object.keys(counts).map(alterId => {
                const alter = alters.find(a => a.id === alterId);
                return {
                    name: alter?.name || 'Inconnu',
                    count: counts[alterId],
                    color: alter?.color || '#ccc',
                    legendFontColor: colors.text,
                    legendFontSize: 12
                };
            }).sort((a, b) => b.count - a.count).slice(0, 5); // Start with top 5

            setChartData(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (chartData.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Statistiques</Text>
                <Text style={styles.emptyText}>Pas assez de données pour le moment.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Activité Récente (Top 5)</Text>

            <PieChart
                data={chartData}
                width={SCREEN_WIDTH - 60}
                height={200}
                chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"count"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
                hasLegend={true}
            />

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Basé sur les {totalSwitches} derniers switchs
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        ...typography.h3,
        color: colors.text,
        fontSize: 18,
        marginBottom: spacing.sm,
    },
    emptyText: {
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    footer: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    footerText: {
        ...typography.caption,
        color: colors.textMuted,
    }
});
