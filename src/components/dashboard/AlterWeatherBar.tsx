import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { EmotionService } from '../../services/emotions';
import { Emotion, EmotionType } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';

import { EMOTION_CONFIG, getEmotionConfig } from '../../lib/emotions';

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

                    // Display up to 2 icons to keep it compact
                    const displayEmotions = emotionsList.slice(0, 2);
                    const mainConfig = getEmotionConfig(emotionsList[0]);

                    return (
                        <TouchableOpacity
                            key={alter.id}
                            style={[
                                styles.weatherItem,
                                { borderColor: mainConfig?.color || colors.border }
                            ]}
                            onPress={() => handleEmotionPress(alter.name, emotion)}
                        >
                            <View style={styles.emotionsRow}>
                                {displayEmotions.map((e, idx) => {
                                    const config = getEmotionConfig(e);
                                    if (!config) return null;
                                    return (
                                        <Ionicons
                                            key={idx}
                                            name={config.icon}
                                            size={14}
                                            color={config.color}
                                        />
                                    );
                                })}
                            </View>
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
    emotionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
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
