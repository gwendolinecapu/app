#!/usr/bin/env node
/**
 * Script d'audit de sécurité pour détecter les alters non autorisés
 *
 * Ce script vérifie que tous les alters appartiennent bien à un système existant
 * et détecte les créations potentiellement non autorisées.
 *
 * Usage: node audit-alters.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialiser Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                           path.join(__dirname, 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialisé');
} catch (error) {
  console.error('❌ Erreur d\'initialisation Firebase Admin:', error.message);
  console.error('');
  console.error('Pour utiliser ce script, vous devez :');
  console.error('1. Télécharger votre clé de service depuis Firebase Console');
  console.error('2. La placer dans serviceAccountKey.json à la racine du projet');
  console.error('   OU définir GOOGLE_APPLICATION_CREDENTIALS avec le chemin');
  console.error('');
  console.error('Télécharger depuis : https://console.firebase.google.com/project/app-tdi/settings/serviceaccounts/adminsdk');
  process.exit(1);
}

const db = admin.firestore();

async function auditAlters() {
  console.log('\n🔍 AUDIT DE SÉCURITÉ - Collection Alters\n');
  console.log('='.repeat(60));

  try {
    // 1. Récupérer tous les alters
    console.log('\n📥 Récupération de tous les alters...');
    const altersSnapshot = await db.collection('alters').get();
    console.log(`   Total d'alters : ${altersSnapshot.size}`);

    // 2. Récupérer tous les systems pour vérification
    console.log('\n📥 Récupération de tous les systèmes...');
    const systemsSnapshot = await db.collection('systems').get();
    const validSystemIds = new Set();
    systemsSnapshot.forEach(doc => validSystemIds.add(doc.id));
    console.log(`   Total de systèmes : ${validSystemIds.size}`);

    // 3. Analyser chaque alter
    console.log('\n🔍 Analyse des alters...\n');

    const suspiciousAlters = [];
    const orphanedAlters = [];
    const validAlters = [];
    const inconsistentFields = [];

    for (const doc of altersSnapshot.docs) {
      const alter = doc.data();
      const alterId = doc.id;

      // Extraire tous les champs de systemId possibles
      const systemIdFields = {
        systemId: alter.systemId,
        system_id: alter.system_id,
        userId: alter.userId
      };

      // Déterminer le systemId principal
      const systemId = systemIdFields.systemId || systemIdFields.system_id || systemIdFields.userId;

      // Vérifier les incohérences
      const uniqueSystemIds = new Set(
        Object.values(systemIdFields).filter(v => v !== undefined)
      );

      if (uniqueSystemIds.size > 1) {
        inconsistentFields.push({
          alterId,
          name: alter.name || 'Sans nom',
          fields: systemIdFields,
          createdAt: alter.created_at?.toDate?.() || 'Inconnu'
        });
      }

      // Vérifier si le système existe
      if (!systemId) {
        orphanedAlters.push({
          alterId,
          name: alter.name || 'Sans nom',
          reason: 'Aucun champ systemId trouvé',
          createdAt: alter.created_at?.toDate?.() || 'Inconnu'
        });
      } else if (!validSystemIds.has(systemId)) {
        suspiciousAlters.push({
          alterId,
          name: alter.name || 'Sans nom',
          systemId,
          reason: 'Système inexistant',
          createdAt: alter.created_at?.toDate?.() || 'Inconnu'
        });
      } else {
        validAlters.push(alterId);
      }
    }

    // 4. Afficher les résultats
    console.log('='.repeat(60));
    console.log('\n📊 RÉSULTATS DE L\'AUDIT\n');

    console.log(`✅ Alters valides : ${validAlters.length}`);
    console.log(`⚠️  Alters orphelins (sans systemId) : ${orphanedAlters.length}`);
    console.log(`🚨 Alters suspects (système inexistant) : ${suspiciousAlters.length}`);
    console.log(`⚠️  Alters avec champs incohérents : ${inconsistentFields.length}`);

    // 5. Détails des alters suspects
    if (suspiciousAlters.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('\n🚨 ALTERS SUSPECTS (Système inexistant)\n');

      suspiciousAlters.forEach((alter, index) => {
        console.log(`${index + 1}. Alter ID: ${alter.alterId}`);
        console.log(`   Nom: ${alter.name}`);
        console.log(`   SystemId: ${alter.systemId}`);
        console.log(`   Raison: ${alter.reason}`);
        console.log(`   Date création: ${alter.createdAt}`);
        console.log('');
      });

      console.log('⚠️  ACTION REQUISE : Ces alters doivent être supprimés');
    }

    // 6. Détails des alters orphelins
    if (orphanedAlters.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('\n⚠️  ALTERS ORPHELINS (Sans systemId)\n');

      orphanedAlters.forEach((alter, index) => {
        console.log(`${index + 1}. Alter ID: ${alter.alterId}`);
        console.log(`   Nom: ${alter.name}`);
        console.log(`   Raison: ${alter.reason}`);
        console.log(`   Date création: ${alter.createdAt}`);
        console.log('');
      });

      console.log('⚠️  ACTION REQUISE : Ces alters doivent être corrigés ou supprimés');
    }

    // 7. Détails des champs incohérents
    if (inconsistentFields.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('\n⚠️  ALTERS AVEC CHAMPS INCOHÉRENTS\n');

      inconsistentFields.forEach((alter, index) => {
        console.log(`${index + 1}. Alter ID: ${alter.alterId}`);
        console.log(`   Nom: ${alter.name}`);
        console.log(`   Champs:`);
        Object.entries(alter.fields).forEach(([key, value]) => {
          if (value) console.log(`     - ${key}: ${value}`);
        });
        console.log(`   Date création: ${alter.createdAt}`);
        console.log('');
      });

      console.log('⚠️  RECOMMANDATION : Normaliser vers une seule convention');
    }

    // 8. Recommandations
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 RECOMMANDATIONS\n');

    if (suspiciousAlters.length > 0 || orphanedAlters.length > 0) {
      console.log('1. Supprimer les alters suspects et orphelins :');
      console.log('   npx firebase firestore:delete /alters/[ALTER_ID]');
      console.log('');
    }

    if (inconsistentFields.length > 0) {
      console.log('2. Normaliser les champs systemId :');
      console.log('   Choisir une convention unique (systemId ou system_id)');
      console.log('   Créer un script de migration pour unifier les données');
      console.log('');
    }

    console.log('3. Surveiller les logs Firestore pour détecter les tentatives non autorisées');
    console.log('   https://console.firebase.google.com/project/app-tdi/firestore/rules');
    console.log('');

    console.log('4. Vérifier les autres collections avec isOwnerCreate() :');
    console.log('   - posts');
    console.log('   - stories');
    console.log('   - journal_entries');
    console.log('   - tasks');
    console.log('');

    console.log('='.repeat(60));
    console.log('\n✅ Audit terminé\n');

    // 9. Retourner les résultats pour traitement automatique si nécessaire
    return {
      total: altersSnapshot.size,
      valid: validAlters.length,
      suspicious: suspiciousAlters,
      orphaned: orphanedAlters,
      inconsistent: inconsistentFields
    };

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'audit:', error);
    throw error;
  }
}

// Exécuter l'audit
auditAlters()
  .then((results) => {
    // Exit avec code d'erreur si des problèmes détectés
    if (results.suspicious.length > 0 || results.orphaned.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
