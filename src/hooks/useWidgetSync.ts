/**
 * useWidgetSync.ts
 * 
 * Hook pour synchroniser automatiquement les données avec les widgets iOS
 * À utiliser dans le composant principal de l'app
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WidgetBridge, { WidgetAlter, WidgetFront, WidgetMood } from '../native/WidgetBridge';
import { Alter } from '../types';

/**
 * Hook qui synchronise automatiquement les alters, le front et l'humeur
 * avec les widgets iOS via App Groups
 */
export function useWidgetSync() {
    const { alters, activeFront, user } = useAuth();

    // Convertir les alters pour les widgets
    const convertAltersForWidget = useCallback((alters: Alter[]): WidgetAlter[] => {
        return alters.map(alter => ({
            id: alter.id,
            name: alter.name,
            color: alter.color || '#8B5CF6',
            avatarUrl: alter.avatar_url,
            pronouns: alter.pronouns,
        }));
    }, []);

    // Sync alters quand ils changent
    useEffect(() => {
        if (!WidgetBridge.isAvailable() || !alters) return;

        const widgetAlters = convertAltersForWidget(alters);
        WidgetBridge.updateAlters(widgetAlters);
    }, [alters, convertAltersForWidget]);

    // Sync front quand il change
    useEffect(() => {
        if (!WidgetBridge.isAvailable()) return;

        const front: WidgetFront = {
            type: activeFront?.type || 'single',
            alterIds: activeFront?.alters?.map(a => a.id) || [],
            timestamp: Date.now(),
        };

        WidgetBridge.updateFront(front);
    }, [activeFront]);

    // Fonction pour mettre à jour l'humeur manuellement
    const updateMoodWidget = useCallback((emoji: string, intensity: number) => {
        if (!WidgetBridge.isAvailable()) return;

        const mood: WidgetMood = {
            emoji,
            intensity,
            timestamp: Date.now(),
        };

        WidgetBridge.updateMood(mood);
    }, []);

    // Fonction pour définir les alters favoris
    const setFavoriteAltersForWidget = useCallback((alterIds: string[]) => {
        if (!WidgetBridge.isAvailable()) return;
        WidgetBridge.setFavoriteAlters(alterIds);
    }, []);

    // Fonction pour mettre à jour les stats
    const updateStatsWidget = useCallback((stats: {
        switchCount: number;
        mostActiveAlterId?: string;
        journalStreak: number;
    }) => {
        if (!WidgetBridge.isAvailable()) return;

        WidgetBridge.updateDailyStats({
            ...stats,
            date: Date.now(),
        });
    }, []);

    // Fonction pour mettre à jour le message bien-être
    const updateWellnessWidget = useCallback((message: string, fromAlterName?: string) => {
        if (!WidgetBridge.isAvailable()) return;

        WidgetBridge.updateWellness({
            message,
            fromAlterName,
            timestamp: Date.now(),
        });
    }, []);

    return {
        updateMoodWidget,
        setFavoriteAltersForWidget,
        updateStatsWidget,
        updateWellnessWidget,
    };
}

export default useWidgetSync;
