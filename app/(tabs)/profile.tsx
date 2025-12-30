import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/lib/theme';

/**
 * ProfileScreen - Redirige vers l'Alter Space du currentAlter
 * 
 * Cette page existe uniquement pour la compatibilité avec les anciennes navigations.
 * Le profil principal est maintenant dans l'Alter Space avec l'onglet 'profile'.
 */
export default function ProfileScreen() {
    const { currentAlter } = useAuth();

    useEffect(() => {
        // Rediriger vers l'alter space du currentAlter avec l'onglet profile
        if (currentAlter) {
            router.replace(`/alter-space/${currentAlter.id}?tab=profile`);
        } else {
            // Si pas d'alter sélectionné, aller au dashboard
            router.replace('/(tabs)/dashboard');
        }
    }, [currentAlter]);

    // Afficher un loader pendant la redirection
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
