import * as admin from "firebase-admin";
import { AIJob } from "../interfaces/IAIJob";
import { PromptService } from "./PromptService";
import { AIRouter } from "./AIRouter";

// Helper to download image
async function downloadImageAsBase64(url: string): Promise<string> {
    const bucket = admin.storage().bucket();
    if (url.startsWith('gs://')) {
        const filePath = url.split('/').slice(3).join('/');
        const [file] = await bucket.file(filePath).download();
        return file.toString('base64');
    } else if (url.includes('firebasestorage') || url.startsWith('http')) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch image");
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
    if (doc.data()?.status === 'cancelled') throw new Error("Job Cancelled");
}

export const AIWorkflows = {
    async performRitual(job: AIJob): Promise<any> {
        const router = new AIRouter();
        const { id: jobId, params } = job;
        const { alterId, referenceImageUrls } = params;
        if (!alterId || !referenceImageUrls) throw new Error("Missing params");

        await checkCancelled(jobId);

        // 1. Analyze (Vision)
        const imagesBase64 = await Promise.all((referenceImageUrls as string[]).map(downloadImageAsBase64));
        await checkCancelled(jobId);

        const analysisPrompt = PromptService.getRitualAnalysisPrompt();

        // Use Router
        const analysisRes = await router.analyzeImage(imagesBase64[0], analysisPrompt);
        const visualDescription = analysisRes.result;
        await checkCancelled(jobId);

        // 2. Ref Sheet (Image Gen)
        const refSheetPrompt = PromptService.getRitualRefSheetPrompt(visualDescription);

        // Map specific model override if provided
        let genOptions: any = {
            referenceImages: imagesBase64,
            width: 2048, height: 2048
        };

        if (params.model) {
            if (params.model === 'gpt-1.5-low') {
                genOptions.provider = 'openai';
                genOptions.quality = 'eco';
                genOptions.model = 'gpt-image-1.5';
            } else if (params.model === 'gpt-1.5-mid') {
                genOptions.provider = 'openai';
                genOptions.quality = 'std';
                genOptions.model = 'gpt-image-1.5';
            } else if (params.model === 'gpt-1.5-high') {
                genOptions.provider = 'openai';
                genOptions.quality = 'high';
                genOptions.model = 'gpt-image-1.5';
            } else if (params.model === 'seedream-4.5') {
                genOptions.provider = 'byteplus';
                genOptions.model = 'seedream-4-5-251128';
            } else if (params.model === 'seedream-4.0') {
                genOptions.provider = 'byteplus';
                genOptions.model = 'seedream-4-0-250828';
            }
        }

        const refSheetRes = await router.generateImage(refSheetPrompt, genOptions);
        const refSheetBuffers = refSheetRes.result;

        await checkCancelled(jobId);

        const refSheetUrl = await uploadImage(refSheetBuffers[0], `alters/${alterId}/visual_dna/ref_sheet_${Date.now()}.png`);

        await admin.firestore().collection('alters').doc(alterId).update({
            'visual_dna.description': visualDescription,
            'visual_dna.reference_sheet_url': refSheetUrl,
            'visual_dna.is_ready': true,
            'visual_dna.updated_at': admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            visualDescription,
            refSheetUrl,
            metadata: {
                providerUsed: {
                    analysis: analysisRes.providerUsed,
                    generation: refSheetRes.providerUsed
                },
                fallbackUsed: analysisRes.fallbackUsed || refSheetRes.fallbackUsed
            }
        };
    },

    async performMagicPost(job: AIJob): Promise<any> {
        const router = new AIRouter();
        const { id: jobId, params } = job;
        const { alterId, prompt, style, imageCount, sceneImageUrl, poseImageUrl } = params;
        const count = imageCount || 1;
        const selectedStyle = style || "Cinematic";

        await checkCancelled(jobId);

        // 1. Get Alter Context
        const alterDoc = await admin.firestore().collection('alters').doc(alterId!).get();
        const alterData = alterDoc.data();
        const charDesc = alterData?.visual_dna?.description || alterData?.name || "A character";

        // 2. Enhance Prompt
        const enhancementPrompt = PromptService.getMagicPromptExpansion(prompt!, charDesc, selectedStyle); // prompt is required in MagicPostRequest but verify
        const magicRes = await router.generateText(enhancementPrompt);
        const magicPrompt = magicRes.result;

        await checkCancelled(jobId);

        // 3. Prepare References
        const references: string[] = [];
        if (sceneImageUrl) references.push(await downloadImageAsBase64(sceneImageUrl));
        if (poseImageUrl) references.push(await downloadImageAsBase64(poseImageUrl));
        await checkCancelled(jobId);

        // 4. Generate
        // Note: Router generates one batch usually, but let's loop if needed or pass count
        // Our interfaces said 'count' in options.
        // Assuming router/provider handles options.count if supported, OR we do parallel calls.

        // Let's do optimized parallel calls via Router
        const promises = Array.from({ length: count }).map(() =>
            router.generateImage(magicPrompt, {
                referenceImages: references,
                style: selectedStyle
            })
        );

        const results = await Promise.all(promises);
        await checkCancelled(jobId);

        const allBuffers: Buffer[] = results.flatMap(r => r.result);
        const providersUsed = results.map(r => r.providerUsed);
        const fallbackUsed = results.some(r => r.fallbackUsed) || magicRes.fallbackUsed;

        // 5. Upload
        const uploadPromises = allBuffers.map((buf, idx) =>
            uploadImage(buf, `posts/ai/${alterId}_${Date.now()}_${idx}.png`)
        );
        const imageUrls = await Promise.all(uploadPromises);

        return {
            images: imageUrls,
            magicPrompt,
            metadata: {
                providerUsed: {
                    prompt: magicRes.providerUsed,
                    generation: [...new Set(providersUsed)]
                },
                fallbackUsed
            }
        };
    },

    async performChat(job: AIJob): Promise<any> {
        const router = new AIRouter();
        const { messages, context } = job.params;
        const systemPrompt = PromptService.getChatSystemPrompt(context?.traits, context?.recentSummary);

        const res = await router.chat(messages, { systemInstruction: systemPrompt });

        return {
            message: res.result,
            metadata: {
                providerUsed: res.providerUsed,
                fallbackUsed: res.fallbackUsed
            }
        };
    }
}
