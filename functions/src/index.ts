import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { processAIJob } from './ai/workers/jobWorker';
import { AIWorkflows } from './ai/services/AIWorkflows';
import { COSTS } from './ai/constants';
import { BillingUtils } from './utils/billing';
import { startAIJob } from './ai/api/startAIJob';
import { cancelAIJob } from './ai/api/cancelAIJob';
import { retryAIJob } from './ai/api/retryAIJob';
import { uploadVideo } from './ai/utils/videoCompression';

admin.initializeApp();

const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"];

export { processAIJob, startAIJob, cancelAIJob, retryAIJob };
export * from './integrations/github';

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
        console.log('🎨 [MAGIC POST] Starting generation with params:', JSON.stringify(data, null, 2));

        const { alterId, imageCount = 1 } = data;

        // 1. Charge
        let cost = COSTS.POST_STD;
        if (imageCount === 3)
            cost = 25; // Batch discount
        else
            cost = COSTS.POST_STD * imageCount;

        console.log(`💰 Charging ${cost} credits for ${imageCount} images`);
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

        console.log('🚀 Calling AIWorkflows.performMagicPost...');
        const result = await AIWorkflows.performMagicPost(mockJob);
        console.log('✅ Magic Post generation successful:', result);

        return result;
    }
    catch (e: any) {
        console.error("❌ Magic Post Error:", e);
        console.error("Stack trace:", e.stack);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

/**
 * Upload and compress video for posts/stories
 * Automatically compresses to 1080p TikTok-style quality
 */
export const uploadVideoPost = functions.runWith({
    timeoutSeconds: 540, // 9 minutes for video processing
    memory: "2GB" // More memory for video processing
}).https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');

    try {
        const { videoBase64, alterId, type = 'post', compress = true } = data;

        if (!videoBase64 || !alterId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing videoBase64 or alterId');
        }

        // Convert base64 to buffer
        const videoBuffer = Buffer.from(videoBase64, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${type}s/videos/${alterId}_${timestamp}.mp4`;

        // Upload with automatic compression
        const publicUrl = await uploadVideo(videoBuffer, filename, compress);

        // Optional: Save metadata to Firestore
        await admin.firestore().collection('videos').add({
            userId: context.auth.uid,
            alterId,
            type,
            url: publicUrl,
            compressed: compress,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            url: publicUrl,
            compressed: compress
        };
    }
    catch (e: any) {
        console.error("Video Upload Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

