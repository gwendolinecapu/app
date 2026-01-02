import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { EmotionService } from '../../services/emotions';
import { Emotion, EmotionType } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';

const EMOTION_CONFIG: { type: EmotionType; emoji: string; color: string; label: string }[] = [
    { type: 'happy', emoji: '😊', color: '#FFD93D', label: 'Joyeux(se)' },
    { type: 'sad', emoji: '😢', color: '#3498DB', label: 'Triste' },
    { type: 'anxious', emoji: '😰', color: '#F39C12', label: 'Anxieux(se)' },
    { type: 'angry', emoji: '😡', color: '#E74C3C', label: 'En colère' },
    { type: 'tired', emoji: '😴', color: '#A0AEC0', label: 'Fatigué(e)' },
    { type: 'calm', emoji: '😌', color: '#6BCB77', label: 'Calme' },
    { type: 'confused', emoji: '😕', color: '#9B59B6', label: 'Confus(e)' },
    { type: 'excited', emoji: '🤩', color: '#FF6B6B', label: 'Excité(e)' },
    { type: 'fear', emoji: '😨', color: '#5D4037', label: 'Peur' },
    { type: 'shame', emoji: '😳', color: '#E91E63', label: 'Honte' },
    { type: 'bored', emoji: '😐', color: '#7F8C8D', label: 'Ennuyé(e)' },
    { type: 'proud', emoji: '🦁', color: '#F1C40F', label: 'Fier(e)' },
    { type: 'love', emoji: '🥰', color: '#FF4081', label: 'Amoureux(se)' },
    { type: 'sick', emoji: '🤢', color: '#8BC34A', label: 'Malade' },
    { type: 'guilt', emoji: '😔', color: '#607D8B', label: 'Coupable' },
    { type: 'hurt', emoji: '🤕', color: '#FF5722', label: 'Blessé(e)' },
];

const formatTimeSince = (dateInput: any): string => {
    if (!dateInput) return '';

    let date: Date;
    // Handle Firestore Timestamp
    if (dateInput?.toDate) {
        date = dateInput.toDate();
    } else if (dateInput?.seconds) {
        date = new Date(dateInput.seconds * 1000);
    } else {
        date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "à l'instant";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}j`;
};

export const AlterWeatherBar: React.FC = () => {
    const { alters, user } = useAuth();
    const [alterEmotions, setAlterEmotions] = useState<Record<string, Emotion>>({});

    useEffect(() => {
        if (!user || alters.length === 0) return;

        const unsubscribe = EmotionService.subscribeToSystemEmotions(user.uid, (emotions) => {
            setAlterEmotions(emotions);
        });

        return () => unsubscribe();
    }, [user, alters]);

    const getEmotionConfig = (emotionType: EmotionType) => {
        return EMOTION_CONFIG.find(e => e.type === emotionType);
    };

    const handleEmotionPress = (alterName: string, emotion: Emotion) => {
        const emotionsList = emotion.emotions && emotion.emotions.length > 0 ? emotion.emotions : [emotion.emotion];

        const emojiString = emotionsList.map(e => getEmotionConfig(e)?.emoji).filter(Boolean).join(' ');
        const labelString = emotionsList.map(e => getEmotionConfig(e)?.label).filter(Boolean).join(', ');

        const timeSince = formatTimeSince(emotion.created_at);

        Alert.alert(
            `${emojiString} ${alterName}`,
            `${labelString} depuis ${timeSince}${emotion.note ? `\n\n"${emotion.note}"` : ''}`,
            [{ text: 'OK' }]
        );
    };

    const altersWithEmotions = alters.filter(alter => alterEmotions[alter.id]);

    if (altersWithEmotions.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="partly-sunny-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.title}>Météo</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {altersWithEmotions.map(alter => {
                    const emotion = alterEmotions[alter.id];
                    const emotionsList = emotion.emotions && emotion.emotions.length > 0 ? emotion.emotions : [emotion.emotion];

                    // Display up to 2 emojis to keep it compact, or all if short
                    const displayEmojis = emotionsList.slice(0, 3).map(e => getEmotionConfig(e)?.emoji).filter(Boolean).join('');
                    const mainConfig = getEmotionConfig(emotionsList[0]);

                    return (
                        <TouchableOpacity
                            key={alter.id}
                            style={[styles.weatherItem, { borderColor: mainConfig?.color || colors.border }]}
                            onPress={() => handleEmotionPress(alter.name, emotion)}
                        >
                            <Text style={styles.emoji}>{displayEmojis || '❔'}</Text>
                            <Text style={styles.alterName} numberOfLines={1}>{alter.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.sm,
        gap: 4,
    },
    title: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '500',
        fontSize: 11,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weatherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.backgroundCard,
        borderWidth: 2,
        gap: 4,
    },
    emoji: {
        fontSize: 16,
    },
    alterName: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '500',
        fontSize: 12,
        maxWidth: 60,
    },
});
