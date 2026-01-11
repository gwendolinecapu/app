import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { LocalAIService } from '../../services/LocalAIService';

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
    entryContent: string; // Aggregated content to summarize
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ visible, onClose, entryContent }) => {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const handleGenerateSummary = async () => {
        if (!entryContent || entryContent.trim().length < 10) {
            Alert.alert('Pas assez de contenu', 'Écris un peu plus avant de demander un résumé.');
            return;
        }

        setLoading(true);
        try {
            const result = await LocalAIService.summarize(entryContent);
            setSummary(result);
        } catch (error) {
            Alert.alert('Erreur IA', 'Impossible de générer le résumé pour le moment.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSummary(null); // Reset on close
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.centeredView}>
                <BlurView intensity={80} tint="dark" style={styles.absolute} />
                <View style={styles.modalView}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <Ionicons name="sparkles" size={24} color={colors.primary} />
                            <Text style={styles.modalTitle}>Résumé IA</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.contentScroll}>
                        {!summary ? (
                            <View style={styles.introContainer}>
                                <Text style={styles.introText}>
                                    Génère un résumé de tes entrées publiques pour avoir une vue d'ensemble de ta journée ou de ta semaine.
                                    {"\n\n"}
                                    <Text style={styles.warningText}>
                                        🔒 Les données sont traitées localement sur ton appareil (si compatible) pour garantir ta vie privée.
                                    </Text>
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.summaryContainer}>
                                <Text style={styles.summaryText}>{summary}</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer / Actions */}
                    <View style={styles.footer}>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : !summary ? (
                            <TouchableOpacity style={styles.generateButton} onPress={handleGenerateSummary}>
                                <Text style={styles.generateButtonText}>Générer le Résumé</Text>
                                <Ionicons name="arrow-forward" size={20} color={colors.text} style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                                <Text style={styles.doneButtonText}>Terminé</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.md,
    },
    absolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    modalView: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    modalTitle: {
        ...typography.h3,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    contentScroll: {
        padding: spacing.lg,
    },
    introContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    introText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    warningText: {
        fontSize: 12,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    summaryContainer: {
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    summaryText: {
        ...typography.body,
        color: colors.text,
        lineHeight: 24,
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    generateButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        alignItems: 'center',
    },
    generateButtonText: {
        ...typography.button,
        color: colors.text,
    },
    doneButton: {
        backgroundColor: colors.backgroundCard,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        width: '100%',
        alignItems: 'center',
    },
    doneButtonText: {
        ...typography.button,
        color: colors.text,
    },
});
