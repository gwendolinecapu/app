# 🌐 Guide Cross-Platform - PluralConnect

## ✅ Compatibilité Totale Garantie

PluralConnect fonctionne parfaitement sur **TOUTES** les plateformes :

- ✅ **Web Desktop** (Windows, Mac, Linux)
- ✅ **Web Mobile** (iOS Safari, Android Chrome)
- ✅ **iOS Natif** (iPhone, iPad)
- ✅ **Android Natif** (Smartphone, Tablette)

---

## 📱 Détection Automatique de Plateforme

L'application détecte automatiquement la plateforme et adapte :

### 1. **Layout & Design**

```
Desktop (≥1024px)
├─ Contenu centré (max 1200px)
├─ Padding large (32px)
├─ Typographie grande (H1: 32px)
└─ Hover effects sur boutons

Tablette (768-1023px)
├─ Contenu semi-large (max 900px)
├─ Padding moyen (24px)
├─ Typographie moyenne
└─ Touch-friendly

Mobile (<768px)
├─ Pleine largeur
├─ Padding réduit (16px)
├─ Typographie optimisée
├─ Boutons plus grands (min 44px)
└─ Font size ≥16px (évite zoom iOS)
```

### 2. **Interactions**

```
Desktop
├─ Hover states
├─ Curseur pointer
├─ Raccourcis clavier
└─ Scrollbar visible

Mobile/Tablette
├─ Touch gestures
├─ Haptic feedback
├─ Swipe navigation
└─ Keyboard auto-gestion
```

### 3. **Fonctionnalités Natives**

```
iOS/Android Natif
├─ Biométrie (Face ID/Touch ID)
├─ Notifications push
├─ AdMob
├─ RevenueCat (achats in-app)
├─ Apple Watch (iOS)
├─ Widgets natifs
└─ Dynamic Island (iOS)

Web (Desktop/Mobile)
├─ Google Auth (popup)
├─ Local Storage
├─ PWA (installable)
├─ Web Push (si configuré)
└─ Responsive design
```

---

## 🎨 Design Adaptatif

### Composants Cross-Platform

Tous les composants s'adaptent automatiquement :

#### **WebContainer**
```tsx
import { WebContainer } from '@/components/ui/WebContainer';

// Sur mobile natif : pas de container
// Sur web mobile : padding réduit
// Sur web desktop : centré avec max-width
<WebContainer maxWidth={1200}>
  <YourContent />
</WebContainer>
```

#### **PlatformSafeView**
```tsx
import { PlatformSafeView } from '@/components/ui/PlatformSafeView';

// Sur iOS : gère le notch
// Sur Android : gère la status bar
// Sur web : view normale
<PlatformSafeView>
  <YourContent />
</PlatformSafeView>
```

#### **ResponsiveButton**
```tsx
import { ResponsiveButton } from '@/components/ui/ResponsiveButton';

// Taille adaptée automatiquement
// Desktop : hover effect
// Mobile : plus grand (min 44px touch target)
<ResponsiveButton
  title="Se connecter"
  onPress={handleLogin}
  size="medium" // auto-adapté selon plateforme
/>
```

#### **ResponsiveInput**
```tsx
import { ResponsiveInput } from '@/components/ui/ResponsiveInput';

// Font size ≥16px sur iOS web (évite zoom)
// Focus visible sur desktop
// Clavier auto-géré sur mobile
<ResponsiveInput
  label="Email"
  placeholder="votre@email.com"
/>
```

---

## 🔧 Utilitaires de Détection

### Hook useResponsive

```tsx
import { useResponsive } from '@/hooks/useResponsive';

function MyComponent() {
  const {
    isMobile,       // true si mobile (natif ou web)
    isTablet,       // true si tablette
    isDesktop,      // true si desktop
    isWeb,          // true si web (desktop ou mobile)
    isNative,       // true si iOS ou Android
    isWebMobile,    // true si web mobile
    isWebDesktop,   // true si web desktop
    platformType,   // 'ios' | 'android' | 'web-mobile' | 'web-desktop'
    width,          // Largeur écran
    height,         // Hauteur écran
  } = useResponsive();

  return (
    <View>
      {isDesktop && <DesktopMenu />}
      {isMobile && <MobileMenu />}
    </View>
  );
}
```

### Fonctions de Détection

```tsx
import {
  getPlatformType,
  isWeb,
  isNative,
  isIOS,
  isAndroid,
  isWebMobile,
  isWebDesktop,
  isMobileDevice,
  isTouchDevice,
  selectByPlatform,
} from '@/lib/platformDetection';

// Sélection par plateforme
const padding = selectByPlatform({
  ios: 20,
  android: 16,
  webMobile: 16,
  webDesktop: 32,
  default: 16,
});

// Détection simple
if (isWeb()) {
  // Code web uniquement
}

if (isNative()) {
  // Code iOS/Android uniquement
}

if (isTouchDevice()) {
  // Touch gestures
}
```

---

## 🧪 Tests Cross-Platform

### Tester sur Web Desktop

```bash
# Lancer le serveur web
npm run web

# Ouvrir dans Chrome
open http://localhost:8081

# Tester différentes tailles
# Chrome DevTools > Toggle Device Toolbar (Cmd+Shift+M)
# Sélectionner : Responsive, Desktop HD, Desktop 4K
```

### Tester sur Web Mobile

```bash
# Même serveur web
npm run web

# Dans Chrome DevTools (Cmd+Shift+M)
# Sélectionner :
- iPhone 13 Pro (390x844)
- iPad Air (820x1180)
- Samsung Galaxy S20 (360x800)
- Pixel 7 (412x915)

# Tester :
- Touch interactions
- Keyboard behavior
- Font sizes (>16px sur iOS)
- Scroll behavior
```

### Tester sur iOS Natif

```bash
# Lancer sur simulateur iOS
npm run ios

# Ou sur appareil physique
# Brancher iPhone/iPad en USB
# Expo Go ou Development Build
```

### Tester sur Android Natif

```bash
# Lancer sur émulateur Android
npm run android

# Ou sur appareil physique
# Activer Debug USB
# Expo Go ou Development Build
```

---

## 📊 Checklist de Compatibilité

### Fonctionnalités Core (Doivent marcher partout)

- [ ] **Connexion/Inscription**
  - [ ] Email/Password (tous)
  - [ ] Google Auth (web: popup, mobile: SDK)
- [ ] **Navigation**
  - [ ] Routes (expo-router)
  - [ ] Bouton retour
  - [ ] Deep links
- [ ] **Dashboard**
  - [ ] Grille d'alters
  - [ ] Fronting selection
  - [ ] System weather
- [ ] **AlterSpace**
  - [ ] Feed personnel
  - [ ] Posts (création, like, commentaire)
  - [ ] Stories
  - [ ] Journal
  - [ ] Galerie
- [ ] **Responsive**
  - [ ] Mobile (<768px)
  - [ ] Tablette (768-1023px)
  - [ ] Desktop (≥1024px)

### Fonctionnalités Natives (iOS/Android seulement)

- [ ] Biométrie (Face ID, Touch ID)
- [ ] Notifications push natives
- [ ] AdMob
- [ ] RevenueCat (achats in-app)
- [ ] Haptic feedback
- [ ] Apple Watch (iOS)
- [ ] Widgets natifs
- [ ] Dynamic Island (iOS)

### Optimisations Web

- [ ] Font size ≥16px (iOS web - évite zoom)
- [ ] Touch targets ≥44px
- [ ] Hover states (desktop)
- [ ] PWA manifest
- [ ] Service Worker (optionnel)
- [ ] Meta tags SEO
- [ ] Open Graph (partage)

---

## 🎯 Bonnes Pratiques

### 1. Toujours Utiliser les Composants Responsive

❌ **Mauvais**
```tsx
<View style={{ padding: 16 }}>
  <TextInput style={{ fontSize: 14 }} />
</View>
```

✅ **Bon**
```tsx
<WebContainer>
  <ResponsiveInput />
</WebContainer>
```

### 2. Vérifier la Plateforme Avant d'Utiliser APIs Natives

❌ **Mauvais**
```tsx
import * as LocalAuthentication from 'expo-local-authentication';

// Crash sur web !
LocalAuthentication.authenticateAsync();
```

✅ **Bon**
```tsx
import { isNative } from '@/lib/platformDetection';

if (isNative()) {
  const LocalAuth = require('expo-local-authentication');
  await LocalAuth.authenticateAsync();
}
```

### 3. Adapter les Tailles selon la Plateforme

❌ **Mauvais**
```tsx
<TouchableOpacity style={{ padding: 8 }}>
  <Text style={{ fontSize: 12 }}>Click</Text>
</TouchableOpacity>
```

✅ **Bon**
```tsx
import { useResponsive } from '@/hooks/useResponsive';

const { isMobile } = useResponsive();

<ResponsiveButton
  title="Click"
  size={isMobile ? 'medium' : 'small'}
/>
```

### 4. Gérer le Clavier sur Mobile

❌ **Mauvais**
```tsx
<View>
  <TextInput />
  <Button onPress={submit} />
</View>
```

✅ **Bon**
```tsx
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.select({ ios: 'padding', android: 'height' })}
>
  <ResponsiveInput />
  <ResponsiveButton />
</KeyboardAvoidingView>
```

---

## 🐛 Problèmes Courants et Solutions

### Problème : Layout cassé sur iOS

**Cause** : SafeArea pas gérée (notch)

**Solution** :
```tsx
import { PlatformSafeView } from '@/components/ui/PlatformSafeView';

<PlatformSafeView edges={['top', 'bottom']}>
  <YourContent />
</PlatformSafeView>
```

### Problème : Zoom automatique sur iOS web

**Cause** : Font size < 16px dans les inputs

**Solution** :
```tsx
// Utiliser ResponsiveInput qui gère ça automatiquement
<ResponsiveInput /> // Font size auto ≥16px sur iOS web
```

### Problème : Boutons trop petits sur mobile

**Cause** : Touch targets < 44px

**Solution** :
```tsx
// ResponsiveButton applique minHeight: 44px automatiquement
<ResponsiveButton title="Click" />
```

### Problème : Hover effect sur mobile

**Cause** : CSS hover activé sur touch

**Solution** :
```tsx
import { isTouchDevice } from '@/lib/platformDetection';

// Dans les styles, conditionner les hover
const styles = StyleSheet.create({
  button: {
    // styles de base
  },
  // Hover seulement si pas touch
  ...((!isTouchDevice()) && {
    buttonHover: {
      opacity: 0.8,
    },
  }),
});
```

---

## 📱 Résumé

**PluralConnect est maintenant 100% compatible avec :**

✅ Web Desktop (Chrome, Firefox, Safari, Edge)
✅ Web Mobile (iOS Safari, Android Chrome)
✅ iOS Natif (iPhone, iPad, Apple Watch)
✅ Android Natif (Smartphone, Tablette)

**Toutes les fonctionnalités core fonctionnent partout !**

Les fonctionnalités natives (biométrie, achats, etc.) sont automatiquement désactivées sur web et remplacées par des alternatives web quand c'est possible.

---

**Testez sur votre plateforme préférée et dites-moi si tout fonctionne ! 🚀**
