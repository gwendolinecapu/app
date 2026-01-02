import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Emotion, EmotionType } from '../../types';
import { EmotionService } from '../../services/emotions';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { ThemeColors } from '../../lib/cosmetics';
import { useToast } from '../ui/Toast';
import { triggerHaptic } from '../../lib/haptics';
import { timeAgo } from '../../lib/date';

interface AlterEmotionsProps {
    alterId: string;
    alterName: string;
    themeColors?: ThemeColors | null;
}

const EMOTION_CONFIG: { type: EmotionType; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
    { type: 'happy', icon: 'happy-outline', label: 'Joyeux', color: '#FFD93D' },
    { type: 'love', icon: 'heart-outline', label: 'Amoureux', color: '#FF6B81' },
    { type: 'excited', icon: 'star-outline', label: 'Excité', color: '#FF9F43' },
    { type: 'proud', icon: 'trophy-outline', label: 'Fier', color: '#FDCB6E' },
    { type: 'calm', icon: 'leaf-outline', label: 'Calme', color: '#2ECC71' },
    { type: 'bored', icon: 'ellipsis-horizontal-circle-outline', label: 'Ennuyé', color: '#95A5A6' },
    { type: 'tired', icon: 'battery-dead-outline', label: 'Fatigué', color: '#7F8C8D' },
    { type: 'sad', icon: 'sad-outline', label: 'Triste', color: '#3498DB' },
    { type: 'anxious', icon: 'alert-circle-outline', label: 'Anxieux', color: '#E67E22' },
    { type: 'fear', icon: 'skull-outline', label: 'Peur', color: '#8E44AD' },
    { type: 'confused', icon: 'help-circle-outline', label: 'Confus', color: '#9B59B6' },
    { type: 'angry', icon: 'flame-outline', label: 'En colère', color: '#E74C3C' },
    { type: 'shame', icon: 'eye-off-outline', label: 'Honte', color: '#D63031' },
    { type: 'guilt', icon: 'cloud-outline', label: 'Coupable', color: '#636E72' },
    { type: 'hurt', icon: 'bandage-outline', label: 'Blessé', color: '#FD79A8' },
    { type: 'sick', icon: 'medkit-outline', label: 'Malade', color: '#00B894' },
];

export const AlterEmotions: React.FC<AlterEmotionsProps> = ({ alterId, alterName, themeColors }) => {
    const [latestEmotion, setLatestEmotion] = useState<Emotion | null>(null);
    const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const toggleEmotion = (emotionType: EmotionType) => {
        triggerHaptic.selection();
        setSelectedEmotions(prev => {
            if (prev.includes(emotionType)) {
                return prev.filter(e => e !== emotionType);
            } else {
                return [...prev, emotionType];
            }
        });
    };

    const handleSave = async () => {
        if (selectedEmotions.length === 0) return;

        setIsSubmitting(true);
        try {
            await EmotionService.addEmotion(alterId, selectedEmotions, 3);
            const labels = selectedEmotions.map(e => EMOTION_CONFIG.find(c => c.type === e)?.label || e).join(', ');
            toast.showToast(`Émotions enregistrées: ${labels}`, 'success');
            setSelectedEmotions([]);
            loadLatestEmotion();
        } catch (error) {
            console.error('Failed to add emotion:', error);
            toast.showToast("Erreur lors de l'enregistrement", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to get config
    const getConfig = (type: EmotionType) => EMOTION_CONFIG.find(e => e.type === type);

    // For rendering current status
    const currentEmotionsList = latestEmotion?.emotions || (latestEmotion ? [latestEmotion.emotion] : []);
    const isCurrentMulti = currentEmotionsList.length > 1;
    const primaryConfig = latestEmotion ? getConfig(currentEmotionsList[0]) : null;

    return (
        <ScrollView style={styles.container}>
            <Text style={[styles.title, themeColors && { color: themeColors.text }]}>Comment te sens-tu, {alterName} ?</Text>

            {/* Emotion Grid */}
            <View style={styles.grid}>
                {EMOTION_CONFIG.map((item, index) => {
                    const isSelected = selectedEmotions.includes(item.type);
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.emotionButton,
                                { backgroundColor: item.color + '15' },
                                isSelected && {
                                    backgroundColor: item.color + '40',
                                    borderWidth: 2,
                                    borderColor: item.color
                                }
                            ]}
                            onPress={() => toggleEmotion(item.type)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon} size={28} color={item.color} />
                            </View>
                            <Text style={[styles.emotionLabel, { color: colors.text, fontWeight: isSelected ? '700' : '500' }]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Validate Button */}
            {selectedEmotions.length > 0 && (
                <TouchableOpacity
                    style={[styles.validateButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    <Text style={styles.validateButtonText}>
                        {isSubmitting ? 'Enregistrement...' : `Enregistrer (${selectedEmotions.length})`}
                    </Text>
                </TouchableOpacity>
            )}

            {latestEmotion ? (
                <View style={styles.statusSection}>
                    <Text style={[styles.sectionTitle, themeColors && { color: themeColors.textSecondary }]}>Dernier ressenti</Text>
                    <View style={[styles.statusContainer, themeColors && { backgroundColor: themeColors.backgroundCard }, { borderLeftColor: primaryConfig?.color || colors.primary }]}>
                        <View style={[styles.statusIcon, { backgroundColor: (primaryConfig?.color || colors.primary) + '20' }]}>
                            <Ionicons name={primaryConfig?.icon || 'heart-outline'} size={24} color={primaryConfig?.color || colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusText}>
                                Actuellement{' '}
                                {isCurrentMulti ? (
                                    <Text style={{ fontWeight: 'bold', color: colors.text }}>
                                        {currentEmotionsList.map(e => getConfig(e)?.label).join(', ')}
                                    </Text>
                                ) : (
                                    <Text style={{ fontWeight: 'bold', color: primaryConfig?.color || colors.text }}>
                                        {primaryConfig?.label || latestEmotion!.emotion}
                                    </Text>
                                )}
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
        borderWidth: 2,
        borderColor: 'transparent',
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
    validateButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    validateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
