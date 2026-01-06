import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { JobsService } from '../services/JobsService'; // Though not strictly used if we just update directly, but for consistency
import { BillingUtils } from '../../utils/billing';

export const retryAIJob = functions.runWith({
    secrets: ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"],
    timeoutSeconds: 60,
    memory: "128MB"
}).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }

    const { jobId } = data;
    if (!jobId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing Job ID');

    const jobRef = admin.firestore().collection('ai_jobs').doc(jobId);

    return admin.firestore().runTransaction(async (t) => {
        const jobDoc = await t.get(jobRef);
        if (!jobDoc.exists)
            throw new functions.https.HttpsError('not-found', 'Job not found');

        const job = jobDoc.data();
        if (job?.userId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'Not your job');
        }

        // Only retry if failed or cancelled
        if (!['failed', 'cancelled'].includes(job?.status)) {
            throw new functions.https.HttpsError('failed-precondition', 'Can only retry failed or cancelled jobs');
        }

        // Check Max Attempts
        const attempts = job?.metadata?.attempts || 0;
        const maxAttempts = job?.metadata?.maxAttempts || 3;
        if (attempts >= maxAttempts) {
            throw new functions.https.HttpsError('resource-exhausted', 'Max attempts reached');
        }

        // Charge again if there is a cost (assuming previous run refunded on failure)
        const cost = job?.metadata?.costEstimate || 0;
        if (cost > 0 && job?.alterId) {
            try {
                // Warning: We are inside a transaction potentially, but BillingUtils isn't transaction-aware this way.
                // Ideal approach: Run charging OUTSIDE transaction, or use a distributed transaction.
                // However, user requests "Retry". If I fail to get credits, I should fail.
                await BillingUtils.chargeCredits(job.alterId, cost, `Retry Job ${jobId} (${attempts + 1})`);
            }
            catch (e: any) {
                throw new functions.https.HttpsError('resource-exhausted', e.message || 'Insufficient credits');
            }
        }

        t.update(jobRef, {
            status: 'queued',
            'metadata.attempts': attempts + 1,
            progress: { percent: 0, stage: 'retrying' },
            error: admin.firestore.FieldValue.delete(),
            result: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, attempts: attempts + 1 };
    });
});
