
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const db = admin.firestore();

export class BillingUtils {
    static async chargeCredits(alterId: string, amount: number, description: string) {
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

    static async refundCredits(alterId: string, amount: number, description: string) {
        const alterRef = db.collection('alters').doc(alterId);
        await db.runTransaction(async (t) => {
            const doc = await t.get(alterRef);
            if (!doc.exists) throw new Error('Alter not found for refund');

            const data = doc.data();
            const credits = data?.credits || 0;

            t.update(alterRef, { credits: credits + amount });

            const txRef = alterRef.collection('credit_transactions').doc();
            t.set(txRef, {
                alterId,
                amount: amount, // Positive amount
                type: 'refund',
                description: "REFUND: " + description,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });
    }
}
