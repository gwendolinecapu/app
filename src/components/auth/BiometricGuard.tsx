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
    const { user } = useAuth();
    const [isLocked, setIsLocked] = useState(false); // Default to false, lock only if auth'd and necessary
    const [hasHardware, setHasHardware] = useState(false);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        checkHardware();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App came to foreground
                if (user) {
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
            // Fallback if hardware isn't available but we are locked? 
            // Ideally we shouldn't lock if no hardware, but let's be safe.
            setIsLocked(false);
            return;
        }

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
            } else {
                // Keep locked or Retry?
                // setIsLocked(true); 
            }
        } catch (error) {
            console.error('Biometric auth error', error);
            setIsLocked(false); // Fail open or closed? Closed for security, but fail open for avoiding lockouts due to bugs?
            // For now, fail open if it's a technical error to avoid blocking user.
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
