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
];

const formatTimeSince = (dateString: string): string => {
    const date = new Date(dateString);
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
        const config = getEmotionConfig(emotion.emotion);
        const timeSince = formatTimeSince(emotion.created_at);

        Alert.alert(
            `${config?.emoji} ${alterName}`,
            `${config?.label || emotion.emotion} depuis ${timeSince}${emotion.note ? `\n\n"${emotion.note}"` : ''}`,
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
                    const config = getEmotionConfig(emotion.emotion);

                    return (
                        <TouchableOpacity
                            key={alter.id}
                            style={[styles.weatherItem, { borderColor: config?.color || colors.border }]}
                            onPress={() => handleEmotionPress(alter.name, emotion)}
                        >
                            <Text style={styles.emoji}>{config?.emoji || '❔'}</Text>
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
