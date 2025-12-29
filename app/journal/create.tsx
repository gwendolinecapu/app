/**
 * Écran de création d'une entrée de journal
 * Permet d'écrire du texte, lier une humeur et verrouiller l'entrée
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ScrollView,
    Alert,
    Switch,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { EmotionType, EMOTION_EMOJIS, EMOTION_LABELS } from '../../src/types';

const MOODS: EmotionType[] = [
    'happy', 'sad', 'anxious', 'angry',
    'tired', 'calm', 'confused', 'excited'
];

export default function CreateJournalEntryScreen() {
    const { currentAlter } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState<EmotionType | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert('Erreur', 'Le contenu ne peut pas être vide');
            return;
        }

        if (!currentAlter) {
            Alert.alert('Erreur', 'Aucun alter sélectionné');
            return;
        }

        setLoading(true);
        try {
            const newEntry = {
                alter_id: currentAlter.id,
                title: title.trim() || null,
                content: content.trim(),
                mood: selectedMood,
                is_locked: isLocked,
                is_audio: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            await addDoc(collection(db, 'journal_entries'), newEntry);

            Alert.alert('✨', 'Entrée enregistrée !', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Error saving journal entry:', error);
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentAlter) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Aucun alter sélectionné</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.cancelButton}>Annuler</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nouvelle entrée</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading || !content.trim()}
                    >
                        <Text style={[
                            styles.saveButton,
                            (!content.trim() || loading) && styles.saveButtonDisabled
                        ]}>
                            {loading ? '...' : 'Enreg.'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Titre optionnel */}
                    <View style={styles.inputGroup}>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Titre (optionnel)"
                            placeholderTextColor={colors.textMuted}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    {/* Contenu */}
                    <View style={styles.inputGroup}>
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Écris tes pensées ici..."
                            placeholderTextColor={colors.textMuted}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Sélecteur d'humeur */}
                    <View style={styles.moodSection}>
                        <Text style={styles.sectionLabel}>Comment te sens-tu ?</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.moodScroll}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.moodChip,
                                    !selectedMood && styles.moodChipSelected,
                                ]}
                                onPress={() => setSelectedMood(null)}
                            >
                                <Text style={styles.moodEmoji}>−</Text>
                                <Text style={[
                                    styles.moodLabel,
                                    !selectedMood && styles.moodLabelSelected,
                                ]}>Aucune</Text>
                            </TouchableOpacity>
                            {MOODS.map((mood) => (
                                <TouchableOpacity
                                    key={mood}
                                    style={[
                                        styles.moodChip,
                                        selectedMood === mood && styles.moodChipSelected,
                                    ]}
                                    onPress={() => setSelectedMood(mood)}
                                >
                                    <Text style={styles.moodEmoji}>
                                        {EMOTION_EMOJIS[mood]}
                                    </Text>
                                    <Text style={[
                                        styles.moodLabel,
                                        selectedMood === mood && styles.moodLabelSelected,
                                    ]}>
                                        {EMOTION_LABELS[mood].split('·')[0]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsSection}>
                        <View style={styles.optionRow}>
                            <View style={styles.optionInfo}>
                                <Text style={styles.optionEmoji}>🔒</Text>
                                <View>
                                    <Text style={styles.optionLabel}>Verrouiller</Text>
                                    <Text style={styles.optionHint}>
                                        Masquer le contenu dans la liste
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={isLocked}
                                onValueChange={setIsLocked}
                                trackColor={{ false: colors.border, true: colors.primaryLight }}
                                thumbColor={isLocked ? colors.primary : colors.textMuted}
                            />
                        </View>
                    </View>

                    {/* Info alter */}
                    <View style={styles.alterInfo}>
                        <View style={[styles.alterDot, { backgroundColor: currentAlter.color }]} />
                        <Text style={styles.alterInfoText}>
                            Cette entrée sera enregistrée pour {currentAlter.name}
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    cancelButton: {
        ...typography.body,
        color: colors.textSecondary,
    },
    headerTitle: {
        ...typography.h3,
    },
    saveButton: {
        ...typography.body,
        color: colors.primary,
        fontWeight: 'bold',
    },
    saveButtonDisabled: {
        color: colors.textMuted,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    titleInput: {
        ...typography.h2,
        color: colors.text,
        padding: 0,
    },
    contentInput: {
        ...typography.body,
        color: colors.text,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        minHeight: 200,
        lineHeight: 24,
    },
    moodSection: {
        marginBottom: spacing.lg,
    },
    sectionLabel: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    moodScroll: {
        gap: spacing.sm,
    },
    moodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    moodChipSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
    },
    moodEmoji: {
        fontSize: 18,
    },
    moodLabel: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    moodLabelSelected: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    optionsSection: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    optionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    optionEmoji: {
        fontSize: 24,
    },
    optionLabel: {
        ...typography.body,
        fontWeight: '600',
    },
    optionHint: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    alterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
    },
    alterDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    alterInfoText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    errorText: {
        ...typography.body,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
});
