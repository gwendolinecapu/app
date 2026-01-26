# 🚀 Guide - Onboarding & Test Web

## ✅ C'EST NORMAL !

L'application affiche l'**onboarding (quiz)** la première fois que vous la lancez sur web. C'est le comportement attendu ! 🎉

```
┌────────────────────────────────────────┐
│                                        │
│     [ICÔNE VIOLETTE]                   │
│                                        │
│    Bienvenue sur Plural Connect        │
│                                        │
│  L'espace sécurisé pour la             │
│  communication et l'organisation       │
│  des systèmes pluriels                 │
│                                        │
│     [Suivant →]                        │
│                                        │
└────────────────────────────────────────┘
```

---

## 🎯 Option 1 : Compléter l'Onboarding (Recommandé)

**C'est rapide (2 minutes) !**

### Étapes :

1. **Slide 1** : "Bienvenue" → Cliquez **Suivant**
2. **Slide 2** : "Suivi du Front" → Cliquez **Suivant**
3. **Slide 3** : "Journal Intime" → Cliquez **Suivant**
4. **Slide 4** : "Espace Sécurisé" → Cliquez **Suivant**
5. **Slide 5** : "Nom du système"
   - Tapez : `Test Système` (ou laissez vide)
   - Cliquez **Suivant**
6. **Slide 6** : "Nombre d'alters"
   - Tapez : `5` (ou n'importe quel nombre)
   - Cliquez **Terminer**

**Résultat** : Vous serez redirigé vers la page de connexion ! ✅

---

## ⚡ Option 2 : Skip l'Onboarding (Pour Tests Rapides)

Si vous voulez aller directement à la connexion sans passer par l'onboarding :

### Dans Chrome :

1. **Ouvrez la Console** : `Cmd+Option+J` (Mac) ou `F12`

2. **Copiez/Collez ce code** dans la console :

```javascript
// Skip onboarding
localStorage.setItem('HAS_SEEN_ONBOARDING', 'true');

// Recharger la page
window.location.reload();
```

3. **Appuyez sur Entrée**

**Résultat** : La page se recharge et affiche directement la page de connexion ! 🎉

---

## 🔄 Réinitialiser l'Onboarding

Si vous voulez revoir l'onboarding plus tard :

```javascript
// Dans la Console Chrome
localStorage.clear();
window.location.reload();
```

---

## 📋 Ce Qui Se Passe Après l'Onboarding

Une fois l'onboarding complété (ou skippé), vous verrez :

```
┌────────────────────────────────────────┐
│                                        │
│         [LOGO PLURALCONNECT]           │
│                                        │
│         PluralConnect                  │
│  Un espace safe pour votre système     │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Email                           │  │
│  │  [_________________________]     │  │
│  │                                  │  │
│  │  Mot de passe                    │  │
│  │  [_________________________]     │  │
│  │                                  │  │
│  │  [   Se connecter   ]            │  │
│  │                                  │  │
│  │        ── OU ──                  │  │
│  │                                  │  │
│  │  [ Continuer avec Google ]       │  │
│  │                                  │  │
│  │  Pas encore de compte ?          │  │
│  │  S'inscrire                      │  │
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

---

## 🧪 Tests à Faire Ensuite

### 1. Tester l'Inscription

1. Cliquez sur **"S'inscrire"**
2. Remplissez le formulaire
3. Créez un compte

### 2. Tester la Connexion

1. Email : Entrez votre email
2. Mot de passe : Entrez votre mot de passe
3. Cliquez **"Se connecter"**

### 3. Tester Google Auth (Optionnel)

1. Cliquez **"Continuer avec Google"**
2. Une popup s'ouvre
3. Choisissez votre compte Google
4. Acceptez les permissions

---

## 🐛 Si Problème avec l'Onboarding

### Onboarding ne démarre pas / Écran blanc

**Solution** :
```bash
# Dans le terminal
killall node
npm run web
```

### Onboarding bloqué / Ne peut pas passer à la slide suivante

**Solution** :
1. Vérifiez que vous avez rempli les champs requis (slides 5 & 6)
2. Ou utilisez le script Skip ci-dessus

### Erreurs dans la Console

**Ouvrir Console** : `Cmd+Option+J` ou `F12`

Cherchez les **lignes ROUGES** et copiez-les.

---

## ✅ Checklist de Validation

Une fois l'onboarding passé :

- [ ] Page de connexion s'affiche
- [ ] Formulaire email/password visible
- [ ] Boutons cliquables
- [ ] Design correct (fond bleu)
- [ ] Pas d'erreurs console

---

## 💡 Pourquoi l'Onboarding ?

L'onboarding est important car il :
- Explique les fonctionnalités de l'app
- Collecte les infos de base (nom système, nb alters)
- Améliore l'expérience utilisateur
- S'affiche **une seule fois** (sauf si localStorage effacé)

C'est une **bonne chose** qu'il s'affiche ! 🎉

---

## 🎯 Résumé

1. **Première fois** : Onboarding s'affiche ✅ (Normal !)
2. **Option A** : Compléter l'onboarding (2 min)
3. **Option B** : Skip avec le script console
4. **Ensuite** : Tester connexion, inscription, etc.

---

**Dites-moi quelle option vous choisissez !** 👀
