/**
 * NotificationService.ts
 * Service principal pour gérer toutes les notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    NotificationType,
    NotificationSettings,
    NotificationPreference,
    NotificationFrequency,
    NOTIFICATION_CONFIGS,
    FREQUENCY_MS,
    AFFIRMATION_MESSAGES,
} from './NotificationTypes';

// Clé de stockage
const SETTINGS_KEY = '@notification_settings';

// Configuration par défaut
const DEFAULT_SETTINGS: NotificationSettings = {
    globalEnabled: true,
    persistentNotification: false,
    dynamicIslandEnabled: false,
    quietHoursEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    preferences: NOTIFICATION_CONFIGS.map(config => ({
        type: config.id,
        enabled: config.defaultEnabled,
        frequency: config.defaultFrequency || 'daily',
    })),
};

class NotificationService {
    private static instance: NotificationService;
    private settings: NotificationSettings = DEFAULT_SETTINGS;
    private scheduledIds: Map<NotificationType, string[]> = new Map();

    private constructor() {
        this.initialize();
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initialise le service, charge les préférences et demande les permissions.
     */
    async initialize(): Promise<void> {
        // Configurer le comportement des notifications
        if (Platform.OS !== 'web') {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        }

        // Charger les settings
        await this.loadSettings();

        // Demander les permissions
        if (Device.isDevice) {
            await this.requestPermissions();
        }

        // Configurer les catégories d'actions
        await this.setupNotificationCategories();

        // Programmer les notifications
        if (this.settings.globalEnabled) {
            await this.scheduleAllNotifications();
        }


    }

    /**
     * Demande les permissions de notification à l'utilisateur.
     * @returns true si accordé, false sinon.
     */
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        // Web Platform Safety Check
        if (Platform.OS === 'web') {
            return true; // Assume granted or handle via browser API if needed, but avoid blocking
        }

        if (finalStatus !== 'granted') {
            console.warn('[NotificationService] Permission not granted');
            return false;
        }

        // Configuration spécifique Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'PluralConnect',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#8B5CF6',
            });

            // Canal pour notifications persistantes
            await Notifications.setNotificationChannelAsync('persistent', {
                name: 'Sélection Alter',
                importance: Notifications.AndroidImportance.LOW,
                vibrationPattern: [0],
            });
        }

        return true;
    }

    // ==================== SETTINGS ====================

    /**
     * Charge les paramètres de notification depuis le stockage local.
     */
    async loadSettings(): Promise<NotificationSettings> {
        try {
            const stored = await AsyncStorage.getItem(SETTINGS_KEY);
            if (stored) {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('[NotificationService] Failed to load settings:', error);
        }
        return this.settings;
    }

    /**
     * Sauvegarde les paramètres et reprogramme les notifications.
     */
    async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
        this.settings = { ...this.settings, ...settings };
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
            // Reprogrammer les notifications
            await this.scheduleAllNotifications();
        } catch (error) {
            console.error('[NotificationService] Failed to save settings:', error);
        }
    }

    /**
     * Retourne les paramètres actuels.
     */
    getSettings(): NotificationSettings {
        return this.settings;
    }

    /**
     * Met à jour une préférence de notification spécifique.
     */
    async updatePreference(
        type: NotificationType,
        updates: Partial<NotificationPreference>
    ): Promise<void> {
        const index = this.settings.preferences.findIndex(p => p.type === type);
        if (index >= 0) {
            this.settings.preferences[index] = {
                ...this.settings.preferences[index],
                ...updates,
            };
            await this.saveSettings({ preferences: this.settings.preferences });
        }
    }

    // ==================== SCHEDULING ====================

    /**
     * Programme toutes les notifications activées selon les fréquences définies.
     */
    async scheduleAllNotifications(): Promise<void> {
        if (Platform.OS === 'web') return;

        // Annuler toutes les notifications existantes
        await Notifications.cancelAllScheduledNotificationsAsync();
        this.scheduledIds.clear();

        if (!this.settings.globalEnabled) return;

        for (const pref of this.settings.preferences) {
            if (pref.enabled) {
                await this.scheduleNotification(pref);
            }
        }


    }

    private async scheduleNotification(pref: NotificationPreference): Promise<void> {
        const config = NOTIFICATION_CONFIGS.find(c => c.id === pref.type);
        if (!config || !config.isLocal) return;

        const frequency = pref.frequency;
        const intervalMs = FREQUENCY_MS[frequency];

        if (intervalMs === 0 && frequency !== 'custom') return;

        try {
            // Calculer le trigger
            let trigger: Notifications.NotificationTriggerInput;

            if (frequency === 'daily') {
                // Notification quotidienne à une heure fixe
                const hour = this.getNotificationHour(pref.type);
                trigger = {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute: 0,
                };
            } else if (frequency === 'twice_daily') {
                // Deux notifications par jour
                await this.scheduleTwiceDaily(pref, config);
                return;
            } else if (frequency === 'custom' && pref.customHours) {
                // Heures personnalisées
                await this.scheduleCustomHours(pref, config);
                return;
            } else {
                // Intervalle régulier
                trigger = {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: intervalMs / 1000,
                    repeats: true,
                };
            }

            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: this.processBody(config.body, {}),
                    sound: true,
                    priority: config.priority === 'high'
                        ? Notifications.AndroidNotificationPriority.HIGH
                        : Notifications.AndroidNotificationPriority.DEFAULT,
                    categoryIdentifier: config.category,
                },
                trigger,
            });

            this.scheduledIds.set(pref.type, [id]);
        } catch (error) {
            console.error(`[NotificationService] Failed to schedule ${pref.type}:`, error);
        }
    }

    private async scheduleTwiceDaily(
        pref: NotificationPreference,
        config: any
    ): Promise<void> {
        const ids: string[] = [];
        const hours = [9, 20]; // 9h et 20h

        for (const hour of hours) {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: config.body,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute: 0,
                },
            });
            ids.push(id);
        }

        this.scheduledIds.set(pref.type, ids);
    }

    private async scheduleCustomHours(
        pref: NotificationPreference,
        config: any
    ): Promise<void> {
        if (!pref.customHours) return;

        const ids: string[] = [];

        for (const hour of pref.customHours) {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: config.body,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour,
                    minute: 0,
                },
            });
            ids.push(id);
        }

        this.scheduledIds.set(pref.type, ids);
    }

    private getNotificationHour(type: NotificationType): number {
        switch (type) {
            case 'morning_checkin':
                return 9;
            case 'journal_reminder':
                return 20;
            case 'daily_affirmation':
                return 8;
            default:
                return 12;
        }
    }

    // ==================== IMMEDIATE NOTIFICATIONS ====================

    /**
     * Envoie une notification immédiate (one-shot).
     */
    async sendImmediateNotification(
        type: NotificationType,
        variables: Record<string, string> = {}
    ): Promise<string | null> {
        const config = NOTIFICATION_CONFIGS.find(c => c.id === type);
        if (!config || Platform.OS === 'web') return null;

        // Vérifier les heures calmes
        if (this.isQuietHours()) {
            return null;
        }

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: this.processBody(config.title, variables),
                    body: this.processBody(config.body, variables),
                    sound: true,
                    categoryIdentifier: config.category,
                },
                trigger: null, // Immédiat
            });

            return id;
        } catch (error) {
            console.error('[NotificationService] Failed to send immediate notification:', error);
            return null;
        }
    }

    /**
     * Envoie une affirmation positive aléatoire.
     */
    async sendAffirmation(): Promise<void> {
        if (Platform.OS === 'web') return;

        const message = AFFIRMATION_MESSAGES[
            Math.floor(Math.random() * AFFIRMATION_MESSAGES.length)
        ];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '💜',
                body: message,
                categoryIdentifier: 'wellness',
            },
            trigger: null,
        });
    }

    // ==================== CATEGORIES & ACTIONS ====================

    private async setupNotificationCategories(): Promise<void> {
        if (Platform.OS === 'web') return;

        await Notifications.setNotificationCategoryAsync('front', [
            {
                identifier: 'switch_front',
                buttonTitle: 'Changer',
                options: { opensAppToForeground: true },
            },
            {
                identifier: 'dismiss',
                buttonTitle: 'Plus tard',
                options: { isDestructive: true },
            },
        ]);

        await Notifications.setNotificationCategoryAsync('mood', [
            {
                identifier: 'record_mood',
                buttonTitle: 'Enregistrer',
                options: { opensAppToForeground: true },
            },
        ]);

        await Notifications.setNotificationCategoryAsync('journal', [
            {
                identifier: 'write_journal',
                buttonTitle: 'Écrire',
                options: { opensAppToForeground: true },
            },
        ]);
    }

    // ==================== HELPERS ====================

    private processBody(template: string, variables: Record<string, string>): string {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(`{${key}}`, value);
        }
        return result;
    }

    private isQuietHours(): boolean {
        if (!this.settings.quietHoursEnabled) return false;

        const now = new Date();
        const hour = now.getHours();
        const { quietHoursStart, quietHoursEnd } = this.settings;

        if (quietHoursStart < quietHoursEnd) {
            return hour >= quietHoursStart || hour < quietHoursEnd;
        } else {
            return hour >= quietHoursStart && hour < quietHoursEnd;
        }
    }

    // ==================== LISTENERS ====================

    /**
     * Ajoute un écouteur pour les notifications reçues au premier plan.
     */
    addNotificationReceivedListener(
        callback: (notification: Notifications.Notification) => void
    ): Notifications.EventSubscription | null {
        if (Platform.OS === 'web') return null;
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Ajoute un écouteur pour les réponses aux notifications (clic).
     */
    addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ): Notifications.EventSubscription | null {
        if (Platform.OS === 'web') return null;
        return Notifications.addNotificationResponseReceivedListener(callback);
    }
}

export default NotificationService.getInstance();
