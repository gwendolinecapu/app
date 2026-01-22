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
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import {
    Emotion,
    EmotionType,
    EMOTION_EMOJIS,
    EMOTION_LABELS
} from '../../src/types';

import { getThemeColors } from '../../src/lib/cosmetics';

const { width } = Dimensions.get('window');

// Liste des émotions disponibles (4x5 = 20 émotions)
const EMOTIONS: EmotionType[] = [
    'happy', 'love', 'excited', 'proud',
    'calm', 'bored', 'tired', 'sad',
    'anxious', 'fear', 'confused', 'angry',
    'shame', 'guilt', 'hurt', 'sick',
    'fuzzy', 'numb', 'overwhelmed', 'hopeful'
];

export default function EmotionsScreen() {
    const { currentAlter, user } = useAuth();

    // Determine Theme Colors
    const themeColors = currentAlter?.equipped_items?.theme
        ? getThemeColors(currentAlter.equipped_items.theme)
        : null;

    const textColor = themeColors?.text || colors.text;
    const textSecondaryColor = themeColors?.textSecondary || colors.textSecondary;
    const primaryColor = themeColors?.primary || colors.primary;
    const backgroundColor = themeColors?.background || colors.background;
    const cardColor = themeColors?.backgroundCard || colors.backgroundCard;

    const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>([]);
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

    // Récupérer l'historique des émotions (Max 7 entrées ou 24h)
    const fetchRecentEmotions = async () => {
        if (!currentAlter) return;

        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        try {
            const q = query(
                collection(db, 'emotions'),
                where('alter_id', '==', currentAlter.id),
                where('created_at', '>=', oneDayAgo.toISOString()),
                orderBy('created_at', 'desc'),
                limit(20) // Fetch a bit more to be safe, but we display 7
            );

            const querySnapshot = await getDocs(q);
            const data: Emotion[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Emotion);
            });

            if (data) {
                // Apply the "Max 7" rule
                setRecentEmotions(data.slice(0, 7));

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
        if (selectedEmotions.length === 0) {
            Alert.alert('Erreur', 'Veuillez sélectionner au moins une émotion');
            return;
        }

        if (!currentAlter) {
            Alert.alert('Erreur', 'Aucun alter sélectionné');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'emotions'), {
                system_id: user?.uid,
                alter_id: currentAlter.id,
                emotion: selectedEmotions[0], // Primary for legacy
                emotions: selectedEmotions, // Full list
                intensity,
                note: note.trim() || null,
                created_at: new Date().toISOString(),
            });

            Alert.alert('✨', 'Émotions enregistrées !');
            setSelectedEmotions([]);
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
            <View style={[styles.container, { backgroundColor }]}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>💭</Text>
                    <Text style={[styles.emptyTitle, { color: textColor }]}>Sélectionne un alter</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => router.push('/dashboard')} style={{ marginTop: 5 }}>
                            <Ionicons name="arrow-back" size={24} color={textColor} />
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.title, { color: textColor }]}>Comment te sens-tu ?</Text>
                            <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
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
                    <View style={[styles.todayBanner, { backgroundColor: primaryColor + '30' }]}>
                        <Text style={[styles.todayText, { color: primaryColor }]}>
                            nc                             Tu as déjà enregistré &quot;{EMOTION_LABELS[todayEmotion.emotion as EmotionType]}&quot;
                            {' '}aujourd&apos;hui
                        </Text>
                    </View>
                )}

                {/* Grille des émotions */}
                <View style={styles.emotionsGrid}>
                    {EMOTIONS.map((emotion) => {
                        const isSelected = selectedEmotions.includes(emotion);
                        return (
                            <TouchableOpacity
                                key={emotion}
                                style={[
                                    styles.emotionButton,
                                    { backgroundColor: cardColor },
                                    isSelected && { borderColor: primaryColor, backgroundColor: primaryColor + '20' },
                                ]}
                                onPress={() => {
                                    setSelectedEmotions(prev => {
                                        if (prev.includes(emotion)) {
                                            return prev.filter(e => e !== emotion);
                                        } else {
                                            return [...prev, emotion];
                                        }
                                    });
                                }}
                            >
                                <Text style={styles.emotionEmoji}>
                                    {EMOTION_EMOJIS[emotion]}
                                </Text>
                                <Text style={[
                                    styles.emotionLabel,
                                    { color: textSecondaryColor },
                                    isSelected && { color: primaryColor, fontWeight: 'bold' },
                                ]}>
                                    {EMOTION_LABELS[emotion]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Intensité */}
                {selectedEmotions.length > 0 && (
                    <View style={styles.intensitySection}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Intensité</Text>
                        <View style={styles.intensityRow}>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.intensityButton,
                                        { backgroundColor: cardColor },
                                        intensity === level && { borderColor: primaryColor, backgroundColor: primaryColor },
                                    ]}
                                    onPress={() => setIntensity(level)}
                                >
                                    <Text style={[
                                        styles.intensityText,
                                        { color: textSecondaryColor },
                                        intensity === level && { color: textColor }, // Or white? Usually white on primary. Let's try textColor for contrast if primary is light. 
                                        // Wait, on pastel primary is light, so text should be brown. 
                                        // If primary is dark, text should be white.
                                        // "themeColors.text" is designed to contrast with background.
                                        // Let's rely on theme logic: if theme is pastel, text is brown.
                                    ]}>
                                        {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.intensityLabels}>
                            <Text style={[styles.intensityHint, { color: textSecondaryColor }]}>Faible</Text>
                            <Text style={[styles.intensityHint, { color: textSecondaryColor }]}>Forte</Text>
                        </View>
                    </View>
                )}

                {/* Note optionnelle */}
                {selectedEmotions.length > 0 && (
                    <View style={styles.noteSection}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Note (optionnel)</Text>
                        <TextInput
                            style={[styles.noteInput, { backgroundColor: cardColor, color: textColor }]}
                            placeholder="Qu'est-ce qui t'a fait ressentir ça ?"
                            placeholderTextColor={textSecondaryColor}
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                )}

                {/* Bouton enregistrer */}
                {selectedEmotions.length > 0 && (
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: primaryColor }, loading && styles.saveButtonDisabled]}
                        onPress={handleSaveEmotion}
                        disabled={loading}
                    >
                        <Text style={[styles.saveButtonText, { color: themeColors?.text || 'white' }]}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Historique récent */}
                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Historique récent</Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: '/history', params: { tab: 'emotions' } })}>
                            <Text style={[styles.seeAllLink, { color: primaryColor }]}>Voir tout →</Text>
                        </TouchableOpacity>
                    </View>

                    {recentEmotions.length === 0 ? (
                        <Text style={[styles.noHistory, { color: textSecondaryColor }]}>
                            Aucune émotion ces dernières 24h
                        </Text>
                    ) : (
                        <View style={styles.historyList}>
                            {recentEmotions.map((emotion) => (
                                <View key={emotion.id} style={[styles.historyItem, { backgroundColor: cardColor }]}>
                                    <Text style={styles.historyEmoji}>
                                        {emotion.emotions
                                            ? emotion.emotions.map(e => EMOTION_EMOJIS[e]).join(' ')
                                            : EMOTION_EMOJIS[emotion.emotion as EmotionType]
                                        }
                                    </Text>
                                    <View style={styles.historyInfo}>
                                        <Text style={[styles.historyLabel, { color: textColor }]}>
                                            {emotion.emotions
                                                ? emotion.emotions.map(e => EMOTION_LABELS[e]).join(', ')
                                                : EMOTION_LABELS[emotion.emotion as EmotionType]
                                            }
                                        </Text>
                                        <Text style={[styles.historyDate, { color: textSecondaryColor }]}>
                                            {formatDate(emotion.created_at)}
                                        </Text>
                                    </View>
                                    <View style={[styles.historyIntensity, { backgroundColor: backgroundColor }]}>
                                        <Text style={[styles.historyIntensityText, { color: textSecondaryColor }]}>
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
        // backgroundColor handled dynamically
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
        // color handled dynamically
    },
    subtitle: {
        ...typography.bodySmall,
        // color handled dynamically
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
        // color handled dynamically
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
