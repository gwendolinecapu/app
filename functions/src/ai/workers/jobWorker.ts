import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { JobsService } from "../services/JobsService";
// import { GeminiProvider } from "../providers/GeminiProvider"; // Unused
// import { BytePlusProvider } from "../providers/BytePlusProvider"; // Unused
import { AIWorkflows } from "../services/AIWorkflows";
import { AIJob } from "../interfaces/IAIJob";
import { BillingUtils } from "../../utils/billing";

// Secrets
const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"];

export const processAIJob = functions.runWith({
    secrets: SECRETS, // Ensure these are set in Firebase
    timeoutSeconds: 540, // 9 mins max
    memory: "1GB"
}).firestore.document('ai_jobs/{jobId}').onWrite(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    // 1. Check if document exists (not delete)
    if (!change.after.exists) return;

    const job = change.after.data() as AIJob;
    const previousJob = change.before.exists ? change.before.data() as AIJob : null;
    const jobId = context.params.jobId;

    // 2. Only run if status IS 'queued' AND (it was new OR it changed to queued)
    const isNew = !previousJob;
    const becameQueued = previousJob && previousJob.status !== 'queued' && job.status === 'queued';

    if (!isNew && !becameQueued) {
        return; // Not a job start event
    }

    if (job.status !== 'queued') return; // Should not happen based on logic above, but safety check

    const startTime = Date.now();

    await JobsService.updateStatus(jobId, 'running');

    try {
        // Init Providers (Previously direct, now Router handled inside Workflows)
        // const googleKey = ... 

        let result;

        switch (job.type) {
            case 'ritual':
                await JobsService.updateProgress(jobId, 10, 'analyzing users');
                result = await AIWorkflows.performRitual(job);
                break;
            case 'magic_post':
                await JobsService.updateProgress(jobId, 20, 'crafting prompt');
                result = await AIWorkflows.performMagicPost(job);
                break;
            case 'chat':
                result = await AIWorkflows.performChat(job);
                break;
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }

        const duration = Date.now() - startTime;

        // Extract technical metadata from result to update Job Metadata
        // Workflows return { ..., metadata: { providerUsed, fallbackUsed } }
        let usageMetadata = {};
        if (result && result.metadata) {
            usageMetadata = result.metadata;
            delete result.metadata; // Remove from "result" field to keep it clean? Or keep it?
            // Let's keep it in result for now or merge to root metadata.
            // Better to update separate fields if possible?
        }

        await JobsService.updateStatus(jobId, 'succeeded', {
            result,
            duration,
            completedAt: new Date().toISOString(),
            // Merge metadata? ideally we want 'metadata.providerUsed'
            // Partial update validation might be strict.
            // Let's just put it in result for now as per design "result: any"
        });

        // If we want to update root metadata, we need to do it explicitly
        if (usageMetadata) {
            await admin.firestore().collection('ai_jobs').doc(jobId).set({
                metadata: usageMetadata
            }, { merge: true });
        }

    } catch (err: any) {
        console.error(`Job ${jobId} failed:`, err);
        const duration = Date.now() - startTime;

        // Special handling for cancellation
        if (err.message === "Job Cancelled") {
            // Already marked as cancelled in DB usually, but ensures consistency
            await JobsService.updateStatus(jobId, 'cancelled', {
                duration
            });
            return;
        }

        // 1. Mark as failed
        await JobsService.failJob(jobId, {
            code: 'internal_error',
            message: err.message || "Unknown error",
            details: err.stack
        });

        // 2. Refund Logic (Only for internal errors, not user cancellation)
        // If "Job Cancelled" error was thrown from checkCancelled, we don't refund? 
        // User triggered cancel, so maybe no refund? Or partial? 
        // For now, let's refund if it FAILED. If cancelled, no refund here (logic for refund on cancel should be in cancel endpoint if we want, or here).
        // Let's assume on Cancel we DO NOT refund automatically here unless specified.

        if (job.params.alterId && job.metadata?.costEstimate) {
            try {
                console.log(`Refunding ${job.metadata.costEstimate} credits to ${job.params.alterId} for failed job ${jobId}`);
                await BillingUtils.refundCredits(job.params.alterId, job.metadata.costEstimate, `Refund for failed job ${jobId}`);
            } catch (refundError) {
                console.error("Refund failed!", refundError);
            }
        }
    }
});
