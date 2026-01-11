
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InnerWorld, InnerWorldShape } from '../types';

const WORLDS_COLLECTION = 'inner_worlds';
const SHAPES_COLLECTION = 'inner_world_shapes';

export const InnerWorldService = {
    /**
     * Fetch all Inner Worlds for a specific alter
     */
    fetchWorlds: async (alterId: string, systemId: string): Promise<InnerWorld[]> => {
        const q = query(
            collection(db, WORLDS_COLLECTION),
            where('system_id', '==', systemId),
            where('alter_id', '==', alterId),
            orderBy('updated_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            created_at: d.data().created_at?.toDate()?.toISOString() || new Date().toISOString(),
            updated_at: d.data().updated_at?.toDate()?.toISOString() || new Date().toISOString(),
        } as InnerWorld));
    },

    /**
     * Create a new Inner World
     */
    createWorld: async (data: Omit<InnerWorld, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
        const docRef = await addDoc(collection(db, WORLDS_COLLECTION), {
            ...data,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
        return docRef.id;
    },

    /**
     * Delete an Inner World
     */
    deleteWorld: async (worldId: string): Promise<void> => {
        // Note: In production, consider a cloud function to delete sub-collection/related shapes
        await deleteDoc(doc(db, WORLDS_COLLECTION, worldId));
    },

    /**
     * Real-time subscription to shapes of a world
     */
    subscribeToShapes: (
        worldId: string,
        systemId: string,
        onUpdate: (shapes: InnerWorldShape[]) => void,
        onError?: (error: any) => void
    ) => {
        const q = query(
            collection(db, SHAPES_COLLECTION),
            where('system_id', '==', systemId),
            where('world_id', '==', worldId),
            orderBy('created_at', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const shapes = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                created_at: d.data().created_at?.toDate()?.toISOString() || new Date().toISOString(),
            } as InnerWorldShape));
            onUpdate(shapes);
        }, (error) => {
            if (onError) onError(error);
            else console.error('Snapshot error:', error);
        });
    },

    /**
     * Add a shape to a world
     */
    addShape: async (shape: Omit<InnerWorldShape, 'id' | 'created_at'>, systemId: string): Promise<string> => {
        const docRef = await addDoc(collection(db, SHAPES_COLLECTION), {
            ...shape,
            system_id: systemId,
            created_at: serverTimestamp(),
        });

        // Update world's updated_at
        await updateDoc(doc(db, WORLDS_COLLECTION, shape.world_id), {
            updated_at: serverTimestamp()
        });

        return docRef.id;
    },

    /**
     * Update a shape
     */
    updateShape: async (shapeId: string, worldId: string, updates: Partial<InnerWorldShape>): Promise<void> => {
        await updateDoc(doc(db, SHAPES_COLLECTION, shapeId), updates);

        // Update world's updated_at
        await updateDoc(doc(db, WORLDS_COLLECTION, worldId), {
            updated_at: serverTimestamp()
        });
    },

    /**
     * Delete a shape
     */
    deleteShape: async (shapeId: string, worldId: string): Promise<void> => {
        await deleteDoc(doc(db, SHAPES_COLLECTION, shapeId));

        // Update world's updated_at
        await updateDoc(doc(db, WORLDS_COLLECTION, worldId), {
            updated_at: serverTimestamp()
        });
    }
};
