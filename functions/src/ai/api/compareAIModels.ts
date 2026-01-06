import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { BytePlusProvider } from "../providers/BytePlusProvider";
import { OpenAIProvider } from "../providers/OpenAIProvider";

const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"];

export const compareAIModels = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: { prompt: string, isDev?: boolean, referenceImageUrls?: string[] }, context: functions.https.CallableContext) => {
    // Optionally verify AppCheck if needed, but for now kept simple
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (context.auth.uid !== 'LEO_ADMIN_UID' && !data.isDev) {
        // Simple protection, or just allow all for this test phase
    }

    const { prompt } = data;
    const openaiKey = process.env.OPENAI_API_KEY;
    const bytePlusKey = process.env.BYTEPLUS_API_KEY;

    if (!openaiKey || !bytePlusKey) throw new Error("Missing API Keys");


    // Helper to run and measure
    const runModel = async (name: string, provider: any, opts?: any) => {
        const start = Date.now();
        try {
            // Merge opts and referenceImages
            const generationOpts = { ...opts };
            if (data.referenceImageUrls && data.referenceImageUrls.length > 0) {
                // For now, assuming providers take base64 or urls?
                // BytePlus provider expects `referenceImages` (base64 or data uri).
                // We should probably download them here to be safe and consistent.
                // BUT, for speed in this lab tool, let's pass URLs if provider supports, OR download.
                // Comparison function: let's download to base64 to be robust.
                // Reuse logic from AIWorkflows? Or just fetch.
            }
            // Actually, to keep it simple for this "lab", let's assume we pass the URLs, 
            // and the Provider determines if it needs to download or if it can use URLs.
            // BytePlusProvider line 29: checks for 'http' or 'data:'. So URLs are fine!

            if (data.referenceImageUrls) {
                generationOpts.referenceImages = data.referenceImageUrls;
            }

            const buffers = await provider.generateInfoImage(prompt, generationOpts);
            const duration = Date.now() - start;

            // Upload to storage to get URL
            const bucket = admin.storage().bucket();
            const file = bucket.file(`comparisons / ${name}_${Date.now()}.png`);
            await file.save(buffers[0], { metadata: { contentType: 'image/png' } });
            await file.makePublic();

            return {
                name,
                url: file.publicUrl(),
                duration,
                status: 'success'
            };
        } catch (e: any) {
            return {
                name,
                error: e.message,
                duration: Date.now() - start,
                status: 'failed'
            };
        }
    };

    // 1. OpenAI GPT-Image 1.5 - Low
    // Using 'eco' which maps to 'low' in our updated provider logic
    const openai = new OpenAIProvider(openaiKey, "gpt-image-1.5");

    // 2. OpenAI GPT-Image 1.5 - Mid
    // Using 'std' which maps to 'medium' in our updated provider logic

    // 3. Seedream 4.5 (Exact slug provided by user)
    const seedream45 = new BytePlusProvider(bytePlusKey, "seedream-4-5-251128");

    // 4. Seedream 4.0 (Exact slug provided by user)
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
