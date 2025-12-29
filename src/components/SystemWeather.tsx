import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, borderRadius, spacing, typography } from '../lib/theme';
import { EmotionService } from '../services/emotions';
import { Emotion, EmotionType, EMOTION_EMOJIS, EMOTION_LABELS } from '../types';
import { formatTimeSince } from '../lib/date';

export function SystemWeather() {
    const { system, alters } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [alterEmotions, setAlterEmotions] = useState<Record<string, Emotion>>({});

    useEffect(() => {
        if (!system?.id) return;
        const unsubscribe = EmotionService.subscribeToSystemEmotions(system.id, (emotions) => {
            setAlterEmotions(emotions);
        });
        return () => unsubscribe();
    }, [system?.id]);

    const getAlterName = (alterId: string) => {
        return alters.find(a => a.id === alterId)?.name || 'Inconnu';
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.container, { borderColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Météo du Système</Text>
                    <Text style={styles.value}>Aperçu des émotions</Text>

                    {/* Mini preview of alter emotions (limit to 3) */}
                    <View style={styles.miniEmotions}>
                        {Object.entries(alterEmotions).slice(0, 3).map(([alterId, emotion]) => (
                            <Text key={alterId} style={styles.miniEmotionText}>
                                {getAlterName(alterId)}: {EMOTION_EMOJIS[emotion.emotion] || ''}
                            </Text>
                        ))}
                    </View>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                            <Text style={styles.modalTitle}>Météo des Alters</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            {Object.keys(alterEmotions).length === 0 ? (
                                <Text style={styles.emptyText}>Aucune émotion enregistrée récemment.</Text>
                            ) : (
                                Object.entries(alterEmotions).map(([alterId, emotion]) => (
                                    <View key={alterId} style={styles.alterEmotionRow}>
                                        <View>
                                            <Text style={styles.alterName}>{getAlterName(alterId)}</Text>
                                            <Text style={styles.timestamp}>
                                                {formatTimeSince(emotion.created_at)}
                                            </Text>
                                        </View>
                                        <View style={styles.emotionBadge}>
                                            <Text style={styles.emoji}>{EMOTION_EMOJIS[emotion.emotion]}</Text>
                                            <Text style={styles.emotionLabel}>{EMOTION_LABELS[emotion.emotion]}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        ...typography.caption,
        color: colors.textMuted,
    },
    value: {
        ...typography.bodySmall,
        color: colors.text,
        fontWeight: '600',
    },
    miniEmotions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: 2,
    },
    miniEmotionText: {
        fontSize: 10,
        color: colors.textMuted,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    modalTitle: {
        ...typography.h3,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    option: {
        width: '30%', // Roughly 3 per row
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.backgroundLight,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}10`,
    },
    optionLabel: {
        ...typography.caption,
        textAlign: 'center',
        marginTop: spacing.xs,
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    alterEmotionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    alterName: {
        ...typography.body,
        fontWeight: '600',
    },
    emotionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: borderRadius.full,
    },
    emoji: {
        fontSize: 16,
        marginRight: 4,
    },
    emotionLabel: {
        ...typography.caption,
        color: colors.text,
    },
    emptyText: {
        ...typography.caption,
        color: colors.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: spacing.md,
    },
    timestamp: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    }
});
