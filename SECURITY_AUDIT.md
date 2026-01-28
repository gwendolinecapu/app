
# 🔒 Audit de Sécurité - PluralConnect
**Date**: 26 janvier 2026
**Audit réalisé par**: Claude Code
**Niveau de Risque Global**: ⚠️ **MOYEN** (Précédemment ÉLEVÉ)

---

## 📊 Résumé Exécutif

| Catégorie | Vulnérabilités | Risque |
|-----------|---------------|--------|
| 🔴 **Critiques** | 0 (8 corrigées) | ÉLEVÉ |
| 🟠 **Importantes** | 12 | MOYEN |
| 🟡 **Mineures** | 7 | FAIBLE |
| **TOTAL** | **19** | - |

---

## ✅ VULNÉRABILITÉS CORRIGÉES (26/01/2026)

### 1. [CORRIGÉ] Notifications lisibles par tous
Les règles Firestore restreignent désormais la lecture et la suppression des notifications au destinataire (`recipientId` ou `targetSystemId`).

### 2. [CORRIGÉ] Messages lisibles par tous
L'accès aux messages est strictement limité à l'expéditeur, au système propriétaire, ou au propriétaire de l'alter destinataire.

### 3. [CORRIGÉ] Création de Friendships sans validation
La création d'amitiés est restreinte : l'utilisateur authentifié doit être l'un des deux systèmes impliqués. Les doublons de règles ont été supprimés.

### 4. [CORRIGÉ] Group Members sans validation
Seul l'utilisateur lui-même peut s'ajouter à un groupe (`system_id == auth.uid`).

### 5. [CORRIGÉ] Friend Requests lisibles par tous
La lecture des demandes d'amis est restreinte à l'expéditeur ou au destinataire.

### 6. [FAUX POSITIF/CORRIGÉ] Hashage de mot de passe
L'audit précédent signalait l'usage de SHA-256 seul. Vérification faite : `PasswordService.ts` utilise `CryptoJS.PBKDF2` avec 100 000 itérations, ce qui est conforme aux recommandations NIST minimales (bien que 600k soient préférables, ce n'est pas critique). Le fallback mot de passe en clair est désactivé (`return false`).

---

## 🟠 VULNÉRABILITÉS RESTANTES (IMPORTANTES)

### 9. ⚠️ **Alters lisibles par tous (exposition de données sensibles)**
**Fichier**: `firestore.rules:59`
**Risque**: 🟠 **MOYEN-ÉLEVÉ**

```javascript
match /alters/{alterId} {
  allow read: if isAuthenticated(); // Public pour tous les users auth
```

**Problème**: Tous les alters de tous les systèmes sont visibles par n'importe quel utilisateur authentifié.
**Note**: Maintenu pour le moment pour les fonctionnalités sociales (Recherche/Découverte). Nécessite une refonte du modèle de données (visibilité).

### 11. ⚠️ **Posts modifiables par tous (champ likes)**
**Fichier**: `firestore.rules`
**Risque**: 🟠 **MOYEN**

Les règles autorisent la modification du champ `likes` par n'importe qui. Bien que restreint aux clés `likes` et `comments_count`, une implémentation atomique via Cloud Function serait plus sûre pour éviter les abus (spam de likes).

### 12. ⚠️ **Landing Page Stats modifiables**
**Fichier**: `firestore.rules`
**Risque**: 🟠 **MOYEN**
Le compteur est modifiable par le client. Devrait passer par une Cloud Function.

### 14. ⚠️ **Pas de limite de taille sur uploads vidéo (Cloud Function)**
**Fichier**: `functions/src/index.ts`
**Risque**: 🟠 **MOYEN**
Risque de déni de service / dépassement de mémoire.

### 15. ⚠️ **Pas de rate limiting sur Cloud Functions**
**Fichier**: `functions/src/index.ts`
**Risque**: 🟠 **MOYEN**
Risque d'abus d'API et de coûts.

### 16. ⚠️ **Pas de validation de type de fichier (Storage)**
**Fichier**: `storage.rules`
**Risque**: 🟠 **MOYEN**
Les règles Storage vérifient l'extension/MIME type mais une validation serveur réelle (Magic Bytes) est préférable.

### 18. ⚠️ **Console.log avec données sensibles**
**Risque**: 🟠 **MOYEN**
Nécessite un nettoyage du code source avant la production.

### FCM Tokens (Architecture Client-Side)
**Note**: La collection `fcm_tokens` reste lisible par tous les utilisateurs authentifiés (`allow read: if isAuthenticated();`).
**Raison**: L'application utilise une architecture d'envoi de push "client-à-client" (via Expo Push API appelé depuis le client). Restreindre la lecture casserait la fonctionnalité d'envoi de notifications (messages, likes).
**Recommandation**: Migrer la logique d'envoi de push vers une Cloud Function pour sécuriser les tokens.

---

## 🟡 VULNÉRABILITÉS MINEURES

### 21. ⚠️ **Pas de politique de mots de passe forts (Firebase Auth)**
Firebase Auth configuration par défaut.

### 22. ⚠️ **Pas de 2FA obligatoire**

### 27. ⚠️ **Dépendances potentiellement obsolètes**

---

## 🛡️ PROCHAINES ÉTAPES RECOMMANDÉES

### Priorité HAUTE (ce mois-ci)

1. **Migrer l'envoi de notifications vers Cloud Functions** : Cela permettra de verrouiller la collection `fcm_tokens` et d'éviter d'exposer les tokens de tous les utilisateurs.
2. **Ajouter rate limiting sur Cloud Functions** (Vulnérabilité #15).
3. **Valider les inputs côté serveur** (Vulnérabilité #20).

### Priorité MOYENNE (trimestre)

4. **Système de visibilité pour Alters** (Vulnérabilité #9).
5. **Implémenter un système de likes atomique** (Vulnérabilité #11).

---

**Mise à jour**: 26 janvier 2026 - Règles Firestore durcies.
