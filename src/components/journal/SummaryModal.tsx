import React, { useState, useEffect } from 'react';
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
import { LocalAIService, ModelStatus, AIProvider } from '../../services/LocalAIService';

// ============================================
// Types
// ============================================

type SummaryPeriod = 'day' | 'week' | 'month';

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
    getEntriesForPeriod: (period: SummaryPeriod) => string;
}

const PERIOD_LABELS: Record<SummaryPeriod, string> = {
    day: 'Journée',
    week: 'Semaine',
    month: 'Mois',
};

const PROVIDER_BADGES: Record<AIProvider, { label: string; icon: string }> = {
    apple: { label: 'Apple Intelligence', icon: '🍎' },
    gemini: { label: 'Gemini Nano', icon: '⚡' },
    gemma: { label: 'Gemma 3n', icon: '🤖' },
    mock: { label: 'Mode Test', icon: '🧪' },
};

// ============================================
// Component
// ============================================

export const SummaryModal: React.FC<SummaryModalProps> = ({
    visible,
    onClose,
    getEntriesForPeriod,
}) => {
    const [status, setStatus] = useState<ModelStatus | null>(null);
    const [period, setPeriod] = useState<SummaryPeriod>('day');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [summary, setSummary] = useState<string | null>(null);
    const [provider, setProvider] = useState<AIProvider | null>(null);

    // Check AI status when modal opens
    useEffect(() => {
        if (visible) {
            checkStatus();
        }
    }, [visible]);

    const checkStatus = async () => {
        const modelStatus = await LocalAIService.getStatus();
        setStatus(modelStatus);
    };

    const handleDownloadModel = async () => {
        setDownloading(true);
        setDownloadProgress(0);

        try {
            await LocalAIService.downloadModel((progress) => {
                setDownloadProgress(progress);
            });
            await checkStatus();
            Alert.alert('✅ Succès', 'Le modèle IA a été installé avec succès !');
        } catch (error) {
            Alert.alert('Erreur', 'Échec du téléchargement. Vérifie ta connexion.');
        } finally {
            setDownloading(false);
        }
    };

    const handleGenerateSummary = async () => {
        const content = getEntriesForPeriod(period);

        if (!content || content.trim().length < 10) {
            Alert.alert(
                'Pas assez de contenu',
                `Aucune entrée trouvée pour cette ${PERIOD_LABELS[period].toLowerCase()}.`
            );
            return;
        }

        setLoading(true);
        try {
            const result = await LocalAIService.summarize(content, period);
            setSummary(result.summary);
            setProvider(result.provider);
        } catch (error: any) {
            Alert.alert('Erreur IA', error.message || 'Impossible de générer le résumé.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSummary(null);
        setProvider(null);
        onClose();
    };

    const handleDeleteModel = () => {
        Alert.alert(
            'Supprimer le modèle IA ?',
            `Cela libérera ~${LocalAIService.getModelSizeMB()}MB d'espace.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        await LocalAIService.deleteModel();
                        await checkStatus();
                    },
                },
            ]
        );
    };

    // ============================================
    // Render Helpers
    // ============================================

    const renderPeriodSelector = () => (
        <View style={styles.periodSelector}>
            {(['day', 'week', 'month'] as SummaryPeriod[]).map((p) => (
                <TouchableOpacity
                    key={p}
                    style={[styles.periodTab, period === p && styles.periodTabActive]}
                    onPress={() => setPeriod(p)}
                >
                    <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                        {PERIOD_LABELS[p]}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderDownloadPrompt = () => (
        <View style={styles.downloadContainer}>
            <Ionicons name="cloud-download-outline" size={48} color={colors.primary} />
            <Text style={styles.downloadTitle}>Installer l'IA locale</Text>
            <Text style={styles.downloadSubtitle}>
                Télécharge le modèle Gemma 3n (~{LocalAIService.getModelSizeMB()}MB) pour générer des résumés directement sur ton appareil.
            </Text>
            <Text style={styles.privacyNote}>
                🔒 100% local, tes données restent privées
            </Text>

            {downloading ? (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{downloadProgress}%</Text>
                </View>
            ) : (
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadModel}>
                    <Ionicons name="download" size={20} color={colors.text} />
                    <Text style={styles.downloadButtonText}>Installer (~{LocalAIService.getModelSizeMB()}MB)</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderSummaryResult = () => (
        <View style={styles.summaryContainer}>
            {provider && (
                <View style={styles.providerBadge}>
                    <Text style={styles.providerIcon}>{PROVIDER_BADGES[provider].icon}</Text>
                    <Text style={styles.providerLabel}>{PROVIDER_BADGES[provider].label}</Text>
                </View>
            )}
            <Text style={styles.summaryText}>{summary}</Text>

            {status?.provider === 'gemma' && (
                <TouchableOpacity style={styles.deleteLink} onPress={handleDeleteModel}>
                    <Text style={styles.deleteLinkText}>Libérer l'espace (~{LocalAIService.getModelSizeMB()}MB)</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderIntro = () => (
        <View style={styles.introContainer}>
            <Text style={styles.introText}>
                Génère un résumé de tes entrées pour avoir une vue d'ensemble de ta{' '}
                <Text style={styles.boldText}>{PERIOD_LABELS[period].toLowerCase()}</Text>.
            </Text>
            <Text style={styles.warningText}>
                🔒 Traitement 100% local sur ton appareil
            </Text>
        </View>
    );

    // ============================================
    // Main Render
    // ============================================

    const needsDownload = status && !status.isInstalled && status.provider !== 'mock';

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

                    {/* Period Selector */}
                    {!summary && renderPeriodSelector()}

                    {/* Content */}
                    <ScrollView style={styles.contentScroll}>
                        {needsDownload ? (
                            renderDownloadPrompt()
                        ) : summary ? (
                            renderSummaryResult()
                        ) : (
                            renderIntro()
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : summary ? (
                            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                                <Text style={styles.doneButtonText}>Terminé</Text>
                            </TouchableOpacity>
                        ) : !needsDownload ? (
                            <TouchableOpacity style={styles.generateButton} onPress={handleGenerateSummary}>
                                <Text style={styles.generateButtonText}>Générer le Résumé</Text>
                                <Ionicons name="arrow-forward" size={20} color={colors.text} style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ============================================
// Styles
// ============================================

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
        maxHeight: '85%',
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
    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        margin: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    periodTab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    periodTabActive: {
        backgroundColor: colors.primary,
    },
    periodTabText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    periodTabTextActive: {
        color: colors.text,
    },
    contentScroll: {
        padding: spacing.lg,
    },
    // Intro
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
    boldText: {
        fontWeight: 'bold',
        color: colors.text,
    },
    warningText: {
        fontSize: 12,
        color: colors.textMuted,
        fontStyle: 'italic',
        marginTop: spacing.md,
    },
    // Download
    downloadContainer: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    downloadTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    downloadSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    privacyNote: {
        ...typography.caption,
        color: colors.success || colors.primary,
        marginTop: spacing.md,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    downloadButtonText: {
        ...typography.button,
        color: colors.text,
    },
    progressContainer: {
        width: '100%',
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.backgroundCard,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    progressText: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    // Summary
    summaryContainer: {
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    providerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    providerIcon: {
        fontSize: 14,
    },
    providerLabel: {
        ...typography.caption,
        color: colors.textMuted,
    },
    summaryText: {
        ...typography.body,
        color: colors.text,
        lineHeight: 24,
    },
    deleteLink: {
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    deleteLinkText: {
        ...typography.caption,
        color: colors.textMuted,
        textDecorationLine: 'underline',
    },
    // Footer
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
