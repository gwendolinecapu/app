import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, borderRadius, spacing, typography } from '../lib/theme';

const WEATHER_OPTIONS = [
    { id: 'sunny', label: 'Ensoleillé', icon: 'sunny', color: '#FFD700' },
    { id: 'partly_sunny', label: 'Eclaircies', icon: 'partly-sunny', color: '#FFB347' },
    { id: 'cloudy', label: 'Nuageux', icon: 'cloudy', color: '#B0C4DE' },
    { id: 'rainy', label: 'Pluvieux', icon: 'rainy', color: '#4682B4' },
    { id: 'stormy', label: 'Orageux', icon: 'thunderstorm', color: '#483D8B' },
    { id: 'snowy', label: 'Neigeux', icon: 'snow', color: '#E0FFFF' },
    { id: 'night', label: 'Nuit', icon: 'moon', color: '#191970' },
    { id: 'foggy', label: 'Brouillard', icon: 'cloud', color: '#778899' }, // Fallback icon
];

export function SystemWeather() {
    const { system, updateHeadspace } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);

    const currentMood = WEATHER_OPTIONS.find(opt => opt.id === system?.headspace) || WEATHER_OPTIONS[0];

    const handleSelectMood = async (moodId: string) => {
        await updateHeadspace(moodId);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.container, { borderColor: currentMood.color }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${currentMood.color}20` }]}>
                    <Ionicons name={currentMood.icon as any} size={24} color={currentMood.color} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Météo Système</Text>
                    <Text style={styles.value}>{currentMood.label}</Text>
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
                        <Text style={styles.modalTitle}>Météo du Système</Text>
                        <View style={styles.grid}>
                            {WEATHER_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.option,
                                        system?.headspace === option.id && styles.optionSelected
                                    ]}
                                    onPress={() => handleSelectMood(option.id)}
                                >
                                    <Ionicons name={option.icon as any} size={32} color={option.color} />
                                    <Text style={styles.optionLabel}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
    },
    modalTitle: {
        ...typography.h3,
        textAlign: 'center',
        marginBottom: spacing.lg,
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
});
