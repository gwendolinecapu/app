import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { DismissKeyboard } from '../../src/components/ui/DismissKeyboard';
import { WebContainer } from '../../src/components/ui/WebContainer';
import { ResponsiveInput } from '../../src/components/ui/ResponsiveInput';
import { ResponsiveButton } from '../../src/components/ui/ResponsiveButton';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
            return;
        }



        setLoading(true);
        const { error } = await signIn(trimmedEmail, trimmedPassword);
        setLoading(false);

        if (error) {
            console.error('Login error:', error.message);
            Alert.alert('Erreur', error.message);
        } else {
            router.replace('/(tabs)/dashboard');
        }
    };

    return (
        <DismissKeyboard>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <WebContainer maxWidth={500} noPadding={Platform.OS !== 'web'}>
                        <View style={styles.header}>
                            <Image
                                source={require('../../assets/adaptive-icon.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>PluralConnect</Text>
                            <Text style={styles.subtitle}>Un espace safe pour votre propre système</Text>
                        </View>

                        <View style={styles.form}>
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
                        autoComplete="password"
                    />

                    <ResponsiveButton
                        title={loading ? 'Connexion...' : 'Se connecter'}
                        onPress={handleLogin}
                        disabled={loading}
                        loading={loading}
                        variant="primary"
                        fullWidth
                        style={styles.buttonContainer}
                    />


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
                        <Text style={[styles.buttonText, styles.googleButtonText]}>Continuer avec Google</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Pas encore de compte ?</Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.link}>S&apos;inscrire</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
                    </WebContainer>
                </ScrollView>
            </KeyboardAvoidingView>
        </DismissKeyboard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoImage: {
        width: 80,
        height: 80,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
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
        color: colors.text,
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
});
