/**
 * useSubsystems Hook
 * Hook React pour gérer les subsystems d'un système
 */

import { useState, useEffect, useCallback } from 'react';
import { Subsystem } from '../types';
import { SubsystemService } from '../services/SubsystemService';

interface UseSubsystemsReturn {
    subsystems: Subsystem[];
    activeSubsystem: Subsystem | null;
    loading: boolean;
    error: string | null;

    // Actions
    switchTo: (subsystemId: string) => Promise<void>;
    createSubsystem: (name: string, color: string, description?: string) => Promise<string | null>;
    updateSubsystem: (subsystemId: string, updates: Partial<Subsystem>) => Promise<void>;
    deleteSubsystem: (subsystemId: string) => Promise<void>;
    setAsDefault: (subsystemId: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useSubsystems = (parentSystemId: string | undefined): UseSubsystemsReturn => {
    const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
    const [activeSubsystem, setActiveSubsystem] = useState<Subsystem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger les subsystems
    const loadSubsystems = useCallback(async () => {
        if (!parentSystemId) {
            setSubsystems([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await SubsystemService.listSubsystems(parentSystemId);
            setSubsystems(data);

            // Définir le subsystem actif (le default ou le premier)
            if (data.length > 0) {
                const defaultSub = data.find(sub => sub.is_default);
                setActiveSubsystem(defaultSub || data[0]);
            }
        } catch (err: any) {
            console.error('Error loading subsystems:', err);
            setError(err.message || 'Failed to load subsystems');
        } finally {
            setLoading(false);
        }
    }, [parentSystemId]);

    // Charger au montage et quand le parentSystemId change
    useEffect(() => {
        loadSubsystems();
    }, [loadSubsystems]);

    // Switcher vers un subsystem
    const switchTo = useCallback(async (subsystemId: string) => {
        try {
            const subsystem = subsystems.find(sub => sub.id === subsystemId);
            if (!subsystem) {
                throw new Error('Subsystem not found');
            }

            setActiveSubsystem(subsystem);

            // Marquer comme "accédé"
            await SubsystemService.touchSubsystem(subsystemId);
        } catch (err: any) {
            console.error('Error switching subsystem:', err);
            setError(err.message);
        }
    }, [subsystems]);

    // Créer un nouveau subsystem
    const createSubsystem = useCallback(async (
        name: string,
        color: string,
        description?: string
    ): Promise<string | null> => {
        if (!parentSystemId) {
            setError('No parent system ID');
            return null;
        }

        try {
            setError(null);
            const newId = await SubsystemService.createSubsystem(
                parentSystemId,
                name,
                color,
                description
            );

            // Rafraîchir la liste
            await loadSubsystems();

            return newId;
        } catch (err: any) {
            console.error('Error creating subsystem:', err);
            setError(err.message || 'Failed to create subsystem');
            return null;
        }
    }, [parentSystemId, loadSubsystems]);

    // Mettre à jour un subsystem
    const updateSubsystem = useCallback(async (
        subsystemId: string,
        updates: Partial<Subsystem>
    ) => {
        try {
            setError(null);
            await SubsystemService.updateSubsystem(subsystemId, updates);

            // Rafraîchir la liste
            await loadSubsystems();
        } catch (err: any) {
            console.error('Error updating subsystem:', err);
            setError(err.message || 'Failed to update subsystem');
            throw err;
        }
    }, [loadSubsystems]);

    // Supprimer un subsystem
    const deleteSubsystem = useCallback(async (subsystemId: string) => {
        try {
            setError(null);
            await SubsystemService.deleteSubsystem(subsystemId);

            // Si c'était le subsystem actif, revenir au premier
            if (activeSubsystem?.id === subsystemId) {
                setActiveSubsystem(null);
            }

            // Rafraîchir la liste
            await loadSubsystems();
        } catch (err: any) {
            console.error('Error deleting subsystem:', err);
            setError(err.message || 'Failed to delete subsystem');
            throw err;
        }
    }, [activeSubsystem, loadSubsystems]);

    // Définir comme défaut
    const setAsDefault = useCallback(async (subsystemId: string) => {
        if (!parentSystemId) {
            setError('No parent system ID');
            return;
        }

        try {
            setError(null);
            await SubsystemService.setAsDefault(parentSystemId, subsystemId);

            // Rafraîchir la liste
            await loadSubsystems();
        } catch (err: any) {
            console.error('Error setting default subsystem:', err);
            setError(err.message || 'Failed to set default');
            throw err;
        }
    }, [parentSystemId, loadSubsystems]);

    return {
        subsystems,
        activeSubsystem,
        loading,
        error,
        switchTo,
        createSubsystem,
        updateSubsystem,
        deleteSubsystem,
        setAsDefault,
        refresh: loadSubsystems,
    };
};
