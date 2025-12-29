import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
    const router = useRouter();
    const { signOut } = useAuth();

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

                {renderMenuItem(
                    "people-outline",
                    "Gestion des Rôles",
                    "Définir les rôles (Protecteur, Gatekeeper...)",
                    "/roles",
                    "#8B5CF6"
                )}

                {renderMenuItem(
                    "hand-left-outline",
                    "Demandes d'Aide",
                    "Voir et résoudre les besoins du système",
                    "/help",
                    "#10B981"
                )}

                {renderMenuItem(
                    "notifications-outline",
                    "Notifications",
                    "Rappels et messages de soutien",
                    "/settings/notifications",
                    "#F59E0B"
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

                <View style={styles.footer}>
                    <Text style={styles.version}>PluralConnect v1.0.0 (Beta)</Text>
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
});
