import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { EmotionService } from '../../services/emotions';
import { Emotion, EmotionType } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { router } from 'expo-router';

const EMOTION_CONFIG: { type: EmotionType; icon: keyof typeof Ionicons.glyphMap; label: string; color: string; emoji: string }[] = [
    { type: 'happy', icon: 'happy-outline', label: 'Joyeux', color: '#FFD93D', emoji: '😊' },
    { type: 'sad', icon: 'sad-outline', label: 'Triste', color: '#3498DB', emoji: '😢' },
    { type: 'anxious', icon: 'alert-circle-outline', label: 'Anxieux', color: '#F39C12', emoji: '😰' },
    { type: 'angry', icon: 'flame-outline', label: 'En colère', color: '#E74C3C', emoji: '😡' },
    { type: 'tired', icon: 'battery-dead-outline', label: 'Fatigué', color: '#A0AEC0', emoji: '😴' },
    { type: 'calm', icon: 'leaf-outline', label: 'Calme', color: '#6BCB77', emoji: '😌' },
    { type: 'confused', icon: 'help-circle-outline', label: 'Confus', color: '#9B59B6', emoji: '😕' },
    { type: 'excited', icon: 'star-outline', label: 'Excité', color: '#FF6B6B', emoji: '🤩' },
];

export const AlterWeatherBar: React.FC = () => {
    const { alters, user } = useAuth();
    const [alterEmotions, setAlterEmotions] = useState<Record<string, Emotion>>({});

    useEffect(() => {
        if (!user || alters.length === 0) return;

        // Subscribe to real-time emotion updates using system user id
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
                <Ionicons name="partly-sunny-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.title}>Météo du système</Text>
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
                            <Text style={styles.alterName} numberOfLines={1}>{alter.name}</Text>
                            <Text style={[styles.emotionLabel, { color: config?.color }]}>{config?.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
        gap: 6,
    },
    title: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    weatherItem: {
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        minWidth: 80,
    },
    emoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    alterName: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
        maxWidth: 70,
        textAlign: 'center',
    },
    emotionLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
});
