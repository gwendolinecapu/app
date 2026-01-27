import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { processAIJob } from './ai/workers/jobWorker';
import { AIWorkflows } from './ai/services/AIWorkflows';
import { COSTS } from './ai/constants';
import { BillingUtils } from './utils/billing';
import { startAIJob } from './ai/api/startAIJob';
import { cancelAIJob } from './ai/api/cancelAIJob';
import { retryAIJob } from './ai/api/retryAIJob';
import { uploadVideo } from './ai/utils/videoCompression';

admin.initializeApp();

const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB Limit

/**
 * Rate Limiting Helper
 */
async function checkRateLimit(userId: string, action: string, cooldownMs: number = 60000) {
    const rateLimitRef = admin.firestore().collection('rate_limits').doc(`${userId}_${action}`);
    const doc = await rateLimitRef.get();

    if (doc.exists) {
        const lastTimestamp = (doc.data()?.timestamp as admin.firestore.Timestamp)?.toMillis() || 0;
        if (Date.now() - lastTimestamp < cooldownMs) {
            throw new functions.https.HttpsError('resource-exhausted', `Rate limit exceeded for ${action}. Please wait.`);
        }
    }

    await rateLimitRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });
}

export { processAIJob, startAIJob, cancelAIJob, retryAIJob };
export * from './integrations/github';
export * from './monetization';

export const performBirthRitual = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');

    // Input Validation
    const { alterId, referenceImageUrls } = data;
    if (!alterId || typeof alterId !== 'string' || alterId.length > 100) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid alterId');
    }
    if (referenceImageUrls && (!Array.isArray(referenceImageUrls) || referenceImageUrls.length > 5)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid referenceImageUrls');
    }

    try {
        await checkRateLimit(context.auth.uid, 'ritual', 30000); // 30s cooldown

        // 1. Charge
        await BillingUtils.chargeCredits(alterId, COSTS.RITUAL, "Rituel de Naissance");
        // 2. Execute directly (Sync)
        const mockJob: any = {
            id: 'sync_' + Date.now(),
            userId: context.auth.uid,
            type: 'ritual',
            status: 'running',
            params: { alterId, referenceImageUrls },
            metadata: { provider: 'mixed', model: 'mixed', costEstimate: COSTS.RITUAL, attempts: 1 },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };
        return await AIWorkflows.performRitual(mockJob);
    }
    catch (e: any) {
        console.error("Ritual Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

export const generateMagicPost = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const { alterId, imageCount = 1 } = data;

    // Validation
    if (!alterId || typeof alterId !== 'string')
        throw new functions.https.HttpsError('invalid-argument', 'Invalid alterId');
    if (typeof imageCount !== 'number' || imageCount < 1 || imageCount > 4)
        throw new functions.https.HttpsError('invalid-argument', 'Invalid imageCount (1-4)');

    try {
        await checkRateLimit(context.auth.uid, 'magic_post', 10000); // 10s cooldown

        console.log('🎨 [MAGIC POST] Starting generation with params:', JSON.stringify(data, null, 2));

        // 1. Charge
        let cost = COSTS.POST_STD;
        if (imageCount === 3)
            cost = 25; // Batch discount
        else
            cost = COSTS.POST_STD * imageCount;

        console.log(`💰 Charging ${cost} credits for ${imageCount} images`);
        await BillingUtils.chargeCredits(alterId, cost, `Magic Post (${imageCount})`);

        // 2. Execute directly (Sync)
        const mockJob: any = {
            id: 'sync_' + Date.now(),
            userId: context.auth.uid,
            type: 'magic_post',
            status: 'running',
            params: data,
            metadata: { provider: 'mixed', model: 'mixed', costEstimate: cost, attempts: 1 },
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        };

        console.log('🚀 Calling AIWorkflows.performMagicPost...');
        const result = await AIWorkflows.performMagicPost(mockJob);
        console.log('✅ Magic Post generation successful:', result);

        return result;
    }
    catch (e: any) {
        console.error("❌ Magic Post Error:", e);
        console.error("Stack trace:", e.stack);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

/**
 * Upload and compress video for posts/stories
 * Automatically compresses to 1080p TikTok-style quality
 */
export const uploadVideoPost = functions.runWith({
    timeoutSeconds: 540, // 9 minutes for video processing
    memory: "2GB" // More memory for video processing
}).https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');

    try {
        const { videoBase64, alterId, type = 'post', compress = true } = data;

        if (!videoBase64 || !alterId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing videoBase64 or alterId');
        }

        // Validate Size (approximate from Base64 length)
        // Base64 is ~33% larger than binary. 100MB binary ~= 133MB Base64
        if (videoBase64.length > (MAX_VIDEO_SIZE * 1.37)) {
            throw new functions.https.HttpsError('invalid-argument', 'Video too large (Max 100MB)');
        }

        await checkRateLimit(context.auth.uid, 'upload_video', 60000); // 1m cooldown

        // Convert base64 to buffer
        const videoBuffer = Buffer.from(videoBase64, 'base64');

        // Double check real buffer size
        if (videoBuffer.length > MAX_VIDEO_SIZE) {
            throw new functions.https.HttpsError('invalid-argument', 'Video too large (Max 100MB)');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${type}s/videos/${alterId}_${timestamp}.mp4`;

        // Upload with automatic compression
        const publicUrl = await uploadVideo(videoBuffer, filename, compress);

        // Optional: Save metadata to Firestore
        await admin.firestore().collection('videos').add({
            userId: context.auth.uid,
            alterId,
            type,
            url: publicUrl,
            compressed: compress,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            success: true,
            url: publicUrl,
            compressed: compress
        };
    }
    catch (e: any) {
        console.error("Video Upload Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});

/**
 * RECHERCHE SYSTÈME PAR CODE (BYPASS SÉCURITÉ)
 * Permet de récupérer les alters d'un système via son ID exact,
 * même s'ils sont privés ou masqués (logique "Code = Clé d'accès").
 */
export const searchSystemAlters = functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');

    const { systemId } = data;

    if (!systemId || typeof systemId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'ID Système invalide');
    }

    try {
        // 1. Verify system exists
        const systemDoc = await admin.firestore().collection('systems').doc(systemId).get();
        if (!systemDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Système introuvable');
        }

        // 2. Fetch ALL alters for this system (Admin SDK bypasses rules)
        // Check both systemId (new) and userId (legacy) fields to be sure
        const altersSnap = await admin.firestore().collection('alters')
            .where('systemId', '==', systemId)
            .get();

        // Use a set to avoid duplicates if we needed multiple queries (but for now one is enough usually)
        const alters = altersSnap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                name: d.name,
                avatar_url: d.avatar_url || d.avatar,
                color: d.color,
                pronouns: d.pronouns,
                visibility: d.visibility || 'private'
            };
        });

        return {
            system: {
                id: systemDoc.id,
                name: systemDoc.data()?.username || 'Système Inconnu',
                avatar_url: systemDoc.data()?.avatar_url
            },
            alters
        };
    } catch (e: any) {
        console.error("Search System Error:", e);
        throw new functions.https.HttpsError('internal', "Erreur lors de la recherche du système.");
    }
});


/**
 * ACCEPTER DEMANDE D'AMI (BYPASS SÉCURITÉ)
 * Gère la création des amitiés et la mise à jour des statuts côté serveur.
 */
export const acceptFriendRequest = functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');

    const { requestId } = data;
    if (!requestId) {
        throw new functions.https.HttpsError('invalid-argument', 'ID de requête manquant');
    }

    try {
        const db = admin.firestore();
        const reqRef = db.collection('friend_requests').doc(requestId);
        const reqDoc = await reqRef.get();

        if (!reqDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Requête introuvable');
        }

        const reqData = reqDoc.data()!;

        // Validation: Seul le système destinataire peut accepter
        const receiverSystemId = reqData.receiverSystemId ||
            (await db.collection('alters').doc(reqData.receiverId).get()).data()?.systemId;

        if (receiverSystemId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez pas accepter cette demande.');
        }

        const { senderId, receiverId, systemId: senderSystemId } = reqData;

        let resolvedSenderSystemId = senderSystemId; // Initialize with direct value

        if (!senderSystemId) {
            // Fallback fetch
            const sDoc = await db.collection('alters').doc(senderId).get();
            if (!sDoc.exists) throw new Error("Sender alter missing");
            const sData = sDoc.data()!;
            if (sData.systemId) resolvedSenderSystemId = sData.systemId;
        }

        if (!resolvedSenderSystemId) throw new Error("Sender System ID not resolved");



        const batch = db.batch();

        // 1. Update Request Status
        batch.update(reqRef, { status: 'accepted' });

        // 2. Create Friendship (Me -> Them)
        const friendshipRef1 = db.collection('friendships').doc();
        batch.set(friendshipRef1, {
            systemId: context.auth.uid,
            alterId: receiverId,
            friendId: senderId,
            friendSystemId: resolvedSenderSystemId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. Create Friendship (Them -> Me)
        const friendshipRef2 = db.collection('friendships').doc();
        batch.set(friendshipRef2, {
            systemId: resolvedSenderSystemId,
            alterId: senderId,
            friendId: receiverId,
            friendSystemId: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 4. Notification for Sender (Requester - The one whom request was accepted)
        let acceptorName = 'Votre ami';
        let acceptorAvatar = null;
        const acceptorDoc = await db.collection('alters').doc(receiverId).get();
        if (acceptorDoc.exists) {
            const d = acceptorDoc.data()!;
            acceptorName = d.name;
            acceptorAvatar = d.avatar || d.avatar_url;
        }

        // Find Requester Name (for Step 5)
        let requesterName = 'Cet alter';
        let requesterAvatar = null;
        const requesterDoc = await db.collection('alters').doc(senderId).get();
        if (requesterDoc.exists) {
            const d = requesterDoc.data()!;
            requesterName = d.name;
            requesterAvatar = d.avatar || d.avatar_url;
        }

        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
            recipientId: senderId, // To Requester
            targetSystemId: resolvedSenderSystemId,
            type: 'friend_request_accepted',
            title: 'Demande acceptée',
            message: " a accepté votre demande d'ami.", // Name is added by UI bold
            data: { alterId: receiverId, friendId: senderId, requestId },
            senderId: context.auth.uid,         // monacapu
            senderAlterId: receiverId,          // Alice
            actorName: acceptorName,             // Alice
            actorAvatar: acceptorAvatar,
            read: false,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        // 5. Notification for Receiver (Acceptor - The one who clicked accept)
        // This is "You and X are now friends" or similar
        const selfNotifRef = db.collection('notifications').doc();
        batch.set(selfNotifRef, {
            recipientId: receiverId, // To Acceptor
            targetSystemId: context.auth.uid,
            type: 'friend_new',
            title: 'Nouvel ami',
            message: " est maintenant ami(e) avec vous.", // Name added by UI
            data: { alterId: senderId, friendId: receiverId, requestId },
            senderId: resolvedSenderSystemId,   // faucqueurstacy
            senderAlterId: senderId,            // A
            actorName: requesterName,            // A
            actorAvatar: requesterAvatar,
            // These enable the "Special Double Avatar" UI in some themes if needed
            targetName: acceptorName,
            targetAvatar: acceptorAvatar,
            read: false,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        return { success: true };

    } catch (e: any) {
        console.error("Accept Request Error:", e);
        throw new functions.https.HttpsError('internal', e.message);
    }
});
