import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext'; // To verify if user is logged in

interface BiometricGuardProps {
    children: React.ReactNode;
}

export function BiometricGuard({ children }: BiometricGuardProps) {
    const { user, isBiometricEnabled } = useAuth();
    const [isLocked, setIsLocked] = useState(false);
    const [hasHardware, setHasHardware] = useState(false);
    const appState = useRef(AppState.currentState);
    const isAuthenticating = useRef(false);

    useEffect(() => {
        checkHardware();

        const subscription = AppState.addEventListener('change', nextAppState => {
            // FIX: Only trigger logic if coming from BACKGROUND.
            // Biometric prompt matches "inactive", so inactive -> active transition causes loop.
            // We strictly want to lock only when the app was fully backgrounded.
            if (
                appState.current.match(/background/) &&
                nextAppState === 'active'
            ) {
                if (user && !isAuthenticating.current && isBiometricEnabled) {
                    authenticate();
                }
            }
            appState.current = nextAppState;
        });

        // Initial check on mount if user is already logged in
        if (user) {
            authenticate();
        }

        return () => {
            subscription.remove();
        };
    }, [user]);

    const checkHardware = async () => {
        const hasHard = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setHasHardware(hasHard && isEnrolled);
    };

    const authenticate = async () => {
        if (!hasHardware && isLocked) {
            setIsLocked(false);
            return;
        }

        if (isAuthenticating.current) return;

        isAuthenticating.current = true;
        setIsLocked(true);

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authentification requise',
                fallbackLabel: 'Utiliser le code',
                disableDeviceFallback: false,
                cancelLabel: 'Annuler',
            });

            if (result.success) {
                setIsLocked(false);
            }
        } catch (error) {
            console.error('Biometric auth error', error);
            setIsLocked(false);
        } finally {
            // Small delay to prevent fluttering state re-trigger
            setTimeout(() => {
                isAuthenticating.current = false;
            }, 500);
        }
    };

    if (isLocked && user) {
        return (
            <View style={styles.container}>
                <Ionicons name="lock-closed" size={64} color={colors.primary} />
                <Text style={styles.title}>Verrouillé</Text>
                <Text style={styles.subtitle} onPress={authenticate}>
                    Touchez pour déverrouiller
                </Text>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        marginTop: 24,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 12,
        textDecorationLine: 'underline',
    },
});
