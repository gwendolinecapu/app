import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { Alter, System } from '../../src/types';
import { colors, spacing, typography } from '../../src/lib/theme';
import { AlterBubble } from '../../src/components/AlterBubble';

export default function SystemProfileScreen() {
    const { systemId } = useLocalSearchParams<{ systemId: string }>();
    const [system, setSystem] = useState<System | null>(null);
    const [alters, setAlters] = useState<Alter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!systemId) return;
            try {
                // Fetch System Details (optional, mostly for name/avatar if needed)
                // Note: Systems collection might be restricted, but we need some info. 
                // Using a safe fetch or relying on what we can get.
                // If system doc is private, we might just show "Système Inconnu"
                try {
                    const sysDoc = await getDoc(doc(db, 'systems', systemId));
                    if (sysDoc.exists()) {
                        setSystem({ id: sysDoc.id, ...sysDoc.data() } as System);
                    }
                } catch (e) {
                    console.log('Could not fetch system details (likely private):', e);
                }

                // Fetch Public Alters
                const q = query(
                    collection(db, 'alters'),
                    where('systemId', '==', systemId), // Using camelCase consistent with new alters
                    // Note: You might want to filter for public/visible alters if that field existed
                    // For now, fetching all alters associated with the system
                );

                // Fallback for snake_case if needed
                const q2 = query(
                    collection(db, 'alters'),
                    where('system_id', '==', systemId)
                );

                const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);

                const uniqueAlters = new Map<string, Alter>();

                const processDoc = (doc: any) => {
                    const data = doc.data();
                    // Only include if not hidden/archived (assuming isArchived exists)
                    if (!data.isArchived) {
                        uniqueAlters.set(doc.id, { id: doc.id, ...data } as Alter);
                    }
                };

                snap1.forEach(processDoc);
                snap2.forEach(processDoc);

                setAlters(Array.from(uniqueAlters.values()));

            } catch (error) {
                console.error('Error fetching system profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [systemId]);

    const handleAlterPress = (alter: Alter) => {
        router.push(`/alter-space/${alter.id}`);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {system?.username || "Profil Système"}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Membres du système ({alters.length})</Text>

                <View style={styles.grid}>
                    {alters.map((alter) => (
                        <View key={alter.id} style={styles.gridItem}>
                            <AlterBubble
                                alter={alter}
                                onPress={() => handleAlterPress(alter)}
                                size={80}
                                showName={true}
                                isActive={alter.is_active || false}
                            />
                        </View>
                    ))}
                    {alters.length === 0 && (
                        <Text style={styles.emptyText}>Aucun membre visible.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: 60,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h3,
        fontWeight: 'bold',
        color: colors.text,
    },
    content: {
        padding: spacing.lg,
    },
    subtitle: {
        ...typography.h4,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start', // Left align
        gap: spacing.lg,
    },
    gridItem: {
        width: '30%', // Approx 3 columns
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
        width: '100%',
        marginTop: spacing.xl,
    }
});
