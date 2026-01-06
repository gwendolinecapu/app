
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { processAIJob } from "./ai/workers/jobWorker";
import { AIWorkflows } from "./ai/services/AIWorkflows";
import { GeminiProvider } from "./ai/providers/GeminiProvider";
import { BytePlusProvider } from "./ai/providers/BytePlusProvider";
import { AIJob } from "./ai/interfaces/IAIJob";
import { COSTS } from "./ai/constants";
import { BillingUtils } from "./utils/billing";

// API
import { startAIJob } from "./ai/api/startAIJob";

admin.initializeApp();

// Export Cloud Functions
export { processAIJob, startAIJob };

// --- Configuration ---
const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"];

// --- Interfaces (Legacy / Frontend Contract) ---
interface RitualRequest {
    alterId: string;
    referenceImageUrls: string[];
}

interface MagicPostRequest {
    alterId: string;
    prompt: string;
    quality: 'eco' | 'mid' | 'high';
    imageCount?: number;
    sceneImageUrl?: string;
    style?: string;
    poseImageUrl?: string;
    isBodySwap?: boolean;
}

// --- Legacy HTTPS Functions (Keep for backward compatibility for minimal downtime during user update) ---

export const performBirthRitual = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: RitualRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    try {
        const { alterId, referenceImageUrls } = data;
        const googleKey = process.env.GOOGLE_AI_API_KEY;
        const bytePlusKey = process.env.BYTEPLUS_API_KEY;

        if (!googleKey || !bytePlusKey) throw new Error("Missing Server Config (Keys)");

        // 1. Charge
        await BillingUtils.chargeCredits(alterId, COSTS.RITUAL, "Rituel de Naissance");

        // 2. Execute directly (Sync)
        const llm = new GeminiProvider(googleKey, "gemini-1.5-flash");
        const imageGen = new BytePlusProvider(bytePlusKey);

        const mockJob: AIJob = {
            id: 'sync_' + Date.now(),
            userId: context.auth.uid,
            type: 'ritual',
            status: 'running',
            params: { alterId, referenceImageUrls },
            metadata: { provider: 'mixed', model: 'mixed', costEstimate: COSTS.RITUAL, attempts: 1 },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };

        return await AIWorkflows.performRitual(mockJob, llm, imageGen);

    } catch (e: any) {
        console.error("Ritual Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

export const generateMagicPost = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: MagicPostRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    try {
        const { alterId, imageCount = 1 } = data;
        const googleKey = process.env.GOOGLE_AI_API_KEY;
        const bytePlusKey = process.env.BYTEPLUS_API_KEY;

        if (!googleKey || !bytePlusKey) throw new Error("Missing Server Config (Keys)");

        // 1. Charge
        let cost = COSTS.POST_STD;
        if (imageCount === 3) cost = 25; // Batch discount
        else cost = COSTS.POST_STD * imageCount;

        await BillingUtils.chargeCredits(alterId, cost, `Magic Post (${imageCount})`);

        // 2. Execute directly (Sync)
        const llm = new GeminiProvider(googleKey, "gemini-1.5-flash");
        const imageGen = new BytePlusProvider(bytePlusKey);

        const mockJob: AIJob = {
            id: 'sync_' + Date.now(),
            userId: context.auth.uid,
            type: 'magic_post',
            status: 'running',
            params: data,
            metadata: { provider: 'mixed', model: 'mixed', costEstimate: cost, attempts: 1 },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };

        return await AIWorkflows.performMagicPost(mockJob, llm, imageGen);

    } catch (e: any) {
        console.error("Magic Post Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});
