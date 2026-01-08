import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { JobsService } from '../services/JobsService';
import { AIWorkflows } from '../services/AIWorkflows';
import { BillingUtils } from '../../utils/billing';

// Secrets
const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY", "OPENAI_API_KEY"];

export const processAIJob = functions.runWith({
    secrets: SECRETS,
    timeoutSeconds: 540,
    memory: "1GB"
}).firestore.document('ai_jobs/{jobId}').onWrite(async (change, context) => {
    // 1. Check if document exists (not delete)
    if (!change.after.exists)
        return;

    const job = change.after.data();
    if (!job) return;
    const previousJob = change.before.exists ? change.before.data() : null;
    const jobId = context.params.jobId;

    // 2. Only run if status IS 'queued' AND (it was new OR it changed to queued)
    const isNew = !previousJob;
    const becameQueued = previousJob && previousJob.status !== 'queued' && job.status === 'queued';

    if (!isNew && !becameQueued) {
        return; // Not a job start event
    }

    if (job.status !== 'queued')
        return; // Should not happen based on logic above, but safety check

    const startTime = Date.now();
    await JobsService.updateStatus(jobId, 'running');

    try {
        let result;
        switch (job.type) {
            case 'ritual':
                await JobsService.updateProgress(jobId, 10, 'analyzing users');
                result = await AIWorkflows.performRitual(job as any);
                break;
            case 'magic_post':
                await JobsService.updateProgress(jobId, 20, 'crafting prompt');
                result = await AIWorkflows.performMagicPost(job as any);
                break;
            case 'chat':
                result = await AIWorkflows.performChat(job as any);
                break;
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }

        const duration = Date.now() - startTime;

        // Extract technical metadata from result to update Job Metadata
        let usageMetadata = {};
        if (result && result.metadata) {
            usageMetadata = result.metadata;
            delete (result as any).metadata;
        }

        await JobsService.updateStatus(jobId, 'succeeded', {
            result,
            duration,
            completedAt: new Date().toISOString(),
        });

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

        // 2. Refund Logic
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
