# 🧪 Guide de Test Web - PluralConnect

## 📱 Application Web Lancée

✅ **Serveur Web** : http://localhost:8081
✅ **Chrome ouvert** : L'application devrait être visible dans Chrome
✅ **Bundle compilé** : 3175 modules chargés avec succès

---

## 🔍 Que Vérifier Maintenant

### 1. Page de Connexion

**Ce qui devrait fonctionner :**
- ✅ Design centré sur desktop
- ✅ Formulaire email/mot de passe
- ✅ Bouton "Se connecter"
- ✅ Bouton "Continuer avec Google"
- ✅ Lien vers inscription
- ✅ Responsive (redimensionner la fenêtre)

**Tests à faire :**
1. Entrer un email et mot de passe
2. Cliquer sur "Se connecter"
3. Vérifier la redirection vers dashboard après connexion
4. Tester le responsive (redimensionner la fenêtre)
5. Vérifier l'apparence sur mobile (DevTools → Toggle Device Toolbar)

### 2. Ouvrir la Console Développeur

**Chrome DevTools** : `Cmd+Option+J` (Mac) ou `F12` (Windows/Linux)

**Vérifier :**
- [ ] Pas d'erreurs rouges dans la console
- [ ] Warnings acceptables (ne pas bloquer l'app)
- [ ] Network tab : toutes les ressources chargées

**Erreurs potentielles à ignorer :**
```
CookieManager - Expected sur web
Selector unknown - Warning React Native Web
Non-serializable values - Normal pour navigation
```

### 3. Problèmes Connus et Solutions

#### ❌ "LocalAuthentication is not available"
**Solution** : Normal sur web, BiometricGuard est désactivé ✅

#### ❌ "GoogleSignIn is not available"
**Solution** : Vérifier que Firebase Auth Web est configuré
```javascript
// Dans src/services/GoogleAuthService.ts
// Devrait utiliser signInWithPopup() sur web
```

#### ❌ "RevenueCat/AdMob not found"
**Solution** : Normal, ces services sont natifs uniquement
- Créer un wrapper qui détecte la plateforme
- Sur web : désactiver ou utiliser alternatives (Stripe, AdSense)

#### ❌ Images ne s'affichent pas
**Solution** : Vérifier les chemins d'images
```javascript
// ✅ Bon
source={require('../../assets/icon.png')}

// ❌ Mauvais
source={{ uri: '/assets/icon.png' }}
```

#### ❌ Modal plein écran ne fonctionne pas
**Solution** : React Native Web gère différemment les modals
```javascript
// Ajouter ces styles pour modals web
{
  position: Platform.OS === 'web' ? 'fixed' : 'absolute',
  zIndex: 9999,
}
```

---

## 🐛 Erreurs Communes et Débogage

### Erreur : "Module not found"

**Vérifier** :
```bash
# Nettoyer le cache
npm start -- --clear
# ou
rm -rf .expo node_modules && npm install
```

### Erreur : "Cannot read property of undefined"

**Cause probable** : Service natif appelé sur web

**Solution** :
```typescript
import { Platform } from 'react-native';
import { isNativeFeatureAvailable } from '../lib/platform';

// Vérifier avant d'utiliser
if (isNativeFeatureAvailable('biometrics')) {
  // Code biométrique
}
```

### Erreur : "signInWithGoogle is not a function"

**Solution** : Mettre à jour `GoogleAuthService.ts`
```typescript
const signInWithGoogle = async () => {
  if (Platform.OS === 'web') {
    // Utiliser signInWithPopup pour web
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  } else {
    // Code mobile existant
    const { idToken } = await GoogleSignin.signIn();
    // ...
  }
};
```

---

## 📊 Tests de Performance Web

### 1. Lighthouse Score
1. Ouvrir Chrome DevTools
2. Onglet "Lighthouse"
3. Sélectionner "Desktop" ou "Mobile"
4. Cliquer "Generate report"

**Objectifs** :
- Performance : > 80
- Accessibility : > 90
- Best Practices : > 85
- SEO : > 80

### 2. Bundle Size
```bash
# Analyser le bundle
npx expo export:web
du -sh web-build
```

### 3. Loading Time
- First Contentful Paint (FCP) : < 1.5s
- Time to Interactive (TTI) : < 3.5s
- Total Bundle Size : < 5MB

---

## 🎨 Tests Responsive

### Desktop (≥1024px)
- [ ] Contenu centré avec max-width 1200px
- [ ] Padding latéral visible
- [ ] Typographie lisible (H1: 32px)
- [ ] Scrollbar personnalisée visible

### Tablet (768px - 1023px)
- [ ] Max-width 900px
- [ ] Layout adapté
- [ ] Navigation accessible

### Mobile (<768px)
- [ ] Pleine largeur
- [ ] Éléments tactiles > 44px
- [ ] Formulaires utilisables
- [ ] Pas de scroll horizontal

**Test rapide** :
1. Cmd+Option+J → Toggle Device Toolbar
2. Sélectionner "iPhone 13 Pro"
3. Tester navigation et formulaires
4. Sélectionner "iPad Air"
5. Vérifier layout tablette

---

## 🔧 Commandes Utiles

```bash
# Redémarrer avec cache clean
npm start -- --clear

# Voir les logs détaillés
npm run web 2>&1 | tee web-debug.log

# Tester sur réseau local (autre appareil)
# 1. Obtenir l'IP locale
ipconfig getifaddr en0  # Mac
# 2. Ouvrir http://[IP]:8081 sur mobile

# Build production
npx expo export:web
npx serve web-build  # Test du build production
```

---

## ✅ Checklist de Test Complète

### Authentification
- [ ] Connexion email/password
- [ ] Connexion Google (web popup)
- [ ] Inscription
- [ ] Déconnexion
- [ ] Redirection après login

### Navigation
- [ ] Routing entre pages
- [ ] Bouton retour
- [ ] Links cliquables
- [ ] Pas d'erreurs 404

### Interface
- [ ] Boutons cliquables
- [ ] Inputs fonctionnels
- [ ] Images chargées
- [ ] Styles appliqués
- [ ] Responsive design
- [ ] Scrolling fluide

### Fonctionnalités Critiques
- [ ] Voir le dashboard
- [ ] Voir la liste des alters
- [ ] Créer un alter (formulaire)
- [ ] Voir AlterSpace
- [ ] Créer un post
- [ ] Upload d'image (si disponible)

### Performance
- [ ] Chargement initial < 3s
- [ ] Pas de lag au scroll
- [ ] Animations fluides
- [ ] Pas de memory leak

---

## 🆘 En Cas de Problème

### L'app ne charge pas du tout

1. Vérifier la console Chrome (F12)
2. Vérifier que le serveur tourne : `http://localhost:8081`
3. Redémarrer :
   ```bash
   killall node
   npm run web
   ```

### Écran blanc / Loading infini

1. Ouvrir Console Chrome
2. Chercher l'erreur rouge
3. Vérifier que Firebase est configuré
4. Vérifier les variables d'environnement `.env`

### Navigation cassée

1. Vérifier expo-router dans package.json
2. Vérifier structure `app/` (pas de fichiers manquants)
3. Clear cache : `npm start -- --clear`

### Styles bizarres

1. Vérifier `web/styles.css` est chargé
2. Vérifier React Native Web styles
3. Inspecter l'élément dans Chrome DevTools

---

## 📸 Screenshots à Prendre

Pour documentation, prendre des screenshots de :
1. Page de connexion (desktop)
2. Page de connexion (mobile - DevTools)
3. Dashboard avec alters
4. AlterSpace
5. Console Chrome (aucune erreur)

---

## 🎯 Prochaines Étapes Après Tests

1. **Corriger les erreurs identifiées**
2. **Optimiser les services natifs** (wrapper Platform.select)
3. **Améliorer l'UX desktop** (keyboard shortcuts, hover states)
4. **Tester sur vrais appareils mobiles** (pas juste DevTools)
5. **Setup PWA complet** (service worker, offline mode)
6. **Deploy sur Vercel/Netlify** pour test en ligne

---

**Astuce** : Gardez la console Chrome ouverte pendant les tests pour voir les erreurs en temps réel !
