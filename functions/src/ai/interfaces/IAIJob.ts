import { Timestamp } from 'firebase-admin/firestore';

export type JobType = 'magic_post' | 'ritual' | 'chat' | 'summary';
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface AIJobStartRequest {
    type: JobType;
    params: any;
}

export interface AIJob {
    id: string;
    userId: string; // The system/user ID
    alterId?: string; // Optional context
    type: JobType;
    status: JobStatus;

    // Inputs
    params: {
        prompt?: string;
        imageUrls?: string[]; // References/Guidance
        style?: string;
        quality?: string;
        count?: number;
        [key: string]: any;
    };

    // Outputs
    result?: {
        text?: string;
        images?: string[];
        [key: string]: any;
    };

    // Error handling
    error?: {
        code: string;
        message: string;
        details?: any;
    };

    // Tracking
    progress?: {
        percent: number;
        stage: string;
        message?: string;
    };
    duration?: number; // Execution duration in ms
    completedAt?: string; // ISO String

    metadata: {
        provider: string; // e.g., 'gemini', 'byteplus'
        model: string;
        costEstimate: number;
        attempts: number;
        maxAttempts?: number;
    };

    createdAt: Timestamp;
    updatedAt: Timestamp;
}
