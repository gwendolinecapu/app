# ✅ Checklist de Déploiement Web - PluralConnect

## 🎯 État Actuel

✅ **Serveur Web Fonctionnel** : http://localhost:8081
✅ **Bundle Compilé** : 3175 modules
✅ **Chrome Ouvert** : Application accessible

---

## 📋 Vérifications Critiques

### 1. Connexion/Authentification

**URL à tester** : http://localhost:8081

- [ ] Page de connexion s'affiche correctement
- [ ] Design centré sur desktop (max-width appliqué)
- [ ] Formulaire email/mot de passe fonctionnel
- [ ] Bouton "Se connecter" cliquable
- [ ] Bouton "Continuer avec Google" fonctionnel sur web
- [ ] Redirection vers dashboard après login
- [ ] Pas d'erreurs dans Console Chrome

### 2. Console Chrome (F12)

Ouvrir la console et vérifier :

**Erreurs à ignorer (normales sur web)** :
```
CookieManager - Attendu sur web
Selector unknown - Warning React Native Web
Non-serializable values - Navigation normale
```

**Erreurs à corriger** :
```
❌ Module not found
❌ Cannot read property of undefined
❌ LocalAuthentication not available (devrait être désactivé)
❌ GoogleSignIn not configured (devrait fonctionner avec popup web)
```

### 3. Responsive Design

**Desktop (≥1024px)** :
- [ ] Contenu centré avec padding latéral
- [ ] Max-width 1200px appliquée
- [ ] Scrollbar personnalisée visible
- [ ] Typographie agrandie (H1: 32px)

**Tablette (768-1023px)** :
- [ ] Layout adapté (max-width 900px)
- [ ] Navigation accessible
- [ ] Formulaires utilisables

**Mobile (<768px)** :
- [ ] Pleine largeur sans padding inutile
- [ ] Boutons > 44px pour touch
- [ ] Pas de scroll horizontal
- [ ] Keyboard ne cache pas les inputs

**Test rapide** :
```
1. Cmd+Option+J (Chrome DevTools)
2. Click "Toggle Device Toolbar" (Cmd+Shift+M)
3. Sélectionner iPhone 13 Pro
4. Tester navigation et formulaires
5. Sélectionner iPad Air
6. Vérifier layout
```

---

## 🔧 Services Natifs - État

### ✅ Déjà Adaptés pour Web

- [x] **BiometricGuard** - Désactivé sur web ✅
- [x] **GoogleAuthService** - signInWithPopup() pour web ✅
- [x] **AdMediationService** - Skip sur web avec check isWeb ✅

### ⚠️ À Vérifier/Corriger

- [ ] **RevenueCatService** - Besoin d'alternative web (Stripe/PayPal)
- [ ] **MonetizationContext** - Vérifier les imports conditionnels
- [ ] **ConsentService** - Adapter pour GDPR web
- [ ] **LocalAIService** - Remplacer par API externe sur web
- [ ] **PushNotificationService** - Utiliser Web Push API
- [ ] **DynamicIslandService** - Désactiver sur web
- [ ] **WidgetBridge / WatchBridge** - Désactiver sur web

---

## 🚀 Tests Fonctionnels

### Authentification
1. [ ] Connexion avec email/password
2. [ ] Connexion avec Google (popup web)
3. [ ] Inscription nouveau compte
4. [ ] Déconnexion
5. [ ] Messages d'erreur corrects

### Navigation
1. [ ] Redirection après login vers dashboard
2. [ ] Navigation entre les pages
3. [ ] Bouton retour fonctionne
4. [ ] Links cliquables
5. [ ] Pas d'erreurs 404

### Dashboard
1. [ ] Affichage de la grille d'alters
2. [ ] Bouton "Ajouter un alter"
3. [ ] Recherche d'alters
4. [ ] Sélection d'alters (fronting)
5. [ ] Mode co-fronting
6. [ ] Navigation vers AlterSpace

### Formulaires & Inputs
1. [ ] Inputs texte focusables
2. [ ] Keyboard apparaît (mobile web)
3. [ ] Upload d'images (camera/gallery)
4. [ ] Validation de formulaire
5. [ ] Messages d'erreur

### Performance
1. [ ] Chargement initial < 3s
2. [ ] Scroll fluide
3. [ ] Animations fonctionnent
4. [ ] Pas de memory leak
5. [ ] Bundle size acceptable (<5MB)

---

## 🐛 Problèmes Potentiels et Solutions

### Problème : Écran blanc après login

**Solution** :
```javascript
// Vérifier que expo-router fonctionne sur web
// Dans app/_layout.tsx, ajouter :
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  console.log('Running on web, expo-router should work');
}
```

### Problème : "Module not found: @react-native-google-signin"

**Solution** : Déjà corrigée dans GoogleAuthService avec import conditionnel ✅

### Problème : Images ne chargent pas

**Solution** :
```javascript
// Utiliser require() pour les assets locaux
<Image source={require('../../assets/icon.png')} />

// Pas de chemins absolus :
// ❌ <Image source={{ uri: '/assets/icon.png' }} />
```

### Problème : Modal ne s'affiche pas correctement

**Solution** :
```javascript
// Ajouter position fixed pour web
modalStyle: {
  position: Platform.OS === 'web' ? 'fixed' : 'absolute',
  zIndex: 9999,
}
```

### Problème : Upload d'image ne fonctionne pas

**Solution** :
```javascript
// expo-image-picker devrait fonctionner sur web
// Vérifie qu'on utilise bien la bonne API
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.8,
});
```

---

## 📊 Performance Web

### Lighthouse (Chrome DevTools)

**Objectifs** :
- 🎯 Performance : > 80
- 🎯 Accessibility : > 90
- 🎯 Best Practices : > 85
- 🎯 SEO : > 80

**Comment tester** :
```
1. Chrome DevTools (F12)
2. Onglet "Lighthouse"
3. Sélectionner "Desktop" ou "Mobile"
4. Generate report
```

### Bundle Analysis

```bash
# Analyser la taille du bundle
npx expo export:web
du -sh web-build

# Objectif : < 5MB total
```

### Optimisations Recommandées

1. **Code Splitting** :
   ```javascript
   // Charger les routes à la demande
   const Dashboard = lazy(() => import('./dashboard'));
   ```

2. **Image Optimization** :
   ```javascript
   // Utiliser expo-image pour lazy loading
   import { Image } from 'expo-image';
   ```

3. **Tree Shaking** :
   ```javascript
   // Importer seulement ce qui est nécessaire
   import { func } from 'module'; // ✅
   // import * as Module from 'module'; // ❌
   ```

---

## 🌐 Déploiement Production

### Option 1 : Vercel (Recommandé)

```bash
# Install Vercel CLI
npm i -g vercel

# Build
npx expo export:web

# Deploy
cd web-build
vercel
```

### Option 2 : Netlify

```bash
# Build
npx expo export:web

# Drag & drop web-build/ sur netlify.com
```

### Option 3 : Firebase Hosting

```bash
# Build
npx expo export:web

# Deploy
firebase deploy --only hosting
```

### Configuration Vercel (vercel.json)

```json
{
  "buildCommand": "npx expo export:web",
  "outputDirectory": "web-build",
  "installCommand": "npm install",
  "devCommand": "npm run web",
  "framework": "react",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔐 Variables d'Environnement

Vérifier que ces variables sont configurées :

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

⚠️ **Sur Vercel/Netlify** : Ajouter ces variables dans les settings du projet

---

## ✅ Checklist Finale Avant Deploy

- [ ] Tous les tests fonctionnels passent
- [ ] Lighthouse score > 80 partout
- [ ] Bundle size < 5MB
- [ ] Pas d'erreurs console
- [ ] Responsive sur mobile/tablet/desktop
- [ ] Images optimisées
- [ ] Variables d'environnement configurées
- [ ] Firebase rules testées
- [ ] Google Auth fonctionne sur web
- [ ] PWA manifest configuré
- [ ] Service worker (optionnel)
- [ ] Analytics configuré (si souhaité)

---

## 📝 Notes

### Fonctionnalités Non Disponibles sur Web

Ces fonctionnalités sont automatiquement désactivées sur web :

- ❌ Biométrie (Face ID / Touch ID)
- ❌ AdMob (publicités natives)
- ❌ RevenueCat (achats in-app natifs)
- ❌ Apple Watch sync
- ❌ Widgets natifs
- ❌ Dynamic Island
- ❌ Notifications push natives
- ❌ Local AI (expo-llm-mediapipe)

### Alternatives Web

- **Achats** : Stripe / PayPal
- **Publicités** : Google AdSense
- **Notifications** : Web Push API
- **IA** : API Gemini / OpenAI

---

## 🆘 Support

En cas de problème :

1. Vérifier les logs du serveur : `/tmp/expo-web.log`
2. Vérifier la console Chrome (F12)
3. Consulter `WEB_FIXES.md` et `WEB_TESTING_GUIDE.md`
4. Redémarrer le serveur : `killall node && npm run web`

---

**Dernière mise à jour** : 2025-01-26
