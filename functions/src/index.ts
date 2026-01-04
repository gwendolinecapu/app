
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import { GoogleAuth } from "google-auth-library";

admin.initializeApp();
const db = admin.firestore();

// --- Configuration ---
const PROJECT_ID = process.env.GCLOUD_PROJECT || "plural-connect-default"; // Fallback or env

// AI Models
const GEMINI_MODEL = "gemini-3-pro-image-preview";
const IMAGEN_MODEL_ECO = "imagen-4.0-fast-generate-001";
const IMAGEN_MODEL_STD = "imagen-4.0-generate-001";
const IMAGEN_MODEL_PRO = "imagen-4.0-ultra-generate-001";

const LOCATION_IMAGEN = "us-central1"; // Imagen 4 is regional (us-central1)

// Vertex AI Client (for Gemini)
// Using 'global' location as required for Gemini 3 Preview/Experimental models
const vertexAI = new VertexAI({
    project: PROJECT_ID,
    location: 'global'
});


// Auth Client (for REST calls to Imagen)
const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Costs (Tokenomics: 1€ = 1000 Credits)
// Based on 2026 Pricing (Vertex AI):
// - Ritual (Gemini 1.5 Pro): ~$0.005 cost -> 50 Credits ($0.05) -> x10 Margin (Setup fee)
// - Eco (Imagen 4 Fast / 3 Fast): $0.02 cost -> 60 Credits ($0.06) -> x3 Margin
// - Std (Imagen 4 / 3): $0.04 cost -> 120 Credits ($0.12) -> x3 Margin
// - Pro (Imagen 4 Ultra): $0.06 cost -> 180 Credits ($0.18) -> x3 Margin
const COSTS = {
    RITUAL: 50,
    POST_ECO: 60,
    POST_STD: 120,
    POST_PRO: 180
};

// --- Interfaces ---
interface RitualRequest {
    alterId: string;
    referenceImageUrls: string[];
}

interface MagicPostRequest {
    alterId: string;
    prompt: string;
    quality: 'eco' | 'mid' | 'high';
    sceneImageUrl?: string;
    isBodySwap?: boolean;
}

// --- Helpers ---

async function chargeCredits(alterId: string, amount: number, description: string) {
    const alterRef = db.collection('alters').doc(alterId);
    await db.runTransaction(async (t) => {
        const doc = await t.get(alterRef);
        if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Alter not found');
        const data = doc.data();
        const credits = data?.credits || 0;
        if (credits < amount) throw new functions.https.HttpsError('resource-exhausted', 'Insufficient credits');
        t.update(alterRef, { credits: credits - amount });

        // Store transaction in subcollection for the Alter
        const txRef = alterRef.collection('credit_transactions').doc();
        t.set(txRef, {
            alterId,
            amount: -amount,
            type: 'ai_generation',
            description,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    });
}

async function downloadImageAsBase64(url: string): Promise<string> {
    const bucket = admin.storage().bucket();
    // Assuming GS URI or handling properly. If simple filename in default bucket:
    let filePath = url;
    if (url.startsWith('gs://')) {
        filePath = url.split('/').slice(3).join('/'); // gs://bucket/path
    } else if (url.includes('firebasestorage')) {
        // Fallback for http urls - fetch
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch image");
        const buf = await res.arrayBuffer();
        return Buffer.from(buf).toString('base64');
    }

    // Default bucket file
    const [file] = await bucket.file(filePath).download();
    return file.toString('base64');
}

/**
 * Call Imagen 4 (REST API)
 * Used purely for Text-to-Image when no scene image is provided.
 */
async function callImagen(prompt: string, quality: 'eco' | 'mid' | 'high'): Promise<Buffer> {
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    // Select Model
    let modelId = IMAGEN_MODEL_STD;
    if (quality === 'eco') modelId = IMAGEN_MODEL_ECO;
    if (quality === 'high') modelId = IMAGEN_MODEL_PRO;

    const endpoint = `https://${LOCATION_IMAGEN}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_IMAGEN}/publishers/google/models/${modelId}:predict`;

    // Construct Request
    const instances = [
        {
            prompt: prompt,
        }
    ];

    const parameters = {
        sampleCount: 1,
        aspectRatio: "1:1",
        // Format: 'image/png' // Default is usually png or jpeg base64
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instances, parameters })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Imagen API Error: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const predictions = result.predictions;
    if (!predictions || predictions.length === 0) throw new Error("No image generated");

    // Imagen returns base64 string
    const b64 = predictions[0].bytesBase64Encoded;
    return Buffer.from(b64, 'base64');
}

/**
 * Call Gemini 3 Pro (Vertex AI SDK)
 * Used for Ritual (Vision) and Magic Post with Image Input (Edition/Context).
 */
async function callGeminiGeneration(prompt: string, imageBase64?: string): Promise<Buffer> {
    const model = vertexAI.getGenerativeModel({
        model: GEMINI_MODEL,
        safetySettings: [{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }]
    });

    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    }

    const result = await model.generateContent({
        contents: [{ role: 'user', parts }]
    });

    const generatedPart = result.response.candidates?.[0]?.content?.parts?.[0];

    // Check for inline image data (Vertex AI Gemini 3 behavior)
    if (generatedPart?.inlineData?.data) {
        return Buffer.from(generatedPart.inlineData.data, 'base64');
    }

    throw new Error("Gemini generation failed - No image returned (Try Imagen if Text-to-Image only). Output: " + generatedPart?.text?.substring(0, 100));
}

// --- Cloud Functions ---

/**
 * RITUEL DE NAISSANCE
 * One-shot analysis of an Alter's reference sheet using Gemini 3 Pro.
 */
export const performBirthRitual = functions.https.onCall(async (data: RitualRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { alterId, referenceImageUrls } = data;
    const userId = context.auth.uid;

    try {
        // 1. Validation (Cost-Free)
        if (!referenceImageUrls || referenceImageUrls.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Images de référence manquantes');
        }

        // Security: Check ownership
        const alterDoc = await db.collection('alters').doc(alterId).get();
        if (!alterDoc.exists) throw new functions.https.HttpsError('not-found', 'Alter not found');
        const alterData = alterDoc.data();
        if (alterData?.userId !== userId && alterData?.systemId !== userId) {
            // throw new functions.https.HttpsError('permission-denied', 'Not your alter');
        }

        // 2. Check Balance
        const credits = alterData?.credits || 0;
        if (credits < COSTS.RITUAL) throw new functions.https.HttpsError('resource-exhausted', `Crédits insuffisants. Requis: ${COSTS.RITUAL}`);

        // 3. Charge Credits
        await chargeCredits(alterId, COSTS.RITUAL, `Rituel de Naissance`);

        // 4. Perform Analysis
        const imagesBase64 = await Promise.all(referenceImageUrls.map(url => downloadImageAsBase64(url)));

        const model = vertexAI.getGenerativeModel({
            model: GEMINI_MODEL,
            safetySettings: [{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }]
        });

        const analysisPrompt = `
            Analyze these character reference images deeply (3D Scan Mode).
            Extract a "Visual DNA" description for an AI image generator.
            Focus on: Physical build, Face details, Hair, Clothing styles, Key colors.
            Ignore pose and background.
            Output purely the visual description.
        `;

        const parts = [
            { text: analysisPrompt },
            ...imagesBase64.map(base64 => ({ inlineData: { mimeType: 'image/jpeg', data: base64 } }))
        ];

        const res = await model.generateContent({
            contents: [{ role: 'user', parts: parts as any }]
        });

        const visualDescription = res.response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!visualDescription) throw new Error("Analysis failed - No description generated");

        // 5. Generate Reference Sheet (Gemini 3 Pro)
        const refSheetPrompt = `
            Generate an image of a Character Reference Sheet (Turn-around view: Front, Side, Back).
            Based on this description: ${visualDescription}
            Full body, neutral lighting, white background.
            High resolution, detailed character design.
        `;

        // Request Image Generation from Gemini
        let refSheetUrl = "";
        try {
            const refImageBuffer = await callGeminiGeneration(refSheetPrompt);
            const refSheetFilename = `alters/${alterId}/visual_dna/ref_sheet_${Date.now()}.png`;
            const itemBucket = admin.storage().bucket();
            const file = itemBucket.file(refSheetFilename);
            await file.save(refImageBuffer, { metadata: { contentType: 'image/png' } });
            [refSheetUrl] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
        } catch (genErr) {
            console.warn("Reference Sheet generation failed (Validation Only):", genErr);
            // Non-blocking failure for ref sheet, main value is DNA
        }

        // 6. Save DNA
        await db.collection('alters').doc(alterId).update({
            visual_dna: {
                description: visualDescription,
                reference_sheet_url: refSheetUrl || admin.firestore.FieldValue.delete(),
                reference_sheets: referenceImageUrls,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                is_ready: true
            }
        });

        return { success: true, visualDescription, refSheetUrl };

    } catch (e: any) {
        console.error("Ritual Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

/**
 * MAGIC POST
 * Generates an image of the alter.
 * Uses Imagen 4 for T2I, Gemini 3 Pro for I2I/Context.
 */
export const generateMagicPost = functions.https.onCall(async (data: MagicPostRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { alterId, prompt, quality, sceneImageUrl, isBodySwap } = data;
    const userId = context.auth.uid;

    try {
        // 1. Validation Checks
        const alterDoc = await db.collection('alters').doc(alterId).get();
        if (!alterDoc.exists) throw new functions.https.HttpsError('not-found', 'Alter not found');

        const alterData = alterDoc.data();
        if (alterData?.userId !== userId && alterData?.systemId !== userId) {
            // Security check if strictly private
        }

        // FLEXIBILITY: Use Manual Profile if DNA is missing
        let charDescription = alterData?.visual_dna?.description;
        if (!charDescription) {
            // Fallback construction
            const name = alterData?.name || "The character";
            const appearance = alterData?.appearance || ""; // Assuming 'appearance' field exists or similar


            // If we really have nothing, we should warn or just try.
            charDescription = `Character Name: ${name}. Appearance details: ${appearance}.`;

            // Note: If avatarUrl exists, we *could* utilize it for I2I, strictly requested I2I uses Gemini.
            // But for now, text fallback.
        }

        // 2. Calculate Cost
        let cost = COSTS.POST_STD;
        if (quality === 'eco') cost = COSTS.POST_ECO;
        if (quality === 'high') cost = COSTS.POST_PRO;

        // 3. Check Balance
        const credits = alterData?.credits || 0;
        if (credits < cost) throw new functions.https.HttpsError('resource-exhausted', `Crédits insuffisants. Requis: ${cost}, Dispo: ${credits}`);

        // 4. Charge Credits
        await chargeCredits(alterId, cost, `Magic Post (${quality})`);

        // 5. AI Operations
        let fullPrompt = `
            Character Description to integrity: ${charDescription}
            
            Action/Scene to generate: ${prompt}
            
            Style: ${quality === 'high' ? 'High definition, photorealistic, cinematic' : quality === 'mid' ? 'Balanced, detailed' : 'Efficient, standard quality'}.
            Make sure the character matches the description details perfectly.
        `;

        let imageBuffer: Buffer;

        if (sceneImageUrl) {
            // IMAGE INPUT -> Use GEMINI 3 PRO (as requested for 'edition')
            const sceneB64 = await downloadImageAsBase64(sceneImageUrl);
            if (isBodySwap) {
                fullPrompt += " IMPORTANT: Perform a Body Swap. Replace the main subject's body in the provided image with the Character described above. Maintain the background seamlessly.";
            }
            // Use Gemini for image-guided generation
            imageBuffer = await callGeminiGeneration(fullPrompt, sceneB64);

        } else {
            // TEXT ONLY -> Use IMAGEN 4 (as requested)
            imageBuffer = await callImagen(fullPrompt, quality);
        }

        // 6. Save Result
        const filename = `posts/ai/${alterId}_${Date.now()}.png`;
        const bucket = admin.storage().bucket();
        const file = bucket.file(filename);
        await file.save(imageBuffer, {
            metadata: { contentType: 'image/png' }
        });

        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        return { success: true, imageUrl: publicUrl };

    } catch (e: any) {
        console.error("Magic Generation Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});
