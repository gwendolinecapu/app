/**
 * Écran principal du Journal
 * Liste les entrées de journal avec option de création
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { JournalEntry, EmotionType, EMOTION_EMOJIS } from '../../src/types';

export default function JournalScreen() {
    const { currentAlter } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Rafraîchir quand l'écran reprend le focus
    useFocusEffect(
        useCallback(() => {
            if (currentAlter) {
                fetchEntries();
            }
        }, [currentAlter])
    );

    const fetchEntries = async () => {
        if (!currentAlter) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('alter_id', currentAlter.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching journal entries:', error);
        } else {
            setEntries(data || []);
        }
        setLoading(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Aujourd'hui";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hier';
        } else {
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    };

    const handleDeleteEntry = (entryId: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous vraiment supprimer cette entrée ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('journal_entries')
                            .delete()
                            .eq('id', entryId);

                        if (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer');
                        } else {
                            fetchEntries();
                        }
                    }
                },
            ]
        );
    };

    const renderEntry = ({ item }: { item: JournalEntry }) => (
        <TouchableOpacity
            style={styles.entryCard}
            onPress={() => router.push(`/journal/${item.id}`)}
            onLongPress={() => handleDeleteEntry(item.id)}
        >
            <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                    {item.mood && (
                        <Text style={styles.moodEmoji}>
                            {EMOTION_EMOJIS[item.mood as EmotionType]}
                        </Text>
                    )}
                    <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
                </View>
                {item.is_locked && (
                    <Text style={styles.lockIcon}>🔒</Text>
                )}
            </View>

            {item.title && (
                <Text style={styles.entryTitle}>{item.title}</Text>
            )}

            <Text
                style={[styles.entryContent, item.is_locked && styles.lockedContent]}
                numberOfLines={item.is_locked ? 1 : 3}
            >
                {item.is_locked ? '••••••••••••••••••••' : item.content}
            </Text>

            {item.is_audio && (
                <View style={styles.audioBadge}>
                    <Text style={styles.audioBadgeText}>🎙️ Audio</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (!currentAlter) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📓</Text>
                    <Text style={styles.emptyTitle}>Sélectionne un alter</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Mon Journal</Text>
                <Text style={styles.subtitle}>
                    Par {currentAlter.name}
                </Text>
            </View>

            {/* Liste des entrées */}
            <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                renderItem={renderEntry}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📝</Text>
                        <Text style={styles.emptyTitle}>
                            {loading ? 'Chargement...' : 'Aucune entrée'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            Commence à écrire tes pensées
                        </Text>
                    </View>
                }
            />

            {/* FAB - Bouton flottant pour créer */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/journal/create')}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    entryCard: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    entryMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    moodEmoji: {
        fontSize: 18,
    },
    entryDate: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    lockIcon: {
        fontSize: 16,
    },
    entryTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    entryContent: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    lockedContent: {
        color: colors.textMuted,
    },
    audioBadge: {
        marginTop: spacing.sm,
        backgroundColor: colors.backgroundLight,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    audioBadgeText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: spacing.xxl * 2,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: 100,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 32,
        color: colors.text,
        fontWeight: 'bold',
    },
});
