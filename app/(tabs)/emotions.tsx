/**
 * Écran principal des émotions
 * Permet de saisir son émotion du moment et voir l'historique récent
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import {
    Emotion,
    EmotionType,
    EMOTION_EMOJIS,
    EMOTION_LABELS
} from '../../src/types';

const { width } = Dimensions.get('window');

// Liste des émotions disponibles
const EMOTIONS: EmotionType[] = [
    'happy', 'sad', 'anxious', 'angry',
    'tired', 'calm', 'confused', 'excited'
];

export default function EmotionsScreen() {
    const { currentAlter, user } = useAuth();
    const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
    const [intensity, setIntensity] = useState<number>(3);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [recentEmotions, setRecentEmotions] = useState<Emotion[]>([]);
    const [todayEmotion, setTodayEmotion] = useState<Emotion | null>(null);

    useEffect(() => {
        if (currentAlter) {
            fetchRecentEmotions();
        }
    }, [currentAlter]);

    // Récupérer les émotions récentes (7 derniers jours)
    const fetchRecentEmotions = async () => {
        if (!currentAlter) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        try {
            const q = query(
                collection(db, 'emotions'),
                where('alter_id', '==', currentAlter.id),
                where('created_at', '>=', sevenDaysAgo.toISOString()),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const data: Emotion[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Emotion);
            });

            if (data) {
                setRecentEmotions(data);
                // Vérifier si une émotion a été enregistrée aujourd'hui
                const today = new Date().toDateString();
                const todaysEntry = data.find(e =>
                    new Date(e.created_at).toDateString() === today
                );
                setTodayEmotion(todaysEntry || null);
            }
        } catch (error) {
            console.error('Error fetching emotions:', error);
        }
    };

    // Enregistrer une nouvelle émotion
    const handleSaveEmotion = async () => {
        if (!selectedEmotion) {
            Alert.alert('Erreur', 'Veuillez sélectionner une émotion');
            return;
        }

        if (!currentAlter) {
            Alert.alert('Erreur', 'Aucun alter sélectionné');
            return;
        }

        setLoading(true);
        try {
            const newEmotion = {
                system_id: user?.uid,
                alter_id: currentAlter.id,
                emotion: selectedEmotion,
                intensity,
                note: note.trim() || null,
                created_at: new Date().toISOString(),
            };

            await addDoc(collection(db, 'emotions'), newEmotion);

            Alert.alert('✨', 'Émotion enregistrée !');
            setSelectedEmotion(null);
            setIntensity(3);
            setNote('');
            fetchRecentEmotions();
        } catch (error: any) {
            console.error('Error saving emotion:', error);
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Formater la date pour l'affichage
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
            return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        }
    };

    if (!currentAlter) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>💭</Text>
                    <Text style={styles.emptyTitle}>Sélectionne un alter</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 5 }}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>Comment te sens-tu ?</Text>
                            <Text style={styles.subtitle}>
                                En tant que {currentAlter.name}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/crisis/index' as any)}>
                        <Ionicons name="warning-outline" size={28} color={colors.error || '#FF4444'} />
                    </TouchableOpacity>
                </View>

                {/* Info si déjà enregistré aujourd'hui */}
                {todayEmotion && (
                    <View style={styles.todayBanner}>
                        <Text style={styles.todayText}>
                            Tu as déjà enregistré "{EMOTION_LABELS[todayEmotion.emotion as EmotionType]}"
                            {' '}aujourd'hui
                        </Text>
                    </View>
                )}

                {/* Grille des émotions */}
                <View style={styles.emotionsGrid}>
                    {EMOTIONS.map((emotion) => (
                        <TouchableOpacity
                            key={emotion}
                            style={[
                                styles.emotionButton,
                                selectedEmotion === emotion && styles.emotionButtonSelected,
                            ]}
                            onPress={() => setSelectedEmotion(emotion)}
                        >
                            <Text style={styles.emotionEmoji}>
                                {EMOTION_EMOJIS[emotion]}
                            </Text>
                            <Text style={[
                                styles.emotionLabel,
                                selectedEmotion === emotion && styles.emotionLabelSelected,
                            ]}>
                                {EMOTION_LABELS[emotion]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Intensité */}
                {selectedEmotion && (
                    <View style={styles.intensitySection}>
                        <Text style={styles.sectionTitle}>Intensité</Text>
                        <View style={styles.intensityRow}>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.intensityButton,
                                        intensity === level && styles.intensityButtonSelected,
                                    ]}
                                    onPress={() => setIntensity(level)}
                                >
                                    <Text style={[
                                        styles.intensityText,
                                        intensity === level && styles.intensityTextSelected,
                                    ]}>
                                        {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.intensityLabels}>
                            <Text style={styles.intensityHint}>Faible</Text>
                            <Text style={styles.intensityHint}>Forte</Text>
                        </View>
                    </View>
                )}

                {/* Note optionnelle */}
                {selectedEmotion && (
                    <View style={styles.noteSection}>
                        <Text style={styles.sectionTitle}>Note (optionnel)</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Qu'est-ce qui t'a fait ressentir ça ?"
                            placeholderTextColor={colors.textMuted}
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                )}

                {/* Bouton enregistrer */}
                {selectedEmotion && (
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSaveEmotion}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Historique récent */}
                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.sectionTitle}>Historique récent</Text>
                        <TouchableOpacity onPress={() => router.push('/emotions/history')}>
                            <Text style={styles.seeAllLink}>Voir tout →</Text>
                        </TouchableOpacity>
                    </View>

                    {recentEmotions.length === 0 ? (
                        <Text style={styles.noHistory}>
                            Aucune émotion enregistrée cette semaine
                        </Text>
                    ) : (
                        <View style={styles.historyList}>
                            {recentEmotions.slice(0, 5).map((emotion) => (
                                <View key={emotion.id} style={styles.historyItem}>
                                    <Text style={styles.historyEmoji}>
                                        {EMOTION_EMOJIS[emotion.emotion as EmotionType]}
                                    </Text>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyLabel}>
                                            {EMOTION_LABELS[emotion.emotion as EmotionType]}
                                        </Text>
                                        <Text style={styles.historyDate}>
                                            {formatDate(emotion.created_at)}
                                        </Text>
                                    </View>
                                    <View style={styles.historyIntensity}>
                                        <Text style={styles.historyIntensityText}>
                                            {emotion.intensity}/5
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
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
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    header: {
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    todayBanner: {
        backgroundColor: colors.primaryLight + '30',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    todayText: {
        ...typography.bodySmall,
        color: colors.primary,
        textAlign: 'center',
    },
    emotionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    emotionButton: {
        width: (width - spacing.lg * 2 - spacing.sm * 3) / 4,
        aspectRatio: 1,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emotionButtonSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
    },
    emotionEmoji: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    emotionLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    emotionLabelSelected: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    intensitySection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
    },
    intensityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    intensityButton: {
        flex: 1,
        height: 50,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    intensityButtonSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    intensityText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: 'bold',
    },
    intensityTextSelected: {
        color: colors.text,
    },
    intensityLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
    },
    intensityHint: {
        ...typography.caption,
        color: colors.textMuted,
    },
    noteSection: {
        marginBottom: spacing.lg,
    },
    noteInput: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    historySection: {
        marginTop: spacing.md,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    seeAllLink: {
        ...typography.bodySmall,
        color: colors.primary,
    },
    noHistory: {
        ...typography.bodySmall,
        color: colors.textMuted,
        textAlign: 'center',
        padding: spacing.lg,
    },
    historyList: {
        gap: spacing.sm,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    historyEmoji: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    historyInfo: {
        flex: 1,
    },
    historyLabel: {
        ...typography.body,
        fontWeight: '600',
    },
    historyDate: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    historyIntensity: {
        backgroundColor: colors.backgroundLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    historyIntensityText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.textSecondary,
    },
});
