/**
 * WatchBridge - Interface TypeScript pour le module natif WatchConnectivity
 * Permet de communiquer avec l'Apple Watch depuis React Native
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Typage du module natif
interface WatchSessionManagerType {
    sendAltersToWatch: (alters: AlterForWatch[]) => void;
    sendCurrentFrontToWatch: (frontData: FrontDataForWatch) => void;
    isWatchReachable: (callback: (reachable: boolean) => void) => void;
    isWatchPaired: (callback: (paired: boolean) => void) => void;
}

// Types pour les données envoyées à la montre
export interface AlterForWatch {
    id: string;
    name: string;
    color: string;
    avatarUrl?: string;
    pronouns?: string;
}

export interface FrontDataForWatch {
    type: 'single' | 'co-front' | 'blurry';
    alterIds: string[];
    alterNames: string[];
}

export interface WatchAlterSelectedEvent {
    alterId: string;
    isCoFront: boolean;
}

export interface WatchMoodSelectedEvent {
    mood: string;
    intensity: number;
}

// Le module n'existe que sur iOS
const WatchSessionManager: WatchSessionManagerType | null =
    Platform.OS === 'ios' ? NativeModules.WatchSessionManager : null;

// Event Emitter pour les événements de la montre
const watchEventEmitter = WatchSessionManager
    ? new NativeEventEmitter(NativeModules.WatchSessionManager)
    : null;

/**
 * Service de communication avec l'Apple Watch
 */
export const WatchBridge = {
    /**
     * Vérifie si le module est disponible (iOS uniquement)
     */
    isAvailable: (): boolean => {
        return WatchSessionManager !== null;
    },

    /**
     * Vérifie si une Apple Watch est jumelée
     */
    isWatchPaired: (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!WatchSessionManager) {
                resolve(false);
                return;
            }
            WatchSessionManager.isWatchPaired((paired) => resolve(paired));
        });
    },

    /**
     * Vérifie si la montre est accessible (à portée)
     */
    isWatchReachable: (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!WatchSessionManager) {
                resolve(false);
                return;
            }
            WatchSessionManager.isWatchReachable((reachable) => resolve(reachable));
        });
    },

    /**
     * Envoie la liste des alters à la montre
     */
    sendAltersToWatch: (alters: AlterForWatch[]): void => {
        if (!WatchSessionManager) return;
        WatchSessionManager.sendAltersToWatch(alters);
    },

    /**
     * Envoie l'état du front actuel à la montre
     */
    sendCurrentFrontToWatch: (frontData: FrontDataForWatch): void => {
        if (!WatchSessionManager) return;
        WatchSessionManager.sendCurrentFrontToWatch(frontData);
    },

    /**
     * S'abonner aux événements de sélection d'alter depuis la montre
     */
    onAlterSelected: (callback: (event: WatchAlterSelectedEvent) => void): (() => void) => {
        if (!watchEventEmitter) return () => { };
        const subscription = watchEventEmitter.addListener('onAlterSelected', callback);
        return () => subscription.remove();
    },

    /**
     * S'abonner aux événements de sélection d'humeur depuis la montre
     */
    onMoodSelected: (callback: (event: WatchMoodSelectedEvent) => void): (() => void) => {
        if (!watchEventEmitter) return () => { };
        const subscription = watchEventEmitter.addListener('onMoodSelected', callback);
        return () => subscription.remove();
    },

    /**
     * S'abonner aux changements de connectivité de la montre
     */
    onReachabilityChanged: (callback: (event: { isReachable: boolean }) => void): (() => void) => {
        if (!watchEventEmitter) return () => { };
        const subscription = watchEventEmitter.addListener('onWatchReachabilityChanged', callback);
        return () => subscription.remove();
    },

    /**
     * S'abonner aux demandes de la montre (ex: refresh des alters)
     */
    onWatchMessage: (callback: (event: { type: string }) => void): (() => void) => {
        if (!watchEventEmitter) return () => { };
        const subscription = watchEventEmitter.addListener('onWatchMessage', callback);
        return () => subscription.remove();
    },
};

export default WatchBridge;
