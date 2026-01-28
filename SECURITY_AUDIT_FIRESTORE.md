# Audit de Sécurité Firestore - PluralConnect
**Date**: 2026-01-28
**Auditeur**: Claude Code
**Fichier**: `firestore.rules`

---

## 🎯 Résumé Exécutif

Cet audit identifie **12 problèmes de sécurité** dans les règles Firestore, classés par gravité :
- 🔴 **1 CRITIQUE** : Exposition des emails utilisateurs
- 🟡 **8 MOYENS** : Performance, confidentialité, spam
- 🟢 **3 FAIBLES** : Optimisations recommandées

**Score global** : 6.5/10 - Nécessite corrections immédiates sur les problèmes critiques

---

## 🔴 Problèmes Critiques

### 1. Exposition des Emails - Systems Collection
**Fichier** : `firestore.rules:46-68`
**Gravité** : 🔴 CRITIQUE
**Impact** : Violation RGPD, phishing, spam

```javascript
match /systems/{systemId} {
  // ⚠️ PROBLÈME: N'importe quel utilisateur authentifié peut lire TOUS les emails
  allow read: if isAuthenticated();
}
```

**Risque** :
- Utilisateur malveillant peut extraire tous les emails de la base
- Violation RGPD (données personnelles non protégées)
- Possibilité de phishing ciblé
- Scraping de la base utilisateurs

**Solution recommandée** (déjà notée dans le code) :
```javascript
match /systems/{systemId} {
  // Restreindre aux propriétaires et admins
  allow read: if isAuthenticated() && (
    systemId == request.auth.uid ||
    isAdmin()
  );
}
```

**Migration nécessaire** :
1. Créer/utiliser collection `public_profiles` pour données publiques (username, avatar, bio)
2. Migrer tous les services pour utiliser `public_profiles` au lieu de `systems`
3. Restreindre `systems` aux propriétaires uniquement

**Priorité** : 🚨 IMMÉDIATE - À corriger dans Sprint 3

---

## 🟡 Problèmes Moyens

### 2. Messages - Lectures Firestore Coûteuses
**Fichier** : `firestore.rules:253-282`
**Gravité** : 🟡 MOYEN
**Impact** : Performance, coûts

```javascript
match /messages/{messageId} {
  allow read: if isAuthenticated() && (
    resource.data.senderId == request.auth.uid ||
    resource.data.systemId == request.auth.uid ||
    // ⚠️ PROBLÈME: Lecture supplémentaire à chaque vérification
    get(/databases/$(database)/documents/alters/$(resource.data.receiver_alter_id)).data.system_id == request.auth.uid
  );
}
```

**Risque** :
- Chaque lecture de message = 2-3 lectures Firestore
- Coût x2-3 sur les factures Firebase
- Latence accrue
- Si l'alter est supprimé, l'accès échoue

**Solution** :
```javascript
// Dénormaliser receiverSystemId dans les messages
match /messages/{messageId} {
  allow read: if isAuthenticated() && (
    resource.data.senderId == request.auth.uid ||
    resource.data.systemId == request.auth.uid ||
    resource.data.receiverSystemId == request.auth.uid  // ✅ Pas de get()
  );
}
```

**Action** : Migrer les messages pour inclure `receiverSystemId`

---

### 3. Friend Requests - Même Problème de Performance
**Fichier** : `firestore.rules:412-440`
**Gravité** : 🟡 MOYEN
**Impact** : Performance, coûts

```javascript
allow read: if isAuthenticated() && (
  resource.data.systemId == request.auth.uid ||
  resource.data.receiverSystemId == request.auth.uid ||
  // ⚠️ PROBLÈME: Lecture supplémentaire
  get(/databases/$(database)/documents/alters/$(resource.data.receiverId)).data.systemId == request.auth.uid
);
```

**Solution** : Toujours inclure `receiverSystemId` lors de la création

---

### 4. Groups - Tous Visibles Par Tous
**Fichier** : `firestore.rules:222-234`
**Gravité** : 🟡 MOYEN
**Impact** : Confidentialité

```javascript
match /groups/{groupId} {
  // ⚠️ PROBLÈME: Tous les groupes visibles par tous
  allow read: if isAuthenticated();
}
```

**Risque** :
- Impossible d'avoir des groupes privés
- Tous les utilisateurs voient tous les groupes
- Métadonnées des groupes exposées (noms, descriptions)

**Solution** :
```javascript
match /groups/{groupId} {
  // Seulement les membres peuvent lire
  allow read: if isAuthenticated() && (
    request.auth.uid in resource.data.members ||
    resource.data.is_public == true  // Si implémenté
  );
}
```

---

### 5. Group Members - Appartenances Publiques
**Fichier** : `firestore.rules:239-248`
**Gravité** : 🟡 MOYEN
**Impact** : Confidentialité

```javascript
match /group_members/{memberId} {
  // ⚠️ PROBLÈME: Tous peuvent voir qui est membre de quoi
  allow read: if isAuthenticated();
}
```

**Solution** :
```javascript
match /group_members/{memberId} {
  // Vérifier si l'utilisateur est membre du groupe concerné
  allow read: if isAuthenticated() && (
    resource.data.system_id == request.auth.uid ||
    // Ou membre du même groupe
    get(/databases/$(database)/documents/groups/$(resource.data.group_id)).data.members.hasAny([request.auth.uid])
  );
}
```

---

### 6. Notifications - Spam Possible
**Fichier** : `firestore.rules:470-493`
**Gravité** : 🟡 MOYEN
**Impact** : Spam, phishing

```javascript
match /notifications/{notificationId} {
  // ⚠️ PROBLÈME: N'importe qui peut créer des notifications pour n'importe qui
  allow create: if isAuthenticated();
}
```

**Risque** :
- Utilisateur malveillant peut spammer les notifications
- Peut usurper l'identité d'autres utilisateurs (senderId)
- Possibilité de phishing via notifications

**Solution** :
```javascript
match /notifications/{notificationId} {
  allow create: if isAuthenticated() && (
    // Vérifier que senderId correspond à l'utilisateur
    request.resource.data.senderId == request.auth.uid ||
    // OU utiliser Cloud Functions pour créer les notifications
    isAdmin()
  );
}
```

**Recommandation** : Migrer la création de notifications vers Cloud Functions

---

### 7. Stories - Pas de Contrôle de Visibilité
**Fichier** : `firestore.rules:545-560`
**Gravité** : 🟡 MOYEN
**Impact** : Confidentialité

```javascript
match /stories/{storyId} {
  // ⚠️ PROBLÈME: Toutes les stories visibles par tous
  allow read: if isAuthenticated();
}
```

**Risque** :
- Stories privées visibles par tous
- Pas de contrôle de visibilité comme les posts
- Impossible d'avoir des stories "friends only"

**Solution** :
```javascript
match /stories/{storyId} {
  allow read: if isAuthenticated() && (
    resource.data.system_id == request.auth.uid ||
    resource.data.visibility == 'public' ||
    // Ajouter logique friends/system si nécessaire
  );
}
```

---

### 8. Friendships - Graphe Social Public
**Fichier** : `firestore.rules:448-464`
**Gravité** : 🟡 MOYEN
**Impact** : Confidentialité (probablement intentionnel)

```javascript
match /friendships/{friendshipId} {
  // ⚠️ Tous peuvent voir toutes les amitiés
  allow read: if isAuthenticated();
}
```

**Note** : Peut être intentionnel pour une app sociale, mais à vérifier selon les specs produit

---

### 9. Follows - Graphe de Suivi Public
**Fichier** : `firestore.rules:315-329`
**Gravité** : 🟡 MOYEN
**Impact** : Confidentialité (probablement intentionnel)

```javascript
match /follows/{followId} {
  // ⚠️ Tous peuvent voir qui suit qui
  allow read: if isAuthenticated();
}
```

**Note** : Probablement intentionnel pour découverte sociale

---

## 🟢 Problèmes Faibles

### 10. FCM Tokens - Tous Lisibles
**Fichier** : `firestore.rules:589-596`
**Gravité** : 🟢 FAIBLE
**Impact** : Sécurité limitée

```javascript
match /fcm_tokens/{tokenId} {
  // ⚠️ Tous peuvent lire tous les tokens
  allow read: if isAuthenticated();
}
```

**Note** : Tokens FCM seuls ne permettent pas d'envoyer des notifications (nécessite clé serveur)
**Recommandation** : Migrer vers Cloud Functions pour la gestion des tokens

---

### 11. Comments sur Posts - Performance
**Fichier** : `firestore.rules:127-139`
**Gravité** : 🟢 FAIBLE
**Impact** : Performance

```javascript
allow delete: if isAuthenticated() && (
  request.auth.uid == resource.data.author_id ||
  // ⚠️ Lecture supplémentaire
  isOwner(get(/databases/$(database)/documents/posts/$(postId)))
);
```

**Note** : Nécessaire pour la fonctionnalité, acceptable

---

### 12. Story Highlights - Visibilité
**Fichier** : `firestore.rules:580-584`
**Gravité** : 🟢 FAIBLE
**Impact** : Confidentialité

```javascript
match /story_highlights/{highlightId} {
  allow read: if isAuthenticated();
}
```

**Recommandation** : Implémenter la visibilité selon le profil de l'alter

---

## ✅ Points Positifs

### Collections Bien Sécurisées

1. **Feedbacks** (ligne 499-540) - ✅ EXCELLENT
   - Votes sécurisés avec validation stricte
   - Comments avec règles appropriées
   - Distinction bug/feature respectée

2. **User Monetization** (ligne 359-374) - ✅ EXCELLENT
   - `allow write: if false` - Force l'utilisation de Cloud Functions
   - Évite manipulation des crédits côté client

3. **Landing Stats** (ligne 651-659) - ✅ EXCELLENT
   - Compteur protégé avec `allow write: if false`
   - Atomic increment via Cloud Functions

4. **Conversations** (ligne 288-310) - ✅ BON
   - Restriction aux participants
   - Pas de suppression (préserve historique)

5. **Emotions, Journal, Tasks, Roles** - ✅ BON
   - Propriétaire uniquement
   - Règles cohérentes

---

## 📊 Statistique des Règles

| Statut | Count | Collections |
|--------|-------|-------------|
| ✅ Sécurisé | 12 | feedbacks, user_monetization, emotions, journal_entries, tasks, roles, etc. |
| ⚠️ À améliorer | 8 | messages, friend_requests, groups, notifications, stories, etc. |
| 🔴 Critique | 1 | systems |

---

## 🎯 Plan d'Action Recommandé

### Sprint 3 (Immédiat)
1. **CRITIQUE** : Corriger exposition emails dans `systems`
   - Créer migration vers `public_profiles`
   - Restreindre lecture de `systems`

2. **MOYEN** : Sécuriser les notifications
   - Migrer création vers Cloud Functions
   - OU valider `senderId`

### Sprint 4 (Court terme)
3. **MOYEN** : Optimiser messages et friend_requests
   - Dénormaliser `receiverSystemId`
   - Supprimer `get()` des rules

4. **MOYEN** : Implémenter visibilité stories
   - Ajouter champ `visibility`
   - Restreindre lecture selon visibilité

### Sprint 5 (Moyen terme)
5. **MOYEN** : Revoir confidentialité groupes
   - Décider si groupes privés nécessaires
   - Implémenter si oui

6. **FAIBLE** : Migrer FCM tokens vers Cloud Functions

---

## 🔍 Tests Recommandés

### Tests de Sécurité à Implémenter

```javascript
// Test 1: Vérifier qu'un utilisateur ne peut pas lire les emails des autres
it('should not allow reading other users emails', async () => {
  const alice = testEnv.authenticatedContext('alice');
  const bob = testEnv.authenticatedContext('bob');

  await firebase.assertFails(
    alice.firestore().collection('systems').doc('bob').get()
  );
});

// Test 2: Vérifier qu'on ne peut pas créer de notifications pour d'autres
it('should not allow creating notifications with fake senderId', async () => {
  const alice = testEnv.authenticatedContext('alice');

  await firebase.assertFails(
    alice.firestore().collection('notifications').add({
      senderId: 'bob',  // Usurpation d'identité
      recipientId: 'charlie',
      type: 'like'
    })
  );
});

// Test 3: Vérifier qu'on ne peut pas manipuler les crédits
it('should not allow direct credit manipulation', async () => {
  const alice = testEnv.authenticatedContext('alice');

  await firebase.assertFails(
    alice.firestore().collection('user_credits').doc('alice').set({
      credits: 999999
    })
  );
});
```

---

## 📝 Notes Complémentaires

### Bonnes Pratiques Observées

1. **Fonctions helpers** bien définies (`isAuthenticated`, `isOwner`, `isAdmin`)
2. **Commentaires clairs** avec emojis pour la gravité
3. **Validation stricte** sur les champs modifiables (`affectedKeys()`)
4. **Timestamps serveur** forcés sur certaines collections
5. **Cloud Functions** utilisées pour opérations critiques

### Améliorations Générales Suggérées

1. Ajouter validation de types sur tous les `create`
2. Limiter la taille des tableaux (votes, likes, etc.)
3. Implémenter rate limiting côté client pour spam
4. Auditer régulièrement avec Firebase Emulator
5. Logger les tentatives d'accès suspects

---

**Fin du rapport d'audit**
**Prochaine étape** : Prioriser et implémenter les corrections selon le plan d'action
