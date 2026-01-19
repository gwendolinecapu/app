
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
    DocumentSnapshot,
    runTransaction,
    QueryConstraint
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
        const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

        if (filter?.status) {
            constraints.push(where('status', '==', filter.status));
        }
        if (filter?.type) {
            constraints.push(where('type', '==', filter.type));
        }

        constraints.push(limit(pageSize));

        if (lastDoc) {
            constraints.push(startAfter(lastDoc));
        }

        const q = query(collection(db, COLLECTION), ...constraints);
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

    /**
     * PUBLIC: Get feature requests ordered by votes
     */
    async getPublicFeatures(pageSize: number = 50): Promise<Feedback[]> {
        const q = query(
            collection(db, COLLECTION),
            where('type', '==', 'FEATURE'),
            orderBy('voteCount', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
    }

    /**
     * Toggle vote on a feature request
     */
    async voteFeedback(feedbackId: string, userId: string): Promise<void> {
        const ref = doc(db, COLLECTION, feedbackId);

        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(ref);
            if (!docSnap.exists()) throw new Error("Feedback not found");

            const data = docSnap.data() as Feedback;
            if (data.type !== 'FEATURE') throw new Error("Can only vote on features");

            const votes = data.votes || [];
            const hasVoted = votes.includes(userId);

            let newVotes;
            let newCount;

            if (hasVoted) {
                newVotes = votes.filter(id => id !== userId);
                newCount = Math.max(0, (data.voteCount || 0) - 1);
            } else {
                newVotes = [...votes, userId];
                newCount = (data.voteCount || 0) + 1;
            }

            transaction.update(ref, {
                votes: newVotes,
                voteCount: newCount
            });
        });
    }
}

export default new FeedbackService();
