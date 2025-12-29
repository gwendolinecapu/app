/**
 * Écran de détail d'une entrée de journal
 * Affiche le contenu complet avec option de modification/suppression
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { JournalEntry, EmotionType, EMOTION_EMOJIS, EMOTION_LABELS } from '../../src/types';

export default function JournalDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { currentAlter } = useAuth();
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchEntry();
        }
    }, [id]);

    const fetchEntry = async () => {
        if (!id) return;
        setLoading(true);

        try {
            const docRef = doc(db, 'journal_entries', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setEntry({ id: docSnap.id, ...docSnap.data() } as JournalEntry);
            } else {
                Alert.alert('Erreur', 'Entrée introuvable');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching journal entry:', error);
            Alert.alert('Erreur', 'Impossible de charger l\'entrée');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous vraiment supprimer cette entrée ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!id) return;
                            await deleteDoc(doc(db, 'journal_entries', id));
                            router.back();
                        } catch (error) {
                            console.error('Error deleting entry:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer');
                        }
                    }
                },
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingState}>
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </View>
        );
    }

    if (!entry) {
        return (
            <View style={styles.container}>
                <View style={styles.errorState}>
                    <Text style={styles.errorText}>Entrée introuvable</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Retour</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete}>
                    <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Meta info */}
                <View style={styles.metaSection}>
                    <View style={styles.metaRow}>
                        {entry.mood && (
                            <View style={styles.moodBadge}>
                                <Text style={styles.moodEmoji}>
                                    {EMOTION_EMOJIS[entry.mood as EmotionType]}
                                </Text>
                                <Text style={styles.moodLabel}>
                                    {EMOTION_LABELS[entry.mood as EmotionType]}
                                </Text>
                            </View>
                        )}
                        {entry.is_locked && (
                            <View style={styles.lockBadge}>
                                <Text>🔒 Verrouillée</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.dateText}>{formatDate(entry.created_at)}</Text>
                </View>

                {/* Titre */}
                {entry.title && (
                    <Text style={styles.title}>{entry.title}</Text>
                )}

                {/* Contenu */}
                <Text style={styles.content}>{entry.content}</Text>

                {/* Audio badge si applicable */}
                {entry.is_audio && (
                    <View style={styles.audioBadge}>
                        <Text style={styles.audioBadgeText}>🎙️ Entrée audio</Text>
                    </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        ...typography.body,
        color: colors.primary,
    },
    deleteButton: {
        fontSize: 20,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    metaSection: {
        marginBottom: spacing.lg,
    },
    metaRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    moodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.backgroundCard,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
    },
    moodEmoji: {
        fontSize: 16,
    },
    moodLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    lockBadge: {
        backgroundColor: colors.warning + '20',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
    },
    dateText: {
        ...typography.caption,
        color: colors.textMuted,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.md,
    },
    content: {
        ...typography.body,
        lineHeight: 28,
        color: colors.text,
    },
    audioBadge: {
        marginTop: spacing.lg,
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    audioBadgeText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        color: colors.textMuted,
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        ...typography.body,
        color: colors.error,
    },
});
