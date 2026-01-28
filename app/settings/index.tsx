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
    StatusBar,
 NativeModules } from 'react-native';
import Animated, {
    FadeInDown,
    FadeInRight,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    LinearTransition,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { useAuth } from '../../src/contexts/AuthContext';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/lib/haptics';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import ConsentService from '../../src/services/ConsentService';

// Guard for Crashlytics
let crashlytics: any = null;
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo';

if (!isExpoGo && NativeModules.RNFBCrashlyticsModule) {
    try {
        crashlytics = require('@react-native-firebase/crashlytics').default;
    } catch (e) {
        console.warn('[Settings] Crashlytics native module not available');
    }
}

// Fallback mock
if (!crashlytics) {
    crashlytics = () => ({
        crash: () => console.log('[Settings] Crashlytics.crash() called (Mock)'),
        log: (msg: string) => console.log('[Settings] Crashlytics.log:', msg),
        recordError: (err: any) => console.log('[Settings] Crashlytics.recordError:', err),
    });
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Composant animé pour les items de settings
const AnimatedSettingItem = ({
    label,
    icon,
    action,
    value,
    isDestructive = false,
    index = 0,
}: {
    label: string;
    icon: string;
    action: () => void;
    value?: boolean | string;
    isDestructive?: boolean;
    index?: number;
}) => {
    const scale = useSharedValue(1);
    const pressed = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: interpolate(
            pressed.value,
            [0, 1],
            [0, isDestructive ? 0.08 : 0.05]
        ) === 0 ? colors.backgroundCard : `rgba(${isDestructive ? '239, 68, 68' : '139, 92, 246'}, ${interpolate(pressed.value, [0, 1], [0, 0.08])})`,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        pressed.value = withTiming(1, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        pressed.value = withTiming(0, { duration: 200 });
    };

    const isToggle = typeof value === 'boolean';

    return (
        <Animated.View
            entering={FadeInRight.delay(50 + index * 30).duration(300).springify().damping(18)}
            layout={LinearTransition.springify().damping(15)}
        >
            <AnimatedTouchable
                style={[styles.item, isDestructive && styles.destructiveItem, animatedStyle]}
                onPress={isToggle ? action : action}
                onPressIn={!isToggle ? handlePressIn : undefined}
                onPressOut={!isToggle ? handlePressOut : undefined}
                disabled={isToggle}
                activeOpacity={isToggle ? 1 : 0.9}
            >
                <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, isDestructive && { backgroundColor: `${colors.error}15` }]}>
                        <Ionicons name={icon as any} size={20} color={isDestructive ? colors.error : colors.primary} />
                    </View>
                    <Text style={[styles.itemLabel, isDestructive && { color: colors.error }]}>{label}</Text>
                </View>

                {isToggle ? (
                    <Switch
                        value={value}
                        onValueChange={action}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={'#FFFFFF'}
                        ios_backgroundColor={colors.border}
                    />
                ) : (
                    <View style={styles.itemRight}>
                        {typeof value === 'string' && <Text style={styles.itemValue}>{value}</Text>}
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                )}
            </AnimatedTouchable>
        </Animated.View>
    );
};

// Section animée
const AnimatedSection = ({
    title,
    children,
    index = 0,
}: {
    title: string;
    children: React.ReactNode;
    index?: number;
}) => (
    <Animated.View
        entering={FadeInDown.delay(100 + index * 80).duration(400).springify().damping(15)}
    >
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.section}>{children}</View>
    </Animated.View>
);

const PrivacySettingsButton = () => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        ConsentService.isPrivacyOptionsRequired().then(setIsVisible);
    }, []);

    if (!isVisible) return null;

    return (
        <TouchableOpacity
            style={styles.item}
            onPress={() => ConsentService.showPrivacyOptions()}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.itemLabel}>Paramètres de confidentialité (GDPR)</Text>
            </View>
            <View style={styles.itemRight}>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const { signOut, system, toggleBiometric, isBiometricEnabled } = useAuth();
    const { isPremium } = useMonetization();
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

    const handlePrivacyBlurToggle = async () => {
        try {
            const newVal = !privacyBlurEnabled;
            setPrivacyBlurEnabled(newVal);
            await AsyncStorage.setItem('privacy_blur_enabled', String(newVal));
            triggerHaptic.medium();
        } catch (e) {
            console.error(e);
        }
    };

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

            <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres</Text>
                <View style={styles.headerRight}>
                    <Ionicons name="settings" size={20} color="rgba(255,255,255,0.5)" />
                </View>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* System ID Card */}
                {system && (
                    <Animated.View entering={FadeInDown.delay(50).duration(400).springify().damping(15)}>
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
                                    <View style={styles.idRow}>
                                        <Ionicons name="finger-print-outline" size={12} color="rgba(255,255,255,0.6)" />
                                        <Text style={styles.profileId}>Tap pour copier l'ID</Text>
                                    </View>
                                </View>
                                <View style={styles.copyBadge}>
                                    <Ionicons name="copy-outline" size={16} color="#FFF" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Premium Banner */}
                <Animated.View entering={FadeInDown.delay(100).duration(400).springify().damping(15)}>
                    <TouchableOpacity onPress={handleSubscriptionAction} style={styles.premiumBanner}>
                        <LinearGradient
                            colors={isPremium ? ['#FFD700', '#FFA500', '#FF8C00'] : [colors.primary, colors.secondary, '#6366F1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.premiumGradient}
                        >
                            <View style={styles.premiumIconContainer}>
                                <Ionicons name={isPremium ? "star" : "diamond-outline"} size={24} color="#FFF" />
                            </View>
                            <View style={styles.premiumTextContainer}>
                                <Text style={styles.premiumTitle}>
                                    {isPremium ? "Membre Premium" : "Passer Premium"}
                                </Text>
                                <Text style={styles.premiumSubtitle}>
                                    {isPremium ? "Gérer mon abonnement & avantages" : "Débloquez toutes les fonctionnalités"}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Account Section */}
                <AnimatedSection title="Compte & Système" index={0}>
                    <AnimatedSettingItem label="Modifier le Système" icon="create-outline" action={() => router.push('/settings/edit-system' as any)} index={0} />
                    <AnimatedSettingItem label="Importer Simply Plural" icon="cloud-download-outline" action={() => router.push('/settings/import' as any)} index={1} />
                    <AnimatedSettingItem label="Sécurité et données" icon="lock-closed-outline" action={() => router.push('/settings/security' as any)} index={2} />
                    <AnimatedSettingItem label="Alters archivés" icon="archive-outline" action={() => router.push('/settings/archived-alters' as any)} index={3} />
                    <PrivacySettingsButton />
                </AnimatedSection>

                {/* App Settings */}
                <AnimatedSection title="Préférences" index={1}>
                    <AnimatedSettingItem label="Notifications" icon="notifications-outline" action={() => router.push('/settings/notifications' as any)} index={0} />
                    <AnimatedSettingItem label="Check-In automatique" icon="time-outline" action={() => router.push('/settings/checkin' as any)} index={1} />
                    <AnimatedSettingItem label="Widgets & Dynamic Island" icon="phone-portrait-outline" action={() => router.push('/settings/widgets' as any)} index={2} />
                    <AnimatedSettingItem label="Verrouillage FaceID" icon="scan-outline" action={toggleBiometric} value={isBiometricEnabled} index={3} />
                    <AnimatedSettingItem label="Flouter l'écran (App Switcher)" icon="eye-off-outline" action={handlePrivacyBlurToggle} value={privacyBlurEnabled} index={4} />
                    <AnimatedSettingItem label="Accessibilité" icon="accessibility-outline" action={() => router.push('/settings/accessibility' as any)} index={5} />
                </AnimatedSection>

                {/* Feedback & Support */}
                <AnimatedSection title="Support & Retours" index={2}>
                    <AnimatedSettingItem label="Donner son avis / Signaler un bug" icon="chatbox-ellipses-outline" action={() => router.push('/settings/feedback' as any)} index={0} />
                    <AnimatedSettingItem label="Centre d'aide" icon="help-circle-outline" action={() => router.push('/help' as any)} index={1} />
                    <AnimatedSettingItem label="Ressources de Crise" icon="medkit-outline" action={() => router.push('/crisis' as any)} index={2} />
                </AnimatedSection>

                {/* Admin Link if Admin */}
                {system?.isAdmin && (
                    <AnimatedSection title="Administration" index={3}>
                        <AnimatedSettingItem label="Admin Feedback" icon="construct-outline" action={() => router.push('/admin/feedback' as any)} index={0} />
                        <AnimatedSettingItem label="Test Crashlytics" icon="bug-outline" action={() => crashlytics().crash()} isDestructive index={1} />
                    </AnimatedSection>
                )}

                {/* Danger Zone */}
                <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.logoutContainer}>
                    <AnimatedSettingItem label="Se déconnecter" icon="log-out-outline" action={handleLogout} isDestructive index={0} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.footer}>
                    <Ionicons name="heart" size={14} color={colors.primary} style={{ marginBottom: 4 }} />
                    <Text style={styles.version}>Plural Connect</Text>
                    <Text style={styles.versionNumber}>Version 1.0.0</Text>
                </Animated.View>
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
    headerRight: {
        width: 28,
        opacity: 0.5,
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
        fontSize: 11,
        marginLeft: 4,
    },
    idRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    copyBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
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
    premiumIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
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
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingVertical: spacing.lg,
    },
    version: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 2,
    },
    versionNumber: {
        ...typography.caption,
        color: colors.textSecondary,
        opacity: 0.5,
        fontSize: 11,
    },
});
