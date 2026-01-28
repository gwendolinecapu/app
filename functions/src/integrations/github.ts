/**
 * GitHub Integration - Création automatique d'issues
 *
 * Quand un utilisateur signale un bug ou propose une feature,
 * cette fonction crée automatiquement une issue sur GitHub.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Types
interface FeedbackData {
    id: string;
    userId: string;
    userEmail?: string;
    type: 'BUG' | 'FEATURE';
    title: string;
    description: string;
    deviceInfo?: string;
    appVersion?: string;
    // Bug-specific
    stepsToReproduce?: string;
    expectedResult?: string;
    actualResult?: string;
    frequency?: 'ONCE' | 'SOMETIMES' | 'ALWAYS';
    // Feature-specific
    problemToSolve?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    // GitHub
    githubIssueUrl?: string;
    githubIssueNumber?: number;
}

/**
 * Crée le body de l'issue GitHub à partir du feedback
 */
function buildIssueBody(feedback: FeedbackData): string {
    const isBug = feedback.type === 'BUG';

    let body = `## Description\n${feedback.description}\n\n`;

    if (isBug) {
        body += `## Étapes pour reproduire\n${feedback.stepsToReproduce || 'Non spécifié'}\n\n`;
        body += `## Résultat attendu\n${feedback.expectedResult || 'Non spécifié'}\n\n`;

        if (feedback.actualResult) {
            body += `## Résultat obtenu\n${feedback.actualResult}\n\n`;
        }

        body += `## Fréquence\n`;
        switch (feedback.frequency) {
            case 'ALWAYS': body += '🔴 Toujours\n\n'; break;
            case 'SOMETIMES': body += '🟠 Parfois\n\n'; break;
            default: body += '🟢 Une seule fois\n\n';
        }
    } else {
        body += `## Problème que ça résout\n${feedback.problemToSolve || 'Non spécifié'}\n\n`;

        body += `## Priorité\n`;
        switch (feedback.priority) {
            case 'HIGH': body += '🔴 Haute\n\n'; break;
            case 'MEDIUM': body += '🟠 Moyenne\n\n'; break;
            default: body += '🟢 Basse\n\n';
        }
    }

    body += `---\n`;
    body += `## Informations techniques\n`;
    body += `- **App Version**: ${feedback.appVersion || 'Inconnue'}\n`;
    body += `- **Device**: ${feedback.deviceInfo || 'Inconnu'}\n`;
    body += `- **Feedback ID**: \`${feedback.id}\`\n`;
    body += `\n---\n`;
    body += `*Issue créée automatiquement depuis l'application Plural Connect*`;

    return body;
}

/**
 * Détermine les labels GitHub en fonction du type et de la priorité
 */
function getLabels(feedback: FeedbackData): string[] {
    const labels: string[] = [];

    // Type label
    if (feedback.type === 'BUG') {
        labels.push('bug');

        // Severity based on frequency
        if (feedback.frequency === 'ALWAYS') {
            labels.push('critical');
        }
    } else {
        labels.push('enhancement');

        // Priority
        if (feedback.priority === 'HIGH') {
            labels.push('priority: high');
        } else if (feedback.priority === 'LOW') {
            labels.push('priority: low');
        }
    }

    // Source label
    labels.push('from-app');

    return labels;
}

/**
 * Crée une issue GitHub via l'API REST
 */
async function createGitHubIssue(
    feedback: FeedbackData,
    config: { token: string; owner: string; repo: string }
): Promise<{ url: string; number: number }> {
    const { token, owner, repo } = config;

    const title = feedback.type === 'BUG'
        ? `🐛 [Bug] ${feedback.title}`
        : `💡 [Feature] ${feedback.title}`;

    const body = buildIssueBody(feedback);
    const labels = getLabels(feedback);

    // Utiliser fetch natif (Node 18+)
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            body,
            labels,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('GitHub API Error:', error);
        throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    const issue = await response.json() as { html_url: string; number: number };

    return {
        url: issue.html_url,
        number: issue.number,
    };
}

/**
 * Cloud Function: Déclenché quand un nouveau feedback est créé
 *
 * Configure avec:
 *   firebase functions:config:set github.token="ghp_xxx" github.owner="gwendolinecapu" github.repo="app"
 */
export const onFeedbackCreated = functions
    .runWith({
        secrets: ['GITHUB_TOKEN'], // Si tu utilises Secret Manager
    })
    .firestore
    .document('feedbacks/{feedbackId}')
    .onCreate(async (snap, context) => {
        const feedbackId = context.params.feedbackId;
        const data = snap.data() as Omit<FeedbackData, 'id'>;

        console.log(`📝 New feedback received: ${feedbackId} (${data.type})`);

        // Récupérer la config GitHub
        // Option 1: Environment config (firebase functions:config)
        // Option 2: Secret Manager (GITHUB_TOKEN)
        // Option 3: Firestore collection 'config'

        let githubToken: string | undefined;
        let githubOwner: string | undefined;
        let githubRepo: string | undefined;

        // Option 1: Variables d'environnement / Secret Manager
        githubToken = process.env.GITHUB_TOKEN;
        githubOwner = process.env.GITHUB_OWNER;
        githubRepo = process.env.GITHUB_REPO;

        // Option 2: Firestore config (fallback)
        if (!githubToken) {
            try {
                const configDoc = await admin.firestore().collection('config').doc('github').get();
                if (configDoc.exists) {
                    const configData = configDoc.data();
                    githubToken = configData?.token;
                    githubOwner = configData?.owner;
                    githubRepo = configData?.repo;
                }
            } catch (e) {
                console.log('No Firestore config found');
            }
        }

        // Valeurs par défaut pour owner/repo
        githubOwner = githubOwner || 'gwendolinecapu';
        githubRepo = githubRepo || 'app';

        if (!githubToken) {
            console.warn('⚠️ GitHub token not configured. Skipping issue creation.');
            console.warn('Configure with: firebase functions:config:set github.token="ghp_xxx"');
            console.warn('Or add to Firestore: config/github { token, owner, repo }');
            return;
        }

        try {
            // Créer l'issue GitHub
            const issue = await createGitHubIssue(
                { ...data, id: feedbackId },
                { token: githubToken, owner: githubOwner, repo: githubRepo }
            );

            console.log(`✅ GitHub issue created: ${issue.url}`);

            // Mettre à jour le feedback avec le lien GitHub
            await snap.ref.update({
                githubIssueUrl: issue.url,
                githubIssueNumber: issue.number,
                githubCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`📌 Feedback ${feedbackId} updated with GitHub issue #${issue.number}`);

        } catch (error: any) {
            console.error('❌ Failed to create GitHub issue:', error.message);

            // Marquer l'erreur dans Firestore (pour retry manuel)
            await snap.ref.update({
                githubError: error.message,
                githubErrorAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });

/**
 * Fonction callable pour créer manuellement une issue
 * (utile pour retry ou admin)
 */
export const createGitHubIssueManual = functions.https.onCall(async (data, context) => {
    // Admin only
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }

    const { feedbackId } = data;
    if (!feedbackId) {
        throw new functions.https.HttpsError('invalid-argument', 'feedbackId required');
    }

    const feedbackDoc = await admin.firestore().collection('feedbacks').doc(feedbackId).get();
    if (!feedbackDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Feedback not found');
    }

    const feedbackData = feedbackDoc.data() as FeedbackData;

    // Récupérer config GitHub depuis Firestore
    const configDoc = await admin.firestore().collection('config').doc('github').get();
    if (!configDoc.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'GitHub config not set');
    }

    const config = configDoc.data() as { token: string; owner: string; repo: string };

    const issue = await createGitHubIssue(
        { ...feedbackData, id: feedbackId },
        config
    );

    await feedbackDoc.ref.update({
        githubIssueUrl: issue.url,
        githubIssueNumber: issue.number,
        githubCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        githubError: admin.firestore.FieldValue.delete(),
        githubErrorAt: admin.firestore.FieldValue.delete(),
    });

    return { success: true, issueUrl: issue.url, issueNumber: issue.number };
});
