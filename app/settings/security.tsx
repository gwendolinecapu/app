import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/lib/haptics';

export default function SecurityScreen() {
    const { deleteAccount, user, isBiometricEnabled, toggleBiometric } = useAuth();
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [showDeleteInput, setShowDeleteInput] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'SUPPRIMER') {
            Alert.alert("Confirmation incorrecte", "Veuillez taper 'SUPPRIMER' en majuscules pour confirmer.");
            return;
        }

        Alert.alert(
            "Action Irréversible",
            "Toutes vos données (alters, journaux, profil) seront définitivement effacées. Êtes-vous vraiment sûr ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Oui, tout effacer",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteAccount();
                            // Navigation handled by auth state change usually, but explicit here helps
                            router.replace('/(auth)/login');
                        } catch (error: any) {
                            console.error(error);
                            if (error.code === 'auth/requires-recent-login') {
                                Alert.alert("Sécurité", "Cette action nécessite une connexion récente. Veuillez vous reconnecter et réessayer.");
                                // Force logout so they can login again? Or just let them do it.
                            } else {
                                Alert.alert("Erreur", "Impossible de supprimer le compte: " + error.message);
                            }
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sécurité & Données</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Email du compte</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                        <Text style={styles.infoText}>{user?.email}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sécurité de l'application</Text>
                    <View style={styles.switchRow}>
                        <View style={styles.switchLabelContainer}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="finger-print-outline" size={22} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.switchLabel}>Verrouillage Biométrique</Text>
                                <Text style={styles.switchSubLabel}>FaceID / TouchID au lancement</Text>
                            </View>
                        </View>
                        <Switch
                            value={isBiometricEnabled}
                            onValueChange={toggleBiometric}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={'#FFFFFF'}
                        />
                    </View>
                </View>

                <View style={[styles.section, styles.dangerZone]}>
                    <View style={styles.dangerHeader}>
                        <Ionicons name="warning" size={24} color={colors.error} />
                        <Text style={styles.dangerTitle}> Zone de Danger</Text>
                    </View>

                    <Text style={styles.dangerDescription}>
                        La suppression de votre compte est définitive et entraînera la perte de toutes vos données : alters, historiques, journaux et paramètres.
                    </Text>

                    {!showDeleteInput ? (
                        <TouchableOpacity
                            style={styles.deleteButtonInitial}
                            onPress={() => {
                                triggerHaptic.warning();
                                setShowDeleteInput(true);
                            }}
                        >
                            <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.confirmationBox}>
                            <Text style={styles.confirmationLabel}>
                                Tapez "SUPPRIMER" ci-dessous pour confirmer :
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={deleteConfirmation}
                                onChangeText={setDeleteConfirmation}
                                placeholder="SUPPRIMER"
                                autoCapitalize="characters"
                                placeholderTextColor={colors.textMuted}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.deleteButtonFinal,
                                    (deleteConfirmation !== 'SUPPRIMER' || loading) && styles.disabledButton
                                ]}
                                onPress={handleDeleteAccount}
                                disabled={deleteConfirmation !== 'SUPPRIMER' || loading}
                            >
                                <Text style={styles.deleteButtonTextFinal}>
                                    {loading ? "Suppression..." : "Confirmer la suppression"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowDeleteInput(false)}>
                                <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
        marginBottom: spacing.xl,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    infoText: {
        ...typography.body,
        color: colors.text,
    },
    dangerZone: {
        borderColor: colors.error,
        borderWidth: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.05)', // faint red
    },
    dangerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    dangerTitle: {
        ...typography.h3,
        color: colors.error,
    },
    dangerDescription: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    deleteButtonInitial: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.error,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: colors.error,
        fontWeight: '600',
    },
    confirmationBox: {
        gap: spacing.md,
    },
    confirmationLabel: {
        ...typography.bodySmall,
        color: colors.text,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontWeight: 'bold',
    },
    deleteButtonFinal: {
        backgroundColor: colors.error,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    deleteButtonTextFinal: {
        color: 'white',
        fontWeight: 'bold',
    },
    cancelText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    switchLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    switchLabel: {
        ...typography.body,
        fontWeight: '500',
        color: colors.text,
    },
    switchSubLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.backgroundCard, // was background
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
});
