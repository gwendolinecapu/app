/**
 * useWatchSync - Hook pour synchroniser les données avec l'Apple Watch
 * Gère l'envoi des alters et la réception des événements de la montre
 */

import { useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import WatchBridge, { AlterForWatch, FrontDataForWatch } from '../native/WatchBridge';
import { Alter } from '../types';

/**
 * Hook pour synchroniser les données avec l'Apple Watch
 * Doit être utilisé dans un composant haut niveau (ex: _layout.tsx)
 */
export function useWatchSync() {
    const { alters, activeFront, setFronting } = useAuth();

    // Convertir les alters pour la montre (avec valeurs par défaut pour les optionnels)
    // Utiliser useMemo pour éviter les re-renders infinis
    const altersForWatch: AlterForWatch[] = useMemo(() =>
        (alters || []).map((alter: Alter) => ({
            id: alter.id,
            name: alter.name,
            color: alter.color || '#8B5CF6',
            avatarUrl: alter.avatar_url,
            pronouns: alter.pronouns,
        })), [alters]);

    // Envoyer les alters à la montre quand ils changent
    useEffect(() => {
        if (!WatchBridge.isAvailable() || Platform.OS !== 'ios') return;

        const sendAlters = async () => {
            const isReachable = await WatchBridge.isWatchReachable();
            if (isReachable && altersForWatch.length > 0) {
                WatchBridge.sendAltersToWatch(altersForWatch);
            }
        };

        sendAlters();
    }, [altersForWatch]); // Dépendance sur l'objet memoizé

    // Envoyer le front actuel à la montre
    useEffect(() => {
        if (!WatchBridge.isAvailable() || Platform.OS !== 'ios') return;

        if (activeFront && activeFront.alters.length > 0) {
            const frontData: FrontDataForWatch = {
                type: activeFront.type,
                alterIds: activeFront.alters.map(a => a.id),
                alterNames: activeFront.alters.map(a => a.name),
            };
            WatchBridge.sendCurrentFrontToWatch(frontData);
        }
    }, [activeFront]);

    // Écouter les événements de la montre
    useEffect(() => {
        if (!WatchBridge.isAvailable() || Platform.OS !== 'ios') return;

        // Quand la montre sélectionne un alter
        const unsubAlter = WatchBridge.onAlterSelected((event) => {


            // Trouver l'alter correspondant
            const selectedAlter = alters?.find(a => a.id === event.alterId);
            if (selectedAlter && setFronting) {
                const type = event.isCoFront ? 'co-front' : 'single';
                setFronting([selectedAlter], type);
            }
        });

        // Quand la montre sélectionne une humeur
        const unsubMood = WatchBridge.onMoodSelected(async (event) => {


            // Trouver qui est au front pour enregistrer l'émotion
            const currentAlter = activeFront?.alters[0];
            if (currentAlter) {
                try {
                    // Import dynamique ou utilisation du service importé
                    const { EmotionService } = require('../services/emotions');
                    await EmotionService.addEmotion(currentAlter.id, event.mood, event.intensity);
                } catch (e) {
                    console.error('[Watch] Failed to save emotion:', e);
                }
            } else {
                console.warn('[Watch] No active alter to save mood');
            }
        });

        // Quand la montre demande les alters
        const unsubMessage = WatchBridge.onWatchMessage((event) => {
            if (event.type === 'request_alters' && altersForWatch.length > 0) {
                WatchBridge.sendAltersToWatch(altersForWatch);
            }
        });

        // Écouter les changements de connectivité
        const unsubReachability = WatchBridge.onReachabilityChanged((event) => {

            if (event.isReachable && altersForWatch.length > 0) {
                // Renvoyer les données quand la montre se reconnecte
                WatchBridge.sendAltersToWatch(altersForWatch);
            }
        });

        return () => {
            unsubAlter();
            unsubMood();
            unsubMessage();
            unsubReachability();
        };
    }, [alters, setFronting, altersForWatch, activeFront?.alters]);

    // Fonctions exposées
    return {
        isWatchAvailable: WatchBridge.isAvailable(),
        sendAltersToWatch: useCallback(() => {
            if (WatchBridge.isAvailable() && altersForWatch.length > 0) {
                WatchBridge.sendAltersToWatch(altersForWatch);
            }
        }, [altersForWatch]),
    };
}

export default useWatchSync;
