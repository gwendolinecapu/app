# 🔍 Guide de Débogage Chrome - PluralConnect Web

## 📱 Que Voir dans Chrome

Votre navigateur devrait afficher : **http://localhost:8081**

---

## ✅ CE QUI DEVRAIT ÊTRE VISIBLE

### 1. **Page de Connexion**

```
┌─────────────────────────────────────┐
│                                     │
│         [LOGO PLURALCONNECT]        │
│                                     │
│         PluralConnect              │
│  Un espace safe pour votre système │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Email                        │ │
│  │  [votre@email.com________]    │ │
│  │                               │ │
│  │  Mot de passe                 │ │
│  │  [••••••••____________]       │ │
│  │                               │ │
│  │   [  Se connecter  ]          │ │
│  │                               │ │
│  │          OU                   │ │
│  │                               │ │
│  │  [ Continuer avec Google ]    │ │
│  │                               │ │
│  │  Pas encore de compte ?       │ │
│  │  S'inscrire                   │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Couleurs** :
- Fond : Bleu foncé (#0F2847)
- Carte : Bleu moyen (#163560)
- Texte : Blanc (#FFFFFF)
- Bouton principal : Violet (#8B5CF6)

---

## 🔎 OUVRIR LA CONSOLE CHROME

### Étape 1 : Ouvrir DevTools

**Mac** : `Cmd + Option + J`
**Windows/Linux** : `F12` ou `Ctrl + Shift + J`

### Étape 2 : Onglets Importants

```
┌────┬────┬─────────┬──────────┬────────┐
│Con-│Ele-│ Network │ Sources  │ Appli- │
│sole│ment│         │          │ cation │
└────┴────┴─────────┴──────────┴────────┘
```

#### **Console Tab**
- Messages de log
- Erreurs (rouge) ❌
- Warnings (jaune) ⚠️
- Info (bleu) ℹ️

#### **Network Tab**
- Voir les requêtes HTTP
- Vérifier si le bundle se charge
- Temps de chargement

#### **Elements Tab**
- Inspecter le HTML/CSS
- Vérifier les styles appliqués

---

## 🐛 VÉRIFICATIONS À FAIRE

### ✅ **1. Vérifier qu'il n'y a pas d'ERREURS ROUGES**

Dans la Console, cherchez :

```
❌ MAUVAIS - Erreurs à corriger :
  × Module not found: @react-native-google-signin
  × Cannot read property 'signIn' of undefined
  × LocalAuthentication is not available
  × Uncaught ReferenceError: X is not defined
```

```
✅ BON - Warnings acceptables :
  ⚠ CookieManager (normal sur web)
  ⚠ Selector unknown (React Native Web)
  ⚠ Non-serializable values (navigation)
```

### ✅ **2. Tester la Connexion**

1. Entrer un email : `test@test.com`
2. Entrer un mot de passe : `test123`
3. Cliquer "Se connecter"

**Résultat attendu** :
- Soit : Message d'erreur "Email ou mot de passe incorrect"
- Soit : Redirection vers le dashboard si le compte existe

### ✅ **3. Tester le Responsive**

**Ouvrir Device Toolbar** : `Cmd + Shift + M`

Tester ces tailles :
- **iPhone 13 Pro** (390x844) - Mobile
- **iPad Air** (820x1180) - Tablette
- **Desktop** (1920x1080) - Desktop

**Ce qui doit changer** :
- Mobile : Pleine largeur, padding réduit
- Tablette : Max 900px de large, centré
- Desktop : Max 1200px de large, centré

---

## 📊 INFORMATIONS À ME DONNER

### Checklist de Débogage

Copiez/collez ce template et remplissez :

```
## État de l'Application Web

### 1. Page de Connexion
- [ ] La page s'affiche correctement
- [ ] Les couleurs sont bonnes (bleu foncé)
- [ ] Le formulaire est visible
- [ ] Les boutons sont cliquables

### 2. Console Chrome
Nombre d'erreurs rouges : ___
Erreurs spécifiques :
- ...

Nombre de warnings jaunes : ___
Warnings spécifiques :
- ...

### 3. Network Tab
- [ ] index.bundle se charge (voir Network > JS)
- [ ] Temps de chargement : ___ secondes

### 4. Fonctionnalité
- [ ] Peut taper dans les inputs
- [ ] Bouton "Se connecter" réagit au clic
- [ ] Bouton "Google" réagit au clic

### 5. Responsive
- [ ] Mobile (390px) : OK / Problème : ___
- [ ] Tablette (820px) : OK / Problème : ___
- [ ] Desktop (1920px) : OK / Problème : ___

### 6. Autres Observations
___
```

---

## 🚨 ERREURS COMMUNES ET SOLUTIONS

### Erreur : Écran Blanc

**Console** : Vérifier les erreurs
**Solution** :
```bash
# Redémarrer le serveur
killall node
npm run web
```

### Erreur : "Cannot find module"

**Console** : `Module not found: @react-native-...`
**Solution** : Module natif appelé sur web
```bash
# Nettoyer et redémarrer
npm start -- --clear
```

### Erreur : "LocalAuthentication not available"

**Console** : Erreur biométrique
**Solution** : ✅ Déjà corrigé (BiometricGuard désactivé sur web)

### Erreur : "GoogleSignIn is not a function"

**Console** : Erreur Google Auth
**Solution** : ✅ Déjà corrigé (utilise signInWithPopup sur web)

### Erreur : Layout cassé / Pas responsive

**Elements Tab** : Vérifier les styles
**Solution** :
1. Inspecter l'élément (clic droit > Inspecter)
2. Vérifier que WebContainer est utilisé
3. Vérifier max-width et padding

---

## 📸 SCREENSHOTS À PRENDRE

Si possible, prenez des screenshots de :

1. **Page de connexion** (plein écran)
2. **Console Chrome** (avec erreurs si présentes)
3. **Network Tab** (montrant le bundle)
4. **Responsive** (mobile, tablette, desktop)

---

## 🛠️ COMMANDES UTILES

```bash
# Voir les logs du serveur en temps réel
tail -f /tmp/expo-web.log

# Redémarrer proprement
killall node && npm run web

# Nettoyer le cache
npm start -- --clear

# Build production (pour tester)
npx expo export:web
npx serve web-build
```

---

## ✉️ ME COMMUNIQUER

### Si tout fonctionne :
```
✅ L'app web fonctionne ! Voici ce que je vois :
- Page de connexion affichée
- Aucune erreur console
- Formulaire fonctionnel
- Responsive OK
```

### Si problèmes :
```
❌ Problème détecté :

**Ce que je vois** :
[Description ou screenshot]

**Console Chrome** :
[Copier/coller les erreurs]

**Network Tab** :
[bundle charge ? combien de temps ?]
```

---

## 🎯 OBJECTIF

L'application web devrait :
- ✅ Afficher la page de connexion
- ✅ Être responsive
- ✅ Avoir 0 erreurs rouges bloquantes
- ✅ Permettre de se connecter
- ✅ Rediriger vers le dashboard après login

**Dites-moi ce que vous voyez !** 👀
