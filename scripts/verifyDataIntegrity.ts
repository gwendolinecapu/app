/**
 * SCRIPT DE VÉRIFICATION D'INTÉGRITÉ DES DONNÉES
 *
 * Ce script permet de scanner la base de données Firestore pour détecter les incohérences.
 * Il doit être exécuté dans un environnement Node.js avec les droits administrateur (Service Account).
 *
 * UTILISATION:
 * 1. Placer la clé de service account dans `service-account.json` à la racine (ou définir GOOGLE_APPLICATION_CREDENTIALS)
 * 2. Exécuter avec: `ts-node scripts/verifyDataIntegrity.ts`
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BATCH_SIZE = 100;
const CHECK_ORPHANS = true;
const CHECK_GROUPS = true;

// Initialisation
async function init() {
    if (admin.apps.length === 0) {
        try {
            // Tentative de chargement local si dispo
            const serviceAccountPath = path.resolve(__dirname, '../service-account.json');
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("✅ Admin SDK initialisé via service-account.json");
            } else {
                // Fallback (Google Cloud Environment ou GOOGLE_APPLICATION_CREDENTIALS)
                admin.initializeApp();
                console.log("✅ Admin SDK initialisé (Environment)");
            }
        } catch (e) {
            console.error("❌ Erreur d'initialisation Admin SDK:", e);
            process.exit(1);
        }
    }
}

async function verifyGroups() {
    console.log('\n🔍 VÉRIFICATION DES GROUPES...');
    const db = admin.firestore();
    const groupsSnap = await db.collection('groups').get();

    let issues = 0;

    for (const doc of groupsSnap.docs) {
        const data = doc.data();
        const groupId = doc.id;
        const membersArray = data.members || [];

        // Compter les membres réels dans la collection
        const membersCollSnap = await db.collection('group_members')
            .where('group_id', '==', groupId)
            .get();

        const realCount = membersCollSnap.size;
        const arrayCount = membersArray.length;

        if (realCount !== arrayCount) {
            console.warn(`⚠️ [GROUPE ${groupId}] Incohérence: Array=${arrayCount} vs Collection=${realCount}`);

            // Détails
            const realMemberIds = membersCollSnap.docs.map(d => d.data().system_id);
            const missingInColl = membersArray.filter((id: string) => !realMemberIds.includes(id));
            const missingInArray = realMemberIds.filter((id: string) => !membersArray.includes(id));

            if (missingInColl.length > 0) console.warn(`   -> Membres dans Array mais absents de Collection: ${missingInColl.join(', ')}`);
            if (missingInArray.length > 0) console.warn(`   -> Membres dans Collection mais absents de Array: ${missingInArray.join(', ')}`);

            issues++;
        }
    }

    console.log(`✅ Vérification Groupes terminée. ${issues} problèmes trouvés.`);
}

async function verifyOrphans() {
    console.log('\n🔍 RECHERCHE DE DONNÉES ORPHELINES...');
    const db = admin.firestore();

    // 1. Alters Orphelins (System manquant)
    console.log('... Scan des Alters');
    const altersSnap = await db.collection('alters').get();
    let orphanAlters = 0;

    // Cache des systems existants pour éviter N+1 reads
    const existingSystems = new Set();
    const systemIdsToCheck = new Set<string>();

    altersSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.systemId) systemIdsToCheck.add(d.systemId);
        if (d.system_id) systemIdsToCheck.add(d.system_id);
    });

    // Batch check systems
    const systemIds = Array.from(systemIdsToCheck);
    for (let i = 0; i < systemIds.length; i += 100) {
        const chunk = systemIds.slice(i, i + 100);
        if (chunk.length === 0) continue;
        const refs = chunk.map(id => db.collection('systems').doc(id));
        const snaps = await db.getAll(...refs);
        snaps.forEach(s => {
            if (s.exists) existingSystems.add(s.id);
        });
    }

    altersSnap.docs.forEach(doc => {
        const d = doc.data();
        const sysId = d.systemId || d.system_id;
        if (sysId && !existingSystems.has(sysId)) {
            console.warn(`⚠️ [ALTER ${doc.id}] Orphelin (System ${sysId} introuvable)`);
            orphanAlters++;
        }
    });

    // 2. Posts Orphelins
    console.log(`... Scan des Posts (Alters orphelins trouvés: ${orphanAlters})`);
    const postsSnap = await db.collection('posts').limit(500).get(); // Limit pour éviter trop de reads
    let orphanPosts = 0;

    for (const doc of postsSnap.docs) {
        const d = doc.data();
        // Check System
        if (d.system_id && !existingSystems.has(d.system_id)) {
             console.warn(`⚠️ [POST ${doc.id}] Orphelin (System ${d.system_id} introuvable)`);
             orphanPosts++;
        }
        // TODO: On pourrait checker l'alter_id aussi
    }

    console.log(`✅ Vérification Orphelins terminée. Alters: ${orphanAlters}, Posts(Sample): ${orphanPosts}`);
}

async function main() {
    await init();

    if (CHECK_GROUPS) await verifyGroups();
    if (CHECK_ORPHANS) await verifyOrphans();

    console.log('\n🏁 Script terminé.');
}

// Exécution si appelé directement
if (require.main === module) {
    main().catch(console.error);
}
