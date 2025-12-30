import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'violence' | 'other';

export const ReportingService = {
    /**
     * Submit a report against a user or content
     */
    submitReport: async (
        reporterId: string,
        targetId: string, // Post ID or User ID
        targetType: 'post' | 'user' | 'comment',
        reason: ReportReason,
        details?: string
    ) => {
        try {
            await addDoc(collection(db, 'reports'), {
                reporterId,
                targetId,
                targetType,
                reason,
                details: details || '',
                status: 'pending',
                created_at: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
        }
    }
};
