/**
 * DynamicIslandService.ts
 * Service pour gérer les Live Activities (Dynamic Island) sur iOS
 * 
 * Utilise ActivityKit via un module natif Swift
 * Note: Nécessite iOS 16.1+ et configuration native
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { LiveActivityModule } = NativeModules;
const STORAGE_KEY = '@dynamic_island_enabled';

export interface LiveActivityData {
    currentAlterName: string;
    currentAlterColor: string;
    currentAlterInitial: string;
    timeSinceSwitch: string;
    coFronters?: string[];
}

class DynamicIslandService {
    private static instance: DynamicIslandService;
    private isActive: boolean = false;
    private activityId: string | null = null;

    private constructor() { }

    static getInstance(): DynamicIslandService {
        if (!DynamicIslandService.instance) {
            DynamicIslandService.instance = new DynamicIslandService();
        }
        return DynamicIslandService.instance;
    }

    /**
     * Vérifie si Dynamic Island est supporté
     */
    isSupported(): boolean {
        return (
            Platform.OS === 'ios' &&
            LiveActivityModule != null &&
            typeof LiveActivityModule.isSupported === 'function'
        );
    }

    /**
     * Démarre une Live Activity pour le front actuel
     */
    async start(data: LiveActivityData): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('[DynamicIsland] Not supported on this device');
            return false;
        }

        try {
            // Appel au module natif Swift
            this.activityId = await LiveActivityModule!.startLiveActivity({
                alterName: data.currentAlterName,
                alterColor: data.currentAlterColor,
                alterInitial: data.currentAlterInitial,
                timeSince: data.timeSinceSwitch,
                coFronters: data.coFronters || [],
            });

            this.isActive = true;
            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to start:', error);
            return false;
        }
    }

    /**
     * Met à jour la Live Activity existante
     */
    async update(data: LiveActivityData): Promise<boolean> {
        if (!this.isActive || !this.activityId) {
            console.warn('[DynamicIsland] No active Live Activity to update');
            return false;
        }

        if (!this.isSupported()) return false;

        try {
            await LiveActivityModule!.updateLiveActivity(this.activityId, {
                alterName: data.currentAlterName,
                alterColor: data.currentAlterColor,
                alterInitial: data.currentAlterInitial,
                timeSince: data.timeSinceSwitch,
                coFronters: data.coFronters || [],
            });


            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to update:', error);
            return false;
        }
    }

    /**
     * Arrête la Live Activity
     */
    async stop(): Promise<boolean> {
        if (!this.isActive || !this.activityId) {
            return true;
        }

        if (!this.isSupported()) return false;

        try {
            await LiveActivityModule!.endLiveActivity(this.activityId);
            this.isActive = false;
            this.activityId = null;
            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to stop:', error);
            return false;
        }
    }

    /**
     * Vérifie si une Live Activity est active
     */
    getIsActive(): boolean {
        return this.isActive;
    }

    /**
     * Sauvegarde la préférence utilisateur
     */
    async setEnabled(enabled: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
        } catch (error) {
            console.error('[DynamicIsland] Failed to save preference:', error);
        }
    }

    /**
     * Charge la préférence utilisateur
     */
    async isEnabled(): Promise<boolean> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : false;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton
export default DynamicIslandService.getInstance();

// Types pour le module natif (à créer en Swift)
declare module 'react-native' {
    interface NativeModulesStatic {
        LiveActivityModule?: {
            isSupported: () => boolean;
            startLiveActivity: (data: {
                alterName: string;
                alterColor: string;
                alterInitial: string;
                timeSince: string;
                coFronters: string[];
            }) => Promise<string>;
            updateLiveActivity: (id: string, data: {
                alterName: string;
                alterColor: string;
                alterInitial: string;
                timeSince: string;
                coFronters: string[];
            }) => Promise<void>;
            endLiveActivity: (id: string) => Promise<void>;
        };
    }
}
