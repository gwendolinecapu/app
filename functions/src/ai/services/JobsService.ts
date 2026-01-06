import * as admin from "firebase-admin";
import { AIJob, JobStatus } from "../interfaces/IAIJob";

const db = admin.firestore();
const COLLECTION = 'ai_jobs';

export const JobsService = {
    async createJob(job: Omit<AIJob, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<string> {
        const docRef = db.collection(COLLECTION).doc();
        const newJob: AIJob = {
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

    async updateStatus(jobId: string, status: JobStatus, updates?: Partial<AIJob>) {
        await db.collection(COLLECTION).doc(jobId).update({
            status,
            updatedAt: admin.firestore.Timestamp.now(),
            ...updates
        });
    },

    async updateProgress(jobId: string, percent: number, stage: string) {
        await db.collection(COLLECTION).doc(jobId).update({
            progress: { percent, stage },
            updatedAt: admin.firestore.Timestamp.now()
        });
    },

    async failJob(jobId: string, error: { code: string, message: string, details?: any }) {
        await db.collection(COLLECTION).doc(jobId).update({
            status: 'failed',
            error,
            updatedAt: admin.firestore.Timestamp.now()
        });
    }
};
