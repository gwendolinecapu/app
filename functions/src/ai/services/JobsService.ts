import * as admin from 'firebase-admin';
import { AIJob } from '../interfaces/IAIJob';

const COLLECTION = 'ai_jobs';

export const JobsService = {
    async createJob(job: Omit<AIJob, 'id' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const db = admin.firestore();
        const docRef = db.collection(COLLECTION).doc();

        const newJob: any = {
            id: docRef.id,
            ...job,
            status: 'queued',
            progress: { percent: 0, stage: 'queued' },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };

        await docRef.set(newJob);
        return docRef.id;
    },

    async updateStatus(jobId: string, status: string, updates: any = {}) {
        await admin.firestore().collection(COLLECTION).doc(jobId).update({
            status,
            updatedAt: admin.firestore.Timestamp.now(),
            ...updates
        });
    },

    async updateProgress(jobId: string, percent: number, stage: string) {
        await admin.firestore().collection(COLLECTION).doc(jobId).update({
            progress: { percent, stage },
            updatedAt: admin.firestore.Timestamp.now()
        });
    },

    async failJob(jobId: string, error: any) {
        await admin.firestore().collection(COLLECTION).doc(jobId).update({
            status: 'failed',
            error,
            updatedAt: admin.firestore.Timestamp.now()
        });
    }
};
