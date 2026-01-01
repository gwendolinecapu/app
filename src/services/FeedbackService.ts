
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    startAfter,
    DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Feedback, FeedbackStatus, FeedbackType } from '../types/Feedback';
import CreditService from './CreditService';

const COLLECTION = 'feedbacks';

class FeedbackService {
    /**
     * Creates a new feedback (Bug or Feature)
     */
    async createFeedback(data: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
        const now = Date.now();
        const feedback: Omit<Feedback, 'id'> = {
            ...data,
            status: 'NEW',
            createdAt: now,
            updatedAt: now,
        };
        const docRef = await addDoc(collection(db, COLLECTION), feedback);
        return docRef.id;
    }

    /**
     * Get feedbacks for the current user
     */
    async getUserFeedbacks(userId: string): Promise<Feedback[]> {
        const q = query(
            collection(db, COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
    }

    /**
     * ADMIN: Get all feedbacks with filtering
     */
    async getFeedbacks(
        filter?: { status?: FeedbackStatus; type?: FeedbackType },
        lastDoc?: DocumentSnapshot,
        pageSize: number = 20
    ): Promise<{ feedbacks: Feedback[]; lastDoc: DocumentSnapshot | null }> {
        let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

        if (filter?.status) {
            q = query(q, where('status', '==', filter.status));
            // Note: Compound query with orderBy needs index in Firestore
        }
        if (filter?.type) {
            q = query(q, where('type', '==', filter.type));
        }

        q = query(q, limit(pageSize));

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const feedbacks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

        return { feedbacks, lastDoc: newLastDoc };
    }

    /**
     * ADMIN: Update status and optional admin notes
     */
    async updateStatus(id: string, status: FeedbackStatus, adminNotes?: string): Promise<void> {
        const ref = doc(db, COLLECTION, id);
        const updates: Partial<Feedback> = {
            status,
            updatedAt: Date.now()
        };
        if (adminNotes !== undefined) {
            updates.adminNotes = adminNotes;
        }
        await updateDoc(ref, updates);
    }

    /**
     * ADMIN: Reward a user for a confirmed bug
     */
    async rewardReporter(feedbackId: string, amount: number): Promise<void> {
        if (amount <= 0) return;

        const ref = doc(db, COLLECTION, feedbackId);
        const snap = await getDoc(ref);

        if (!snap.exists()) throw new Error('Feedback not found');
        const feedback = snap.data() as Feedback;

        // Prevent double rewarding if logic requires check, but here we assume Admin knows best.
        // We log the amount in the feedback doc for reference
        await updateDoc(ref, {
            creditRewardAmount: (feedback.creditRewardAmount || 0) + amount,
            status: 'CONFIRMED_BUG' // Auto switch status if rewarded
        });

        // Grant credits via CreditService (system wallet)
        // Ensure CreditService handles "addCredits" correctly for another user?
        // Wait, CreditService defaults to "this.userId". It's a singleton for the CURRENT user.
        // We need a way to credit ANOTHER user.
        // CreditService currently relies on `this.userId`.
        // FIX: We need to use a direct lower-level call or update CreditService to accept userId.

        // Let's implement a direct credit for now to avoid refactoring CreditService singleton for this specific case,
        // OR add a static/helper method in CreditService for Admin operations.
        // Direct transaction here for safety and specific type.

        await CreditService.addCreditsToUser(feedback.userId, amount, 'bug_report_reward', `Récompense Bug: ${feedback.title}`);
    }

    async getFeedbackById(id: string): Promise<Feedback | null> {
        const ref = doc(db, COLLECTION, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Feedback;
        }
        return null;
    }
}

export default new FeedbackService();
