import * as admin from 'firebase-admin';
import { BytePlusProvider } from '../providers/BytePlusProvider';
import { GeminiProvider } from '../providers/GeminiProvider';
import { PromptService } from './PromptService';
import sharp from 'sharp';

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


async function uploadImage(buffer: Buffer, path: string, compress = false): Promise<string> {
    const bucket = admin.storage().bucket();
    const file = bucket.file(path);

    let finalBuffer = buffer;
    let contentType = 'image/png';

    // Only compress if explicitly requested (for Magic Posts, not avatars)
    if (compress) {
        // Compress image to keep it under 1MB
        let compressedBuffer = buffer;
        let quality = 90; // Start with high quality
        const maxSizeBytes = 1 * 1024 * 1024; // 1MB

        // Convert to JPEG with progressive compression until under 1MB
        while (quality > 10) {
            compressedBuffer = await sharp(buffer)
                .jpeg({ quality, progressive: true })
                .toBuffer();

            if (compressedBuffer.length <= maxSizeBytes) {
                break;
            }
            quality -= 10;
        }

        // If still too large, resize PROPORTIONALLY (no forced ratio)
        if (compressedBuffer.length > maxSizeBytes) {
            const metadata = await sharp(buffer).metadata();
            const scaleFactor = Math.sqrt(maxSizeBytes / compressedBuffer.length);
            const newWidth = Math.floor((metadata.width || 1920) * scaleFactor);

            compressedBuffer = await sharp(buffer)
                .resize(newWidth, null, { withoutEnlargement: true }) // null = keep aspect ratio
                .jpeg({ quality: 80, progressive: true })
                .toBuffer();
        }

        console.log(`Image compressed: ${buffer.length} → ${compressedBuffer.length} bytes (${Math.round(compressedBuffer.length / 1024)}KB)`);
        finalBuffer = compressedBuffer;
        contentType = 'image/jpeg';
    }

    await file.save(finalBuffer, { metadata: { contentType } });
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
            width: 3840,  // Ultra-wide format - BytePlus minimum: 3686400 pixels (3840x2400 = 9,216,000)
            height: 2400  // 16:10 format for 4-view reference sheet
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
        const { alterId, prompt, style, imageCount, sceneImageUrl, poseImageUrl, format } = params;
        const count = imageCount || 1;
        const selectedStyle = style || "Cinematic";
        const selectedFormat = format || "instagram_square"; // Default: Instagram carré

        // Format definitions (all >= 3.6M pixels for BytePlus)
        const formats: Record<string, { width: number; height: number; name: string }> = {
            instagram_square: { width: 2048, height: 2048, name: "Instagram Carré (1:1)" },       // 4.2M pixels
            instagram_portrait: { width: 2048, height: 2560, name: "Instagram Portrait (4:5)" },  // 5.2M pixels
            instagram_story: { width: 1920, height: 3413, name: "Instagram Story (9:16)" },       // 6.5M pixels
            landscape: { width: 2560, height: 1440, name: "Paysage Standard (16:9)" },            // 3.7M pixels
            cinema: { width: 3072, height: 1316, name: "Cinéma Large (21:9)" }                    // 4.0M pixels
        };

        const formatConfig = formats[selectedFormat] || formats.instagram_square;

        await checkCancelled(jobId);

        // 1. Get Alter Context
        const alterDoc = await admin.firestore().collection('alters').doc(alterId).get();
        const alterData = alterDoc.data();
        const charDesc = alterData?.visual_dna?.description || alterData?.name || "A character";

        // 2. Build Direct Prompt (No Gemini Enhancement)
        // Combine user prompt with character description and style keywords
        const styleKeywords = style ? `Style: ${selectedStyle}.` : '';
        const magicPrompt = `${prompt}\nCharacter: ${charDesc}\n${styleKeywords}`;

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
            width: formatConfig.width,
            height: formatConfig.height
        }));

        const nestedResults = await Promise.all(promises);
        await checkCancelled(jobId);

        // Flatten results
        const allBuffers: Buffer[] = nestedResults.flat();

        // 5. Upload with compression (Magic Posts only, not avatars)
        const uploadPromises = allBuffers.map((buf, idx) => uploadImage(buf, `posts/ai/${alterId}_${Date.now()}_${idx}.png`, true));
        const imageUrls = await Promise.all(uploadPromises);

        return {
            images: imageUrls,
            magicPrompt,
            metadata: {
                providerUsed: {
                    prompt: 'direct-prompt',
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
        const llmProvider = new GeminiProvider(googleApiKey, 'gemini-2.5-flash');

        const response = await llmProvider.chat(messages, { systemInstruction: systemPrompt });

        return {
            message: response,
            metadata: {
                providerUsed: 'gemini-direct',
                model: 'gemini-2.5-flash'
            }
        };
    }
};
