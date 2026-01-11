import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HelpRequest } from '../types';

export const HelpService = {
    /**
     * Crée une demande d'aide
     */
    createRequest: async (
        systemId: string,
        alterId: string,
        alterName: string,
        type: HelpRequest['type'],
        description: string,
        isAnonymous: boolean = false
    ): Promise<void> => {
        try {
            const request: Omit<HelpRequest, 'id'> = {
                system_id: systemId,
                requester_alter_id: alterId,
                requester_name: alterName,
                type,
                description,
                status: 'pending',
                is_anonymous: isAnonymous,
                created_at: Date.now(),
            };

            await addDoc(collection(db, 'help_requests'), request);
        } catch (error) {
            console.error("Erreur créant la demande d'aide:", error);
            throw error;
        }
    },

    /**
     * Récupère les demandes d'aide actives (non résolues)
     */
    getActiveRequests: async (systemId: string): Promise<HelpRequest[]> => {
        try {
            const q = query(
                collection(db, 'help_requests'),
                where('system_id', '==', systemId),
                where('status', '==', 'pending'),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as HelpRequest));
        } catch (error) {
            console.error("Erreur récupérant les demandes d'aide:", error);
            return [];
        }
    },

    /**
     * Marque une demande comme résolue
     */
    resolveRequest: async (requestId: string) => {
        try {
            const requestRef = doc(db, 'help_requests', requestId);
            await updateDoc(requestRef, {
                status: 'resolved',
                resolved_at: Date.now()
            });
        } catch (error) {
            console.error("Erreur résolvant la demande:", error);
            throw error;
        }
    },

    /**
     * Supprime une demande
     */
    deleteRequest: async (requestId: string) => {
        try {
            await deleteDoc(doc(db, 'help_requests', requestId));
        } catch (error) {
            console.error("Erreur supprimant la demande:", error);
            throw error;
        }
    }
};
