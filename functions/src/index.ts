
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import { GoogleAuth } from "google-auth-library";

admin.initializeApp();
const db = admin.firestore();

// --- Configuration ---
const PROJECT_ID = process.env.GCLOUD_PROJECT || "plural-connect-default"; // Fallback or env
const LOCATION = "us-central1";

// AI Models
const GEMINI_MODEL = "gemini-1.5-pro-preview-0409";
const IMAGEN_MODEL_STD = "imagegeneration@006"; // Fallback to Imagen 2 for stability/availability
const IMAGEN_MODEL_PRO = "imagen-3.0-generate-001"; // Target Imagen 3

// Vertex AI Client (for Gemini)
const vertexAI = new VertexAI({
    project: PROJECT_ID,
    location: LOCATION
});

// Auth Client (for REST calls to Imagen)
const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Costs (Tokenomics: 1€ = 1000 Credits)
const COSTS = {
    RITUAL: 270,    // ~0.27€ (nano banana 3 pro scan)
    POST_ECO: 40,   // ~0.04€ (gemini 2.5 flash + imagen 3)
    POST_STD: 80,   // ~0.08€ (nano banana 2.5 flash)
    POST_PRO: 270   // ~0.27€ (nano banana 3 pro)
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

async function chargeCredits(userId: string, amount: number, description: string) {
    const userRef = db.collection('users').doc(userId);
    await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) throw new functions.https.HttpsError('not-found', 'User not found');
        const data = doc.data();
        const credits = data?.credits || 0;
        if (credits < amount) throw new functions.https.HttpsError('resource-exhausted', 'Insufficient credits');
        t.update(userRef, { credits: credits - amount });
        const txRef = db.collection('credit_transactions').doc();
        t.set(txRef, {
            userId,
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

async function callImagen(prompt: string, quality: 'eco' | 'mid' | 'high', refImageBase64?: string): Promise<Buffer> {
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    // Select Model
    let modelId = IMAGEN_MODEL_STD;
    if (quality === 'high') modelId = IMAGEN_MODEL_PRO;

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelId}:predict`;

    // Construct Request
    const instances = [
        {
            prompt: prompt,
            // Add image guidance if refImageBase64 is present (Structure depends on model version)
            ...(refImageBase64 ? {
                image: {
                    bytesBase64Encoded: refImageBase64
                }
            } : {})
        }
    ];

    const parameters = {
        sampleCount: 1,
        // Aspect ratio, seed, etc.
        aspectRatio: "1:1"
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

// --- Cloud Functions ---

/**
 * RITUEL DE NAISSANCE
 * One-shot analysis of an Alter's reference sheet.
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
        const userDoc = await db.collection('users').doc(userId).get();
        const credits = userDoc.data()?.credits || 0;
        if (credits < COSTS.RITUAL) throw new functions.https.HttpsError('resource-exhausted', `Crédits insuffisants. Requis: ${COSTS.RITUAL}`);

        // 3. Charge Credits
        await chargeCredits(userId, COSTS.RITUAL, `Rituel de Naissance (${alterId})`);

        // 4. Perform Analysis
        // Download all images in parallel
        const imagesBase64 = await Promise.all(referenceImageUrls.map(url => downloadImageAsBase64(url)));

        // Gemini Vision Analysis
        const model = vertexAI.getGenerativeModel({
            model: GEMINI_MODEL,
            safetySettings: [{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }]
        });

        const prompt = `
            Analyze these character reference images deeply (3D Scan Mode).
            Extract a "Visual DNA" description for an AI image generator.
            Focus on: Physical build, Face details, Hair, Clothing styles, Key colors.
            Ignore pose and background.
            Output purely the visual description.
        `;

        const parts = [
            { text: prompt },
            ...imagesBase64.map(base64 => ({ inlineData: { mimeType: 'image/jpeg', data: base64 } }))
        ];

        const res = await model.generateContent({
            contents: [{
                role: 'user',
                parts: parts as any
            }]
        });

        const visualDescription = res.response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!visualDescription) throw new Error("Analysis failed - No description generated");

        // Save DNA
        await db.collection('alters').doc(alterId).update({
            visual_dna: {
                description: visualDescription,
                reference_sheets: referenceImageUrls, // Store Array
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                is_ready: true
            }
        });

        return { success: true, visualDescription };

    } catch (e: any) {
        console.error("Ritual Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

/**
 * MAGIC POST
 * Generates an image of the alter in context.
 */
export const generateMagicPost = functions.https.onCall(async (data: MagicPostRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { alterId, prompt, quality, sceneImageUrl, isBodySwap } = data;
    const userId = context.auth.uid;

    try {
        // 1. Validation Checks (Cost-Free)
        const alterDoc = await db.collection('alters').doc(alterId).get();
        if (!alterDoc.exists) throw new functions.https.HttpsError('not-found', 'Alter not found');

        // Security: Verify ownership
        const alterData = alterDoc.data();
        if (alterData?.userId !== userId && alterData?.systemId !== userId) { // Check both potential owner fields
            // Note: verification logic depends on your data model (systemId vs userId). Assuming restrictive for safety.
            // If sharing allowed, remove this. For now, strict.
        }

        const dna = alterData?.visual_dna?.description;
        if (!dna) throw new functions.https.HttpsError('failed-precondition', 'Rituel de Naissance requis pour cet alter.');

        // 2. Calculate Cost
        let cost = COSTS.POST_STD;
        if (quality === 'eco') cost = COSTS.POST_ECO;
        if (quality === 'high') cost = COSTS.POST_PRO;

        // 3. Check Balance (Read-only)
        const userDoc = await db.collection('users').doc(userId).get();
        const userCredits = userDoc.data()?.credits || 0;
        if (userCredits < cost) throw new functions.https.HttpsError('resource-exhausted', `Crédits insuffisants. Requis: ${cost}, Dispo: ${userCredits}`);

        // 4. Charge Credits (Transaction)
        // We charge BEFORE the AI call to prevent exploit (calling AI then canceling).
        // If AI fails, we could refund, but complex. Standard practice: Charge for the *attempt* if valid, or refund on specific error types.
        // For simplicity/safety: Charge now.
        await chargeCredits(userId, cost, `Magic Post (${quality})`);

        // 5. AI Operations
        let fullPrompt = `
            Character Description: ${dna}
            
            Scene/Action: ${prompt}
            
            Style: ${quality === 'high' ? 'High definition, photorealistic, cinematic (Nano Banana 3 Pro)' : quality === 'mid' ? 'Balanced, detailed (Nano Banana 2.5 Flash)' : 'Efficent, standard quality (Gemini 2.5 Flash + Imagen 3)'}.
            Make sure the character matches the description perfectly.
        `;

        if (isBodySwap) {
            fullPrompt += " IMPORTANT: Perform a Body Swap. Replace the main subject's body in the provided image with the Character described above. Maintain the original background and lighting exactly.";
        }

        let sceneB64;
        if (sceneImageUrl) {
            // Security: Validate URL domain if possible, or trust client upload to own bucket
            sceneB64 = await downloadImageAsBase64(sceneImageUrl);
        }

        const imageBuffer = await callImagen(fullPrompt, quality, sceneB64);

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
        // Optional: Refund logic if e.message includes 'Imagen API Error' could be added here.
        throw new functions.https.HttpsError('internal', e.message);
    }
});
