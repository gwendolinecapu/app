import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';

export default function SettingsScreen() {
    const { system, user, signOut } = useAuth();

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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Paramètres</Text>
                <View style={{ width: 24 }} />
            </View>

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

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>🎨</Text>
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Thème</Text>
                        <Text style={styles.menuValue}>Bleu foncé</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>✨</Text>
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Personnalisation</Text>
                        <View style={styles.premiumBadge}>
                            <Text style={styles.premiumText}>Premium</Text>
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

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>📱</Text>
                    <Text style={styles.menuText}>Temps d'écran</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Privacy Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Confidentialité</Text>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>🔒</Text>
                    <Text style={styles.menuText}>Compte privé</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>🚫</Text>
                    <Text style={styles.menuText}>Comptes bloqués</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Support Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>❓</Text>
                    <Text style={styles.menuText}>Aide</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuIcon}>📝</Text>
                    <Text style={styles.menuText}>Signaler un bug</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Premium */}
            <View style={styles.premiumCard}>
                <Text style={styles.premiumTitle}>✨ PluralConnect Premium</Text>
                <Text style={styles.premiumDescription}>
                    Débloquez les thèmes personnalisés, polices d'écriture, et plus encore !
                </Text>
                <TouchableOpacity style={styles.premiumButton}>
                    <Text style={styles.premiumButtonText}>Voir les offres</Text>
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>

            <Text style={styles.version}>PluralConnect v1.0.0</Text>
        </ScrollView>
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
        paddingTop: spacing.xl,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    title: {
        ...typography.h2,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
        textTransform: 'uppercase',
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
    premiumText: {
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
});
