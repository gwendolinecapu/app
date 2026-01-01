import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    ScrollView,
    Platform,
    StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/lib/haptics';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function SettingsScreen() {
    const { signOut, system, toggleBiometric, isBiometricEnabled } = useAuth();
    const { isPremium, presentPaywall, presentCustomerCenter } = useMonetization();
    const [privacyBlurEnabled, setPrivacyBlurEnabled] = useState(true);

    React.useEffect(() => {
        AsyncStorage.getItem('privacy_blur_enabled')
            .then(val => {
                if (val !== null) setPrivacyBlurEnabled(val === 'true');
            })
            .catch(() => { });
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

    const renderSettingItem = React.useCallback((label: string, icon: any, action: () => void, value?: boolean | string, isDestructive = false) => (
        <TouchableOpacity
            style={[styles.item, isDestructive && styles.destructiveItem]}
            onPress={action}
            disabled={typeof value === 'boolean'}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, isDestructive && { backgroundColor: `${colors.error}20` }]}>
                    <Ionicons name={icon} size={20} color={isDestructive ? colors.error : colors.primary} />
                </View>
                <Text style={[styles.itemLabel, isDestructive && { color: colors.error }]}>{label}</Text>
            </View>

            {value === 'toggle' ? (
                <Switch
                    value={false}
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
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
            )}
        </TouchableOpacity>
    ), []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Premium Header Background */}
            <LinearGradient
                colors={[colors.primaryDark, colors.background]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* System ID Card */}
                {system && (
                    <TouchableOpacity onPress={handleCopySystemId} activeOpacity={0.8} style={styles.profileCard}>
                        <LinearGradient
                            colors={['#4c669f', '#3b5998', '#192f6a']}
                            style={styles.profileGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{system.username?.[0]?.toUpperCase() || 'S'}</Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{system.username}</Text>
                                <Text style={styles.profileEmail}>{system.email}</Text>
                                <Text style={styles.profileId}>ID: {system.id} (Tap to copy)</Text>
                            </View>
                            <Ionicons name="copy-outline" size={18} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Premium Banner */}
                <TouchableOpacity onPress={handleSubscriptionAction} style={styles.premiumBanner}>
                    <LinearGradient
                        colors={[isPremium ? '#FFD700' : colors.primary, isPremium ? '#FFA500' : colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.premiumGradient}
                    >
                        <Ionicons name={isPremium ? "star" : "diamond-outline"} size={24} color="#FFF" style={styles.premiumIcon} />
                        <View style={styles.premiumTextContainer}>
                            <Text style={styles.premiumTitle}>
                                {isPremium ? "Membre Premium" : "Passer Premium"}
                            </Text>
                            <Text style={styles.premiumSubtitle}>
                                {isPremium ? "Gérer mon abonnement & avantages" : "Débloquez toutes les fonctionnalités"}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Account Section */}
                <Text style={styles.sectionTitle}>Compte & Système</Text>
                <View style={styles.section}>
                    {renderSettingItem("Modifier le Système", "create-outline", () => router.push('/settings/edit-system' as any))}
                    {renderSettingItem("Sécurité et données", "lock-closed-outline", () => router.push('/settings/security' as any))}
                </View>

                {/* App Settings */}
                <Text style={styles.sectionTitle}>Préférences</Text>
                <View style={styles.section}>
                    {renderSettingItem("Notifications", "notifications-outline", () => router.push('/settings/notifications' as any))}
                    {renderSettingItem("Check-In automatique", "time-outline", () => router.push('/settings/checkin' as any))}
                    {renderSettingItem("Widgets & Dynamic Island", "phone-portrait-outline", () => router.push('/settings/widgets' as any))}
                    {renderSettingItem("Verrouillage FaceID", "scan-outline", toggleBiometric, isBiometricEnabled)}
                    {renderSettingItem("Flouter l'écran (App Switcher)", "eye-off-outline", async () => {
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

                {/* Feedback & Support - NEW */}
                <Text style={styles.sectionTitle}>Support & Retours</Text>
                <View style={styles.section}>
                    {renderSettingItem("Donner son avis / Signaler un bug", "chatbox-ellipses-outline", () => router.push('/settings/feedback' as any))}
                    {renderSettingItem("Centre d'aide", "help-circle-outline", () => router.push('/help' as any))}
                    {renderSettingItem("Ressources de Crise", "medkit-outline", () => router.push('/crisis' as any))}
                </View>

                {/* Admin Link if Admin */}
                {system?.isAdmin && (
                    <>
                        <Text style={styles.sectionTitle}>Administration</Text>
                        <View style={styles.section}>
                            {renderSettingItem("Admin Feedback", "construct-outline", () => router.push('/admin/feedback' as any))}
                        </View>
                    </>
                )}

                {/* Danger Zone */}
                <View style={styles.logoutContainer}>
                    {renderSettingItem("Se déconnecter", "log-out-outline", handleLogout, undefined, true)}
                </View>

                <Text style={styles.version}>Version 1.0.0 • Plural Connect</Text>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        zIndex: 10,
    },
    backButton: {
        marginRight: spacing.md,
        padding: 4,
    },
    headerTitle: {
        ...typography.h2,
        flex: 1,
        color: '#FFFFFF', // Force white on gradient
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    content: {
        padding: spacing.lg,
    },
    profileCard: {
        marginBottom: spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    profileGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        ...typography.h3,
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        ...typography.h3,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    profileEmail: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    profileId: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
    },
    premiumBanner: {
        marginBottom: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    premiumGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    premiumIcon: {
        marginRight: spacing.md,
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumTitle: {
        ...typography.h3,
        color: '#FFFFFF',
        fontSize: 18,
    },
    premiumSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14, // Slightly taller click targets
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border, // Very subtle separator
        backgroundColor: colors.backgroundCard,
    },
    destructiveItem: {
        backgroundColor: 'rgba(255, 69, 58, 0.05)', // Very subtle red tint
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    itemLabel: {
        ...typography.body,
        fontWeight: '500',
        fontSize: 15,
        color: colors.text,
        flex: 1,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemValue: {
        ...typography.caption,
        color: colors.textSecondary,
        marginRight: spacing.sm,
        fontSize: 13,
    },
    logoutContainer: {
        marginTop: spacing.xl,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,69,58,0.2)',
    },
    version: {
        textAlign: 'center',
        marginTop: spacing.xl,
        ...typography.caption,
        color: colors.textSecondary,
        opacity: 0.5,
    },
});
