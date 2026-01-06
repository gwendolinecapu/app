import { Timestamp } from 'firebase-admin/firestore';

export interface AIJob {
    id: string;
    userId: string;
    type: 'ritual' | 'magic_post' | 'chat';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    params: any;
    metadata?: any;
    result?: any;
    error?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
