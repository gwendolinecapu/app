import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { ReportReason } from '../services/reporting';

interface ReportModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (reason: ReportReason, details: string) => Promise<void>;
}

const REASONS: { id: ReportReason; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'spam', label: "C'est du spam", icon: 'mail-open-outline' },
    { id: 'harassment', label: "Harcèlement ou intimidation", icon: 'sad-outline' },
    { id: 'inappropriate', label: "Contenu inapproprié", icon: 'alert-circle-outline' },
    { id: 'violence', label: "Violence ou danger", icon: 'flash-outline' },
    { id: 'other', label: "Autre problème", icon: 'help-circle-outline' },
];

export function ReportModal({ isVisible, onClose, onSubmit }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert('Erreur', 'Veuillez sélectionner une raison.');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(selectedReason, details);
            onClose(); // Parent handles success toast
        } catch (error) {
            Alert.alert('Erreur', "Echec de l'envoi du signalement.");
        } finally {
            setLoading(false);
            // Reset state after close
            setTimeout(() => {
                setSelectedReason(null);
                setDetails('');
            }, 500);
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} tint="dark" style={styles.absolute} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Signaler ce contenu</Text>
                            <TouchableOpacity onPress={onClose} disabled={loading}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subtitle}>
                            Aidez-nous à comprendre le problème.
                        </Text>

                        <View style={styles.reasonsList}>
                            {REASONS.map((reason) => (
                                <TouchableOpacity
                                    key={reason.id}
                                    style={[
                                        styles.reasonItem,
                                        selectedReason === reason.id && styles.reasonItemSelected
                                    ]}
                                    onPress={() => setSelectedReason(reason.id)}
                                >
                                    <View style={styles.reasonLeft}>
                                        <Ionicons
                                            name={reason.icon}
                                            size={20}
                                            color={selectedReason === reason.id ? colors.primary : colors.textSecondary}
                                        />
                                        <Text style={[
                                            styles.reasonText,
                                            selectedReason === reason.id && styles.reasonTextSelected
                                        ]}>
                                            {reason.label}
                                        </Text>
                                    </View>
                                    {selectedReason === reason.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {selectedReason === 'other' && (
                            <TextInput
                                style={styles.input}
                                placeholder="Détails supplémentaires (optionnel)..."
                                placeholderTextColor={colors.textMuted}
                                value={details}
                                onChangeText={setDetails}
                                multiline
                                numberOfLines={3}
                            />
                        )}

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!selectedReason || loading) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedReason || loading}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Envoi...' : 'Envoyer le signalement'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: spacing.md,
    },
    absolute: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.h3,
    },
    subtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    reasonsList: {
        width: '100%',
        marginBottom: spacing.md,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.sm,
        marginBottom: 4,
    },
    reasonItemSelected: {
        backgroundColor: colors.background, // Slightly lighter/darker
        borderColor: colors.primary,
        borderWidth: 1,
    },
    reasonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    reasonText: {
        ...typography.body,
        fontSize: 14,
        color: colors.textSecondary,
    },
    reasonTextSelected: {
        color: colors.text,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        color: colors.text,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    submitButton: {
        backgroundColor: colors.error,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: colors.textMuted,
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
