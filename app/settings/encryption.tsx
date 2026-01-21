import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/lib/haptics';
import { EncryptionService } from '../../src/services/EncryptionService';

export default function EncryptionSettingsScreen() {
    const { user } = useAuth();
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEncryptionStatus();
    }, []);

    const loadEncryptionStatus = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const status = await EncryptionService.isEncryptionEnabled(user.uid);
            setIsEnabled(status);
        } catch (error) {
            console.error('[EncryptionSettings] Erreur chargement status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEncryption = async (value: boolean) => {
        if (!user?.uid) return;

        if (value) {
            // Activer le chiffrement - montrer l'avertissement
            Alert.alert(
                "🔒 Activer le chiffrement E2E",
                "Vos nouveaux messages seront chiffrés sur votre appareil avant d'être envoyés.\n\n⚠️ Attention : Si vous perdez votre appareil sans backup, vous perdrez l'accès aux messages chiffrés.",
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Activer",
                        onPress: async () => {
                            setLoading(true);
                            try {
                                await EncryptionService.enableEncryption(user.uid);
                                setIsEnabled(true);
                                triggerHaptic.success();
                                Alert.alert("✅ Activé", "Le chiffrement est maintenant actif pour vos messages privés.");
                            } catch (error: any) {
                                console.error('[EncryptionSettings] Erreur activation:', error);
                                Alert.alert("Erreur", "Impossible d'activer le chiffrement: " + error.message);
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                ]
            );
        } else {
            // Désactiver
            Alert.alert(
                "🔓 Désactiver le chiffrement",
                "Les nouveaux messages ne seront plus chiffrés. Les anciens messages chiffrés resteront protégés.",
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Désactiver",
                        style: "destructive",
                        onPress: async () => {
                            setLoading(true);
                            try {
                                await EncryptionService.disableEncryption(user.uid);
                                setIsEnabled(false);
                                triggerHaptic.warning();
                            } catch (error: any) {
                                console.error('[EncryptionSettings] Erreur désactivation:', error);
                                Alert.alert("Erreur", "Impossible de désactiver le chiffrement.");
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chiffrement E2E</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Status Section */}
                <View style={styles.section}>
                    <View style={styles.statusCard}>
                        <View style={styles.statusIcon}>
                            <Ionicons
                                name={isEnabled ? "shield-checkmark" : "shield-outline"}
                                size={48}
                                color={isEnabled ? colors.success : colors.textMuted}
                            />
                        </View>
                        <Text style={styles.statusTitle}>
                            {isEnabled ? "🔒 Chiffrement Activé" : "🔓 Chiffrement Désactivé"}
                        </Text>
                        <Text style={styles.statusDescription}>
                            {isEnabled
                                ? "Vos messages privés sont protégés par chiffrement end-to-end"
                                : "Vos messages sont envoyés en clair (protégés uniquement par Firebase)"
                            }
                        </Text>
                    </View>
                </View>

                {/* Toggle Section */}
                <View style={styles.section}>
                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchLabel}>Activer le chiffrement E2E</Text>
                            <Text style={styles.switchSubLabel}>Pour tous les messages privés</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <Switch
                                value={isEnabled}
                                onValueChange={handleToggleEncryption}
                                trackColor={{ false: colors.border, true: colors.success }}
                                thumbColor={'#FFFFFF'}
                                disabled={loading}
                            />
                        )}
                    </View>
                </View>

                {/* Explanation Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Comment ça marche ?</Text>

                    <View style={styles.featureItem}>
                        <Ionicons name="lock-closed" size={24} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                            <Text style={styles.featureTitle}>Chiffrement AES-256</Text>
                            <Text style={styles.featureDescription}>
                                Algorithme cryptographique de niveau bancaire
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="phone-portrait" size={24} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                            <Text style={styles.featureTitle}>Chiffré sur votre appareil</Text>
                            <Text style={styles.featureDescription}>
                                Le texte est chiffré AVANT d'être envoyé à Firebase
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="key" size={24} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                            <Text style={styles.featureTitle}>Clé sécurisée locale</Text>
                            <Text style={styles.featureDescription}>
                                Stockée dans le Keychain iOS / Keystore Android
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="eye-off" size={24} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                            <Text style={styles.featureTitle}>Zero-knowledge</Text>
                            <Text style={styles.featureDescription}>
                                Même nous ne pouvons pas lire vos messages
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Warning Section */}
                <View style={[styles.section, styles.warningSection]}>
                    <View style={styles.warningHeader}>
                        <Ionicons name="warning" size={24} color={colors.warning} />
                        <Text style={styles.warningTitle}>Important à savoir</Text>
                    </View>

                    <Text style={styles.warningText}>
                        • Les anciens messages (avant activation) restent non chiffrés{'\n'}
                        • Les images/médias ne sont pas chiffrés actuellement{'\n'}
                        • Si vous perdez votre appareil, les messages chiffrés ne seront plus accessibles{'\n'}
                        • Le chiffrement peut légèrement ralentir l'envoi de messages
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
        marginRight: spacing.md,
    },
    headerTitle: {
        ...typography.h3,
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.lg,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: 'bold',
        marginBottom: spacing.md,
        color: colors.text,
    },
    statusCard: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    statusIcon: {
        marginBottom: spacing.md,
    },
    statusTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    statusDescription: {
        ...typography.caption,
        textAlign: 'center',
        color: colors.textSecondary,
        paddingHorizontal: spacing.xl,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    switchLabel: {
        ...typography.body,
        fontWeight: '500',
        color: colors.text,
    },
    switchSubLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    featureTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    featureDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    warningSection: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderColor: colors.warning,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    warningTitle: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.warning,
    },
    warningText: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});
