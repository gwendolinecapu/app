import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../lib/theme';
import { BlurView } from 'expo-blur';

// Optional import for expo-local-authentication (not available in Expo Go)
let LocalAuthentication: any = null;
try {
    LocalAuthentication = require('expo-local-authentication');
} catch (e) {
    console.log('[SecureContainer] expo-local-authentication not available (Expo Go mode)');
}

interface SecureContainerProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    autoPrompt?: boolean;
    onUnlock?: () => void;
}

export const SecureContainer: React.FC<SecureContainerProps> = ({
    children,
    title = "Contenu Privé",
    subtitle = "Authentification requise pour accéder à cet espace",
    autoPrompt = true,
    onUnlock
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasHardware, setHasHardware] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        checkHardware();
    }, []);

    const checkHardware = async () => {
        // If LocalAuthentication is not available (Expo Go), auto-unlock
        if (!LocalAuthentication) {
            console.log('[SecureContainer] No LocalAuthentication, auto-unlocking for dev');
            setIsAuthenticated(true);
            if (onUnlock) onUnlock();
            return;
        }

        const compatible = await LocalAuthentication.hasHardwareAsync();
        setHasHardware(compatible);

        if (compatible) {
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setIsEnrolled(enrolled);

            if (enrolled && autoPrompt) {
                authenticate();
            }
        }
    };

    const authenticate = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authentification requise',
                fallbackLabel: 'Utiliser le code secret',
                cancelLabel: 'Annuler',
                disableDeviceFallback: false,
            });

            if (result.success) {
                setIsAuthenticated(true);
                if (onUnlock) onUnlock();
            } else {
                // Keep locked if failed
                if (result.error !== 'user_cancel') {
                    Alert.alert('Echec', 'Authentification échouée');
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'authentification');
        }
    };

    // If no hardware or not enrolled, we might want to allow access or fallback to something else.
    // For now, if no security exists on device, we warn but allow? 
    // Or strictly block? STRICT for "Private Vault".
    // But for dev, we might want to bypass if no hardware (simulator).
    const handleNoSecurity = () => {
        Alert.alert(
            "Sécurité non configurée",
            "Votre appareil n'a pas de sécurité biométrique configurée. Le contenu sera déverrouillé.",
            [{ text: "OK", onPress: () => setIsAuthenticated(true) }]
        );
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.lockContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={48} color={colors.primary} />
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        if (hasHardware && isEnrolled) {
                            authenticate();
                        } else {
                            handleNoSecurity();
                        }
                    }}
                >
                    <Ionicons name="finger-print" size={24} color={colors.textOnPrimary} style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Déverrouiller</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    lockContainer: {
        alignItems: 'center',
        maxWidth: 300,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${colors.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        ...typography.button,
        color: colors.textOnPrimary,
    },
});
