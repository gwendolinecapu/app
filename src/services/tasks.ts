import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Task } from '../types';

export const TaskService = {
    /**
     * Créer une nouvelle tâche
     */
    async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'is_completed'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, 'tasks'), {
                ...taskData,
                is_completed: false,
                created_at: new Date().toISOString(),
                // S'assurer que les valeurs optionnelles sont null si undefined
                assigned_to: taskData.assigned_to || null,
                due_date: taskData.due_date || null,
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        }
    },

    /**
     * Récupérer les tâches d'un système
     * @param systemId ID du système
     * @param assigneeId (Optionnel) Filtrer par alter assigné. Si 'system', cherche les tâches assignées à null.
     */
    async getTasks(systemId: string, assigneeId?: string): Promise<Task[]> {
        let q = query(
            collection(db, 'tasks'),
            where('system_id', '==', systemId),
            orderBy('created_at', 'desc')
        );

        // Note: Firestore nécessite des index composites pour certaines requêtes avec where multiples + orderBy
        // Pour l'instant on filtre en JS si besoin ou on garde des requêtes simples

        const snapshot = await getDocs(q);
        let tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));

        // Filtrage côté client pour éviter complexité index Firestore pour l'instant
        if (assigneeId) {
            if (assigneeId === 'system') {
                tasks = tasks.filter(t => t.assigned_to === null);
            } else if (assigneeId === 'all') {
                // Pas de filtre
            } else {
                tasks = tasks.filter(t => t.assigned_to === assigneeId);
            }
        }

        return tasks;
    },

    /**
     * Marquer une tâche comme complétée/non-complétée
     */
    async toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<void> {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null
        });
    },

    /**
     * Supprimer une tâche
     */
    async deleteTask(taskId: string): Promise<void> {
        await deleteDoc(doc(db, 'tasks', taskId));
    }
};
