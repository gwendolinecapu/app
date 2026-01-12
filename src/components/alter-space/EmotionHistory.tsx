import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmotionService } from '../../services/emotions';
import { Emotion, EmotionType } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { getEmotionConfig } from '../../lib/emotions';

interface EmotionHistoryProps {
    alterId: string;
}

const formatTimeSince = (dateInput: any): string => {
    if (!dateInput) return '';

    let date: Date;
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
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return "hier";
    return `il y a ${diffDays}j`;
};

const groupEmotionsByDate = (emotions: Emotion[]) => {
    const groups: { [key: string]: Emotion[] } = {};

    emotions.forEach(emotion => {
        let emotionDate: Date;
        if ((emotion.created_at as any)?.toDate) {
            emotionDate = (emotion.created_at as any).toDate();
        } else if ((emotion.created_at as any)?.seconds) {
            emotionDate = new Date((emotion.created_at as any).seconds * 1000);
        } else {
            emotionDate = new Date(emotion.created_at);
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let groupKey: string;
        if (emotionDate.toDateString() === today.toDateString()) {
            groupKey = "Aujourd'hui";
        } else if (emotionDate.toDateString() === yesterday.toDateString()) {
            groupKey = "Hier";
        } else {
            const diffDays = Math.floor((today.getTime() - emotionDate.getTime()) / 86400000);
            groupKey = `Il y a ${diffDays} jours`;
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(emotion);
    });

    return groups;
};

export const EmotionHistory: React.FC<EmotionHistoryProps> = ({ alterId }) => {
    const [emotions, setEmotions] = useState<Emotion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmotions();
    }, [alterId]);

    const loadEmotions = async () => {
        try {
            setLoading(true);
            // Get all emotions (not filtered by 24h)
            const history = await EmotionService.getEmotionsHistory(alterId, 30); // Last 30 days
            setEmotions(history);
        } catch (error) {
            console.error('Error loading emotion history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmotionPress = (emotion: Emotion) => {
        const emotionsList = emotion.emotions && emotion.emotions.length > 0
            ? emotion.emotions
            : [emotion.emotion];

        const emojiString = emotionsList
            .map(e => getEmotionConfig(e)?.emoji)
            .filter(Boolean)
            .join(' ');
        const labelString = emotionsList
            .map(e => getEmotionConfig(e)?.label)
            .filter(Boolean)
            .join(', ');

        const timeSince = formatTimeSince(emotion.created_at);

        Alert.alert(
            `${emojiString} ${labelString}`,
            `${timeSince}${emotion.note ? `\n\n"${emotion.note}"` : ''}\n\nIntensité: ${'⭐'.repeat(emotion.intensity)}`,
            [{ text: 'OK' }]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (emotions.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="partly-sunny-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>Aucune émotion enregistrée</Text>
                <Text style={styles.emptySubtext}>
                    Les émotions seront archivées ici après 24h
                </Text>
            </View>
        );
    }

    const groupedEmotions = groupEmotionsByDate(emotions);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {Object.entries(groupedEmotions).map(([groupLabel, groupEmotions]) => (
                <View key={groupLabel} style={styles.group}>
                    <Text style={styles.groupLabel}>{groupLabel}</Text>
                    {groupEmotions.map(emotion => {
                        const emotionsList = emotion.emotions && emotion.emotions.length > 0
                            ? emotion.emotions
                            : [emotion.emotion];
                        const mainConfig = getEmotionConfig(emotionsList[0]);
                        const timeSince = formatTimeSince(emotion.created_at);

                        return (
                            <TouchableOpacity
                                key={emotion.id}
                                style={[
                                    styles.emotionItem,
                                    { borderLeftColor: mainConfig?.color || colors.border }
                                ]}
                                onPress={() => handleEmotionPress(emotion)}
                            >
                                <View style={styles.emotionIcons}>
                                    {emotionsList.slice(0, 3).map((e, idx) => {
                                        const config = getEmotionConfig(e);
                                        return config ? (
                                            <Ionicons
                                                key={idx}
                                                name={config.icon}
                                                size={20}
                                                color={config.color}
                                            />
                                        ) : null;
                                    })}
                                </View>
                                <View style={styles.emotionContent}>
                                    <Text style={styles.emotionLabel}>
                                        {emotionsList.map(e => getEmotionConfig(e)?.label).filter(Boolean).join(', ')}
                                    </Text>
                                    {emotion.note ? (
                                        <Text style={styles.emotionNote} numberOfLines={1}>
                                            "{emotion.note}"
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={styles.emotionTime}>{timeSince}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
        fontWeight: '600',
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    group: {
        marginBottom: spacing.lg,
    },
    groupLabel: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 12,
    },
    emotionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
        borderLeftWidth: 4,
        gap: spacing.sm,
    },
    emotionIcons: {
        flexDirection: 'row',
        gap: 4,
    },
    emotionContent: {
        flex: 1,
    },
    emotionLabel: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    emotionNote: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
        fontStyle: 'italic',
    },
    emotionTime: {
        ...typography.caption,
        color: colors.textMuted,
        fontSize: 11,
    },
});
