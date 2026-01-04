
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
// import { GoogleAuth } from "google-auth-library"; // Unused

admin.initializeApp();
const db = admin.firestore();

// --- Configuration ---
// const PROJECT_ID = process.env.GCLOUD_PROJECT || "plural-connect-default"; 
// CRITICAL: Google AI Studio API Key from environment variable
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || "MISSING_KEY";

// BytePlus Ark API Key (Seedream-4.5)
const BYTEPLUS_API_KEY = process.env.BYTEPLUS_API_KEY; // Secured via Cloud Secret Manager
const SEEDREAM_MODEL = "seedream-4-5-251128";

// Style prompts mapping
const STYLES: { [key: string]: string } = {
    "photorealist": "8k, photorealistic, highly detailed, dramatic lighting, depth of field, color graded, movie scene",
    "Anime": "anime style, studio ghibli inspired, vibrant colors, cel shaded, highly detailed, 2d animation style",
    "Painting": "digital oil painting, textured brushstrokes, artistic, detailed, masterpiece, conceptual art",
    "Cyberpunk": "cyberpunk style, neon lights, futuristic city, chromatic aberration, high tech, night time",
    "Polaroid": "vintage polaroid photo, film grain, flash photography, retro aesthetic, soft focus, 90s style"
};

// AI Models
const GEMINI_MODEL = "gemini-3-pro-image-preview"; // Used for Vision/Analysis only now

// Google AI Client (for Gemini Vision)
let genAI: GoogleGenerativeAI;
if (GOOGLE_AI_API_KEY) {
    genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
} else {
    console.warn("GOOGLE_AI_API_KEY is missing! Gemini calls will fail.");
}

// Costs
const COSTS = {
    RITUAL: 50,
    POST_ECO: 5,
    POST_STD: 10, // Seedream Standard
    POST_PRO: 20
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
    imageCount?: number; // New: Batch generation (1 or 3)
    sceneImageUrl?: string;
    style?: string; // New: Vibe selector
    poseImageUrl?: string; // New: Scribble/Pose control
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
 * Call BytePlus Ark (Seedream) for Image Generation
 */
async function callBytePlusArk(prompt: string, imagesBase64: string[] = [], size: string = "2048x2048"): Promise<Buffer> {
    const endpoint = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";

    // Construct payload
    const payload: any = {
        model: SEEDREAM_MODEL,
        prompt: prompt,
        response_format: "b64_json",
        size: size,
        sequential_image_generation: "disabled" // Single image output for now
    };

    // Handle reference images
    if (imagesBase64.length > 0) {
        // Seedream supports referencing images via Base64 (data:image/...) or URL.
        // We have base64 data (without prefix usually from our helper), let's format it.
        // API requires: "data:image/png;base64,..."

        const formattedImages = imagesBase64.map(b64 => `data:image/jpeg;base64,${b64}`);

        if (formattedImages.length === 1) {
            payload.image = formattedImages[0];
        } else {
            payload.image = formattedImages; // Array for multi-image
            // If strictly multi-image (2-14), ensure valid count. 
            // Our ritual allows up to 5, so valid.
        }
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BYTEPLUS_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`BytePlus Ark Error (${response.status}): ${errText}`);
    }

    const result = await response.json();
    // Check for data
    if (!result.data || result.data.length === 0) {
        throw new Error("No image data returned from BytePlus");
    }

    const b64Data = result.data[0].b64_json;
    return Buffer.from(b64Data, 'base64');
}

// --- Cloud Functions ---

export const performBirthRitual = functions.runWith({
    secrets: ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"],
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: RitualRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { alterId, referenceImageUrls } = data;

    try {
        if (!genAI) {
            const key = process.env.GOOGLE_AI_API_KEY;
            if (key) genAI = new GoogleGenerativeAI(key);
            else throw new functions.https.HttpsError('failed-precondition', 'Server AI Config Missing');
        }

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

        // 3. DNA Analysis (Gemini Vision)
        // Download images once for both Vision and Generation
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

        // 4. Reference Sheet (Seedream-4.5)
        const refSheetPrompt = `
            Generate a SINGLE “character turnaround sheet” image from the provided reference photos.
            
            Goal:
            One composite sheet with 4 full-body views of the SAME subject: FRONT / 3-4 FRONT / juste face / BACK.
            
            Layout:
            photorealist, full body, neutral standing pose, arms relaxed.
            Same scale and alignment across all views (feet on the same baseline).
            Plain neutral background, consistent studio lighting.
            
            Consistency rules
            Identity match, exact likeness.
            
            Visual DNA Context:
            ${visualDescription}
        `;

        let refSheetUrl = "";
        try {
            // Call Seedream-4.5 with MULTI-IMAGE references + Prompt
            const refImageBuffer = await callBytePlusArk(refSheetPrompt, imagesBase64, "2048x2048"); // Using high res

            const refSheetFilename = `alters/${alterId}/visual_dna/ref_sheet_${Date.now()}.png`;
            const itemBucket = admin.storage().bucket();
            const file = itemBucket.file(refSheetFilename);
            await file.save(refImageBuffer, { metadata: { contentType: 'image/png' } });
            await file.makePublic(); // Keep using public URL
            refSheetUrl = file.publicUrl();
        } catch (genErr: any) {
            console.error("Reference Sheet generation failed DETAILS:", genErr.message, genErr);
        }

        // 5. Save
        const updates: { [key: string]: any } = {
            'visual_dna.description': visualDescription,
            'visual_dna.created_at': admin.firestore.FieldValue.serverTimestamp(),
            'visual_dna.is_ready': true
        };

        if (refSheetUrl) {
            updates['visual_dna.reference_sheet_url'] = refSheetUrl;
        } else {
            updates['visual_dna.reference_sheet_url'] = admin.firestore.FieldValue.delete();
        }

        await db.collection('alters').doc(alterId).update(updates);

        return { success: true, visualDescription, refSheetUrl };

    } catch (e: any) {
        console.error("Ritual Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

export const generateMagicPost = functions.runWith({
    secrets: ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"],
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: MagicPostRequest, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { alterId, prompt, quality, sceneImageUrl, imageCount = 1 } = data;
    console.log(`Generating Magic Post. Quality: ${quality}, Count: ${imageCount}`);

    try {
        const alterDoc = await db.collection('alters').doc(alterId).get();
        if (!alterDoc.exists) throw new functions.https.HttpsError('not-found', 'Alter not found');

        const alterData = alterDoc.data();
        const credits = alterData?.credits || 0;

        // Cost Calculation
        // Standard: 10 credits per image. 
        // Batch (3 images): 25 credits (Discounted from 30).
        let cost = COSTS.POST_STD;
        if (imageCount === 3) {
            cost = 25; // Discounted batch price
        } else {
            cost = COSTS.POST_STD * imageCount;
        }

        if (credits < cost) throw new functions.https.HttpsError('resource-exhausted', 'Insufficient credits');
        await chargeCredits(alterId, cost, `Magic Post (${imageCount} image${imageCount > 1 ? 's' : ''})`);

        const visualDNA = alterData?.visual_dna;
        const charDescription = visualDNA?.description || alterData?.name;
        // const refSheetUrl = visualDNA?.reference_sheet_url;

        // 1. Magic Prompt Expansion (Gemini)
        let magicPrompt = prompt;
        const selectedStyle = data.style || "Cinematic";
        const styleKeywords = STYLES[selectedStyle] || STYLES["Cinematic"];

        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Fast model for text
                const enhancementPrompt = `
                    Act as an expert Art Director. Rewrite the following user prompt into a detailed image generation prompt.
                    
                    User Prompt: "${prompt}"
                    Character Context: "${charDescription}"
                    Style Goal: "${selectedStyle}" (${styleKeywords})
                    
                    Rules:
                    1. Keep it under 400 characters.
                    2. Focus on visual description (lighting, texture, composition).
                    3. Ensure the character looks like the Context provided (hair, gender, vibes).
                    4. Output ONLY the raw prompt, no "Here is the prompt:" prefix.
                `;
                const result = await model.generateContent(enhancementPrompt);
                const candidates = result.response.candidates;
                if (candidates && candidates.length > 0 && candidates[0].content.parts.length > 0) {
                    magicPrompt = candidates[0].content.parts[0].text || prompt;
                }
            } catch (err) {
                console.warn("Magic Prompt expansion failed, falling back to raw prompt", err);
                magicPrompt = `${charDescription}. ${prompt}. ${styleKeywords}`;
            }
        } else {
            magicPrompt = `${charDescription}. ${prompt}. ${styleKeywords}`;
        }

        console.log("✨ Magic Prompt:", magicPrompt);

        // 2. Prepare Reference Images
        let referenceImages: string[] = [];

        // A. Character Consistency (Priority #1)
        /*
        if (refSheetUrl) {
            try {
                const refSheetB64 = await downloadImageAsBase64(refSheetUrl);
                referenceImages.push(refSheetB64);
                console.log("✅ Added Reference Sheet for consistency");
            } catch (e) {
                console.warn("Failed to download Ref Sheet:", e);
            }
        }
        */

        // B. Scene Guidance (I2I)
        if (sceneImageUrl) {
            try {
                const sceneB64 = await downloadImageAsBase64(sceneImageUrl);
                referenceImages.push(sceneB64);
            } catch (e) {
                console.warn("Failed to download Scene Image:", e);
            }
        }

        // C. Pose/Scribble Guidance (New)
        if (data.poseImageUrl) {
            try {
                const poseB64 = await downloadImageAsBase64(data.poseImageUrl);
                referenceImages.push(poseB64);
                console.log("✅ Added Pose Image");
            } catch (e) {
                console.warn("Failed to download Pose Image:", e);
            }
        }

        // 3. Generate Image(s) (Seedream)
        // Parallel execution for batch generation
        const generatePromises = Array.from({ length: imageCount }).map(() =>
            callBytePlusArk(magicPrompt, referenceImages, "2048x2048")
        );

        const imageBuffers = await Promise.all(generatePromises);

        // 4. Upload All Images
        const uploadPromises = imageBuffers.map(async (buffer: Buffer, index: number) => {
            const filename = `posts/ai/${alterId}_${Date.now()}_${index}.png`;
            const bucket = admin.storage().bucket();
            const file = bucket.file(filename);
            await file.save(buffer, { metadata: { contentType: 'image/png' } });
            await file.makePublic();
            return file.publicUrl();
        });

        const imageUrls = await Promise.all(uploadPromises);

        return {
            success: true,
            images: imageUrls, // Return array
            imageUrl: imageUrls[0] // Backward compatibility for single image
        };

    } catch (e: any) {
        console.error("Magic Post Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});
