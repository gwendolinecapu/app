/**
 * NotificationContext.tsx
 * Context global pour les notifications
 * Intègre NotificationService, PersistentNotification, et Dynamic Island
 */

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import NotificationService from '../services/NotificationService';
import PersistentNotificationService from '../services/PersistentNotificationService';
import DynamicIslandService from '../services/DynamicIslandService';
import {
    NotificationSettings,
    NotificationType,
    NotificationPreference,
    NotificationFrequency,
} from '../services/NotificationTypes';
import { Alter } from '../types';

// Types pour le front
interface FrontData {
    type: 'single' | 'co-front' | 'blurry';
    alterIds: string[];
    timestamp: number;
}

interface NotificationContextType {
    // Settings
    settings: NotificationSettings | null;
    loading: boolean;

    // Global
    setGlobalEnabled: (enabled: boolean) => Promise<void>;

    // Persistent Notification
    setPersistentEnabled: (enabled: boolean) => Promise<void>;
    isPersistentActive: boolean;

    // Dynamic Island
    setDynamicIslandEnabled: (enabled: boolean) => Promise<void>;
    isDynamicIslandActive: boolean;
    isDynamicIslandSupported: boolean;

    // Quiet Hours
    setQuietHours: (enabled: boolean, start?: number, end?: number) => Promise<void>;

    // Preferences
    toggleNotification: (type: NotificationType) => Promise<void>;
    setFrequency: (type: NotificationType, frequency: NotificationFrequency) => Promise<void>;

    // Actions
    sendNotification: (type: NotificationType, variables?: Record<string, string>) => Promise<void>;
    sendAffirmation: () => Promise<void>;

    // Front sync
    updateFrontData: (front: FrontData, alters: Alter[], favoriteIds?: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const router = useRouter();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPersistentActive, setIsPersistentActive] = useState(false);
    const [isDynamicIslandActive, setIsDynamicIslandActive] = useState(false);

    // ==================== INITIALIZATION ====================

    useEffect(() => {
        initializeNotifications();
    }, []);

    const initializeNotifications = async () => {
        try {
            // Charger les settings
            // Charger les settings
            const loadedSettings = await NotificationService.loadSettings();
            if (loadedSettings) {
                setSettings(loadedSettings);
            } else {
                // Initialize defaults if null
                const defaults: NotificationSettings = {
                    globalEnabled: true,
                    quietHoursEnabled: false,
                    persistentNotification: false,
                    dynamicIslandEnabled: false,
                    quietHoursStart: 22 * 60, // 22:00
                    quietHoursEnd: 7 * 60, // 07:00
                    preferences: [] // Service handles defaults
                };
                setSettings(defaults);
            }

            // Setup notification response listener
            const subscription = Notifications.addNotificationResponseReceivedListener(
                handleNotificationResponse
            );

            setLoading(false);
            return () => subscription.remove();
        } catch (error) {
            console.error('[NotificationProvider] Init error:', error);
            setLoading(false);
        }
    };

    // ==================== NOTIFICATION RESPONSE HANDLER ====================

    const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
        const { actionIdentifier, notification } = response;
        const category = notification.request.content.categoryIdentifier;
        const data = notification.request.content.data;



        // Vérifier si c'est une action de la notification persistante
        const alterId = PersistentNotificationService.handleAction(actionIdentifier);
        if (alterId) {
            // Switch vers l'alter
            router.push(`/alter/${alterId}?switch=true`);
            return;
        }

        // Router selon la catégorie
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
                // Tap simple sur la notification
                if (category === 'front') router.push('/' as any);
                else if (category === 'mood') router.push('/emotions/history' as any);
                else if (category === 'journal') router.push('/journal' as any);
                else if (category === 'social') router.push('/discover/index' as any);
                else router.push('/' as any);
        }
    }, [router]);

    // ==================== SETTINGS METHODS ====================

    const setGlobalEnabled = useCallback(async (enabled: boolean) => {
        if (!settings) return;
        setSettings({ ...settings, globalEnabled: enabled });
        await NotificationService.saveSettings({ globalEnabled: enabled });
    }, []);

    const setPersistentEnabled = useCallback(async (enabled: boolean) => {
        if (!settings) return;
        setSettings({ ...settings, persistentNotification: enabled });
        await NotificationService.saveSettings({ persistentNotification: enabled });

        if (!enabled) {
            await PersistentNotificationService.stop();
            setIsPersistentActive(false);
        }
    }, []);

    const setDynamicIslandEnabled = useCallback(async (enabled: boolean) => {
        await NotificationService.saveSettings({ dynamicIslandEnabled: enabled });
        setSettings(prev => prev ? { ...prev, dynamicIslandEnabled: enabled } : null);
        await DynamicIslandService.setEnabled(enabled);

        if (!enabled) {
            await DynamicIslandService.stop();
            setIsDynamicIslandActive(false);
        }
    }, []);

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

    const toggleNotification = useCallback(async (type: NotificationType) => {
        if (!settings) return;
        const pref = settings.preferences.find(p => p.type === type);
        if (pref) {
            await NotificationService.updatePreference(type, { enabled: !pref.enabled });
            const newPreferences = settings.preferences.map(p =>
                p.type === type ? { ...p, enabled: !pref.enabled } : p
            );
            setSettings({ ...settings, preferences: newPreferences });
        }
    }, [settings]);

    const setFrequency = useCallback(async (
        type: NotificationType,
        frequency: NotificationFrequency
    ) => {
        await NotificationService.updatePreference(type, { frequency });
        if (settings) {
            const newPreferences = settings.preferences.map(p =>
                p.type === type ? { ...p, frequency } : p
            );
            setSettings({ ...settings, preferences: newPreferences });
        }
    }, [settings]);

    // ==================== ACTION METHODS ====================

    const sendNotification = useCallback(async (
        type: NotificationType,
        variables?: Record<string, string>
    ) => {
        await NotificationService.sendImmediateNotification(type, variables);
    }, []);

    const sendAffirmation = useCallback(async () => {
        await NotificationService.sendAffirmation();
    }, []);

    // ==================== FRONT SYNC ====================

    const updateFrontData = useCallback(async (
        front: FrontData,
        alters: Alter[],
        favoriteIds: string[] = []
    ) => {
        if (!settings) return;

        const getAlter = (id: string) => alters.find(a => a.id === id);
        const getInitial = (name: string) => name.charAt(0).toUpperCase();
        const getTimeSince = (timestamp: number): string => {
            const diff = Date.now() - timestamp;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            return hours > 0 ? `${hours}h${minutes % 60}min` : `${minutes}min`;
        };

        const firstAlter = getAlter(front.alterIds[0]);
        if (!firstAlter) return;

        // Mise à jour notification persistante
        if (settings.persistentNotification) {
            const favoriteAlters = favoriteIds
                .slice(0, 9)
                .map(id => getAlter(id))
                .filter(Boolean)
                .map(alter => ({
                    id: alter!.id,
                    name: alter!.name,
                    color: alter!.color || '#8B5CF6',
                }));

            await PersistentNotificationService.update({
                currentAlterName: firstAlter.name,
                currentAlterColor: firstAlter.color || '#8B5CF6',
                favoriteAlters,
            });
            setIsPersistentActive(true);
        }

        // Mise à jour Dynamic Island
        if (settings.dynamicIslandEnabled && DynamicIslandService.isSupported()) {
            const coFronters = front.alterIds
                .slice(1)
                .map((id: string) => getAlter(id)?.name)
                .filter(Boolean) as string[];

            const data = {
                currentAlterName: firstAlter.name,
                currentAlterColor: firstAlter.color || '#8B5CF6',
                currentAlterInitial: getInitial(firstAlter.name),
                timeSinceSwitch: getTimeSince(front.timestamp),
                coFronters,
            };

            if (DynamicIslandService.getIsActive()) {
                await DynamicIslandService.update(data);
            } else {
                await DynamicIslandService.start(data);
            }
            setIsDynamicIslandActive(true);
        }
    }, [settings]);

    // ==================== CONTEXT VALUE ====================

    const value: NotificationContextType = {
        settings,
        loading,
        setGlobalEnabled,
        setPersistentEnabled,
        isPersistentActive,
        setDynamicIslandEnabled,
        isDynamicIslandActive,
        isDynamicIslandSupported: DynamicIslandService.isSupported(),
        setQuietHours,
        toggleNotification,
        setFrequency,
        sendNotification,
        sendAffirmation,
        updateFrontData,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
