
import * as functions from 'firebase-functions/v1';
import { Octokit } from '@octokit/rest';

// Configuration: Set these via firebase functions:config:set github.token="YOUR_TOKEN" github.owner="YOUR_OWNER" github.repo="YOUR_REPO"
// Or default to hardcoded for now if config is missing (but config is better security)
const GITHUB_TOKEN = functions.config().github?.token;
const OWNER = functions.config().github?.owner || 'gwendolinecapu'; // Assumed owner based on path
const REPO = functions.config().github?.repo || 'plural-connect'; // Assumed repo

const octokit = new Octokit({
    auth: GITHUB_TOKEN // If undefined, it might work for public repos but fail for creating issues. Needs token.
});

/**
 * Triggered when a new Feedback is created.
 * Syncs 'BUG' and 'FEATURE' to GitHub Issues.
 */
export const syncFeedbackToGitHub = functions.firestore
    .document('feedbacks/{feedbackId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const feedbackId = context.params.feedbackId;

        // Only sync BUG and FEATURE
        if (data.type !== 'BUG' && data.type !== 'FEATURE') {
            console.log(`[GitHub Sync] Skipped feedback ${feedbackId} of type ${data.type}`);
            return;
        }

        if (!GITHUB_TOKEN) {
            console.error('[GitHub Sync] No GitHub Token configured. Run: firebase functions:config:set github.token="..."');
            return;
        }

        const label = data.type === 'BUG' ? 'bug' : 'enhancement';
        const title = data.title || `Feedback from User (${data.type})`;

        // Build thorough description for Jules
        let body = `### ${data.title}\n\n`;
        body += `${data.description || 'No description provided.'}\n\n`;
        body += `---\n`;
        body += `**Type**: ${data.type}\n`;
        body += `**Reporter**: ${data.userId || 'Anonymous'}\n`;
        body += `**Feedback ID**: \`${feedbackId}\`\n`;
        if (data.version) body += `**App Version**: ${data.version}\n`;

        try {
            const response = await octokit.rest.issues.create({
                owner: OWNER,
                repo: REPO,
                title: title,
                body: body,
                labels: [label, 'jules-triage'] // 'jules-triage' allows you to filter specifically for these
            });

            console.log(`[GitHub Sync] Created Issue #${response.data.number} for feedback ${feedbackId}`);

            // Optional: Write back the issue URL to Firestore to link them
            await snap.ref.update({
                githubIssueUrl: response.data.html_url,
                githubIssueNumber: response.data.number,
                syncedToGithub: true,
                syncedAt: Date.now()
            });

        } catch (error: any) {
            console.error('[GitHub Sync] Failed to create issue:', error);
            // Don't throw, so the function doesn't retry indefinitely on fatal API errors (like bad token)
        }
    });
