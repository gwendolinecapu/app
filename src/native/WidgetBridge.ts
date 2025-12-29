//
//  WidgetBridge.ts
//  PluralConnect
//
//  Interface TypeScript pour mettre à jour les widgets iOS
//

import { NativeModules, Platform } from 'react-native';

const { WidgetModule } = NativeModules;

// Types pour les widgets
export interface WidgetAlter {
    id: string;
    name: string;
    color: string;
    avatarUrl?: string;
    pronouns?: string;
}

export interface WidgetFront {
    type: 'single' | 'co-front' | 'blurry';
    alterIds: string[];
    timestamp: number; // Unix timestamp en millisecondes
}

export interface WidgetMood {
    emoji: string;
    intensity: number; // 1-5
    timestamp: number;
}

export interface WidgetDailyStats {
    switchCount: number;
    mostActiveAlterId?: string;
    averageMood?: number;
    journalStreak: number;
    date: number;
}

export interface WidgetWellness {
    message: string;
    fromAlterName?: string;
    timestamp: number;
}

/**
 * Bridge pour communiquer avec les widgets iOS via App Groups
 */
export const WidgetBridge = {
    /**
     * Vérifie si les widgets sont disponibles (iOS uniquement)
     */
    isAvailable(): boolean {
        return Platform.OS === 'ios' && WidgetModule != null;
    },

    /**
     * Met à jour la liste des alters pour les widgets
     */
    async updateAlters(alters: WidgetAlter[]): Promise<void> {
        if (!this.isAvailable()) return;
        try {
            await WidgetModule.updateAlters(alters);
        } catch (error) {
            console.warn('[WidgetBridge] Failed to update alters:', error);
        }
    },

    /**
     * Met à jour le front actuel
     */
    async updateFront(front: WidgetFront): Promise<void> {
        if (!this.isAvailable()) return;
        try {
            await WidgetModule.updateFront(front);
        } catch (error) {
            console.warn('[WidgetBridge] Failed to update front:', error);
        }
    },

    /**
     * Met à jour l'humeur actuelle
     */
    async updateMood(mood: WidgetMood): Promise<void> {
        if (!this.isAvailable()) return;
        try {
            await WidgetModule.updateMood(mood);
        } catch (error) {
            console.warn('[WidgetBridge] Failed to update mood:', error);
        }
    },

    /**
     * Met à jour les stats du jour
     */
    async updateDailyStats(stats: WidgetDailyStats): Promise<void> {
        if (!this.isAvailable()) return;
        try {
            await WidgetModule.updateDailyStats(stats);
        } catch (error) {
            console.warn('[WidgetBridge] Failed to update daily stats:', error);
        }
    },

    /**
     * Met à jour le message de bien-être
     */
    async updateWellness(wellness: WidgetWellness): Promise<void> {
        if (!this.isAvailable()) return;
        try {
            await WidgetModule.updateWellness(wellness);
        } catch (error) {
            console.warn('[WidgetBridge] Failed to update wellness:', error);
        }
    },

    /**
     * Définit les alters favoris pour le Quick Switch
     */
    async setFavoriteAlters(alterIds: string[]): Promise<void> {
        if (!this.isAvailable()) return;
        try {
            await WidgetModule.setFavoriteAlters(alterIds);
        } catch (error) {
            console.warn('[WidgetBridge] Failed to set favorite alters:', error);
        }
    },

    /**
     * Force le rafraîchissement de tous les widgets
     */
    async reloadAllWidgets(): Promise<void> {
        if (!this.isAvailable()) return;
        try {
            await WidgetModule.reloadAllWidgets();
        } catch (error) {
            console.warn('[WidgetBridge] Failed to reload widgets:', error);
        }
    },
};

export default WidgetBridge;
