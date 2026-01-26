
# 🔒 Audit de Sécurité - PluralConnect
**Date**: 26 janvier 2026
**Audit réalisé par**: Claude Code
**Niveau de Risque Global**: ⚠️ **ÉLEVÉ**

---

## 📊 Résumé Exécutif

| Catégorie | Vulnérabilités | Risque |
|-----------|---------------|--------|
| 🔴 **Critiques** | 8 | ÉLEVÉ |
| 🟠 **Importantes** | 12 | MOYEN |
| 🟡 **Mineures** | 7 | FAIBLE |
| **TOTAL** | **27** | - |

---

## 🔴 VULNÉRABILITÉS CRITIQUES (à corriger IMMÉDIATEMENT)

### 1. ⚠️ **Notifications lisibles par tous les utilisateurs authentifiés**
**Fichier**: `firestore.rules:461`
**Risque**: 🔴 **CRITIQUE**

```javascript
match /notifications/{notificationId} {
  allow read: if isAuthenticated(); // ❌ DANGEREUX !
```

**Problème**: N'importe quel utilisateur authentifié peut lire TOUTES les notifications de TOUS les autres utilisateurs. Cela expose des données privées comme :
- Messages privés
- Demandes d'amis
- Activités personnelles
- Informations sur les relations inter-alters

**Exploitation**:
```javascript
// Un attaquant peut facilement lire toutes les notifications
const allNotifications = await getDocs(collection(db, 'notifications'));
```

**Solution recommandée**:
```javascript
allow read: if isAuthenticated() && (
  resource.data.recipientId == request.auth.uid ||
  resource.data.targetSystemId == request.auth.uid
);
```

---

### 2. ⚠️ **Messages lisibles par tous les utilisateurs**
**Fichier**: `firestore.rules:263`
**Risque**: 🔴 **CRITIQUE**

```javascript
match /messages/{messageId} {
  allow read: if isAuthenticated(); // ❌ Pas de vérification du destinataire !
```

**Problème**: Tous les messages privés entre alters sont accessibles par n'importe quel utilisateur authentifié.

**Impact**: Violation massive de la confidentialité. Un utilisateur malveillant peut lire toutes les conversations privées de l'application.

**Solution**:
```javascript
allow read: if isAuthenticated() && (
  resource.data.senderId == request.auth.uid ||
  resource.data.systemId == request.auth.uid ||
  get(/databases/$(database)/documents/alters/$(resource.data.receiver_alter_id)).data.system_id == request.auth.uid
);
```

---

### 3. ⚠️ **Création de Friendships sans validation**
**Fichier**: `firestore.rules:446`
**Risque**: 🔴 **CRITIQUE**

```javascript
match /friendships/{friendshipId} {
  allow create: if isAuthenticated(); // ❌ Pas de validation !
```

**Problème**: N'importe qui peut créer des relations d'amitié entre n'importe quels utilisateurs sans leur consentement.

**Exploitation**:
```javascript
// Attaquant peut créer une fausse amitié
await addDoc(collection(db, 'friendships'), {
  systemId: 'victim_uid',
  friendSystemId: 'attacker_uid',
  // Accès aux données privées de la victime
});
```

**Solution**:
```javascript
allow create: if isAuthenticated() && (
  request.resource.data.systemId == request.auth.uid ||
  request.resource.data.friendSystemId == request.auth.uid
);
```

---

### 4. ⚠️ **Group Members sans validation d'appartenance**
**Fichier**: `firestore.rules:253`
**Risque**: 🔴 **CRITIQUE**

```javascript
match /group_members/{memberId} {
  allow create: if isAuthenticated(); // ❌ N'importe qui peut s'ajouter !
```

**Problème**: Un utilisateur peut s'ajouter à n'importe quel groupe sans invitation.

**Impact**: Accès non autorisé à des groupes privés, exposition de contenus privés.

---

### 5. ⚠️ **SHA-256 seul pour les mots de passe (insuffisant)**
**Fichier**: `src/services/PasswordService.ts:34`
**Risque**: 🔴 **CRITIQUE**

```typescript
const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + password
);
```

**Problème**: SHA-256 est trop rapide pour les mots de passe. Les attaques par force brute sont possibles avec des GPUs modernes.

**Bonnes pratiques ignorées**:
- ❌ Pas d'algorithme de dérivation de clé (KDF)
- ❌ Pas de facteur de travail configurable
- ❌ Pas de protection contre les attaques temporelles

**Solution recommandée**: Utiliser **PBKDF2**, **bcrypt** ou **Argon2** avec :
- Minimum 100 000 itérations pour PBKDF2
- Cost factor de 12+ pour bcrypt
- Paramètres recommandés pour Argon2id

---

### 6. ⚠️ **Fallback de mot de passe en clair**
**Fichier**: `src/services/PasswordService.ts:54-57`
**Risque**: 🔴 **CRITIQUE**

```typescript
// Support des anciens passwords en clair (migration)
if (!storedHash.includes(':')) {
    return password === storedHash; // ❌ PASSWORDS EN CLAIR !
}
```

**Problème**: L'application accepte et compare des mots de passe stockés en clair pour la "rétrocompatibilité".

**Impact**: Si la base de données est compromise, les anciens mots de passe sont immédiatement exposés.

**Solution**: Migration forcée des anciens comptes :
1. Détecter les anciens hashes
2. Forcer un changement de mot de passe
3. Supprimer ce code après migration

---

### 7. ⚠️ **Fallback btoa() pour le hashage**
**Fichier**: `src/services/PasswordService.ts:41`
**Risque**: 🔴 **CRITIQUE**

```typescript
const simpleHash = btoa(salt + password); // ❌ BASE64 N'EST PAS UN HASH !
```

**Problème**: `btoa()` est un encodage Base64, PAS un hash cryptographique. C'est réversible en un clic.

**Impact**: Les mots de passe "hashés" avec btoa sont aussi sûrs que du texte clair.

---

### 8. ⚠️ **Clés API Firebase exposées dans .env**
**Fichier**: `.env:3-9`
**Risque**: 🔴 **CRITIQUE** (si Git)

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDX8fxXcnZuxcmzDQwKOKJUSNAVC48uUwg
EXPO_PUBLIC_FIREBASE_PROJECT_ID=app-tdi
```

**Statut actuel**: ✅ `.env` est dans `.gitignore` (ligne 34)

**⚠️ MAIS**: Vérifier que le fichier n'a JAMAIS été commité dans l'historique Git.

**Vérification nécessaire**:
```bash
git log --all --full-history -- .env
```

Si le fichier apparaît dans l'historique, il faut :
1. Régénérer TOUTES les clés API Firebase
2. Nettoyer l'historique Git avec git-filter-repo
3. Force-push (⚠️ coordination équipe)

---

## 🟠 VULNÉRABILITÉS IMPORTANTES

### 9. ⚠️ **Alters lisibles par tous (exposition de données sensibles)**
**Fichier**: `firestore.rules:59`
**Risque**: 🟠 **MOYEN-ÉLEVÉ**

```javascript
match /alters/{alterId} {
  allow read: if isAuthenticated(); // Public pour tous les users auth
```

**Problème**: Tous les alters de tous les systèmes sont visibles par n'importe quel utilisateur authentifié.

**Données exposées**:
- Noms des alters
- Pronoms
- Âges
- Rôles
- Bios personnelles
- Photos de profil
- Informations médicales potentielles

**Justification possible**: Features sociales (recherche, profils publics)

**Recommandations**:
1. Implémenter un système de visibilité par alter (public/friends/private)
2. Filtrer les champs sensibles selon le niveau de visibilité
3. Ajouter un champ `visibility` et vérifier dans les règles

---

### 10. ⚠️ **Systems lisibles par tous**
**Fichier**: `firestore.rules:48`
**Risque**: 🟠 **MOYEN**

```javascript
match /systems/{systemId} {
  allow read: if isAuthenticated(); // Tous les systèmes publics
```

**Problème**: Informations de système accessibles à tous (usernames, emails potentiels, métadonnées).

---

### 11. ⚠️ **Posts modifiables par tous (champ likes)**
**Fichier**: `firestore.rules:75-78`
**Risque**: 🟠 **MOYEN**

```javascript
allow update: if isOwner(resource) || (
  isAuthenticated() &&
  request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'comments_count'])
);
```

**Problème**: N'importe qui peut modifier le nombre de likes et de commentaires.

**Exploitation**:
- Manipulation des likes (ajouter des millions)
- Fausser les statistiques
- Spam de likes

**Solution**: Utiliser des sous-collections ou Cloud Functions avec transactions atomiques.

---

### 12. ⚠️ **Landing Page Stats modifiables**
**Fichier**: `firestore.rules:633-637`
**Risque**: 🟠 **MOYEN**

```javascript
allow write: if request.resource.data.keys().hasOnly(['count', 'lastUpdated']) &&
                request.resource.data.count is int &&
                request.resource.data.count >= 0 &&
                request.resource.data.count <= 10000 &&
                request.resource.data.lastUpdated is string;
```

**Problème**: La validation est trop permissive.

**Exploitation possible**:
- Manipulation du compteur (mettre à 9999)
- Race conditions
- Incohérences dans les stats

**Solution**: Utiliser FieldValue.increment() côté client + Cloud Function.

---

### 13. ⚠️ **Friend Requests lisibles par tous**
**Fichier**: `firestore.rules:109, 411`
**Risque**: 🟠 **MOYEN**

```javascript
allow read: if isAuthenticated(); // Toutes les demandes d'amis publiques
```

**Problème**: Énumération des relations sociales, identification de patterns sociaux.

---

### 14. ⚠️ **Pas de limite de taille sur uploads vidéo**
**Fichier**: `functions/src/index.ts:108-116`
**Risque**: 🟠 **MOYEN**

```javascript
const { videoBase64, alterId, type = 'post', compress = true } = data;
const videoBuffer = Buffer.from(videoBase64, 'base64');
```

**Problème**: Aucune validation de la taille avant traitement.

**Impact**:
- Déni de service (upload de 2GB → crash function)
- Coûts Cloud Functions explosifs
- Épuisement de la mémoire

**Solution**:
```javascript
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
if (videoBase64.length * 0.75 > MAX_VIDEO_SIZE) {
    throw new functions.https.HttpsError('invalid-argument', 'Video too large');
}
```

---

### 15. ⚠️ **Pas de rate limiting sur Cloud Functions**
**Fichier**: `functions/src/index.ts`
**Risque**: 🟠 **MOYEN**

**Problème**: Aucune protection contre les abus sur :
- `performBirthRitual`
- `generateMagicPost`
- `uploadVideoPost`

**Impact**:
- Spam de requêtes coûteuses
- Épuisement du quota AI
- Factures Cloud Functions explosives

**Solution**: Implémenter rate limiting avec Firestore :
```javascript
const rateLimitDoc = await db.collection('rate_limits')
    .doc(`${context.auth.uid}_ritual`)
    .get();

if (rateLimitDoc.exists) {
    const lastCall = rateLimitDoc.data().timestamp;
    if (Date.now() - lastCall < 60000) { // 1 minute cooldown
        throw new functions.https.HttpsError('resource-exhausted', 'Too many requests');
    }
}
```

---

### 16. ⚠️ **Pas de validation de type de fichier (Storage)**
**Fichier**: `storage.rules`
**Risque**: 🟠 **MOYEN**

**Problème**: Aucune validation du type MIME sur les uploads.

**Exploitation**:
```javascript
// Uploader des exécutables malveillants déguisés en images
upload('avatars/user123/malware.exe.jpg', maliciousFile);
```

**Solution**:
```javascript
allow write: if isOwner(userId) &&
  request.resource.size < 10 * 1024 * 1024 &&
  request.resource.contentType.matches('image/.*');
```

---

### 17. ⚠️ **Pas de limite de taille sur Storage**
**Fichier**: `storage.rules`
**Risque**: 🟠 **MOYEN**

**Problème**: Un utilisateur peut uploader des fichiers illimités en taille.

**Impact**:
- Coûts de stockage explosifs
- Déni de service
- Remplissage du quota Firebase

---

### 18. ⚠️ **Console.log avec données sensibles**
**Fichier**: Multiple (à vérifier avec grep)
**Risque**: 🟠 **MOYEN**

**Problème potentiel**: Logs de données utilisateur en production.

**Recherche nécessaire**:
```bash
grep -r "console.log.*data\|console.log.*user\|console.log.*password" src/
```

---

### 19. ⚠️ **Pas de CSRF protection sur Cloud Functions**
**Fichier**: `functions/src/index.ts`
**Risque**: 🟠 **MOYEN**

**Problème**: Les Cloud Functions onCall n'ont pas de protection CSRF native.

**Note**: Firebase Auth Token fournit une protection partielle, mais validation d'origine recommandée.

---

### 20. ⚠️ **Pas de validation des inputs côté serveur**
**Fichier**: `functions/src/index.ts:27-28`
**Risque**: 🟠 **MOYEN**

```javascript
const { alterId, referenceImageUrls } = data;
// Aucune validation ! ❌
```

**Problème**: Les paramètres ne sont pas validés.

**Exploitation**:
```javascript
// Injection possible
performBirthRitual({
    alterId: "../../../etc/passwd",
    referenceImageUrls: ["javascript:alert(1)"]
});
```

**Solution**:
```javascript
if (!alterId || typeof alterId !== 'string' || alterId.length > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid alterId');
}

if (!Array.isArray(referenceImageUrls) || referenceImageUrls.length > 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid URLs');
}

referenceImageUrls.forEach(url => {
    if (!url.startsWith('https://')) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid URL protocol');
    }
});
```

---

## 🟡 VULNÉRABILITÉS MINEURES

### 21. ⚠️ **Pas de politique de mots de passe forts**
**Risque**: 🟡 **FAIBLE**

Firebase Auth n'impose que 6 caractères minimum par défaut.

**Recommandation**:
- Minimum 12 caractères
- Complexité (majuscules, chiffres, symboles)
- Vérification contre liste de mots de passe communs

---

### 22. ⚠️ **Pas de 2FA obligatoire**
**Risque**: 🟡 **FAIBLE**

**Recommandation**: Encourager ou imposer l'authentification à deux facteurs pour les comptes sensibles.

---

### 23. ⚠️ **Pas de rotation automatique des tokens**
**Risque**: 🟡 **FAIBLE**

**Recommandation**: Implémenter une expiration et rotation régulière des tokens d'authentification.

---

### 24. ⚠️ **Pas de détection d'activité suspecte**
**Risque**: 🟡 **FAIBLE**

**Recommandation**:
- Logging des tentatives de connexion échouées
- Détection de connexions depuis nouvelles localisations
- Alertes sur activité inhabituelle

---

### 25. ⚠️ **Pas de Content Security Policy (Web)**
**Risque**: 🟡 **FAIBLE**

**Recommandation**: Ajouter des headers CSP pour la version web.

---

### 26. ⚠️ **Pas de protection contre les énumérations**
**Risque**: 🟡 **FAIBLE**

**Problème**: Messages d'erreur qui révèlent si un email existe.

**Solution**: Messages génériques ("Email ou mot de passe incorrect").

---

### 27. ⚠️ **Dépendances potentiellement obsolètes**
**Risque**: 🟡 **FAIBLE-MOYEN**

**Vérification nécessaire**:
```bash
npm audit
npm outdated
```

---

## 🛡️ RECOMMANDATIONS PRIORITAIRES

### Priorité IMMÉDIATE (cette semaine)

1. **Corriger les règles Firestore pour notifications et messages** (Vulnérabilités #1 et #2)
2. **Supprimer le fallback btoa() et les mots de passe en clair** (Vulnérabilités #6 et #7)
3. **Ajouter validation sur friendships** (Vulnérabilité #3)
4. **Vérifier l'historique Git pour .env** (Vulnérabilité #8)

### Priorité HAUTE (ce mois-ci)

5. **Implémenter un algorithme de hashage moderne** (Vulnérabilité #5)
6. **Ajouter rate limiting sur Cloud Functions** (Vulnérabilité #15)
7. **Valider les inputs côté serveur** (Vulnérabilité #20)
8. **Ajouter limites de taille Storage** (Vulnérabilités #14, #16, #17)

### Priorité MOYENNE (trimestre)

9. **Système de visibilité pour Alters** (Vulnérabilité #9)
10. **Audit des console.log** (Vulnérabilité #18)
11. **Implémenter un système de likes atomique** (Vulnérabilité #11)

### Améliorations continues

12. **Politique de mots de passe forts**
13. **2FA optionnel puis obligatoire**
14. **Monitoring de sécurité**
15. **Audits réguliers des dépendances**

---

## 📋 Checklist de Sécurité

### Authentification
- [x] Authentification Firebase activée
- [ ] 2FA disponible
- [ ] Politique de mots de passe forts (12+ caractères)
- [ ] Rotation automatique des tokens
- [ ] Détection d'activité suspecte

### Autorisation
- [ ] Règles Firestore complètes et testées
- [ ] Règles Storage avec validation de type
- [ ] Validation des permissions côté serveur
- [ ] Tests unitaires des règles de sécurité

### Données
- [ ] Chiffrement au repos (Firebase natif: ✅)
- [ ] Chiffrement en transit (HTTPS: ✅)
- [ ] Hashage moderne des mots de passe
- [ ] Pas de données sensibles dans les logs
- [ ] Sauvegarde régulière des données

### Code
- [ ] Validation de tous les inputs utilisateur
- [ ] Protection contre l'injection SQL (N/A: NoSQL)
- [ ] Protection XSS
- [ ] Protection CSRF
- [ ] Rate limiting
- [ ] Gestion sécurisée des secrets

### Infrastructure
- [ ] Limites de taille sur uploads
- [ ] Quotas et limites configurés
- [ ] Monitoring et alertes
- [ ] Logs de sécurité centralisés
- [ ] Plan de réponse aux incidents

### Tests
- [ ] Tests de sécurité automatisés
- [ ] Audit régulier des dépendances
- [ ] Pentesting périodique
- [ ] Revue de code de sécurité

---

## 🔥 PLAN D'ACTION URGENT (Semaine 1)

### Jour 1-2: Corriger les fuites de données

**Fichier**: `firestore.rules`

```javascript
// CORRIGER IMMÉDIATEMENT:

// 1. Notifications
match /notifications/{notificationId} {
  allow read: if isAuthenticated() && (
    resource.data.recipientId == request.auth.uid ||
    resource.data.targetSystemId == request.auth.uid
  );
  allow create: if isAuthenticated() &&
    request.resource.data.senderId == request.auth.uid;
  allow update: if isAuthenticated() && (
    resource.data.recipientId == request.auth.uid ||
    resource.data.targetSystemId == request.auth.uid
  ) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
  allow delete: if isAuthenticated() && (
    resource.data.recipientId == request.auth.uid ||
    resource.data.targetSystemId == request.auth.uid
  );
}

// 2. Messages
match /messages/{messageId} {
  allow read: if isAuthenticated() && (
    resource.data.senderId == request.auth.uid ||
    resource.data.systemId == request.auth.uid ||
    get(/databases/$(database)/documents/alters/$(resource.data.receiver_alter_id)).data.system_id == request.auth.uid
  );
  // ... reste inchangé
}

// 3. Friendships
match /friendships/{friendshipId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && (
    request.resource.data.systemId == request.auth.uid ||
    request.resource.data.friendSystemId == request.auth.uid
  );
  allow delete: if isAuthenticated() && (
    resource.data.systemId == request.auth.uid ||
    resource.data.system_id == request.auth.uid
  );
}

// 4. Group Members
match /group_members/{memberId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() &&
    request.resource.data.system_id == request.auth.uid;
  allow delete: if isAuthenticated() &&
    resource.data.system_id == request.auth.uid;
}
```

**Déploiement**:
```bash
firebase deploy --only firestore:rules
```

---

### Jour 3: Corriger le hashage des mots de passe

**Fichier**: `src/services/PasswordService.ts`

```typescript
import * as Crypto from 'expo-crypto';

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;

/**
 * Hash un mot de passe avec PBKDF2-SHA256
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await Crypto.getRandomBytesAsync(SALT_LENGTH);
    const saltHex = Array.from(new Uint8Array(salt))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // PBKDF2 n'est pas natif dans expo-crypto, utiliser une lib comme crypto-js
    // OU migrer vers un hashage côté serveur avec Cloud Functions

    // SOLUTION TEMPORAIRE: Augmenter les itérations SHA-256
    let hash = password + saltHex;
    for (let i = 0; i < 10000; i++) {
        hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            hash
        );
    }

    return `v2:${saltHex}:${hash}`;
}

/**
 * Vérifie un mot de passe
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // SUPPRIMER le support des anciens passwords en clair
    if (!storedHash.startsWith('v2:')) {
        // Forcer la réinitialisation du mot de passe
        throw new Error('PASSWORD_MIGRATION_REQUIRED');
    }

    const [version, salt, hash] = storedHash.split(':');

    let computedHash = password + salt;
    for (let i = 0; i < 10000; i++) {
        computedHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            computedHash
        );
    }

    return computedHash === hash;
}
```

**Migration des comptes**:
```typescript
// Dans AuthContext, détecter et forcer la migration
if (error.message === 'PASSWORD_MIGRATION_REQUIRED') {
    Alert.alert(
        "Mise à jour de sécurité",
        "Pour votre sécurité, vous devez réinitialiser votre mot de passe.",
        [{ text: "Réinitialiser", onPress: () => router.push('/reset-password') }]
    );
}
```

---

### Jour 4-5: Validation et rate limiting

**Fichier**: `functions/src/index.ts`

Ajouter validation et rate limiting sur toutes les Cloud Functions.

---

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules Best Practices](https://firebase.google.com/docs/rules/rules-and-auth)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)

---

## 📝 Notes Finales

Cet audit a identifié **27 vulnérabilités** dont **8 critiques** nécessitant une action immédiate. La priorité absolue doit être donnée à la correction des fuites de données dans les règles Firestore et à l'amélioration du hashage des mots de passe.

**Estimation du temps de correction**:
- Corrections critiques: 3-5 jours
- Corrections importantes: 2-3 semaines
- Améliorations complètes: 2-3 mois

**Recommandation**: Effectuer un pentest professionnel après implémentation des corrections critiques.

---

**Audit réalisé le**: 26 janvier 2026
**Prochaine révision recommandée**: Dans 3 mois ou après changements majeurs
