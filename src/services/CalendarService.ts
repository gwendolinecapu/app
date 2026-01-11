
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

export type EventType = 'appointment' | 'reminder' | 'fronting' | 'social' | 'other';

export interface CalendarEvent {
    id: string;
    systemId: string;
    title: string;
    description?: string;
    startTime: number; // Timestamp ms
    endTime: number;   // Timestamp ms
    type: EventType;
    concernedAlters: string[]; // Alter IDs
    createdBy: string; // Alter ID
    createdAt: number;
}

const COLLECTION = 'calendar_events';

export const CalendarService = {
    /**
     * Create a new event
     */
    async createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
        try {
            const newEvent = {
                ...event,
                createdAt: Date.now(),
            };

            const docRef = await addDoc(collection(db, COLLECTION), newEvent);

            return {
                id: docRef.id,
                ...newEvent,
            };
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    /**
     * Get events for a system within a time range
     */
    async getEvents(systemId: string, start: number, end: number): Promise<CalendarEvent[]> {
        try {
            // Firestore queries on multiple fields can be tricky without composite indexes.
            // Simplified query: get all future-ish events or just filter by systemId and filter locally for range
            // For better performance, we should index. For now, let's fetch by systemId and day range if possible, 
            // or just systemId and sort.

            const q = query(
                collection(db, COLLECTION),
                where('systemId', '==', systemId),
                where('startTime', '>=', start),
                where('startTime', '<=', end),
                orderBy('startTime', 'asc')
            );

            // Note: Range query might require composite index (systemId + startTime).
            // If it fails, check console link to create index.

            const querySnapshot = await getDocs(q);
            const events: CalendarEvent[] = [];

            querySnapshot.forEach((doc) => {
                events.push({ id: doc.id, ...doc.data() as Omit<CalendarEvent, 'id'> });
            });

            return events;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    /**
     * Update an event
     */
    async updateEvent(eventId: string, updates: Partial<Omit<CalendarEvent, 'id' | 'systemId' | 'createdAt'>>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION, eventId);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    /**
     * Delete an event
     */
    async deleteEvent(eventId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, COLLECTION, eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
};
