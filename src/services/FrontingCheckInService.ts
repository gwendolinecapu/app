/**
 * FrontingCheckInService.ts
 * Service de rappel périodique pour demander qui est en front
 * 
 * - Envoie une notification toutes les X heures (configurable)
 * - Utilise le Dynamic Island si disponible (iPhone 14 Pro+)
 * - Sinon, envoie une notification classique avec actions rapides
 * - L'utilisateur peut choisir l'alter en front rapidement
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import DynamicIslandService from './DynamicIslandService';

const STORAGE_KEYS = {
    ENABLED: '@fronting_checkin_enabled',
    INTERVAL_HOURS: '@fronting_checkin_interval',
    LAST_CHECKIN: '@fronting_checkin_last',
    NOTIFICATION_ID: '@fronting_checkin_notification_id',
};

// Intervalle par défaut : 4 heures
const DEFAULT_INTERVAL_HOURS = 4;

export interface CheckInSettings {
    enabled: boolean;
    intervalHours: number;
    quietHoursStart?: number; // ex: 22 (22h)
    quietHoursEnd?: number;   // ex: 8 (8h)
}

class FrontingCheckInService {
    private static instance: FrontingCheckInService;
    private notificationId: string | null = null;

    private constructor() { }

    static getInstance(): FrontingCheckInService {
        if (!FrontingCheckInService.instance) {
            FrontingCheckInService.instance = new FrontingCheckInService();
        }
        return FrontingCheckInService.instance;
    }

    /**
     * Initialise le service et configure les notifications
     */
    async initialize(): Promise<void> {
        // Configurer le handler de notification
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
        });

        // Configurer les catégories de notification avec actions
        if (Platform.OS === 'ios') {
            await Notifications.setNotificationCategoryAsync('fronting_checkin', [
                {
                    identifier: 'open_app',
                    buttonTitle: 'Choisir',
                    options: { opensAppToForeground: true },
                },
                {
                    identifier: 'same_fronter',
                    buttonTitle: 'Même fronter',
                    options: { opensAppToForeground: false },
                },
            ]);
        }

        // Écouter les réponses aux notifications
        Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);

        // Démarrer la planification si activé
        const settings = await this.getSettings();
        if (settings.enabled) {
            await this.scheduleNextCheckIn();
        }

        console.log('[FrontingCheckIn] Service initialized');
    }

    /**
     * Active ou désactive les check-ins
     */
    async setEnabled(enabled: boolean): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, JSON.stringify(enabled));

        if (enabled) {
            await this.scheduleNextCheckIn();
        } else {
            await this.cancelAllCheckIns();
        }
    }

    /**
     * Configure l'intervalle entre les check-ins
     */
    async setIntervalHours(hours: number): Promise<void> {
        const validHours = Math.max(1, Math.min(24, hours)); // Entre 1 et 24h
        await AsyncStorage.setItem(STORAGE_KEYS.INTERVAL_HOURS, JSON.stringify(validHours));

        // Reprogrammer avec le nouvel intervalle
        const settings = await this.getSettings();
        if (settings.enabled) {
            await this.cancelAllCheckIns();
            await this.scheduleNextCheckIn();
        }
    }

    /**
     * Récupère les paramètres actuels
     */
    async getSettings(): Promise<CheckInSettings> {
        try {
            const [enabledStr, intervalStr] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.ENABLED),
                AsyncStorage.getItem(STORAGE_KEYS.INTERVAL_HOURS),
            ]);

            return {
                enabled: enabledStr ? JSON.parse(enabledStr) : true, // Activé par défaut
                intervalHours: intervalStr ? JSON.parse(intervalStr) : DEFAULT_INTERVAL_HOURS,
                quietHoursStart: 22,
                quietHoursEnd: 8,
            };
        } catch (error) {
            return { enabled: true, intervalHours: DEFAULT_INTERVAL_HOURS };
        }
    }

    /**
     * Planifie le prochain check-in
     */
    async scheduleNextCheckIn(): Promise<void> {
        const settings = await this.getSettings();
        if (!settings.enabled) return;

        // Annuler les notifications précédentes
        await this.cancelAllCheckIns();

        // Calculer le prochain trigger
        const trigger = this.calculateNextTriggerTime(settings);

        try {
            // Planifier la notification récurrente
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎭 Qui est en front ?',
                    body: "C'est l'heure du check-in ! Dites-nous qui est présent.",
                    data: { type: 'fronting_checkin' },
                    categoryIdentifier: 'fronting_checkin',
                    sound: 'default',
                },
                trigger: {
                    seconds: settings.intervalHours * 3600,
                    repeats: true,
                },
            });

            this.notificationId = notificationId;
            await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ID, notificationId);

            console.log(`[FrontingCheckIn] Scheduled every ${settings.intervalHours}h`);
        } catch (error) {
            console.error('[FrontingCheckIn] Failed to schedule:', error);
        }
    }

    /**
     * Envoie un check-in immédiat (pour test ou demande manuelle)
     */
    async sendImmediateCheckIn(): Promise<void> {
        // Vérifier si Dynamic Island est disponible
        const dynamicIslandAvailable = await DynamicIslandService.checkAvailability();

        if (dynamicIslandAvailable.available && dynamicIslandAvailable.enabled) {
            // Utiliser le Dynamic Island avec une animation spéciale
            // (Le Dynamic Island affichera un message "Qui est en front ?")
            await this.showDynamicIslandCheckIn();
        } else {
            // Envoyer une notification classique
            await this.sendCheckInNotification();
        }
    }

    /**
     * Affiche le check-in dans le Dynamic Island
     */
    private async showDynamicIslandCheckIn(): Promise<void> {
        // Utiliser un état spécial pour le check-in
        await DynamicIslandService.startFronterActivity({
            name: '❓ Qui est là ?',
            initial: '?',
            color: '#8B5CF6',
            coFronterCount: 0,
            isCoFront: false,
            systemName: 'Check-in',
        });

        // Ouvrir l'app pour la sélection
        setTimeout(() => {
            Linking.openURL('pluralconnect://checkin');
        }, 2000);
    }

    /**
     * Envoie une notification de check-in
     */
    private async sendCheckInNotification(): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🎭 Qui est en front ?',
                body: "Appuyez pour indiquer qui est présent maintenant.",
                data: { type: 'fronting_checkin', immediate: true },
                categoryIdentifier: 'fronting_checkin',
                sound: 'default',
            },
            trigger: null, // Immédiat
        });
    }

    /**
     * Gère la réponse à une notification
     */
    private handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data;

        if (data?.type !== 'fronting_checkin') return;

        const actionId = response.actionIdentifier;

        if (actionId === 'same_fronter') {
            // L'utilisateur confirme que c'est le même fronter
            await this.recordCheckIn({ confirmed: true, changed: false });
            console.log('[FrontingCheckIn] Same fronter confirmed');
        } else {
            // Ouvrir l'app pour sélectionner
            Linking.openURL('pluralconnect://checkin');
        }
    };

    /**
     * Enregistre un check-in
     */
    async recordCheckIn(data: { confirmed: boolean; changed: boolean; newAlterId?: string }): Promise<void> {
        const now = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKIN, now);

        // Ici, on pourrait aussi enregistrer l'historique des check-ins
        console.log('[FrontingCheckIn] Check-in recorded:', data);
    }

    /**
     * Annule tous les check-ins programmés
     */
    async cancelAllCheckIns(): Promise<void> {
        try {
            const storedId = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ID);
            if (storedId) {
                await Notifications.cancelScheduledNotificationAsync(storedId);
            }

            // Annuler toutes les notifications de ce type
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notif of scheduled) {
                if (notif.content.data?.type === 'fronting_checkin') {
                    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                }
            }

            this.notificationId = null;
            await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_ID);
        } catch (error) {
            console.error('[FrontingCheckIn] Failed to cancel:', error);
        }
    }

    /**
     * Calcule le prochain moment de déclenchement (évite les heures de nuit)
     */
    private calculateNextTriggerTime(settings: CheckInSettings): Date {
        const now = new Date();
        const next = new Date(now.getTime() + settings.intervalHours * 3600 * 1000);

        // Vérifier les heures calmes
        const hour = next.getHours();
        if (settings.quietHoursStart && settings.quietHoursEnd) {
            if (hour >= settings.quietHoursStart || hour < settings.quietHoursEnd) {
                // Reporter au matin
                next.setHours(settings.quietHoursEnd, 0, 0, 0);
                if (next <= now) {
                    next.setDate(next.getDate() + 1);
                }
            }
        }

        return next;
    }

    /**
     * Obtient le dernier check-in
     */
    async getLastCheckIn(): Promise<Date | null> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECKIN);
            return stored ? new Date(stored) : null;
        } catch {
            return null;
        }
    }
}

// Export singleton
export default FrontingCheckInService.getInstance();
