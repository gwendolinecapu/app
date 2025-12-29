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

    // Helper pour calculer le temps depuis le switch
    const getTimeSince = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h${minutes % 60}min`;
        }
        return `${minutes}min`;
    };

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
            DynamicIslandService.stop();
            return;
        }

        const frontAlterIds = currentFront.alterIds || [];
        const firstAlterId = frontAlterIds[0];
        const firstAlter = getAlter(firstAlterId);

        if (!firstAlter) {
            DynamicIslandService.stop();
            return;
        }

        // Noms des co-fronteurs
        const coFronters = frontAlterIds
            .slice(1)
            .map(id => getAlter(id)?.name)
            .filter(Boolean) as string[];

        // Démarrer/mettre à jour le Dynamic Island
        const updateDynamicIsland = async () => {
            const isActive = DynamicIslandService.getIsActive();

            const data = {
                currentAlterName: firstAlter.name,
                currentAlterColor: firstAlter.color || '#8B5CF6',
                currentAlterInitial: getInitial(firstAlter.name),
                timeSinceSwitch: getTimeSince(currentFront.timestamp),
                coFronters,
            };

            if (isActive) {
                await DynamicIslandService.update(data);
            } else {
                await DynamicIslandService.start(data);
            }
        };

        updateDynamicIsland();

        // Mettre à jour le temps régulièrement
        const interval = setInterval(() => {
            if (DynamicIslandService.getIsActive() && currentFront) {
                const firstAlter = getAlter(frontAlterIds[0]);
                if (firstAlter) {
                    DynamicIslandService.update({
                        currentAlterName: firstAlter.name,
                        currentAlterColor: firstAlter.color || '#8B5CF6',
                        currentAlterInitial: getInitial(firstAlter.name),
                        timeSinceSwitch: getTimeSince(currentFront.timestamp),
                        coFronters,
                    });
                }
            }
        }, 60000); // Toutes les minutes

        return () => clearInterval(interval);
    }, [settings?.dynamicIslandEnabled, currentFront?.alterIds, currentFront?.timestamp, getAlter]);

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
