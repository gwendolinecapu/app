import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { EmotionService } from '../../services/emotions';
import { Emotion, EmotionType } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';
import { router } from 'expo-router';

const EMOTION_CONFIG: { type: EmotionType; emoji: string; color: string }[] = [
    { type: 'happy', emoji: '😊', color: '#FFD93D' },
    { type: 'sad', emoji: '😢', color: '#3498DB' },
    { type: 'anxious', emoji: '😰', color: '#F39C12' },
    { type: 'angry', emoji: '😡', color: '#E74C3C' },
    { type: 'tired', emoji: '😴', color: '#A0AEC0' },
    { type: 'calm', emoji: '😌', color: '#6BCB77' },
    { type: 'confused', emoji: '😕', color: '#9B59B6' },
    { type: 'excited', emoji: '🤩', color: '#FF6B6B' },
];

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
                            onPress={() => router.push(`/alter-space/${alter.id}?tab=profile`)}
                        >
                            <Text style={styles.emoji}>{config?.emoji || '❔'}</Text>
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
        gap: 6,
    },
    weatherItem: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.backgroundCard,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 16,
    },
});
