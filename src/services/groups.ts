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
    arrayUnion,
    arrayRemove,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Group, Message } from '../types';

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
     * Quitter un groupe
     */
    leaveGroup: async (groupId: string, systemId: string) => {
        try {
            // 1. Trouver le document membre
            const q = query(
                collection(db, 'group_members'),
                where('group_id', '==', groupId),
                where('system_id', '==', systemId)
            );
            const snapshot = await getDocs(q);

            // 2. Supprimer de la collection group_members
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // 3. Mettre à jour le tableau dénormalisé members du groupe
            const groupRef = doc(db, 'groups', groupId);
            await updateDoc(groupRef, {
                members: arrayRemove(systemId)
            });

        } catch (error) {
            console.error("Erreur quittant le groupe:", error);
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
    getGroupMessages: async (groupId: string): Promise<Message[]> => {
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
            } as Message));
        } catch (error) {
            console.error("Erreur récupérant messages groupe:", error);
            return [];
        }
    },

    /**
     * Envoie un message dans un groupe
     * @param groupId - ID du groupe
     * @param senderId - ID de l'utilisateur authentifié (system_id) - REQUIS par les règles Firestore
     * @param senderAlterId - ID de l'alter qui envoie
     * @param content - Contenu du message
     * @param type - Type de message
     * @param extraData - Données optionnelles (poll, note)
     */
    sendGroupMessage: async (
        groupId: string,
        senderId: string, // NOUVEAU: requis par les règles Firestore
        senderAlterId: string,
        content: string,
        type: 'text' | 'image' | 'poll' | 'note' = 'text',
        extraData?: {
            pollOptions?: string[];
            noteTitle?: string;
        }
    ) => {
        try {
            // IMPORTANT: Les règles Firestore exigent senderId == request.auth.uid
            const messageData: Omit<Message, 'id'> = {
                group_id: groupId,
                system_id: senderId, // Requis par le type Message
                sender_alter_id: senderAlterId,
                content: content,
                type: type,
                is_internal: false,
                is_read: false,
                created_at: new Date().toISOString(),
                reactions: []
            };

            // Ajouter les données spécifiques
            if (type === 'poll' && extraData?.pollOptions) {
                messageData.poll_options = extraData.pollOptions.map(opt => ({
                    id: Math.random().toString(36).substr(2, 9),
                    label: opt,
                    votes: []
                }));
                messageData.poll_votes = [];
            } else if (type === 'note' && extraData?.noteTitle) {
                messageData.content = `${extraData.noteTitle}|||${content}`;
            }

            await addDoc(collection(db, 'messages'), messageData);
        } catch (error) {
            console.error("Erreur envoi message groupe:", error);
            throw error;
        }
    },

    /**
     * Vote pour un sondage
     */
    votePoll: async (messageId: string, optionId: string, userId: string) => {
        try {
            const messageRef = doc(db, 'messages', messageId);
            const messageSnap = await getDoc(messageRef);

            if (!messageSnap.exists()) return;

            const message = messageSnap.data();
            let votes = message.poll_votes || [];

            // Retirer l'ancien vote de cet utilisateur s'il existe (vote unique)
            votes = votes.filter((v: any) => v.user_id !== userId);

            // Ajouter le nouveau vote
            votes.push({ option_id: optionId, user_id: userId });

            await updateDoc(messageRef, {
                poll_votes: votes
            });
        } catch (error) {
            console.error("Erreur vote sondage:", error);
            throw error;
        }
    },

    /**
     * Ajoute ou retire une réaction sur un message
     */
    toggleReaction: async (messageId: string, emoji: string, userId: string) => {
        try {
            const messageRef = doc(db, 'messages', messageId);
            const messageSnap = await getDoc(messageRef);

            if (!messageSnap.exists()) return;

            const message = messageSnap.data();
            const reactions = message.reactions || [];

            // Vérifier si l'utilisateur a déjà réagi avec cet emoji
            const existingIndex = reactions.findIndex(
                (r: any) => r.user_id === userId && r.emoji === emoji
            );

            let newReactions;
            if (existingIndex >= 0) {
                // Retirer la réaction
                newReactions = reactions.filter((_: any, index: number) => index !== existingIndex);
            } else {
                // Ajouter la réaction
                newReactions = [...reactions, { emoji, user_id: userId }];
            }

            await updateDoc(messageRef, {
                reactions: newReactions
            });
        } catch (error) {
            console.error("Erreur toggle réaction:", error);
            throw error;
        }
    },

    /**
     * Met à jour le statut "en train d'écrire"
     * Utilise une collection dédiée 'typing_status'
     * Doc ID: ${groupId}_${systemId}
     */
    setTypingStatus: async (groupId: string, systemId: string, isTyping: boolean, username: string) => {
        try {
            const docId = `${groupId}_${systemId}`;
            const typingRef = doc(db, 'typing_status', docId);

            if (isTyping) {
                await setDoc(typingRef, {
                    group_id: groupId,
                    system_id: systemId,
                    username: username,
                    last_typed: Date.now()
                });
            } else {
                await deleteDoc(typingRef);
            }
        } catch {
            // Silencieux pour ne pas spammer les logs si erreur mineure réseau
        }
    },

    /**
     * Écoute les utilisateurs en train d'écrire dans un groupe
     */
    subscribeToTyping: (groupId: string, callback: (typers: string[]) => void) => {
        const q = query(
            collection(db, 'typing_status'),
            where('group_id', '==', groupId)
        );

        return onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const typers: string[] = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                // Filtrer les vieux status (> 10s) pour éviter les fantômes
                if (now - data.last_typed < 10000) {
                    typers.push(data.username);
                }
            });

            callback(typers);
        });
    }
};
