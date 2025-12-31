import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Emotion, EmotionType } from '../../types';
import { EmotionService } from '../../services/emotions';
import { colors, spacing, typography } from '../../lib/theme';
import { useToast } from '../ui/Toast';
import { triggerHaptic } from '../../lib/haptics';
import { timeAgo } from '../../lib/date';

interface AlterEmotionsProps {
    alterId: string;
    alterName: string;
}

const EMOTION_CONFIG: { type: EmotionType; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
    { type: 'happy', icon: 'happy-outline', label: 'Joyeux', color: '#FFD93D' },
    { type: 'sad', icon: 'sad-outline', label: 'Triste', color: '#3498DB' },
    { type: 'anxious', icon: 'alert-circle-outline', label: 'Anxieux', color: '#F39C12' },
    { type: 'angry', icon: 'flame-outline', label: 'En colère', color: '#E74C3C' },
    { type: 'tired', icon: 'battery-dead-outline', label: 'Fatigué', color: '#A0AEC0' },
    { type: 'calm', icon: 'leaf-outline', label: 'Calme', color: '#6BCB77' },
    { type: 'confused', icon: 'help-circle-outline', label: 'Confus', color: '#9B59B6' },
    { type: 'excited', icon: 'star-outline', label: 'Excité', color: '#FF6B6B' }
];

export const AlterEmotions: React.FC<AlterEmotionsProps> = ({ alterId, alterName }) => {
    const [latestEmotion, setLatestEmotion] = useState<Emotion | null>(null);
    const toast = useToast();

    useEffect(() => {
        loadLatestEmotion();
    }, [alterId]);

    const loadLatestEmotion = async () => {
        try {
            const emotion = await EmotionService.getLatestEmotion(alterId);
            setLatestEmotion(emotion);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddEmotion = async (emotionType: EmotionType) => {
        try {
            triggerHaptic.selection();
            await EmotionService.addEmotion(alterId, emotionType, 3);
            const config = EMOTION_CONFIG.find(e => e.type === emotionType);
            toast.showToast(`Emotion enregistrée: ${config?.label || emotionType}`, 'success');
            loadLatestEmotion();
        } catch (error) {
            console.error('Failed to add emotion:', error);
            toast.showToast("Erreur lors de l'enregistrement", 'error');
        }
    };

    const currentEmotionConfig = latestEmotion ? EMOTION_CONFIG.find(e => e.type === latestEmotion.emotion) : null;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Comment te sens-tu, {alterName} ?</Text>

            {/* Emotion Grid */}
            <View style={styles.grid}>
                {EMOTION_CONFIG.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.emotionButton, { borderColor: item.color + '40' }]}
                        onPress={() => handleAddEmotion(item.type)}
                    >
                        <Ionicons name={item.icon} size={32} color={item.color} />
                        <Text style={styles.emotionLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {latestEmotion ? (
                <View style={styles.statusContainer}>
                    <View style={[styles.statusIcon, { backgroundColor: (currentEmotionConfig?.color || colors.primary) + '20' }]}>
                        <Ionicons name={currentEmotionConfig?.icon || 'heart-outline'} size={24} color={currentEmotionConfig?.color || colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statusText}>
                            Actuellement <Text style={{ fontWeight: 'bold', color: currentEmotionConfig?.color || colors.text }}>{currentEmotionConfig?.label || latestEmotion.emotion}</Text>
                        </Text>
                        <Text style={styles.statusTime}>
                            {timeAgo(latestEmotion.created_at) ? `Depuis ${timeAgo(latestEmotion.created_at)}` : "À l'instant"}
                        </Text>
                    </View>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Historique émotionnel</Text>
                    <Text style={styles.emptySubtitle}>
                        Enregistrer les émotions de {alterName} pour suivre son bien-être au fil du temps.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    title: {
        ...typography.h3,
        marginBottom: spacing.lg,
        color: colors.text,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    emotionButton: {
        width: '23%', // 4 columns with gap
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: colors.surface,
    },
    emotionLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    statusText: {
        ...typography.body,
        color: colors.text,
    },
    statusTime: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
