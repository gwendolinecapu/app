/**
 * useFrontNotifications.ts
 * Hook pour synchroniser les notifications persistantes et Dynamic Island
 * avec le front actuel de l'utilisateur
 */

import { useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import PersistentNotificationService from '../services/PersistentNotificationService';
import DynamicIslandService from '../services/DynamicIslandService';
import NotificationService from '../services/NotificationService';
import { Alter } from '../types';

// Interface pour le front actuel
interface Front {
    type: 'single' | 'co-front' | 'none';
    alterIds: string[];
    timestamp: number;
}

interface UseFrontNotificationsProps {
    currentFront: Front | null;
    alters: Alter[];
    favoriteAlterIds?: string[];
}

export function useFrontNotifications({
    currentFront,
    alters,
    favoriteAlterIds = [],
}: UseFrontNotificationsProps) {
    const { settings } = useNotifications();

    // Helper pour obtenir un alter par ID
    const getAlter = useCallback(
        (id: string) => alters.find(a => a.id === id),
        [alters]
    );

    // Helper pour obtenir l'initiale d'un alter
    const getInitial = (name: string) => name.charAt(0).toUpperCase();

    // Met à jour la notification persistante
    useEffect(() => {
        if (!settings?.persistentNotification || !currentFront) {
            PersistentNotificationService.stop();
            return;
        }

        const frontAlterIds = currentFront.alterIds || [];
        const firstAlterId = frontAlterIds[0];
        const firstAlter = getAlter(firstAlterId);

        if (!firstAlter) {
            PersistentNotificationService.stop();
            return;
        }

        // Préparer les données
        const favoriteAlters = favoriteAlterIds
            .slice(0, 9) // Max 9 pour la grille
            .map(id => getAlter(id))
            .filter(Boolean)
            .map(alter => ({
                id: alter!.id,
                name: alter!.name,
                color: alter!.color || '#8B5CF6',
            }));

        // Démarrer/mettre à jour la notification
        PersistentNotificationService.update({
            currentAlterName: firstAlter.name,
            currentAlterColor: firstAlter.color || '#8B5CF6',
            favoriteAlters,
        });
    }, [settings?.persistentNotification, currentFront, alters, favoriteAlterIds, getAlter]);

    // Met à jour le Dynamic Island
    useEffect(() => {
        if (!settings?.dynamicIslandEnabled || !currentFront) {
            DynamicIslandService.stopFronterActivity();
            return;
        }

        const frontAlterIds = currentFront.alterIds || [];
        const firstAlterId = frontAlterIds[0];
        const firstAlter = getAlter(firstAlterId);

        if (!firstAlter) {
            DynamicIslandService.stopFronterActivity();
            return;
        }

        // Démarrer/mettre à jour le Dynamic Island
        const updateDynamicIsland = async () => {
            const isActive = DynamicIslandService.getIsActive();

            const data = {
                name: firstAlter.name,
                color: firstAlter.color || '#8B5CF6',
                initial: getInitial(firstAlter.name),
                coFronterCount: frontAlterIds.length > 1 ? frontAlterIds.length - 1 : 0,
                isCoFront: frontAlterIds.length > 1,
                systemName: 'Mon Système'
            };
            if (isActive) {
                await DynamicIslandService.updateFronterActivity(data);
            } else {
                await DynamicIslandService.startFronterActivity(data);
            }
        };

        updateDynamicIsland();

        // Mettre à jour le temps régulièrement
        const interval = setInterval(() => {
            if (DynamicIslandService.getIsActive() && currentFront) {
                const firstAlter = getAlter(frontAlterIds[0]);
                if (firstAlter) {
                    DynamicIslandService.updateFronterActivity({
                        name: firstAlter.name,
                        color: firstAlter.color || '#8B5CF6',
                        initial: getInitial(firstAlter.name),
                        coFronterCount: frontAlterIds.length > 1 ? frontAlterIds.length - 1 : 0,
                        isCoFront: frontAlterIds.length > 1,
                        systemName: 'Mon Système'
                    });
                }
            }
        }, 60000); // Toutes les minutes

        return () => clearInterval(interval);
    }, [settings?.dynamicIslandEnabled, currentFront, getAlter]);

    // Envoie une notification après un switch
    const sendSwitchNotification = useCallback(
        async (newAlterId: string) => {
            const alter = getAlter(newAlterId);
            if (!alter) return;

            await NotificationService.sendImmediateNotification('post_switch_check', {
                alterName: alter.name,
            });
        },
        [getAlter]
    );

    // Envoie un rappel de front
    const sendFrontReminder = useCallback(async () => {
        await NotificationService.sendImmediateNotification('front_check');
    }, []);

    return {
        sendSwitchNotification,
        sendFrontReminder,
        isPersistentActive: PersistentNotificationService.getIsActive(),
        isDynamicIslandActive: DynamicIslandService.getIsActive(),
    };
}

export default useFrontNotifications;
