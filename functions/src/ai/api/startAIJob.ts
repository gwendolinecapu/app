
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { AIJobStartRequest, AIJob } from "./ai/interfaces/IAIJob";
import { JobsService } from "./ai/services/JobsService";
import { BillingUtils } from "./utils/billing";
import { COSTS } from "./ai/constants";

// The unified entry point for creating AI jobs safely
export const startAIJob = functions.runWith({
    secrets: ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"],
    timeoutSeconds: 60,
    memory: "256MB"
    // @ts-ignore
}).https.onCall(async (data: AIJobStartRequest, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }
    const userId = context.auth.uid;
    const { type, params } = data;

    // 2. Rate Limiting Check (Simple)
    // Check if user has > 3 running jobs
    const activeJobsSnap = await admin.firestore().collection('ai_jobs')
        .where('userId', '==', userId)
        .where('status', 'in', ['queued', 'running'])
        .get();

    if (activeJobsSnap.size >= 3) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many active jobs. Please wait.');
    }

    // 3. Validation & Cost Calculation
    let cost = 0;
    let description = "";

    switch (type) {
        case 'ritual':
            if (!params.alterId || !params.referenceImageUrls) throw new functions.https.HttpsError('invalid-argument', 'Missing params');
            cost = COSTS.RITUAL;
            description = "Rituel de Naissance";
            break;

        case 'magic_post':
            if (!params.alterId || !params.prompt) throw new functions.https.HttpsError('invalid-argument', 'Missing params');
            const count = params.imageCount || 1;
            // Batch discount logic
            if (count === 3) cost = 25;
            else cost = COSTS.POST_STD * count;
            description = `Magic Post (${count})`;
            break;

        case 'chat':
            // Chat might be free or micro-cost, assume free for sprint 2 hookup or small cost
            cost = 0;
            description = "Soul Chat";
            break;

        default:
            throw new functions.https.HttpsError('invalid-argument', `Unknown job type: ${type}`);
    }

    // 4. Charge Credits (Atomic)
    if (cost > 0) {
        // If charge fails, it throws 'resource-exhausted' and we stop here.
        await BillingUtils.chargeCredits(params.alterId, cost, description);
    }

    // 5. Create Job (Queued)
    const jobId = await JobsService.createJob({
        userId,
        type,
        params,
        metadata: {
            costEstimate: cost,
            attempts: 0,
            provider: 'auto',
            model: 'auto'
        }
    });

    // Return the Job ID so frontend can subscribe
    return { success: true, jobId };
});
