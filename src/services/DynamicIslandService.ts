/**
 * DynamicIslandService.ts
 * Service pour gérer les Live Activities (Dynamic Island) sur iOS
 * 
 * Affiche le fronter actuel dans le Dynamic Island (iPhone 14 Pro+)
 * Utilise ActivityKit via le module natif LiveActivityModule
 * Note: Nécessite iOS 16.1+ et configuration native
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { LiveActivityModule } = NativeModules;
const STORAGE_KEY = '@dynamic_island_enabled';

export interface LiveActivityAlterData {
    name: string;
    initial: string;
    color: string;
    coFronterCount?: number;
    isCoFront?: boolean;
    systemName?: string;
}

class DynamicIslandService {
    private static instance: DynamicIslandService;
    private isActive: boolean = false;

    private constructor() { }

    static getInstance(): DynamicIslandService {
        if (!DynamicIslandService.instance) {
            DynamicIslandService.instance = new DynamicIslandService();
        }
        return DynamicIslandService.instance;
    }

    /**
     * Vérifie si Dynamic Island est disponible sur cet appareil
     * Retourne { available: boolean, enabled: boolean }
     */
    async checkAvailability(): Promise<{ available: boolean; enabled: boolean }> {
        if (Platform.OS !== 'ios' || !LiveActivityModule) {
            return { available: false, enabled: false };
        }

        try {
            const result = await LiveActivityModule.isAvailable();
            return result;
        } catch (error) {
            console.warn('[DynamicIsland] Error checking availability:', error);
            return { available: false, enabled: false };
        }
    }

    /**
     * Vérifie si le service est supporté
     */
    isSupported(): boolean {
        return Platform.OS === 'ios' && LiveActivityModule != null;
    }

    /**
     * Démarre une Live Activity pour afficher le fronter actuel
     */
    async startFronterActivity(data: LiveActivityAlterData): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('[DynamicIsland] Not supported on this device');
            return false;
        }

        // Vérifier la préférence utilisateur
        const enabled = await this.isEnabled();
        if (!enabled) {
            return false;
        }

        try {
            if (!LiveActivityModule) {
                console.warn('[DynamicIsland] Native module not available');
                return false;
            }
            await LiveActivityModule.startFronterActivity({
                name: data.name,
                initial: data.initial || data.name.charAt(0).toUpperCase(),
                color: data.color || '#8B5CF6',
                coFronterCount: data.coFronterCount || 0,
                isCoFront: data.isCoFront || false,
                systemName: data.systemName || 'Mon Système',
            });

            this.isActive = true;
            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to start:', error);
            return false;
        }
    }

    /**
     * Met à jour la Live Activity avec un nouvel alter (lors d'un switch)
     */
    async updateFronterActivity(data: LiveActivityAlterData): Promise<boolean> {
        if (!this.isSupported()) return false;

        try {
            if (!LiveActivityModule) return false;
            await LiveActivityModule.updateFronterActivity({
                name: data.name,
                initial: data.initial || data.name.charAt(0).toUpperCase(),
                color: data.color || '#8B5CF6',
                coFronterCount: data.coFronterCount || 0,
                isCoFront: data.isCoFront || false,
                systemName: data.systemName || 'Mon Système',
            });

            this.isActive = true;
            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to update:', error);
            return false;
        }
    }

    /**
     * Arrête la Live Activity
     */
    async stopFronterActivity(): Promise<boolean> {
        if (!this.isSupported()) return false;

        try {
            if (!LiveActivityModule) return false;
            await LiveActivityModule.stopFronterActivity();
            this.isActive = false;
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
     * Active/Désactive le Dynamic Island (préférence utilisateur)
     */
    async setEnabled(enabled: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));

            // Si désactivé, arrêter l'activité en cours
            if (!enabled && this.isActive) {
                await this.stopFronterActivity();
            }
        } catch (error) {
            console.error('[DynamicIsland] Failed to save preference:', error);
        }
    }

    /**
     * Vérifie si le Dynamic Island est activé par l'utilisateur
     */
    async isEnabled(): Promise<boolean> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            // Par défaut activé si disponible
            return stored ? JSON.parse(stored) : true;
        } catch {
            return true;
        }
    }
}

// Export singleton
export default DynamicIslandService.getInstance();

// Types pour le module natif Swift
declare module 'react-native' {
    interface NativeModulesStatic {
        LiveActivityModule?: {
            isAvailable: () => Promise<{ available: boolean; enabled: boolean }>;
            startFronterActivity: (data: {
                name: string;
                initial: string;
                color: string;
                coFronterCount: number;
                isCoFront: boolean;
                systemName: string;
            }) => Promise<{ activityId: string }>;
            updateFronterActivity: (data: {
                name: string;
                initial: string;
                color: string;
                coFronterCount: number;
                isCoFront: boolean;
                systemName: string;
            }) => Promise<{ success: boolean }>;
            stopFronterActivity: () => Promise<{ success: boolean }>;
        };
    }
}
