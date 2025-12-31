import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, borderRadius, spacing, typography } from '../lib/theme';
import { EmotionService } from '../services/emotions';
import { Emotion, EMOTION_EMOJIS, EMOTION_LABELS } from '../types';
import { timeAgo } from '../lib/date';
import { LinearGradient } from 'expo-linear-gradient';

const WEATHER_TYPES = [
    { id: 'sunny', label: 'Ensoleillé', icon: 'sunny', color: '#F59E0B' },
    { id: 'partly-sunny', label: 'Eclaircies', icon: 'partly-sunny', color: '#FCD34D' },
    { id: 'cloudy', label: 'Nuageux', icon: 'cloudy', color: '#9CA3AF' },
    { id: 'rainy', label: 'Pluvieux', icon: 'rainy', color: '#60A5FA' },
    { id: 'thunderstorm', label: 'Orageux', icon: 'thunderstorm', color: '#7C3AED' },
    { id: 'snow', label: 'Gelé', icon: 'snow', color: '#93C5FD' },
];

export function SystemWeather() {
    const { system, alters, updateHeadspace } = useAuth();
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

    const currentWeather = WEATHER_TYPES.find(w => w.id === system?.headspace) || WEATHER_TYPES[0];

    const handleUpdateWeather = async (weatherId: string) => {
        await updateHeadspace(weatherId);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.container, { borderColor: currentWeather.color }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={[`${currentWeather.color}20`, `${currentWeather.color}05`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                <View style={[styles.iconContainer, { backgroundColor: `${currentWeather.color}20` }]}>
                    <Ionicons name={currentWeather.icon as any} size={24} color={currentWeather.color} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.label}>Météo du Système</Text>
                    <Text style={styles.value}>{currentWeather.label}</Text>

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
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Météo du Système</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>Ambiance générale</Text>
                        <View style={styles.weatherGrid}>
                            {WEATHER_TYPES.map((weather) => (
                                <TouchableOpacity
                                    key={weather.id}
                                    style={[
                                        styles.weatherOption,
                                        system?.headspace === weather.id && styleWithBorder(weather.color)
                                    ]}
                                    onPress={() => handleUpdateWeather(weather.id)}
                                >
                                    <Ionicons
                                        name={weather.icon as any}
                                        size={32}
                                        color={system?.headspace === weather.id ? weather.color : colors.textMuted}
                                    />
                                    <Text style={[
                                        styles.weatherLabel,
                                        system?.headspace === weather.id && { color: weather.color, fontWeight: 'bold' }
                                    ]}>
                                        {weather.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>Émotions récentes des alters</Text>
                        <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                            {Object.keys(alterEmotions).length === 0 ? (
                                <Text style={styles.emptyText}>Aucune émotion enregistrée récemment.</Text>
                            ) : (
                                Object.entries(alterEmotions).map(([alterId, emotion]) => (
                                    <View key={alterId} style={styles.alterEmotionRow}>
                                        <View>
                                            <Text style={styles.alterName}>{getAlterName(alterId)}</Text>
                                            <Text style={styles.timestamp}>
                                                {emotion.created_at ? timeAgo(emotion.created_at) : 'récemment'}
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

const styleWithBorder = (color: string) => ({
    borderColor: color,
    backgroundColor: `${color}10`,
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        overflow: 'hidden',
        position: 'relative',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
        marginBottom: 2,
    },
    value: {
        ...typography.body,
        color: colors.text,
        fontWeight: 'bold',
    },
    miniEmotions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: 4,
    },
    miniEmotionText: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        ...typography.h2,
    },
    closeButton: {
        padding: 4,
    },
    sectionTitle: {
        ...typography.h3,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        color: colors.textSecondary,
        fontSize: 16,
    },
    weatherGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    weatherOption: {
        width: '31%',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.backgroundLight,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    weatherLabel: {
        ...typography.caption,
        marginTop: spacing.xs,
        textAlign: 'center',
        color: colors.textMuted,
        fontWeight: '600',
    },
    alterEmotionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight, // Lighter border
    },
    alterName: {
        ...typography.body,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    emotionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emoji: {
        fontSize: 18,
        marginRight: 6,
    },
    emotionLabel: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '500',
    },
    emptyText: {
        ...typography.bodySmall,
        color: colors.textMuted,
        textAlign: 'center',
        padding: spacing.xl,
        fontStyle: 'italic',
    },
});
