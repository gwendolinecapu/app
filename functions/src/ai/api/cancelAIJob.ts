import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

export const cancelAIJob = functions.runWith({
    secrets: [],
    timeoutSeconds: 60,
    memory: "128MB"
}).https.onCall(async (data: { jobId: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }
    const { jobId } = data;
    if (!jobId) throw new functions.https.HttpsError('invalid-argument', 'Missing Job ID');

    const jobRef = admin.firestore().collection('ai_jobs').doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Job not found');
    }

    const job = jobSnap.data();
    if (job?.userId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your job');
    }

    if (['succeeded', 'failed', 'cancelled'].includes(job?.status)) {
        return { success: false, message: 'Job already finished' };
    }

    await jobRef.update({
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
});
