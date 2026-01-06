
import * as functions from "firebase-functions";
import { JobsService } from "../services/JobsService";
import { GeminiProvider } from "../providers/GeminiProvider";
import { BytePlusProvider } from "../providers/BytePlusProvider";
import { AIWorkflows } from "../services/AIWorkflows";
import { AIJob } from "../interfaces/IAIJob";
import { BillingUtils } from "../../utils/billing";

// Secrets
const SECRETS = ["GOOGLE_AI_API_KEY", "BYTEPLUS_API_KEY"];

export const processAIJob = functions.runWith({
    secrets: SECRETS, // Ensure these are set in Firebase
    timeoutSeconds: 540, // 9 mins max
    memory: "1GB"
}).firestore.document('ai_jobs/{jobId}').onCreate(async (snap, context) => {
    const job = snap.data() as AIJob;
    const jobId = context.params.jobId;
    const startTime = Date.now();

    // Prevent double execution if status isn't queued (idempotency check)
    if (job.status !== 'queued') return;

    await JobsService.updateStatus(jobId, 'running');

    try {
        // Init Providers
        const googleKey = process.env.GOOGLE_AI_API_KEY;
        const bytePlusKey = process.env.BYTEPLUS_API_KEY;

        if (!googleKey || !bytePlusKey) {
            throw new Error("Missing API Keys");
        }

        const llm = new GeminiProvider(googleKey, "gemini-1.5-flash"); // Using Flash for speed/cost
        const imageGen = new BytePlusProvider(bytePlusKey);

        let result;

        switch (job.type) {
            case 'ritual':
                await JobsService.updateProgress(jobId, 10, 'analyzing users');
                result = await AIWorkflows.performRitual(job, llm, imageGen);
                break;
            case 'magic_post':
                await JobsService.updateProgress(jobId, 20, 'crafting prompt');
                result = await AIWorkflows.performMagicPost(job, llm, imageGen);
                break;
            case 'chat':
                result = await AIWorkflows.performChat(job, llm);
                break;
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }

        const duration = Date.now() - startTime;
        await JobsService.updateStatus(jobId, 'succeeded', {
            result,
            duration,
            completedAt: new Date().toISOString()
        });

    } catch (err: any) {
        console.error(`Job ${jobId} failed:`, err);
        const duration = Date.now() - startTime;

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
