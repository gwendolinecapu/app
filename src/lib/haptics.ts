import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Utilitaires pour gérer les retours haptiques uniformément dans l'application.
 * Ne fonctionne que sur les appareils physiques.
 */

export const triggerHaptic = {
    // Impact léger (ex: switch d'onglet, tap clavier)
    light: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    },

    // Impact moyen (ex: toggle, bouton d'action secondaire)
    medium: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    },

    // Impact lourd (ex: validation majeure, action destructive)
    heavy: () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    },

    // Succès (ex: formulaire envoyé, action réussie)
    success: () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    },

    // Erreur (ex: validation échouée, problème réseau)
    error: () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    },

    // Avertissement
    warning: () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    },

    // Sélection (ex: scroll picker)
    selection: () => {
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    }
};
