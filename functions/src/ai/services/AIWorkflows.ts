import * as admin from 'firebase-admin';
import { BytePlusProvider } from '../providers/BytePlusProvider';
import { GeminiProvider } from '../providers/GeminiProvider';
import { PromptService } from './PromptService';

// Helper to download image
async function downloadImageAsBase64(url: string): Promise<string> {
    const bucket = admin.storage().bucket();
    if (url.startsWith('gs://')) {
        const filePath = url.split('/').slice(3).join('/');
        const [file] = await bucket.file(filePath).download();
        return file.toString('base64');
    }
    else if (url.includes('firebasestorage') || url.startsWith('http')) {
        const res = await fetch(url);
        if (!res.ok)
            throw new Error("Failed to fetch image");
        const buf = await res.arrayBuffer();
        return Buffer.from(buf).toString('base64');
    }
    return "";
}

async function uploadImage(buffer: Buffer, path: string): Promise<string> {
    const bucket = admin.storage().bucket();
    const file = bucket.file(path);
    await file.save(buffer, { metadata: { contentType: 'image/png' } });
    await file.makePublic();
    return file.publicUrl();
}

// Helper to check for cancellation
async function checkCancelled(jobId: string) {
    const doc = await admin.firestore().collection('ai_jobs').doc(jobId).get();
    if (doc.data()?.status === 'cancelled')
        throw new Error("Job Cancelled");
}

export const AIWorkflows = {
    async performRitual(job: any) {
        // Direct BytePlus (Seedream 4.5) Implementation - No Router, No Gemini
        const { id: jobId, params } = job;
        const { alterId, referenceImageUrls } = params;

        if (!alterId || !referenceImageUrls)
            throw new Error("Missing params");

        await checkCancelled(jobId);

        // 1. Download Images
        const imagesBase64 = await Promise.all(referenceImageUrls.map(downloadImageAsBase64));
        await checkCancelled(jobId);

        // 2. Direct Generation (Skip Analysis)
        const refSheetPrompt = PromptService.getRitualRefSheetPrompt();

        // Instantiate BytePlus Provider directly
        // We need to access the API Key. In Cloud Functions, it's in process.env if secrets are declared.
        // We assume 'BYTEPLUS_API_KEY' is available as per index.ts secrets.
        const apiKey = process.env.BYTEPLUS_API_KEY;
        if (!apiKey) throw new Error("Missing BYTEPLUS_API_KEY");

        const provider = new BytePlusProvider(apiKey, 'seedream-4-5-251128');

        const genOptions = {
            referenceImages: imagesBase64,
            width: 1024, // BytePlus standard/optimal
            height: 1024 // BytePlus standard/optimal - Aspect Ratio will be handled by provider or we request wide?
            // Seedream/BytePlus usually handles resolution. Let's request 1024x1024 or similar.
            // User wanted "Wide" ref sheet. 
            // If we want wide, maybe 1280x720 or 1024x576? 
            // Let's stick to square or standard 3:4 for safety unless we know Seedream supports specific AR.
            // Reverting to standard high res.
        };

        const resultBuffers = await provider.generateInfoImage(refSheetPrompt, genOptions);

        await checkCancelled(jobId);

        // 3. Upload & Save
        const refSheetUrl = await uploadImage(resultBuffers[0], `alters/${alterId}/visual_dna/ref_sheet_${Date.now()}.png`);

        await admin.firestore().collection('alters').doc(alterId).update({
            'visual_dna.description': "Généré par Seedream 4.5", // Static desc since we removed analysis
            'visual_dna.reference_sheet_url': refSheetUrl,
            'visual_dna.is_ready': true,
            'visual_dna.updated_at': admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            visualDescription: "Généré par Seedream 4.5",
            refSheetUrl,
            metadata: {
                providerUsed: 'byteplus-direct',
                model: 'seedream-4.5'
            }
        };
    },
    async performMagicPost(job: any) {
        const { id: jobId, params } = job;
        const { alterId, prompt, style, imageCount, sceneImageUrl, poseImageUrl } = params;
        const count = imageCount || 1;
        const selectedStyle = style || "Cinematic";

        await checkCancelled(jobId);

        // 1. Get Alter Context
        const alterDoc = await admin.firestore().collection('alters').doc(alterId).get();
        const alterData = alterDoc.data();
        const charDesc = alterData?.visual_dna?.description || alterData?.name || "A character";

        // 2. Enhance Prompt (Gemini Direct)
        const enhancementPrompt = PromptService.getMagicPromptExpansion(prompt, charDesc, selectedStyle);

        const googleApiKey = process.env.GOOGLE_AI_API_KEY;
        if (!googleApiKey) throw new Error("Missing GOOGLE_AI_API_KEY");
        const llmProvider = new GeminiProvider(googleApiKey, 'gemini-1.5-flash');

        const magicPrompt = await llmProvider.generateText(enhancementPrompt);
        await checkCancelled(jobId);

        // 3. Prepare References
        const references: string[] = [];
        if (sceneImageUrl)
            references.push(await downloadImageAsBase64(sceneImageUrl));
        if (poseImageUrl)
            references.push(await downloadImageAsBase64(poseImageUrl));

        await checkCancelled(jobId);

        // 4. Generate Images (BytePlus Direct)
        const bytePlusKey = process.env.BYTEPLUS_API_KEY;
        if (!bytePlusKey) throw new Error("Missing BYTEPLUS_API_KEY");
        const imageProvider = new BytePlusProvider(bytePlusKey, 'seedream-4-5-251128');

        // Parallel generation if count > 1
        // Note: BytePlus provider returns Buffer[] because of parallel/batch possibilities in API, but usually 1 unless configured
        // We will call it 'count' times in parallel or use API features if available. Provider wrapper does simplified single call usually.
        // Let's call it in parallel to be safe and fast.
        const promises = Array.from({ length: count }).map(() => imageProvider.generateInfoImage(magicPrompt, {
            referenceImages: references,
            width: 1024,
            height: 1024
        }));

        const nestedResults = await Promise.all(promises);
        await checkCancelled(jobId);

        // Flatten results
        const allBuffers: Buffer[] = nestedResults.flat();

        // 5. Upload
        const uploadPromises = allBuffers.map((buf, idx) => uploadImage(buf, `posts/ai/${alterId}_${Date.now()}_${idx}.png`));
        const imageUrls = await Promise.all(uploadPromises);

        return {
            images: imageUrls,
            magicPrompt,
            metadata: {
                providerUsed: {
                    prompt: 'gemini-direct',
                    generation: 'byteplus-direct'
                },
                fallbackUsed: false
            }
        };
    },
    async performChat(job: any) {
        const { messages, context } = job.params;
        const systemPrompt = PromptService.getChatSystemPrompt(context?.traits, context?.recentSummary);

        const googleApiKey = process.env.GOOGLE_AI_API_KEY;
        if (!googleApiKey) throw new Error("Missing GOOGLE_AI_API_KEY");
        const llmProvider = new GeminiProvider(googleApiKey, 'gemini-1.5-flash');

        const response = await llmProvider.chat(messages, { systemInstruction: systemPrompt });

        return {
            message: response,
            metadata: {
                providerUsed: 'gemini-direct',
                model: 'gemini-1.5-flash'
            }
        };
    }
};
