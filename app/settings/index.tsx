import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/lib/haptics';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const { signOut, system, toggleBiometric, isBiometricEnabled } = useAuth();
    const { isPremium, presentPaywall, presentCustomerCenter } = useMonetization();
    const [notifications, setNotifications] = useState(true);
    const [theme, setTheme] = useState('dark');
    const [privacyBlurEnabled, setPrivacyBlurEnabled] = useState(true);

    React.useEffect(() => {
        AsyncStorage.getItem('privacy_blur_enabled').then(val => {
            if (val !== null) setPrivacyBlurEnabled(val === 'true');
        });
    }, []);

    const handleSubscriptionAction = async () => {
        triggerHaptic.selection();
        // Always direct to premium landing page for now to see features
        router.push('/premium' as any);
    };

    const handleLogout = async () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Se déconnecter",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/(auth)/login');
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Erreur", "Impossible de se déconnecter.");
                        }
                    }
                }
            ]
        );
    };


    const handleCopySystemId = async () => {
        if (!system?.id) return;
        await Clipboard.setStringAsync(system.id);
        triggerHaptic.success();
        Alert.alert("Copié !", "ID Système copié dans le presse-papier.");
    };


    const renderSettingItem = (label: string, icon: any, action: () => void, value?: boolean | string) => (
        <TouchableOpacity style={styles.item} onPress={action} disabled={typeof value === 'boolean'}>
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color={colors.primary} />
                    <Text style={styles.itemLabel}>{label}</Text>
                </View>
            </View>
            {value === 'toggle' ? (
                <Switch
                    value={false} // Placeholder if needed, but we use action logic for specific toggles
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={'#FFFFFF'}
                    disabled={true}
                />
            ) : typeof value === 'boolean' ? (
                <Switch
                    value={value}
                    onValueChange={action}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={'#FFFFFF'}
                />
            ) : (
                <View style={styles.itemRight}>
                    {value && <Text style={styles.itemValue}>{value}</Text>}
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Subscription Section */}
                <Text style={styles.sectionTitle}>Abonnement Premium</Text>
                <View style={styles.section}>
                    {renderSettingItem(
                        isPremium ? "Gérer mon abonnement" : "Passer Premium",
                        isPremium ? "star" : "star-outline",
                        handleSubscriptionAction,
                        isPremium ? "Actif" : "Gratuit"
                    )}
                </View>

                {/* Account Section */}
                <Text style={styles.sectionTitle}>Compte</Text>
                <View style={styles.section}>
                    {renderSettingItem("Email", "mail-outline", () => { }, system?.email)}
                    {renderSettingItem("Système", "planet-outline", () => router.push('/settings/edit-system' as any), system?.username)}
                    {renderSettingItem("Copier mon ID", "copy-outline", handleCopySystemId)}
                    {renderSettingItem("Utilisateurs bloqués", "shield-outline", () => router.push('/settings/blocked' as any))}
                    {renderSettingItem("Sécurité et données", "lock-closed-outline", () => router.push('/settings/security' as any))}
                </View>

                {/* App Settings */}
                <Text style={styles.sectionTitle}>Application</Text>
                <View style={styles.section}>
                    {renderSettingItem("Notifications", "notifications-outline", () => {
                        router.push('/settings/notifications' as any);
                    })}
                    {renderSettingItem("Verrouillage Biométrique (FaceID)", "scan-outline", toggleBiometric, isBiometricEnabled)}
                    {renderSettingItem("Flou de confidentialité", "eye-off-outline", async () => {
                        try {
                            const newVal = !privacyBlurEnabled;
                            setPrivacyBlurEnabled(newVal);
                            await AsyncStorage.setItem('privacy_blur_enabled', String(newVal));
                            triggerHaptic.medium();
                        } catch (e) {
                            console.error(e);
                        }
                    }, privacyBlurEnabled)}
                </View>

                {/* Removed Broken/Unused Settings based on feedback: Theme, Language, Export */}
                {/* 
                <Text style={styles.sectionTitle}>Données & Stockage</Text>
                <View style={styles.section}>
                    {renderSettingItem("Exporter mes données (JSON)", "download-outline", handleExportData)}
                    {renderSettingItem("Vider le cache", "trash-outline", handleClearCache)}
                </View> 
                */}

                {/* Support */}
                <Text style={styles.sectionTitle}>Aide & Support</Text>
                <View style={styles.section}>
                    {renderSettingItem("À propos", "information-circle-outline", () => router.push('/help' as any))}
                    {renderSettingItem("Crisis Resources", "warning-outline", () => router.push('/crisis' as any))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0</Text>
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
        marginRight: spacing.md,
    },
    headerTitle: {
        ...typography.h2,
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.background, // or subtle primary
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    itemLabel: {
        ...typography.body,
        fontWeight: '500',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemValue: {
        ...typography.caption,
        color: colors.textSecondary,
        marginRight: spacing.sm,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.xl,
        borderWidth: 1,
        borderColor: colors.error,
    },
    logoutText: {
        ...typography.body,
        color: colors.error,
        fontWeight: 'bold',
        marginLeft: spacing.sm,
    },
    version: {
        textAlign: 'center',
        marginTop: spacing.xl,
        ...typography.caption,
    },
});
