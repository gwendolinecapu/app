import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { Role } from '../types';

const COLLECTION_NAME = 'roles';

// Preset colors for roles
export const ROLE_COLORS = [
    '#FF6B6B', // Red - Protector
    '#4ECDC4', // Teal - Caretaker
    '#FFE66D', // Yellow - Little
    '#95E1D3', // Mint - Host
    '#F38181', // Coral - Persecutor
    '#AA96DA', // Lavender - Gatekeeper
    '#74B9FF', // Blue - Trauma Holder
    '#FD79A8', // Pink - Social
    '#00B894', // Green - Helper
    '#E17055', // Orange - Protector Alt
    '#A29BFE', // Purple - Inner Self Helper
    '#636E72', // Gray - Fragment
];

// Common role presets
export const ROLE_PRESETS = [
    { name: 'Host', color: '#95E1D3', description: 'Alter principal du quotidien' },
    { name: 'Protecteur', color: '#FF6B6B', description: 'Protège le système' },
    { name: 'Little', color: '#FFE66D', description: 'Alter enfant' },
    { name: 'Gatekeeper', color: '#AA96DA', description: 'Gère les switches' },
    { name: 'Persecutor', color: '#F38181', description: 'Alter en difficulté' },
    { name: 'Caretaker', color: '#4ECDC4', description: 'Prend soin du système' },
    { name: 'Trauma Holder', color: '#74B9FF', description: 'Porte les traumas' },
    { name: 'Social', color: '#FD79A8', description: 'Gère les interactions sociales' },
    { name: 'ISH', color: '#A29BFE', description: 'Inner Self Helper' },
    { name: 'Fragment', color: '#636E72', description: 'Alter fragmenté' },
];

export const RoleService = {
    /**
     * Fetch all roles for a system
     */
    fetchRoles: async (systemId: string): Promise<Role[]> => {
        try {
            // Query without orderBy to avoid needing a composite index
            const q = query(
                collection(db, COLLECTION_NAME),
                where('system_id', '==', systemId)
            );
            const snapshot = await getDocs(q);
            const roles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Role));
            // Sort client-side by createdAt descending
            return roles.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (error) {
            console.error('Error fetching roles:', error);
            return [];
        }
    },

    /**
     * Create a new role
     */
    createRole: async (systemId: string, name: string, color: string, description?: string): Promise<string | null> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                system_id: systemId,
                name: name.trim(),
                color,
                description: description?.trim() || null,
                createdAt: Date.now()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating role:', error);
            return null;
        }
    },

    /**
     * Update a role
     */
    updateRole: async (roleId: string, updates: Partial<Role>): Promise<boolean> => {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, roleId), updates);
            return true;
        } catch (error) {
            console.error('Error updating role:', error);
            return false;
        }
    },

    /**
     * Delete a role
     */
    deleteRole: async (roleId: string): Promise<boolean> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, roleId));
            return true;
        } catch (error) {
            console.error('Error deleting role:', error);
            return false;
        }
    },

    /**
     * Add a role to an alter
     */
    addRoleToAlter: async (alterId: string, roleId: string): Promise<boolean> => {
        try {
            const alterRef = doc(db, 'alters', alterId);
            const { getDoc, arrayUnion } = await import('firebase/firestore');
            const alterDoc = await getDoc(alterRef);

            if (alterDoc.exists()) {
                await updateDoc(alterRef, {
                    role_ids: arrayUnion(roleId)
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding role to alter:', error);
            return false;
        }
    },

    /**
     * Remove a role from an alter
     */
    removeRoleFromAlter: async (alterId: string, roleId: string): Promise<boolean> => {
        try {
            const alterRef = doc(db, 'alters', alterId);
            const { arrayRemove } = await import('firebase/firestore');
            await updateDoc(alterRef, {
                role_ids: arrayRemove(roleId)
            });
            return true;
        } catch (error) {
            console.error('Error removing role from alter:', error);
            return false;
        }
    }
};

export default RoleService;
