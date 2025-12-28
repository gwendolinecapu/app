import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Switch,
    Linking,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';

// Liste des thèmes disponibles
const THEMES = [
    { id: 'dark', name: 'Bleu foncé', emoji: '🌙' },
    { id: 'midnight', name: 'Minuit', emoji: '🌑' },
    { id: 'purple', name: 'Violet', emoji: '💜' },
];

export default function SettingsScreen() {
    const { system, user, signOut } = useAuth();

    // États locaux pour les paramètres
    const [selectedTheme, setSelectedTheme] = useState('dark');
    const [isPrivate, setIsPrivate] = useState(false);
    const [themeModalVisible, setThemeModalVisible] = useState(false);

    // ============================================
    // HANDLERS - Fonctions de gestion des actions
    // ============================================

    const handleSignOut = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    // Sélection du thème
    const handleThemeSelect = (themeId: string) => {
        setSelectedTheme(themeId);
        setThemeModalVisible(false);
        // TODO: Sauvegarder en base de données et appliquer le thème
        Alert.alert('Thème changé', 'Le thème sera appliqué au prochain démarrage.');
    };

    // Personnalisation (Premium)
    const handlePersonalization = () => {
        Alert.alert(
            '✨ Fonctionnalité Premium',
            'La personnalisation avancée (couleurs, polices, animations) est disponible avec PluralConnect Premium.',
            [
                { text: 'Plus tard', style: 'cancel' },
                { text: 'Voir les offres', onPress: handlePremium },
            ]
        );
    };

    // Temps d'écran
    const handleScreenTime = () => {
        Alert.alert(
            '📱 Temps d\'écran',
            'Cette fonctionnalité nécessite l\'accès aux données d\'utilisation de votre appareil.\n\nElle sera disponible dans une prochaine mise à jour.',
            [{ text: 'OK' }]
        );
    };

    // Toggle compte privé
    const handlePrivacyToggle = () => {
        const newValue = !isPrivate;
        setIsPrivate(newValue);
        // TODO: Sauvegarder en base de données
        Alert.alert(
            newValue ? '🔒 Compte privé' : '🌍 Compte public',
            newValue
                ? 'Votre profil et vos publications ne seront visibles que par vos amis.'
                : 'Votre profil est maintenant visible par tous.'
        );
    };

    // Comptes bloqués
    const handleBlockedAccounts = () => {
        Alert.alert(
            '🚫 Comptes bloqués',
            'Vous n\'avez bloqué aucun compte pour le moment.\n\nPour bloquer un compte, appuyez longuement sur son profil.',
            [{ text: 'OK' }]
        );
    };

    // Aide
    const handleHelp = () => {
        Alert.alert(
            '❓ Centre d\'aide',
            'Comment pouvons-nous vous aider ?',
            [
                {
                    text: 'FAQ',
                    onPress: () => Linking.openURL('https://pluralconnect.app/faq')
                        .catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir le lien'))
                },
                {
                    text: 'Nous contacter',
                    onPress: () => Linking.openURL('mailto:support@pluralconnect.app')
                        .catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir l\'email'))
                },
                { text: 'Fermer', style: 'cancel' },
            ]
        );
    };

    // Signaler un bug
    const handleReportBug = () => {
        Alert.alert(
            '📝 Signaler un bug',
            'Décrivez le problème rencontré et nous le corrigerons au plus vite !',
            [
                {
                    text: 'Envoyer par email',
                    onPress: () => {
                        const subject = encodeURIComponent('Bug Report - PluralConnect');
                        const body = encodeURIComponent(
                            `Version: 1.0.0\nCompte: ${user?.email}\n\nDescription du bug:\n\n`
                        );
                        Linking.openURL(`mailto:bugs@pluralconnect.app?subject=${subject}&body=${body}`)
                            .catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir l\'email'));
                    }
                },
                { text: 'Annuler', style: 'cancel' },
            ]
        );
    };

    // Premium
    const handlePremium = () => {
        Alert.alert(
            '✨ PluralConnect Premium',
            'Débloquez toutes les fonctionnalités :\n\n' +
            '• Thèmes personnalisés illimités\n' +
            '• Polices d\'écriture personnalisées\n' +
            '• Statistiques avancées\n' +
            '• Badge Premium\n' +
            '• Support prioritaire\n\n' +
            '💰 2,99€/mois ou 24,99€/an',
            [
                { text: 'Plus tard', style: 'cancel' },
                {
                    text: 'S\'abonner',
                    onPress: () => Alert.alert('Bientôt disponible', 'Les achats in-app seront disponibles prochainement.')
                },
            ]
        );
    };

    // Nom du thème actuel pour l'affichage
    const currentThemeName = THEMES.find(t => t.id === selectedTheme)?.name || 'Bleu foncé';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Paramètres</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView>
                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Compte</Text>

                    <View style={styles.card}>
                        <View style={styles.accountInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarEmoji}>💜</Text>
                            </View>
                            <View>
                                <Text style={styles.username}>@{system?.username || 'user'}</Text>
                                <Text style={styles.email}>{user?.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Apparence</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setThemeModalVisible(true)}
                    >
                        <Text style={styles.menuIcon}>🎨</Text>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuText}>Thème</Text>
                            <Text style={styles.menuValue}>{currentThemeName}</Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handlePersonalization}
                    >
                        <Text style={styles.menuIcon}>✨</Text>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuText}>Personnalisation</Text>
                            <View style={styles.premiumBadge}>
                                <Text style={styles.premiumBadgeText}>Premium</Text>
                            </View>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Statistiques</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/stats')}
                    >
                        <Text style={styles.menuIcon}>📊</Text>
                        <Text style={styles.menuText}>Temps de front</Text>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleScreenTime}
                    >
                        <Text style={styles.menuIcon}>📱</Text>
                        <Text style={styles.menuText}>Temps d'écran</Text>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Privacy Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Confidentialité</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handlePrivacyToggle}
                    >
                        <Text style={styles.menuIcon}>🔒</Text>
                        <Text style={styles.menuText}>Compte privé</Text>
                        <Switch
                            value={isPrivate}
                            onValueChange={handlePrivacyToggle}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.text}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleBlockedAccounts}
                    >
                        <Text style={styles.menuIcon}>🚫</Text>
                        <Text style={styles.menuText}>Comptes bloqués</Text>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleHelp}
                    >
                        <Text style={styles.menuIcon}>❓</Text>
                        <Text style={styles.menuText}>Aide</Text>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleReportBug}
                    >
                        <Text style={styles.menuIcon}>📝</Text>
                        <Text style={styles.menuText}>Signaler un bug</Text>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Premium */}
                <TouchableOpacity style={styles.premiumCard} onPress={handlePremium}>
                    <Text style={styles.premiumTitle}>✨ PluralConnect Premium</Text>
                    <Text style={styles.premiumDescription}>
                        Débloquez les thèmes personnalisés, polices d'écriture, et plus encore !
                    </Text>
                    <View style={styles.premiumButton}>
                        <Text style={styles.premiumButtonText}>Voir les offres</Text>
                    </View>
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>

                <Text style={styles.version}>PluralConnect v1.0.0</Text>
            </ScrollView>

            {/* Modal de sélection de thème */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={themeModalVisible}
                onRequestClose={() => setThemeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choisir un thème</Text>

                        {THEMES.map((theme) => (
                            <TouchableOpacity
                                key={theme.id}
                                style={[
                                    styles.themeOption,
                                    selectedTheme === theme.id && styles.themeOptionSelected,
                                ]}
                                onPress={() => handleThemeSelect(theme.id)}
                            >
                                <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                                <Text style={styles.themeName}>{theme.name}</Text>
                                {selectedTheme === theme.id && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setThemeModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        padding: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    headerButton: {
        width: 40,
        alignItems: 'center',
    },
    title: {
        ...typography.h2,
        flex: 1,
        textAlign: 'center',
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
        marginLeft: spacing.sm,
    },
    card: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    accountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarEmoji: {
        fontSize: 24,
    },
    username: {
        ...typography.body,
        fontWeight: 'bold',
    },
    email: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    menuItem: {
        backgroundColor: colors.backgroundCard,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
    },
    menuIcon: {
        fontSize: 20,
        marginRight: spacing.md,
    },
    menuContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    menuText: {
        ...typography.body,
        flex: 1,
    },
    menuValue: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    premiumBadge: {
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    premiumBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.text,
    },
    arrow: {
        fontSize: 24,
        color: colors.textMuted,
    },
    premiumCard: {
        margin: spacing.md,
        marginTop: spacing.xl,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.secondary,
    },
    premiumTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    premiumDescription: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    premiumButton: {
        backgroundColor: colors.secondary,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    premiumButtonText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: colors.error + '20',
        marginHorizontal: spacing.md,
        marginTop: spacing.xl,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    logoutText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
    },
    version: {
        ...typography.caption,
        textAlign: 'center',
        marginVertical: spacing.xl,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    modalTitle: {
        ...typography.h2,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        backgroundColor: colors.backgroundLight,
    },
    themeOptionSelected: {
        backgroundColor: colors.primary + '30',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    themeEmoji: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    themeName: {
        ...typography.body,
        flex: 1,
    },
    checkmark: {
        fontSize: 20,
        color: colors.primary,
        fontWeight: 'bold',
    },
    modalCloseButton: {
        marginTop: spacing.md,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
    },
    modalCloseText: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
