
import * as admin from "firebase-admin";
import { AIJob } from "../interfaces/IAIJob";
import { ILLMProvider } from "../interfaces/ILLMProvider";
import { IImageProvider } from "../interfaces/IImageProvider";
import { PromptService } from "./PromptService";
import { STYLES } from "../constants";

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

export const AIWorkflows = {
    async performRitual(job: AIJob, llm: ILLMProvider, imageGen: IImageProvider): Promise<any> {
        const { alterId, referenceImageUrls } = job.params;
        if (!alterId || !referenceImageUrls) throw new Error("Missing params");

        // 1. Analyze (Vision)
        const imagesBase64 = await Promise.all((referenceImageUrls as string[]).map(downloadImageAsBase64));
        const analysisPrompt = PromptService.getRitualAnalysisPrompt();

        const visualDescription = await llm.analyzeImage(imagesBase64[0], analysisPrompt);

        // 2. Ref Sheet (Image Gen)
        const refSheetPrompt = PromptService.getRitualRefSheetPrompt(visualDescription);

        const refSheetBuffers = await imageGen.generateInfoImage(refSheetPrompt, {
            referenceImages: imagesBase64,
            width: 2048, height: 2048
        });

        const refSheetUrl = await uploadImage(refSheetBuffers[0], `alters/${alterId}/visual_dna/ref_sheet_${Date.now()}.png`);

        await admin.firestore().collection('alters').doc(alterId).update({
            'visual_dna.description': visualDescription,
            'visual_dna.reference_sheet_url': refSheetUrl,
            'visual_dna.is_ready': true,
            'visual_dna.updated_at': admin.firestore.FieldValue.serverTimestamp()
        });

        return { visualDescription, refSheetUrl };
    },

    async performMagicPost(job: AIJob, llm: ILLMProvider, imageGen: IImageProvider): Promise<any> {
        const { alterId, prompt, style, imageCount, sceneImageUrl, poseImageUrl } = job.params;
        const count = imageCount || 1;
        const selectedStyle = style || "Cinematic";

        // 1. Get Alter Context
        const alterDoc = await admin.firestore().collection('alters').doc(alterId!).get();
        const alterData = alterDoc.data();
        const charDesc = alterData?.visual_dna?.description || alterData?.name || "A character";

        // 2. Enhance Prompt
        const enhancementPrompt = PromptService.getMagicPromptExpansion(prompt, charDesc, selectedStyle);
        const magicPrompt = await llm.generateText(enhancementPrompt);

        // 3. Prepare References
        const references: string[] = [];
        if (sceneImageUrl) references.push(await downloadImageAsBase64(sceneImageUrl));
        if (poseImageUrl) references.push(await downloadImageAsBase64(poseImageUrl));

        // 4. Generate
        const promises = Array.from({ length: count }).map(() =>
            imageGen.generateInfoImage(magicPrompt, {
                referenceImages: references,
                style: selectedStyle
            })
        );

        const results = await Promise.all(promises);
        const allBuffers: Buffer[] = results.flatMap(r => r);

        // 5. Upload
        const uploadPromises = allBuffers.map((buf, idx) =>
            uploadImage(buf, `posts/ai/${alterId}_${Date.now()}_${idx}.png`)
        );
        const imageUrls = await Promise.all(uploadPromises);

        return { images: imageUrls, magicPrompt };
    },

    async performChat(job: AIJob, llm: ILLMProvider): Promise<any> {
        const { messages, context } = job.params;
        const systemPrompt = PromptService.getChatSystemPrompt(context?.traits, context?.recentSummary);
        const response = await llm.chat(messages, { systemInstruction: systemPrompt });
        return { message: response };
    }
}
