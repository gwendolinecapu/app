/**
 * @deprecated This service is deprecated in favor of `RoleService.ts` which offers better sorting and type safety.
 * Only `initializeDefaultRoles` might still be useful during system creation.
 */
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Role } from '../types';

export const RoleService = {
    /**
     * Crée un nouveau rôle dans le système
     */
    createRole: async (systemId: string, name: string, color: string, description?: string): Promise<Role> => {
        try {
            const roleData = {
                system_id: systemId,
                name,
                color,
                description: description || '',
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'roles'), roleData);

            return {
                id: docRef.id,
                ...roleData,
                createdAt: Date.now() // Approximation pour le retour immédiat
            } as Role;
        } catch (error) {
            console.error("Erreur lors de la création du rôle:", error);
            throw error;
        }
    },

    /**
     * Récupère tous les rôles du système
     */
    getRoles: async (systemId: string): Promise<Role[]> => {
        try {
            const q = query(
                collection(db, 'roles'),
                where('system_id', '==', systemId),
                orderBy('name', 'asc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Role));
        } catch (error) {
            console.error("Erreur lors de la récupération des rôles:", error);
            // Si l'erreur est liée à l'index manquant, on renvoie tableau vide temporairement ou on log l'URL
            throw error;
        }
    },

    /**
     * Met à jour un rôle
     */
    updateRole: async (roleId: string, updates: Partial<Omit<Role, 'id' | 'system_id' | 'createdAt'>>) => {
        try {
            const roleRef = doc(db, 'roles', roleId);
            await updateDoc(roleRef, updates);
        } catch (error) {
            console.error("Erreur lors de la mise à jour du rôle:", error);
            throw error;
        }
    },

    /**
     * Supprime un rôle
     */
    deleteRole: async (roleId: string) => {
        try {
            await deleteDoc(doc(db, 'roles', roleId));
            // Note: Idéalement, il faudrait aussi retirer ce role_id des alters qui l'ont
            // On le fera peut-être côté client ou via une fonction cloud plus tard
        } catch (error) {
            console.error("Erreur lors de la suppression du rôle:", error);
            throw error;
        }
    },

    /**
     * Prédéfinit des rôles de base pour un nouveau système (optionnel)
     */
    initializeDefaultRoles: async (systemId: string) => {
        const defaultRoles = [
            { name: 'Protecteur', color: '#EF4444', description: 'Protège le système des menaces et gère les conflits' },
            { name: 'Caretaker', color: '#10B981', description: 'Prend soin des autres alters (souvent les plus jeunes)' },
            { name: 'Hôte', color: '#3B82F6', description: 'Gère la vie quotidienne la plupart du temps' },
            { name: 'Gatekeeper', color: '#8B5CF6', description: 'Contrôle l\'accès au front et aux souvenirs' },
            { name: 'Little', color: '#F59E0B', description: 'Alter enfant' }
        ];

        for (const role of defaultRoles) {
            await RoleService.createRole(systemId, role.name, role.color, role.description);
        }
    }
};
