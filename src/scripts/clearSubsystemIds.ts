// Script to clear subsystem_id from all base alters (like Zeph)
// Run this in Firebase Console or as a Cloud Function

import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

export const clearSubsystemFromBaseAlters = async (userId: string) => {
    try {
        // Get all alters for this user
        const altersRef = collection(db, 'alters');
        const q = query(altersRef, where('system_id', '==', userId));
        const snapshot = await getDocs(q);

        const updates: Promise<void>[] = [];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // If this alter has a subsystem_id AND has the same name as a subsystem, 
            // it's likely a base alter that was incorrectly assigned
            // Clear the subsystem_id
            if (data.subsystem_id) {
                console.log(`Clearing subsystem_id from alter: ${data.name}`);
                updates.push(
                    updateDoc(doc(db, 'alters', docSnap.id), {
                        subsystem_id: null
                    })
                );
            }
        });

        await Promise.all(updates);
        console.log(`Cleared subsystem_id from ${updates.length} alters`);
        return updates.length;
    } catch (error) {
        console.error('Error clearing subsystem IDs:', error);
        throw error;
    }
};
