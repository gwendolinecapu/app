import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    orderBy,
    getDoc,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Group, GroupMember } from '../types';

export const GroupService = {
    /**
     * Crée un nouveau groupe
     */
    createGroup: async (
        name: string,
        description: string,
        ownerSystemId: string,
        initialMembers: string[] = [] // Liste d'IDs de systèmes à inviter
    ): Promise<string> => {
        try {
            // 1. Créer le groupe
            const groupData: Omit<Group, 'id'> = {
                name,
                description,
                created_by: ownerSystemId,
                created_at: Date.now(),
                type: 'private',
                members: [ownerSystemId, ...initialMembers]
            };

            const groupRef = await addDoc(collection(db, 'groups'), groupData);
            const groupId = groupRef.id;

            // 2. Ajouter le créateur comme admin
            await addDoc(collection(db, 'group_members'), {
                group_id: groupId,
                system_id: ownerSystemId,
                role: 'admin',
                joined_at: Date.now()
            });

            // 3. Ajouter les autres membres (si implémenté)
            for (const memberId of initialMembers) {
                await addDoc(collection(db, 'group_members'), {
                    group_id: groupId,
                    system_id: memberId,
                    role: 'member',
                    joined_at: Date.now()
                });
            }

            return groupId;
        } catch (error) {
            console.error("Erreur créant le groupe:", error);
            throw error;
        }
    },

    /**
     * Récupère les groupes d'un utilisateur (système)
     */
    getUserGroups: async (systemId: string): Promise<Group[]> => {
        try {
            // Approche simple: on cherche dans le tableau 'members' dénormalisé
            const q = query(
                collection(db, 'groups'),
                where('members', 'array-contains', systemId),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Group));
        } catch (error) {
            console.error("Erreur récupérant les groupes:", error);
            return [];
        }
    },

    /**
     * Ajoute un membre à un groupe
     */
    addMember: async (groupId: string, systemId: string) => {
        try {
            // Vérifier si déjà membre
            const q = query(
                collection(db, 'group_members'),
                where('group_id', '==', groupId),
                where('system_id', '==', systemId)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) return; // Déjà membre

            // Ajouter à la collection group_members
            await addDoc(collection(db, 'group_members'), {
                group_id: groupId,
                system_id: systemId,
                role: 'member',
                joined_at: Date.now()
            });

            // Mettre à jour le tableau dénormalisé members du groupe
            const groupRef = doc(db, 'groups', groupId);
            await updateDoc(groupRef, {
                members: arrayUnion(systemId)
            });

        } catch (error) {
            console.error("Erreur ajoutant membre:", error);
            throw error;
        }
    },

    /**
     * Récupère les détails d'un groupe
     */
    getGroup: async (groupId: string): Promise<Group | null> => {
        try {
            const docRef = doc(db, 'groups', groupId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Group;
            }
            return null;
        } catch (error) {
            console.error("Erreur récupérant le groupe:", error);
            return null;
        }
    },

    /**
     * Récupère les messages d'un groupe
     */
    getGroupMessages: async (groupId: string): Promise<any[]> => {
        try {
            const q = query(
                collection(db, 'messages'),
                where('group_id', '==', groupId),
                orderBy('created_at', 'asc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Erreur récupérant messages groupe:", error);
            return [];
        }
    },

    /**
     * Envoie un message dans un groupe
     */
    sendGroupMessage: async (
        groupId: string,
        senderAlterId: string,
        content: string,
        type: 'text' | 'image' | 'poll' | 'note' = 'text'
    ) => {
        try {
            await addDoc(collection(db, 'messages'), {
                group_id: groupId,
                sender_alter_id: senderAlterId,
                content: content,
                type: type,
                is_internal: false,
                is_read: false,
                created_at: new Date().toISOString()
            });
        } catch (error) {
            console.error("Erreur envoi message groupe:", error);
            throw error;
        }
    }
};
