import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSuccessAnimation } from '../../src/contexts/SuccessAnimationContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { DismissKeyboard } from '../../src/components/ui/DismissKeyboard';
import { LegalModal } from '../../src/components/auth/LegalModal';
import { Ionicons } from '@expo/vector-icons';
import { PlatformSafeView } from '../../src/components/ui/PlatformSafeView';
import { WebContainer } from '../../src/components/ui/WebContainer';
import { ResponsiveInput } from '../../src/components/ui/ResponsiveInput';
import { ResponsiveButton } from '../../src/components/ui/ResponsiveButton';

export default function RegisterScreen() {
    const params = useLocalSearchParams<{ systemName?: string; alterCount?: string }>();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const { play } = useSuccessAnimation();
    const [legalModal, setLegalModal] = useState<{ visible: boolean; type: 'tos' | 'privacy' | null }>({
        visible: false,
        type: null
    });

    useEffect(() => {
        if (params.systemName) {
            setUsername(params.systemName);
        }
    }, [params.systemName]);

    const handleRegister = async () => {
        if (!email || !username || !password || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        const trimmedEmail = email.trim();
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();
        const trimmedConfirmPassword = confirmPassword.trim();

        if (trimmedPassword !== trimmedConfirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (trimmedPassword.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
            return;
        }

        if (trimmedUsername.length > 30) {
            Alert.alert('Erreur', "Le nom d'utilisateur ne doit pas dépasser 30 caractères");
            return;
        }

        const alterCountNumber = params.alterCount ? parseInt(params.alterCount, 10) : undefined;

        setLoading(true);
        const { error } = await signUp(trimmedEmail, trimmedPassword, trimmedUsername, alterCountNumber);
        setLoading(false);

        if (error) {
            console.error('Registration error:', error.message);
            if (error.message.includes('already registered') ||
                error.message.includes('already exists') ||
                error.message.includes('user-already-in-use') ||
                error.message.includes('email-already-in-use')) {
                Alert.alert(
                    'Compte existant',
                    'Un compte avec cet email existe déjà. Voulez-vous vous connecter ?',
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Se connecter', onPress: () => router.replace('/(auth)/login') }
                    ]
                );
            } else {
                Alert.alert('Erreur', error.message);
            }
        } else {
            play();
            Alert.alert(
                'Inscription réussie !',
                'Votre système a été créé. Vous pouvez maintenant vous connecter.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
        }
    };

    return (
        <DismissKeyboard>
            <PlatformSafeView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
                    style={styles.container}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <WebContainer maxWidth={500} noPadding={Platform.OS !== 'web'}>
                            <View style={styles.header}>
                                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                                </TouchableOpacity>

                                <Text style={styles.logo}>💜</Text>
                            </View>

                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>Créer un compte</Text>
                                <Text style={styles.subtitle}>Rejoignez la communauté PluralConnect</Text>
                            </View>

                            <View style={styles.form}>
                            <ResponsiveInput
                                label="Nom du système"
                                placeholder="Le Collectif Stellaire"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="words"
                            />

                            <ResponsiveInput
                                label="Email"
                                placeholder="votre@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />

                            <ResponsiveInput
                                label="Mot de passe"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="new-password"
                            />

                            <ResponsiveInput
                                label="Confirmer le mot de passe"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoComplete="new-password"
                            />

                            <ResponsiveButton
                                title={loading ? 'Création...' : "S'inscrire"}
                                onPress={handleRegister}
                                disabled={loading}
                                loading={loading}
                                variant="primary"
                                fullWidth
                                style={styles.buttonContainer}
                            />

                            <Text style={styles.legalText}>
                                En vous inscrivant, vous acceptez nos{' '}
                                <Text
                                    style={styles.legalLink}
                                    onPress={() => setLegalModal({ visible: true, type: 'tos' })}
                                >
                                    Conditions Générales
                                </Text>
                                {' et notre '}
                                <Text
                                    style={styles.legalLink}
                                    onPress={() => setLegalModal({ visible: true, type: 'privacy' })}
                                >
                                    Politique de Confidentialité
                                </Text>.
                            </Text>

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>OU</Text>
                                <View style={styles.divider} />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, styles.googleButton]}
                                onPress={async () => {
                                    setLoading(true);
                                    const { error } = await signInWithGoogle();
                                    setLoading(false);
                                    if (error) {
                                        Alert.alert("Erreur Google", error.message);
                                    } else {
                                        router.replace('/(tabs)/dashboard');
                                    }
                                }}
                                disabled={loading}
                            >
                                <Text style={[styles.buttonText, styles.googleButtonText]}>S&apos;inscrire avec Google</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Déjà un compte ?</Text>
                                <Link href="/(auth)/login" asChild>
                                    <TouchableOpacity>
                                        <Text style={styles.link}>Se connecter</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                        </WebContainer>
                    </ScrollView>
                </KeyboardAvoidingView>

                <LegalModal
                    visible={legalModal.visible}
                    type={legalModal.type}
                    onClose={() => setLegalModal({ visible: false, type: null })}
                />
            </PlatformSafeView>
        </DismissKeyboard>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        height: 50,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: spacing.lg,
        padding: spacing.xs,
        zIndex: 10,
    },
    logo: {
        fontSize: 40,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    form: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    button: {
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.primary,
    },
    buttonText: {
        color: colors.textOnPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.lg,
        gap: spacing.xs,
    },
    footerText: {
        ...typography.bodySmall,
    },
    link: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginHorizontal: spacing.md,
    },
    googleButton: {
        backgroundColor: colors.backgroundLight,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 0,
    },
    googleButtonText: {
        color: colors.text,
    },
    legalText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
        lineHeight: 20,
    },
    legalLink: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});