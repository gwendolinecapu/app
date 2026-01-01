import { collection, addDoc, query, where, getDocs, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Alter, FrontingEntry } from '../types';

export interface ImportResult {
    altersCreated: number;
    historyEntriesCreated: number;
    errors: string[];
}

export const ImportService = {
    /**
     * Parse et importe un fichier JSON Simply Plural
     */
    async importSimplyPluralData(jsonData: any, systemId: string, userId: string): Promise<ImportResult> {
        const result: ImportResult = {
            altersCreated: 0,
            historyEntriesCreated: 0,
            errors: []
        };

        try {
            // 1. Import des Alters (Members)
            // SP utilise souvent 'content' pour les détails ou direct properties
            const members = jsonData.members || []; // Ajuster selon le format réel
            const spIdToFirebaseId: Record<string, string> = {};



            // Récupérer les alters existants pour éviter les doublons de noms
            const existingAltersQuery = query(collection(db, 'alters'), where('system_id', '==', systemId));
            const existingDocs = await getDocs(existingAltersQuery);
            const existingNames = new Set(existingDocs.docs.map(d => d.data().name?.toLowerCase()));

            let batch = writeBatch(db);
            let operationCount = 0;

            for (const member of members) {
                const name = member.content?.name || member.name || 'Sans nom';

                if (existingNames.has(name.toLowerCase())) {
                    result.errors.push(`Alter "${name}" ignoré (existe déjà)`);
                    // On pourrait mapper l'ID SP vers l'ID Firebase existant si on voulait lier l'historique
                    // Mais pour l'instant on skip simplement
                    continue;
                }

                const newAlterRef = doc(collection(db, 'alters'));
                const newAlter: Partial<Alter> = {
                    id: newAlterRef.id,
                    system_id: systemId, // Important: champ requis par nos règles de sécu
                    userId: userId,     // Backward compat
                    name: name,
                    pronouns: member.content?.pronouns || member.pronouns || '',
                    bio: member.content?.desc || member.desc || member.description || '',
                    avatar_url: member.content?.avatarUuid || member.avatarUuid || member.avatarUrl || null, // SP utilise souvent avatarUuid
                    color: member.content?.color || member.color || '#cccccc',
                    is_active: false,
                    created_at: member.content?.created || member.created ? new Date(member.content?.created || member.created) : new Date(),
                    imported_from: 'simply_plural' // Flag utile
                } as any;

                batch.set(newAlterRef, newAlter);
                spIdToFirebaseId[member.content?.uid || member.uid || member.id] = newAlterRef.id;

                result.altersCreated++;
                operationCount++;

                // Commit batch par lots de 500
                if (operationCount >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                }
            }

            // 2. Import de l'Historique (Front History)
            const history = jsonData.frontHistory || jsonData.history || [];

            for (const entry of history) {
                const memberIdSP = entry.content?.member || entry.member;
                const firebaseAlterId = spIdToFirebaseId[memberIdSP];

                // Si on n'a pas créé l'alter (doublon ou pas trouvé), on essaie de trouver l'alter existant ?
                // Pour cette V1, on n'importe l'historique que pour les nouveaux alters créés pour simplifier
                if (!firebaseAlterId) continue;

                const startTime = entry.content?.startTime || entry.startTime;
                const endTime = entry.content?.endTime || entry.endTime;

                if (!startTime) continue;

                const start = new Date(startTime);
                const end = endTime ? new Date(endTime) : null;
                const duration = end ? (end.getTime() - start.getTime()) / 1000 : 0;

                const historyRef = doc(collection(db, 'fronting_history'));
                batch.set(historyRef, {
                    system_id: systemId,
                    alter_id: firebaseAlterId,
                    start_time: start,
                    end_time: end,
                    duration: duration,
                    imported_from: 'simply_plural'
                });

                result.historyEntriesCreated++;
                operationCount++;

                if (operationCount >= 450) {
                    await batch.commit();
                    batch = writeBatch(db);
                    operationCount = 0;
                }
            }

            // Commit final
            if (operationCount > 0) {
                await batch.commit();
            }

        } catch (error) {
            console.error("Erreur fatal import:", error);
            result.errors.push("Erreur critique lors de l'import: " + error);
        }

        return result;
    }
};
