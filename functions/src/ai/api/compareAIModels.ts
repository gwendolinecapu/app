import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { BytePlusProvider } from '../providers/BytePlusProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';

const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY", "OPENAI_API_KEY"];

export const compareAIModels = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // Optionally verify AppCheck if needed, but for now kept simple
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');

    // Simple admin check (hardcoded UID or claim) or development flag
    if (context.auth.uid !== 'LEO_ADMIN_UID' && !data.isDev) {
        // Simple protection, or just allow all for this test phase
    }

    const { prompt } = data;
    const openaiKey = process.env.OPENAI_API_KEY;
    const bytePlusKey = process.env.BYTEPLUS_API_KEY;

    if (!openaiKey || !bytePlusKey)
        throw new Error("Missing API Keys");

    // Helper to run and measure
    const runModel = async (name: string, provider: any, opts?: any) => {
        const start = Date.now();
        try {
            // Merge opts and referenceImages
            const generationOpts = { ...opts };
            if (data.referenceImageUrls) {
                generationOpts.referenceImages = data.referenceImageUrls;
            }

            const buffers = await provider.generateInfoImage(prompt, generationOpts);
            const duration = Date.now() - start;

            // Upload to storage to get URL
            const bucket = admin.storage().bucket();
            const file = bucket.file(`comparisons/${name.replace(/\s+/g, '_')}_${Date.now()}.png`);

            await file.save(buffers[0], { metadata: { contentType: 'image/png' } });
            await file.makePublic();

            return {
                name,
                url: file.publicUrl(),
                duration,
                status: 'success'
            };
        }
        catch (e: any) {
            return {
                name,
                error: e.message,
                duration: Date.now() - start,
                status: 'failed'
            };
        }
    };

    // 1. OpenAI GPT-Image 1.5 - Low
    const openai = new OpenAIProvider(openaiKey, "gpt-image-1.5");

    // 2. Seedream 4.5
    const seedream45 = new BytePlusProvider(bytePlusKey, "seedream-4-5-251128");

    // 3. Seedream 4.0
    const seedream40 = new BytePlusProvider(bytePlusKey, "seedream-4-0-250828");

    const promises = [
        runModel('GPT 1.5 Low (1024x1024)', openai, { quality: 'eco' }),
        runModel('GPT 1.5 Mid (1024x1024)', openai, { quality: 'std' }),
        runModel('GPT 1.5 High (1024x1024)', openai, { quality: 'high' }),
        runModel('Seedream 4.5', seedream45),
        runModel('Seedream 4.0', seedream40)
    ];

    const benchmarkResults = await Promise.all(promises);
    return { results: benchmarkResults };
});
