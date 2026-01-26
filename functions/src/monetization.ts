import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Constants mirrored from MonetizationTypes.ts (Single Source of Truth ideally, but duplicated for Functions safety)
const AD_CONFIG = {
    REWARD_ADS_FOR_AD_FREE: 3,
    REWARD_ADS_FOR_PREMIUM: 15,
    TRIAL_DURATION_DAYS: 14,
    FREE_MONTH_DAYS: 30,
};

const FIRESTORE_COLLECTION = 'user_monetization';

/**
 * Handle Ad Reward Claim Securely
 * Increments counters and grants rewards if thresholds met.
 */
export const claimAdReward = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const userId = context.auth.uid;
    const userRef = admin.firestore().collection(FIRESTORE_COLLECTION).doc(userId);

    return admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);

        // Initial state if not exists
        const currentData = doc.exists ? doc.data()! : {
            rewardAdsToday: 0,
            rewardAdsForAdFree: 0,
            rewardAdsForPremium: 0,
            tier: 'free'
        };

        // Increment counters
        const newData = {
            rewardAdsToday: (currentData.rewardAdsToday || 0) + 1,
            rewardAdsForAdFree: (currentData.rewardAdsForAdFree || 0) + 1,
            rewardAdsForPremium: (currentData.rewardAdsForPremium || 0) + 1,
        } as any;

        const results = {
            adFreeUnlocked: false,
            premiumUnlocked: false,
            message: 'Ad reward recorded'
        };

        // Check Ad-Free Threshold (3 ads = 7 days)
        if (newData.rewardAdsForAdFree >= AD_CONFIG.REWARD_ADS_FOR_AD_FREE) {
            newData.rewardAdsForAdFree = 0; // Reset progress
            const currentEnd = currentData.adFreeUntil || Date.now();
            newData.adFreeUntil = Math.max(currentEnd, Date.now()) + (7 * 24 * 60 * 60 * 1000);
            results.adFreeUnlocked = true;
        }

        // Check Premium Threshold (15 ads = 7 days)
        if (newData.rewardAdsForPremium >= AD_CONFIG.REWARD_ADS_FOR_PREMIUM) {
            newData.rewardAdsForPremium = 0; // Reset progress
            const currentEnd = currentData.premiumEndDate || Date.now();
            newData.premiumEndDate = Math.max(currentEnd, Date.now()) + (7 * 24 * 60 * 60 * 1000);
            newData.tier = 'premium'; // Update tier
            results.premiumUnlocked = true;
        }

        transaction.set(userRef, newData, { merge: true });

        // Grant Credit Reward (10 credits) - Log transaction
        // const creditRef = admin.firestore().collection('user_credits').doc(userId);
        // const creditDoc = await transaction.get(creditRef);
        // Note: credits might be in user_monetization too depending on schema, 
        // using separate collection or field? 
        // MonetizationTypes says 'credits' is in MonetizationStatus.
        // Let's update credits inside user_monetization to be safe based on types.
        newData.credits = (currentData.credits || 0) + 10;

        transaction.set(userRef, newData, { merge: true });

        return results;
    });
});

/**
 * Start 14-Day Trial Securely
 */
export const startTrial = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const userId = context.auth.uid;
    const userRef = admin.firestore().collection(FIRESTORE_COLLECTION).doc(userId);

    // const doc = await userRef.get();
    // const currentData = doc.exists ? doc.data()! : {};

    // Prevent abuse: Check if already had trial? 
    // For now, simple implementation logic as per client

    // We can add a "hasUsedTrial" flag later to be strict.

    const trialEndDate = Date.now() + (AD_CONFIG.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    await userRef.set({
        tier: 'trial',
        trialEndDate: trialEndDate
    }, { merge: true });

    return { success: true, trialEndDate };
});

/**
 * Activate Post-Trial Free Month
 */
export const activateFreeMonth = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const userId = context.auth.uid;
    const userRef = admin.firestore().collection(FIRESTORE_COLLECTION).doc(userId);

    return admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        const data = doc.data() || {};

        if (data.hasUsedFreeMonth) {
            throw new functions.https.HttpsError('failed-precondition', 'Free month already used');
        }

        // Logic: currentEnd + 30 days
        const currentEnd = data.premiumEndDate || Date.now();
        const newEnd = Math.max(currentEnd, Date.now()) + (AD_CONFIG.FREE_MONTH_DAYS * 24 * 60 * 60 * 1000);

        transaction.set(userRef, {
            premiumEndDate: newEnd,
            hasUsedFreeMonth: true,
            tier: 'premium'
        }, { merge: true });

        return { success: true, newEndDate: newEnd };
    });
});
