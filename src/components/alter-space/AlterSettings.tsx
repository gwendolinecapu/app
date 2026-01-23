import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Alter } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { PasswordService } from '../../services/PasswordService';

import { ThemeColors } from '../../lib/cosmetics';

interface AlterSettingsProps {
    alter: Alter;
    themeColors?: ThemeColors;
}

export const AlterSettings: React.FC<AlterSettingsProps> = ({ alter, themeColors }) => {
    const textColor = themeColors?.text || colors.text;
    const textSecondaryColor = themeColors?.textSecondary || colors.textSecondary;
    const cardBg = themeColors?.backgroundCard || colors.surface;
    const borderColor = themeColors?.border || colors.border;
    const iconColor = themeColors?.primary || colors.primary;
    const bgColor = themeColors?.background || colors.background;

    // Password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    const hasPassword = !!alter.password;

    const handleSavePassword = async () => {
        if (!newPassword.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un mot de passe');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }
        if (newPassword.length < 4) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 4 caractères');
            return;
        }

        setSaving(true);
        try {
            const alterRef = doc(db, 'alters', alter.id);
            // Hash the password before storing
            const hashedPassword = await PasswordService.hashPassword(newPassword);
            await updateDoc(alterRef, { password: hashedPassword });
            Alert.alert('Succès', 'Mot de passe défini avec succès');
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error saving password:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le mot de passe');
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePassword = () => {
        Alert.alert(
            'Supprimer le mot de passe',
            'Voulez-vous vraiment supprimer la protection par mot de passe de cet espace ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const alterRef = doc(db, 'alters', alter.id);
                            await updateDoc(alterRef, { password: null });
                            Alert.alert('Succès', 'Mot de passe supprimé');
                        } catch (error) {
                            console.error('Error removing password:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer le mot de passe');
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors?.background || 'transparent' }]}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Compte</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={() => router.push(`/alter-space/${alter.id}/edit`)}>
                    <Ionicons name="person-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Modifier le profil</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>

                {/* PASSWORD OPTION */}
                <TouchableOpacity
                    style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}
                    onPress={() => {
                        if (hasPassword) {
                            // Show options: change or remove
                            Alert.alert(
                                'Mot de passe',
                                'Que voulez-vous faire ?',
                                [
                                    { text: 'Annuler', style: 'cancel' },
                                    { text: 'Modifier', onPress: () => setShowPasswordModal(true) },
                                    { text: 'Supprimer', style: 'destructive', onPress: handleRemovePassword }
                                ]
                            );
                        } else {
                            setShowPasswordModal(true);
                        }
                    }}
                >
                    <Ionicons name="key-outline" size={24} color={iconColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Mot de passe</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {hasPassword ? (
                            <View style={[styles.statusBadge, { backgroundColor: `${colors.success}20` }]}>
                                <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>Actif</Text>
                            </View>
                        ) : (
                            <View style={[styles.statusBadge, { backgroundColor: `${colors.textSecondary}20` }]}>
                                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>Désactivé</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="lock-closed-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Confidentialité</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="notifications-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={() => router.push('/settings')}>
                    <Ionicons name="settings-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Paramètres de l'application</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Interactions</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="people-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Abonnés proches</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="ban-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Comptes bloqués</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Système</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="eye-off-outline" size={24} color={colors.error} />
                    <Text style={[styles.itemText, { color: colors.error }]}>Masquer cet alter</Text>
                </TouchableOpacity>
            </View>

            {/* PASSWORD MODAL */}
            <Modal visible={showPasswordModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
                        <View style={[styles.modalIconContainer, { backgroundColor: `${iconColor}20` }]}>
                            <Ionicons name="key" size={32} color={iconColor} />
                        </View>

                        <Text style={[styles.modalTitle, { color: textColor }]}>
                            {hasPassword ? 'Modifier le mot de passe' : 'Définir un mot de passe'}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: textSecondaryColor }]}>
                            Protégez l'accès à cet espace alter
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: bgColor, borderColor }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Nouveau mot de passe"
                                placeholderTextColor={textSecondaryColor}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={22} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: bgColor, borderColor }]}>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirmer le mot de passe"
                                placeholderTextColor={textSecondaryColor}
                                secureTextEntry={!showNewPassword}
                            />
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { borderColor }]}
                                onPress={() => {
                                    setShowPasswordModal(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={[styles.cancelButtonText, { color: textSecondaryColor }]}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton, { backgroundColor: iconColor }]}
                                onPress={handleSavePassword}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemText: {
        flex: 1,
        marginLeft: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        marginRight: spacing.sm,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
