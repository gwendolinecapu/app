import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { HelpService } from '../../src/services/help';
import { HelpRequest } from '../../src/types';


export default function HelpRequestsListScreen() {
    const router = useRouter();
    const { system } = useAuth();
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadRequests = async () => {
        if (!system) return;
        setRefreshing(true);
        try {
            const data = await HelpService.getActiveRequests(system.id);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [system]);

    const handleResolve = async (id: string) => {
        Alert.alert(
            "Résoudre la demande",
            "Avez-vous apporté l'aide nécessaire ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Oui, c'est réglé",
                    onPress: async () => {
                        try {
                            await HelpService.resolveRequest(id);
                            loadRequests();
                        } catch {
                            Alert.alert("Erreur", "Impossible de mettre à jour la demande.");
                        }
                    }
                }
            ]
        );
    };

    const getIconForType = (type: HelpRequest['type']) => {
        switch (type) {
            case 'emergency': return 'warning';
            case 'support': return 'hand-left';
            case 'talk': return 'chatbubbles';
            default: return 'help-circle';
        }
    };

    const getColorForType = (type: HelpRequest['type']) => {
        switch (type) {
            case 'emergency': return '#EF4444';
            case 'support': return '#3B82F6';
            case 'talk': return '#10B981';
            default: return colors.textSecondary;
        }
    };

    const renderItem = ({ item }: { item: HelpRequest }) => (
        <View style={[styles.card, { borderLeftColor: getColorForType(item.type) }]}>
            <View style={styles.cardHeader}>
                <View style={styles.requesterInfo}>
                    <View style={[styles.typeIcon, { backgroundColor: getColorForType(item.type) }]}>
                        <Ionicons name={getIconForType(item.type) as any} size={16} color="white" />
                    </View>
                    <Text style={styles.requesterName}>
                        {item.is_anonymous ? "Anonyme" : (item.requester_name || "Alter inconnu")}
                    </Text>
                </View>
                <Text style={styles.date}>
                    {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at))}
                </Text>
            </View>

            <Text style={styles.description}>{item.description}</Text>

            <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => handleResolve(item.id)}
            >
                <Text style={styles.resolveButtonText}>Marquer comme résolu</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Demandes d&apos;Aide</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/help/create')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={requests}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadRequests} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Aucune demande active.</Text>
                        <Text style={styles.emptySubtext}>Tout va bien dans le système !</Text>
                    </View>
                }
            />
        </View>
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
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: colors.backgroundCard,
    },
    title: {
        ...typography.h3,
    },
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    requesterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    typeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requesterName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    date: {
        ...typography.caption,
        color: colors.textMuted,
    },
    description: {
        ...typography.body,
        fontSize: 15,
        marginBottom: spacing.md,
        color: colors.textSecondary,
    },
    resolveButton: {
        alignSelf: 'flex-end',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    resolveButtonText: {
        ...typography.caption,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: spacing.md,
        color: colors.textSecondary,
    },
    emptySubtext: {
        ...typography.body,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
});
