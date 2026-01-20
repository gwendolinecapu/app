/**
 * PersistentNotificationService.ts
 * Service pour gérer la notification persistante de sélection d'alter
 * 
 * iOS: Utilise les notifications avec actions
 * Android: Utilise un Foreground Service avec notification ongoing
 */

import * as Notifications from 'expo-notifications';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSISTENT_NOTIF_ID = 'persistent_alter_selector';
const STORAGE_KEY = '@persistent_notification_data';

interface PersistentNotificationData {
    currentAlterName: string;
    currentAlterColor: string;
    favoriteAlters: {
        id: string;
        name: string;
        color: string;
    }[];
}

class PersistentNotificationService {
    private static instance: PersistentNotificationService;
    private isActive: boolean = false;
    private data: PersistentNotificationData | null = null;

    private constructor() { }

    static getInstance(): PersistentNotificationService {
        if (!PersistentNotificationService.instance) {
            PersistentNotificationService.instance = new PersistentNotificationService();
        }
        return PersistentNotificationService.instance;
    }

    // ==================== MAIN METHODS ====================

    /**
     * Démarre la notification persistante
     */
    async start(data: PersistentNotificationData): Promise<void> {
        this.data = data;
        await this.saveData(data);

        if (Platform.OS === 'android') {
            await this.startAndroidForegroundService(data);
        } else {
            await this.startIOSPersistentNotification(data);
        }

        this.isActive = true;
    }

    /**
     * Arrête la notification persistante
     */
    async stop(): Promise<void> {
        if (Platform.OS === 'android') {
            await this.stopAndroidForegroundService();
        } else {
            await this.stopIOSPersistentNotification();
        }

        this.isActive = false;
        this.data = null;
    }

    /**
     * Met à jour la notification avec les nouvelles données
     */
    async update(data: PersistentNotificationData): Promise<void> {
        if (!this.isActive) return;

        this.data = data;
        await this.saveData(data);

        if (Platform.OS === 'android') {
            await this.updateAndroidNotification(data);
        } else {
            await this.updateIOSNotification(data);
        }


    }

    /**
     * Vérifie si la notification est active
     */
    getIsActive(): boolean {
        return this.isActive;
    }

    // ==================== iOS Implementation ====================

    private async startIOSPersistentNotification(data: PersistentNotificationData): Promise<void> {
        // Configurer la catégorie avec les actions
        await this.setupIOSCategory(data);

        // Programmer une notification qui reste visible
        await Notifications.scheduleNotificationAsync({
            identifier: PERSISTENT_NOTIF_ID,
            content: {
                title: `🔄 ${data.currentAlterName}`,
                body: 'Appuyez longuement pour changer de front',
                sound: false,
                sticky: true, // Note: iOS ne supporte pas vraiment "sticky"
                categoryIdentifier: 'persistent_alter',
                priority: Notifications.AndroidNotificationPriority.MIN,
            },
            trigger: null, // Immédiat
        });
    }

    private async setupIOSCategory(data: PersistentNotificationData): Promise<void> {
        // Créer les actions pour les alters favoris
        const actions: Notifications.NotificationAction[] = data.favoriteAlters
            .slice(0, 4) // Max 4 actions sur iOS
            .map(alter => ({
                identifier: `switch_${alter.id}`,
                buttonTitle: alter.name,
                options: {
                    opensAppToForeground: false,
                },
            }));

        // Ajouter action "Ouvrir app"
        actions.push({
            identifier: 'open_app',
            buttonTitle: "Plus d'options...",
            options: {
                opensAppToForeground: true,
            },
        });

        await Notifications.setNotificationCategoryAsync('persistent_alter', actions);
    }

    private async updateIOSNotification(data: PersistentNotificationData): Promise<void> {
        // Annuler et recréer avec les nouvelles données
        await Notifications.cancelScheduledNotificationAsync(PERSISTENT_NOTIF_ID);
        await this.setupIOSCategory(data);
        await this.startIOSPersistentNotification(data);
    }

    private async stopIOSPersistentNotification(): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(PERSISTENT_NOTIF_ID);
        await Notifications.dismissNotificationAsync(PERSISTENT_NOTIF_ID);
    }

    // ==================== Android Implementation ====================

    private async startAndroidForegroundService(data: PersistentNotificationData): Promise<void> {
        // Configurer le canal pour notifications persistantes (basse priorité)
        await Notifications.setNotificationChannelAsync('persistent', {
            name: 'Sélection Alter',
            importance: Notifications.AndroidImportance.MIN,
            vibrationPattern: [],
            enableVibrate: false,
            showBadge: false,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // Créer la notification ongoing
        await Notifications.scheduleNotificationAsync({
            identifier: PERSISTENT_NOTIF_ID,
            content: {
                title: `En front: ${data.currentAlterName}`,
                body: 'Touchez pour changer',
                sound: false,
                sticky: true,
                priority: Notifications.AndroidNotificationPriority.MIN,
                autoDismiss: false,
                categoryIdentifier: 'persistent',
                color: data.currentAlterColor,
                // Actions Android
                data: {
                    alters: data.favoriteAlters,
                },
            },
            trigger: null,
        });
    }

    private async updateAndroidNotification(data: PersistentNotificationData): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(PERSISTENT_NOTIF_ID);
        await this.startAndroidForegroundService(data);
    }

    private async stopAndroidForegroundService(): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(PERSISTENT_NOTIF_ID);
        await Notifications.dismissNotificationAsync(PERSISTENT_NOTIF_ID);
    }

    // ==================== Storage ====================

    private async saveData(data: PersistentNotificationData): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[PersistentNotification] Failed to save data:', error);
        }
    }

    async loadData(): Promise<PersistentNotificationData | null> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('[PersistentNotification] Failed to load data:', error);
            return null;
        }
    }

    // ==================== Handle Actions ====================

    /**
     * Traite une action de la notification
     * @returns l'ID de l'alter à switcher, ou null
     */
    handleAction(actionIdentifier: string): string | null {
        if (actionIdentifier.startsWith('switch_')) {
            return actionIdentifier.replace('switch_', '');
        }
        return null;
    }
}

export default PersistentNotificationService.getInstance();
