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
const STYLE_STORAGE_KEY = '@dynamic_island_style';

// Styles de présentation disponibles
export type DynamicIslandStyle = 'minimal' | 'detailed' | 'mood';

// Données de base pour un alter
export interface LiveActivityAlterData {
    name: string;
    initial: string;
    color: string;
    avatarUrl?: string;
    mood?: string;
    moodEmoji?: string;
    coFronterCount?: number;
    coFronterNames?: string[];
    isCoFront?: boolean;
    systemName?: string;
    frontingSince?: number; // Timestamp du début du fronting
}

// Configuration complète de l'activité
export interface LiveActivityConfig {
    alter: LiveActivityAlterData;
    style: DynamicIslandStyle;
    showMood: boolean;
    showElapsedTime: boolean;
    showCoFronters: boolean;
    accentColor?: string;
}

// État du Dynamic Island
export interface DynamicIslandState {
    isActive: boolean;
    currentAlterId?: string;
    style: DynamicIslandStyle;
    lastUpdate: number;
}

class DynamicIslandService {
    private static instance: DynamicIslandService;
    private isActive: boolean = false;
    private currentAlterId?: string;
    private currentStyle: DynamicIslandStyle = 'detailed';
    private lastUpdate: number = 0;

    private constructor() { }

    static getInstance(): DynamicIslandService {
        if (!DynamicIslandService.instance) {
            DynamicIslandService.instance = new DynamicIslandService();
        }
        return DynamicIslandService.instance;
    }

    /**
     * Vérifie si Dynamic Island est disponible sur cet appareil
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
     * Obtient l'état actuel
     */
    getState(): DynamicIslandState {
        return {
            isActive: this.isActive,
            currentAlterId: this.currentAlterId,
            style: this.currentStyle,
            lastUpdate: this.lastUpdate,
        };
    }

    /**
     * Démarre une Live Activity pour afficher le fronter actuel
     */
    async startFronterActivity(data: LiveActivityAlterData): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('[DynamicIsland] Not supported on this device');
            return false;
        }

        const enabled = await this.isEnabled();
        if (!enabled) {
            return false;
        }

        const style = await this.getStyle();

        try {
            if (!LiveActivityModule) {
                console.warn('[DynamicIsland] Native module not available');
                return false;
            }

            const activityData = this.prepareActivityData(data, style);
            await LiveActivityModule.startFronterActivity(activityData);

            this.isActive = true;
            this.currentAlterId = data.name; // Using name as identifier for now
            this.currentStyle = style;
            this.lastUpdate = Date.now();

            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to start:', error);
            return false;
        }
    }

    /**
     * Met à jour la Live Activity avec un nouvel alter
     */
    async updateFronterActivity(data: LiveActivityAlterData): Promise<boolean> {
        if (!this.isSupported()) return false;

        const style = await this.getStyle();

        try {
            if (!LiveActivityModule) return false;

            const activityData = this.prepareActivityData(data, style);
            await LiveActivityModule.updateFronterActivity(activityData);

            this.isActive = true;
            this.currentAlterId = data.name;
            this.currentStyle = style;
            this.lastUpdate = Date.now();

            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to update:', error);
            return false;
        }
    }

    /**
     * Prépare les données pour le module natif
     */
    private prepareActivityData(data: LiveActivityAlterData, style: DynamicIslandStyle) {
        const elapsedMinutes = data.frontingSince
            ? Math.floor((Date.now() - data.frontingSince) / 60000)
            : 0;

        return {
            // Données de base
            name: data.name,
            initial: data.initial || data.name.charAt(0).toUpperCase(),
            color: data.color || '#8B5CF6',
            avatarUrl: data.avatarUrl || '',

            // Mood
            mood: data.mood || '',
            moodEmoji: data.moodEmoji || '',

            // Co-fronting
            coFronterCount: data.coFronterCount || 0,
            coFronterNames: data.coFronterNames?.join(', ') || '',
            isCoFront: data.isCoFront || false,

            // Contexte
            systemName: data.systemName || 'Mon Système',
            frontingSince: data.frontingSince || Date.now(),
            elapsedMinutes,

            // Style d'affichage
            style: style,
        };
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
            this.currentAlterId = undefined;
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
     * Active/Désactive le Dynamic Island
     */
    async setEnabled(enabled: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));

            if (!enabled && this.isActive) {
                await this.stopFronterActivity();
            }
        } catch (error) {
            console.error('[DynamicIsland] Failed to save preference:', error);
        }
    }

    /**
     * Vérifie si le Dynamic Island est activé
     */
    async isEnabled(): Promise<boolean> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : true;
        } catch {
            return true;
        }
    }

    /**
     * Définit le style d'affichage
     */
    async setStyle(style: DynamicIslandStyle): Promise<void> {
        try {
            await AsyncStorage.setItem(STYLE_STORAGE_KEY, style);
            this.currentStyle = style;

            // Mettre à jour l'activité si active
            if (this.isActive && LiveActivityModule) {
                await LiveActivityModule.updateStyle({ style });
            }
        } catch (error) {
            console.error('[DynamicIsland] Failed to save style:', error);
        }
    }

    /**
     * Obtient le style d'affichage actuel
     */
    async getStyle(): Promise<DynamicIslandStyle> {
        try {
            const stored = await AsyncStorage.getItem(STYLE_STORAGE_KEY);
            return (stored as DynamicIslandStyle) || 'detailed';
        } catch {
            return 'detailed';
        }
    }

    /**
     * Met à jour uniquement le mood
     */
    async updateMood(mood: string, moodEmoji: string): Promise<boolean> {
        if (!this.isActive || !LiveActivityModule) return false;

        try {
            await LiveActivityModule.updateMood({ mood, moodEmoji });
            this.lastUpdate = Date.now();
            return true;
        } catch (error) {
            console.error('[DynamicIsland] Failed to update mood:', error);
            return false;
        }
    }

    /**
     * Calcule le temps écoulé depuis le début du fronting
     */
    static formatElapsedTime(startTimestamp: number): string {
        const now = Date.now();
        const diff = now - startTimestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
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
                avatarUrl: string;
                mood: string;
                moodEmoji: string;
                coFronterCount: number;
                coFronterNames: string;
                isCoFront: boolean;
                systemName: string;
                frontingSince: number;
                elapsedMinutes: number;
                style: string;
            }) => Promise<{ activityId: string }>;
            updateFronterActivity: (data: {
                name: string;
                initial: string;
                color: string;
                avatarUrl: string;
                mood: string;
                moodEmoji: string;
                coFronterCount: number;
                coFronterNames: string;
                isCoFront: boolean;
                systemName: string;
                frontingSince: number;
                elapsedMinutes: number;
                style: string;
            }) => Promise<{ success: boolean }>;
            updateStyle: (data: { style: string }) => Promise<{ success: boolean }>;
            updateMood: (data: { mood: string; moodEmoji: string }) => Promise<{ success: boolean }>;
            stopFronterActivity: () => Promise<{ success: boolean }>;
        };
    }
}
