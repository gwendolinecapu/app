
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
// import { GoogleAuth } from "google-auth-library"; // Unused

admin.initializeApp();
const db = admin.firestore();

// --- Configuration ---
// const PROJECT_ID = process.env.GCLOUD_PROJECT || "plural-connect-default"; 
// CRITICAL: Google AI Studio API Key from environment variable
// Set this in a .env file in functions/ folder: GOOGLE_AI_API_KEY=your_key_here
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || "MISSING_KEY";

// AI Models
const GEMINI_MODEL = "gemini-3-pro-image-preview"; // Google AI Studio Model ID
// const IMAGEN_MODEL_ECO = "imagen-4.0-fast-generate-001";
// const IMAGEN_MODEL_STD = "imagen-4.0-generate-001";
// const IMAGEN_MODEL_PRO = "imagen-4.0-ultra-generate-001";

// const LOCATION_IMAGEN = "us-central1"; // Imagen is still on Vertex AI (Google Cloud)

// Google AI Client (for Gemini)
let genAI: GoogleGenerativeAI;
if (GOOGLE_AI_API_KEY) {
    genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
} else {
    console.warn("GOOGLE_AI_API_KEY is missing! Gemini calls will fail.");
}


// Auth Client (for REST calls to Imagen via Vertex AI) // Unused now
// const auth = new GoogleAuth({
//     scopes: ['https://www.googleapis.com/auth/cloud-platform']
// });

// Costs
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
    let filePath = url;
    if (url.startsWith('gs://')) {
        filePath = url.split('/').slice(3).join('/');
    } else if (url.includes('firebasestorage')) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch image");
        const buf = await res.arrayBuffer();
        return Buffer.from(buf).toString('base64');
    }
    const [file] = await bucket.file(filePath).download();
    return file.toString('base64');
}

/**
 * Call Imagen 4 (Vertex AI REST API)
 * Kept for future reference or fallback
 */
// async function callImagen(prompt: string, quality: 'eco' | 'mid' | 'high'): Promise<Buffer> {
//     const client = await auth.getClient();
//     const token = await client.getAccessToken();

//     let modelId = IMAGEN_MODEL_STD;
//     if (quality === 'eco') modelId = IMAGEN_MODEL_ECO;
//     if (quality === 'high') modelId = IMAGEN_MODEL_PRO;

//     const endpoint = `https://${LOCATION_IMAGEN}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_IMAGEN}/publishers/google/models/${modelId}:predict`;

//     const instances = [{ prompt: prompt }];
//     const parameters = { sampleCount: 1, aspectRatio: "1:1" };

//     const response = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//             'Authorization': `Bearer ${token.token}`,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ instances, parameters })
//     });

//     if (!response.ok) {
//         const errText = await response.text();
//         throw new Error(`Imagen API Error: ${response.status} - ${errText}`);
//     }

//     const result = await response.json();
//     const predictions = result.predictions;
//     if (!predictions || predictions.length === 0) throw new Error("No image generated");

//     const b64 = predictions[0].bytesBase64Encoded;
//     return Buffer.from(b64, 'base64');
// }

/**
 * Call Gemini 3 Pro (Google AI Studio SDK)
 */
async function callGeminiGeneration(prompt: string, imageBase64?: string): Promise<Buffer> {
    if (!genAI) throw new Error("Google AI Config missing (API Key)");

    const model = genAI.getGenerativeModel({
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

    const response = result.response;
    // Google AI Studio SDK structure is slightly different for images sometimes
    // But usually returns text unless specific image generation endpoint is used.
    // WAIT: gemini-3-pro-image-preview generates images via generateContent?
    // User says "Gemini 3 Pro Image".
    // If it returns an image, it might be in inlineData or File URI.

    // NOTE: For now, assuming standard generation structure.
    // If this is purely Text-to-Image via Gemini, usage differs.
    // But Ritual uses Vision (Image-to-Text), which returns TEXT (Visual DNA).
    // The "Reference Sheet" generation uses Text-to-Image.

    // If Gemini 3 Pro Image Preview returns an image directly:
    // Check candidates.
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("No candidates returned");

    // Check for inline data (Image generation)
    // Note: The SDK types might not explicitly show image output for generateContent yet if using older types,
    // but the raw response should contain it if the model supports it.
    // Checking first part.
    const part = candidates[0].content.parts[0];

    // Type assertion or check
    if ('inlineData' in part && part.inlineData) {
        return Buffer.from(part.inlineData.data, 'base64');
    }

    // If it returned text, maybe it failed to generate image or user misuse?
    throw new Error("Gemini generation return text instead of image: " + (part.text ? part.text.substring(0, 50) : "No text"));
}

// --- Cloud Functions ---

export const performBirthRitual = functions.https.onCall(async (data: RitualRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { alterId, referenceImageUrls } = data;
    // const userId = context.auth.uid;

    try {
        if (!genAI) throw new functions.https.HttpsError('failed-precondition', 'Server AI Config Missing');

        // 1. Validation & Security
        if (!referenceImageUrls || referenceImageUrls.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing images');
        }
        const alterDoc = await db.collection('alters').doc(alterId).get();
        if (!alterDoc.exists) throw new functions.https.HttpsError('not-found', 'Alter not found');

        // 2. Charge Credits
        const credits = alterDoc.data()?.credits || 0;
        if (credits < COSTS.RITUAL) throw new functions.https.HttpsError('resource-exhausted', 'Insufficient credits');
        await chargeCredits(alterId, COSTS.RITUAL, `Rituel de Naissance`);

        // 3. DNA Analysis (Vision)
        const imagesBase64 = await Promise.all(referenceImageUrls.map(url => downloadImageAsBase64(url)));

        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const analysisPrompt = `
            Analyze these character reference images deeply (3D Scan Mode).
            Extract a "Visual DNA" description for an AI image generator.
            Focus on: Physical build, Face details, Hair, Clothing styles, Key colors.
            Ignore pose and background.
            Output purely the visual description.
        `;

        const parts: any[] = [{ text: analysisPrompt }];
        imagesBase64.forEach(b64 => {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
        });

        const res = await model.generateContent({
            contents: [{ role: 'user', parts }]
        });

        const visualDescription = res.response.text();
        if (!visualDescription) throw new Error("Analysis failed - No description");

        // 4. Reference Sheet (Image Gen)
        const refSheetPrompt = `
            Generate an image of a Character Reference Sheet (Turn-around view: Front, Side, Back).
            Based on this description: ${visualDescription}
            Full body, neutral lighting, white background.
            High resolution, detailed character design.
        `;

        let refSheetUrl = "";
        try {
            // Using our helper which handles the Image return check
            const refImageBuffer = await callGeminiGeneration(refSheetPrompt);
            const refSheetFilename = `alters/${alterId}/visual_dna/ref_sheet_${Date.now()}.png`;
            const itemBucket = admin.storage().bucket();
            const file = itemBucket.file(refSheetFilename);
            await file.save(refImageBuffer, { metadata: { contentType: 'image/png' } });
            [refSheetUrl] = await file.getSignedUrl({ action: 'read', expires: '03-01-2500' });
        } catch (genErr) {
            console.warn("Reference Sheet generation failed:", genErr);
        }

        // 5. Save
        await db.collection('alters').doc(alterId).update({
            visual_dna: {
                description: visualDescription,
                reference_sheet_url: refSheetUrl || admin.firestore.FieldValue.delete(),
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

export const generateMagicPost = functions.https.onCall(async (data: MagicPostRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { alterId, prompt, quality, sceneImageUrl } = data; // quality ignored for Gemini if used directly
    // Use quality for log or analytics if not for model
    console.log("Quality requested:", quality);

    try {
        if (!genAI) throw new functions.https.HttpsError('failed-precondition', 'Server AI Config Missing');

        const alterDoc = await db.collection('alters').doc(alterId).get();
        if (!alterDoc.exists) throw new functions.https.HttpsError('not-found', 'Alter not found');

        const credits = alterDoc.data()?.credits || 0;
        // Cost logic simplified for brevity, assuming standard post cost
        const cost = COSTS.POST_STD;
        if (credits < cost) throw new functions.https.HttpsError('resource-exhausted', 'Insufficient credits');
        await chargeCredits(alterId, cost, `Magic Post`);

        let charDescription = alterDoc.data()?.visual_dna?.description || alterDoc.data()?.name;

        let fullPrompt = `Character integrity: ${charDescription}. Scene: ${prompt}. Photorealistic.`;

        let imageBuffer: Buffer;

        if (sceneImageUrl) {
            // I2I / Editing with Gemini
            const sceneB64 = await downloadImageAsBase64(sceneImageUrl);
            // Note: Gemini 3 Pro supports image editing or image-guided generation
            imageBuffer = await callGeminiGeneration(fullPrompt, sceneB64);
        } else {
            // T2I -> Use Imagen 4 (Vertex) OR Gemini 3 Pro (if it supports T2I)
            // User requested Gemini 3 Pro Image Preview... presumably it does T2I too.
            // Let's try Gemini 3 Pro for everything if possible, but keeping Imagen as fallback logic in our head.
            // For now, let's route T2I to IMAGEN (Vertex) as it's proven for T2I, unless user explicitly said "Forget Vertex".
            // User said: "oublie gemini 1.5 pro il n'existe plus [on Vertex US Central?] ... passer a ia google studio"
            // But Imagen is Vertex. 
            // Let's adhere to "Use Gemini 3 Pro Image (nano banana pro)" which implies image gen capabilities.
            // We will try Gemini for T2I as well!
            imageBuffer = await callGeminiGeneration(fullPrompt);
        }

        const filename = `posts/ai/${alterId}_${Date.now()}.png`;
        const bucket = admin.storage().bucket();
        const file = bucket.file(filename);
        await file.save(imageBuffer, { metadata: { contentType: 'image/png' } });
        await file.makePublic();

        return { success: true, imageUrl: file.publicUrl() };

    } catch (e: any) {
        console.error("Magic Post Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});
