/**
 * SubsystemService
 * Gestion des sous-systèmes pour organiser les alters en groupes
 */

import { db } from '../lib/firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { Subsystem } from '../types';

export class SubsystemService {
    /**
     * Créer un nouveau subsystem
     */
    static async createSubsystem(
        parentSystemId: string,
        name: string,
        color: string,
        description?: string
    ): Promise<string> {
        if (!parentSystemId?.trim()) {
            throw new Error('Parent system ID is required');
        }
        if (!name?.trim()) {
            throw new Error('Subsystem name is required');
        }

        const now = new Date().toISOString();
        const subsystemData: Omit<Subsystem, 'id'> = {
            parent_system_id: parentSystemId,
            name: name.trim(),
            description: description?.trim() || '',
            color: color || '#7C3AED',
            avatar_url: undefined,
            alter_count: 0,
            created_at: now,
            updated_at: now,
            last_accessed_at: now,
            order: Date.now(), // Tri par date de création par défaut
            is_default: false,
        };

        const docRef = await addDoc(collection(db, 'subsystems'), subsystemData);
        return docRef.id;
    }

    /**
     * Lister tous les subsystems d'un système
     */
    static async listSubsystems(parentSystemId: string): Promise<Subsystem[]> {
        if (!parentSystemId) {
            return [];
        }

        try {
            const q = query(
                collection(db, 'subsystems'),
                where('parent_system_id', '==', parentSystemId),
                orderBy('order', 'asc')
            );

            const snapshot = await getDocs(q);
            const subsystems = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
            })) as Subsystem[];

            // Calculer altar_count pour chaque subsystem
            for (const subsystem of subsystems) {
                const count = await this.countAlters(subsystem.id);
                subsystem.alter_count = count;
            }

            return subsystems;
        } catch (error) {
            console.error('Error listing subsystems:', error);
            return [];
        }
    }

    /**
     * Récupérer un subsystem par ID
     */
    static async getSubsystem(subsystemId: string): Promise<Subsystem | null> {
        if (!subsystemId) return null;

        try {
            const docRef = doc(db, 'subsystems', subsystemId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            const data = docSnap.data();
            const count = await this.countAlters(subsystemId);

            return {
                id: docSnap.id,
                ...data,
                alter_count: count,
            } as Subsystem;
        } catch (error) {
            console.error('Error getting subsystem:', error);
            return null;
        }
    }

    /**
     * Mettre à jour un subsystem
     */
    static async updateSubsystem(
        subsystemId: string,
        updates: Partial<Omit<Subsystem, 'id' | 'parent_system_id'>>
    ): Promise<void> {
        if (!subsystemId) {
            throw new Error('Subsystem ID is required');
        }

        const docRef = doc(db, 'subsystems', subsystemId);
        await updateDoc(docRef, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
    }

    /**
     * Supprimer un subsystem
     * IMPORTANT: Ne supprime pas si des alters sont assignés
     */
    static async deleteSubsystem(subsystemId: string): Promise<void> {
        if (!subsystemId) {
            throw new Error('Subsystem ID is required');
        }

        // Vérifier qu'aucun alter n'est assigné
        const alterCount = await this.countAlters(subsystemId);
        if (alterCount > 0) {
            throw new Error(
                `Cannot delete subsystem with ${alterCount} alter(s). Please reassign or delete alters first.`
            );
        }

        const docRef = doc(db, 'subsystems', subsystemId);
        await deleteDoc(docRef);
    }

    /**
     * Marquer un subsystem comme "accédé" (pour tri par récence)
     */
    static async touchSubsystem(subsystemId: string): Promise<void> {
        if (!subsystemId) return;

        try {
            const docRef = doc(db, 'subsystems', subsystemId);
            await updateDoc(docRef, {
                last_accessed_at: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error touching subsystem:', error);
        }
    }

    /**
     * Compter les alters dans un subsystem
     */
    static async countAlters(subsystemId: string): Promise<number> {
        if (!subsystemId) return 0;

        try {
            const q = query(
                collection(db, 'alters'),
                where('subsystem_id', '==', subsystemId)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error counting alters:', error);
            return 0;
        }
    }

    /**
     * Définir un subsystem comme défaut
     */
    static async setAsDefault(
        parentSystemId: string,
        subsystemId: string
    ): Promise<void> {
        if (!parentSystemId || !subsystemId) {
            throw new Error('Parent system ID and subsystem ID are required');
        }

        // Retirer le flag default des autres
        const subsystems = await this.listSubsystems(parentSystemId);
        for (const sub of subsystems) {
            if (sub.is_default && sub.id !== subsystemId) {
                await updateDoc(doc(db, 'subsystems', sub.id), { is_default: false });
            }
        }

        // Définir le nouveau default
        await updateDoc(doc(db, 'subsystems', subsystemId), { is_default: true });

        // Mettre à jour le système parent
        await updateDoc(doc(db, 'systems', parentSystemId), {
            default_subsystem_id: subsystemId,
        });
    }

    /**
     * Réassigner un alter à un subsystem
     */
    static async assignAlterToSubsystem(
        alterId: string,
        subsystemId: string | null
    ): Promise<void> {
        if (!alterId) {
            throw new Error('Alter ID is required');
        }

        const alterRef = doc(db, 'alters', alterId);
        await updateDoc(alterRef, {
            subsystem_id: subsystemId || null,
        });
    }

    /**
     * Réassigner plusieurs alters à un subsystem en batch
     */
    static async batchAssignAlters(
        alterIds: string[],
        subsystemId: string | null
    ): Promise<void> {
        if (!alterIds || alterIds.length === 0) {
            return;
        }

        const promises = alterIds.map(alterId =>
            this.assignAlterToSubsystem(alterId, subsystemId)
        );

        await Promise.all(promises);
    }

    /**
     * Récupérer le subsystem par défaut d'un système
     */
    static async getDefaultSubsystem(parentSystemId: string): Promise<Subsystem | null> {
        if (!parentSystemId) return null;

        try {
            const q = query(
                collection(db, 'subsystems'),
                where('parent_system_id', '==', parentSystemId),
                where('is_default', '==', true)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                return null;
            }

            const docSnap = snapshot.docs[0];
            const count = await this.countAlters(docSnap.id);

            return {
                id: docSnap.id,
                ...docSnap.data(),
                alter_count: count,
            } as Subsystem;
        } catch (error) {
            console.error('Error getting default subsystem:', error);
            return null;
        }
    }

    /**
     * Créer un subsystem "Principal" par défaut pour un système
     * Utilisé lors de la migration ou du premier setup
     */
    static async createDefaultSubsystem(parentSystemId: string): Promise<string> {
        const subsystemId = await this.createSubsystem(
            parentSystemId,
            'Système Principal',
            '#7C3AED',
            'Système principal créé automatiquement'
        );

        await this.setAsDefault(parentSystemId, subsystemId);
        return subsystemId;
    }
}
