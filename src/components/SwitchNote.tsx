import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = 'dashboard_switch_note';

export const SwitchNote = () => {
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadNote();
    }, []);

    const loadNote = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) setNote(saved);
        } catch (e) {
            console.error('Failed to load note', e);
        }
    };

    const handleSave = async (text: string) => {
        setNote(text);
        // Debounce would be better, but simple save on text change is risky for performance if too frequent.
        // Let's save on blur or with a timeout? 
        // For simplicity in this v1, we save 1 second after last type or on blur.
    };

    // Auto-save effect
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (note) {
                setIsSaving(true);
                await AsyncStorage.setItem(STORAGE_KEY, note);
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 1000);

        return () => clearTimeout(timeout);
    }, [note]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.label}>Note rapide (Switch Note)</Text>
                </View>
                {isSaving && <Text style={styles.saving}>Sauvegarde...</Text>}
            </View>
            <TextInput
                style={styles.input}
                multiline
                placeholder="Laissez une note pour le prochain fronter..."
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={handleSave}
                maxLength={500}
                scrollEnabled={false} // Grow with content
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary, // Accent border
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    saving: {
        ...typography.tiny,
        color: colors.primary,
    },
    input: {
        ...typography.body,
        color: colors.text,
        minHeight: 60,
        textAlignVertical: 'top',
    },
});
