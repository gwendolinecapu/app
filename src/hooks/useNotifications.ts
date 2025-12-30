/**
 * useNotifications.ts
 * Hook pour gérer les notifications dans l'app
 */

import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import NotificationService from '../services/NotificationService';
import {
    NotificationSettings,
    NotificationType,
    NotificationPreference,
    NotificationFrequency,
} from '../services/NotificationTypes';

export function useNotifications() {
    const router = useRouter();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Charger les settings au montage
    useEffect(() => {
        loadSettings();
    }, []);

    // Écouter les réponses aux notifications
    useEffect(() => {
        const subscription = NotificationService.addNotificationResponseListener(
            (response) => {
                const { actionIdentifier, notification } = response;
                const category = notification.request.content.categoryIdentifier;



                // Router vers l'écran approprié
                switch (actionIdentifier) {
                    case 'switch_front':
                        router.push('/' as any);
                        break;
                    case 'record_mood':
                        router.push('/emotions/history' as any);
                        break;
                    case 'write_journal':
                        router.push('/journal/create' as any);
                        break;
                    default:
                        // Tap sur la notification elle-même
                        handleNotificationTap(category);
                }
            }
        );

        return () => subscription.remove();
    }, [router]);

    const loadSettings = async () => {
        try {
            const loaded = await NotificationService.loadSettings();
            setSettings(loaded);
        } catch (error) {
            console.error('[useNotifications] Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationTap = (category?: string | null) => {
        switch (category) {
            case 'front':
                router.push('/' as any);
                break;
            case 'mood':
                router.push('/emotions/history' as any);
                break;
            case 'journal':
                router.push('/journal' as any);
                break;
            case 'social':
                router.push('/discover/index' as any);
                break;
            default:
                router.push('/' as any);
        }
    };

    // Activer/désactiver globalement
    const setGlobalEnabled = useCallback(async (enabled: boolean) => {
        await NotificationService.saveSettings({ globalEnabled: enabled });
        setSettings(prev => prev ? { ...prev, globalEnabled: enabled } : null);
    }, []);

    // Activer/désactiver la notification persistante
    const setPersistentNotification = useCallback(async (enabled: boolean) => {
        await NotificationService.saveSettings({ persistentNotification: enabled });
        setSettings(prev => prev ? { ...prev, persistentNotification: enabled } : null);
    }, []);

    // Activer/désactiver Dynamic Island
    const setDynamicIslandEnabled = useCallback(async (enabled: boolean) => {
        await NotificationService.saveSettings({ dynamicIslandEnabled: enabled });
        setSettings(prev => prev ? { ...prev, dynamicIslandEnabled: enabled } : null);
    }, []);

    // Modifier les heures calmes
    const setQuietHours = useCallback(async (
        enabled: boolean,
        start?: number,
        end?: number
    ) => {
        await NotificationService.saveSettings({
            quietHoursEnabled: enabled,
            ...(start !== undefined && { quietHoursStart: start }),
            ...(end !== undefined && { quietHoursEnd: end }),
        });
        setSettings(prev => prev ? {
            ...prev,
            quietHoursEnabled: enabled,
            ...(start !== undefined && { quietHoursStart: start }),
            ...(end !== undefined && { quietHoursEnd: end }),
        } : null);
    }, []);

    // Modifier une préférence
    const updatePreference = useCallback(async (
        type: NotificationType,
        updates: Partial<NotificationPreference>
    ) => {
        await NotificationService.updatePreference(type, updates);
        if (settings) {
            const newPreferences = settings.preferences.map(p =>
                p.type === type ? { ...p, ...updates } : p
            );
            setSettings({ ...settings, preferences: newPreferences });
        }
    }, [settings]);

    // Toggle une notification
    const toggleNotification = useCallback(async (type: NotificationType) => {
        if (!settings) return;
        const pref = settings.preferences.find(p => p.type === type);
        if (pref) {
            await updatePreference(type, { enabled: !pref.enabled });
        }
    }, [settings, updatePreference]);

    // Changer la fréquence
    const setFrequency = useCallback(async (
        type: NotificationType,
        frequency: NotificationFrequency
    ) => {
        await updatePreference(type, { frequency });
    }, [updatePreference]);

    // Envoyer une notification immédiate
    const sendNotification = useCallback(async (
        type: NotificationType,
        variables?: Record<string, string>
    ) => {
        return NotificationService.sendImmediateNotification(type, variables);
    }, []);

    // Envoyer un message d'affirmation
    const sendAffirmation = useCallback(async () => {
        await NotificationService.sendAffirmation();
    }, []);

    return {
        settings,
        loading,
        setGlobalEnabled,
        setPersistentNotification,
        setDynamicIslandEnabled,
        setQuietHours,
        updatePreference,
        toggleNotification,
        setFrequency,
        sendNotification,
        sendAffirmation,
    };
}

export default useNotifications;
