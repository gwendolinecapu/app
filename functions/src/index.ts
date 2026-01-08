import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { processAIJob } from './ai/workers/jobWorker';
import { AIWorkflows } from './ai/services/AIWorkflows';
import { COSTS } from './ai/constants';
import { BillingUtils } from './utils/billing';
import { startAIJob } from './ai/api/startAIJob';
import { cancelAIJob } from './ai/api/cancelAIJob';
import { retryAIJob } from './ai/api/retryAIJob';
import { compareAIModels } from './ai/api/compareAIModels';

admin.initializeApp();

const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"];

export { processAIJob, startAIJob, cancelAIJob, retryAIJob, compareAIModels };

export const performBirthRitual = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    try {
        const { alterId, referenceImageUrls } = data;
        // 1. Charge
        await BillingUtils.chargeCredits(alterId, COSTS.RITUAL, "Rituel de Naissance");
        // 2. Execute directly (Sync)
        const mockJob: any = {
            id: 'sync_' + Date.now(),
            userId: context.auth.uid,
            type: 'ritual',
            status: 'running',
            params: { alterId, referenceImageUrls },
            metadata: { provider: 'mixed', model: 'mixed', costEstimate: COSTS.RITUAL, attempts: 1 },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };
        return await AIWorkflows.performRitual(mockJob);
    }
    catch (e: any) {
        console.error("Ritual Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

export const generateMagicPost = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    try {
        const { alterId, imageCount = 1 } = data;
        // 1. Charge
        let cost = COSTS.POST_STD;
        if (imageCount === 3)
            cost = 25; // Batch discount
        else
            cost = COSTS.POST_STD * imageCount;
        await BillingUtils.chargeCredits(alterId, cost, `Magic Post (${imageCount})`);
        // 2. Execute directly (Sync)
        const mockJob: any = {
            id: 'sync_' + Date.now(),
            userId: context.auth.uid,
            type: 'magic_post',
            status: 'running',
            params: data,
            metadata: { provider: 'mixed', model: 'mixed', costEstimate: cost, attempts: 1 },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };
        return await AIWorkflows.performMagicPost(mockJob);
    }
    catch (e: any) {
        console.error("Magic Post Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});
