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
                        style={[styles.emotionButton, { backgroundColor: item.color + '15' }]} // 15% opacity background
                        onPress={() => handleAddEmotion(item.type)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon} size={28} color={item.color} />
                        </View>
                        <Text style={[styles.emotionLabel, { color: colors.text }]}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {latestEmotion ? (
                <View style={styles.statusSection}>
                    <Text style={styles.sectionTitle}>Dernier ressenti</Text>
                    <View style={[styles.statusContainer, { borderLeftColor: currentEmotionConfig?.color || colors.primary }]}>
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
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Historique émotionnel</Text>
                    <Text style={styles.emptySubtitle}>
                        Enregistrez les émotions de {alterName} pour suivre son bien-être au fil du temps.
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
        textAlign: 'center',
    },
    sectionTitle: {
        ...typography.h4,
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.sm, // Reduced gap
        marginBottom: spacing.xl,
    },
    emotionButton: {
        width: '23%', // 4 columns
        aspectRatio: 0.85, // Slightly taller
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        padding: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    emotionLabel: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    statusSection: {
        marginTop: spacing.xs,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderLeftWidth: 4, // Accent border
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
