import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut, deleteAccount, user, system } = useAuth();
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [newName, setNewName] = useState(system?.username || '');

    const handleUpdateName = async () => {
        if (!user || !newName.trim()) return;
        try {
            await updateDoc(doc(db, 'systems', user.uid), {
                username: newName.trim()
            });
            setNameModalVisible(false);
            Alert.alert("Succès", "Nom du système mis à jour !");
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de mettre à jour le nom.");
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Supprimer le compte ?",
            "Cette action supprimera DÉFINITIVEMENT tous vos alters, journaux et données. Êtes-vous sûr ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer tout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            router.replace('/auth/login' as any);
                        } catch (error: any) {
                            Alert.alert("Erreur", error.message || "Une erreur est survenue.");
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            "Déconnexion",
            "Voulez-vous vraiment vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Déconnexion",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/auth/login' as any);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            ]
        );
    };

    const renderMenuItem = (icon: string, title: string, subtitle: string, route: string, color: string = colors.primary) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push(route as any)}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={[colors.background, colors.backgroundCard]}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Paramètres</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView style={styles.content}>
                <Text style={styles.sectionTitle}>Système</Text>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                        setNewName(system?.username || '');
                        setNameModalVisible(true);
                    }}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                        <Ionicons name="pencil" size={24} color={colors.secondary} />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuTitle}>Nom du Système</Text>
                        <Text style={styles.menuSubtitle}>{system?.username || "Non défini"}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </TouchableOpacity>

                {renderMenuItem(
                    "people-outline",
                    "Gestion des Rôles",
                    "Définir les rôles (Protecteur, Gatekeeper...)",
                    "/roles/index",
                    "#8B5CF6"
                )}

                {renderMenuItem(
                    "hand-left-outline",
                    "Demandes d'Aide",
                    "Voir et résoudre les besoins du système",
                    "/help/index",
                    "#10B981"
                )}

                {renderMenuItem(
                    "notifications-outline",
                    "Notifications",
                    "Rappels et messages de soutien",
                    "/settings/notifications",
                    "#F59E0B"
                )}

                {renderMenuItem(
                    "cloud-download-outline",
                    "Import Simply Plural",
                    "Importer vos alters et historique",
                    "/settings/import",
                    "#3B82F6"
                )}

                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Compte</Text>

                <TouchableOpacity
                    style={[styles.menuItem, styles.logoutButton]}
                    onPress={handleLogout}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
                        <Ionicons name="log-out-outline" size={24} color={colors.error} />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={[styles.menuTitle, { color: colors.error }]}>Déconnexion</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, styles.deleteButton]}
                    onPress={handleDeleteAccount}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#FF000020' }]}>
                        <Ionicons name="trash-outline" size={24} color="#FF0000" />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={[styles.menuTitle, { color: '#FF0000' }]}>Supprimer le compte</Text>
                        <Text style={styles.menuSubtitle}>Cette action est irréversible</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.version}>PluralConnect v1.0.0 (Beta)</Text>
                </View>
            </ScrollView>

            {/* Edit System Name Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={nameModalVisible}
                onRequestClose={() => setNameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nom du Système</Text>
                        <Text style={styles.modalSubtitle}>Choisissez comment votre système s'appelle.</Text>

                        <TextInput
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Ex: Système Solaire"
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalButtonCancel}
                                onPress={() => setNameModalVisible(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButtonConfirm}
                                onPress={handleUpdateName}
                            >
                                <Text style={styles.modalButtonTextConfirm}>Enregistrer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        ...typography.h2,
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    menuSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    logoutButton: {
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    footer: {
        marginTop: spacing.xxl,
        alignItems: 'center',
    },
    version: {
        ...typography.caption,
        color: colors.textMuted,
    },
    deleteButton: {
        borderWidth: 1,
        borderColor: '#FF000030',
        marginTop: spacing.md,
    },
    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        ...typography.h2,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    input: {
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalButtonCancel: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
    },
    modalButtonConfirm: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
    },
    modalButtonTextCancel: {
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    modalButtonTextConfirm: {
        fontWeight: 'bold',
        color: colors.text,
    },
});
