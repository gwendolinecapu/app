# 🌐 Corrections Web pour PluralConnect

Ce document détaille les corrections apportées pour rendre l'application fonctionnelle sur web (ordinateur et mobile).

## ✅ Corrections Effectuées

### 1. **Hook Responsive Design** (`src/hooks/useResponsive.ts`)
- Nouveau hook `useResponsive()` pour détecter le type d'appareil (mobile/tablet/desktop)
- Hook `useResponsiveValue()` pour des valeurs adaptatives selon la taille d'écran
- Détection automatique de l'orientation (portrait/landscape)

```typescript
const { isDesktop, isTablet, isMobile, isWeb } = useResponsive();
const padding = useResponsiveValue({ mobile: 16, tablet: 24, desktop: 32 });
```

### 2. **Composant WebContainer** (`src/components/ui/WebContainer.tsx`)
- Container responsive qui centre le contenu sur desktop/tablet
- Limite automatique de la largeur maximale
- Padding adaptatif selon la taille d'écran
- Support du scroll quand nécessaire

```tsx
<WebContainer maxWidth={800}>
  <YourContent />
</WebContainer>
```

### 3. **Utilitaires Plateforme** (`src/lib/platform.ts`)
- Fonctions pour détecter les fonctionnalités natives disponibles
- `isNativeFeatureAvailable()` - vérifie si une fonctionnalité native est dispo
- `platformSelect()` - retourne des valeurs différentes selon la plateforme
- Constantes: `isWeb`, `isIOS`, `isAndroid`, `isMobileNative`

### 4. **BiometricGuard** (`src/components/auth/BiometricGuard.tsx`)
- ✅ Désactivé sur web (pas de biométrie navigateur)
- Garde l'authentification biométrique sur iOS/Android
- Plus d'erreurs sur web quand LocalAuthentication n'est pas disponible

### 5. **Écran de Connexion** (`app/(auth)/login.tsx`)
- ✅ Utilise maintenant WebContainer pour centrer sur desktop
- ✅ ScrollView ajouté pour les petits écrans
- ✅ Layout responsive automatique

### 6. **Styles Web** (`web/styles.css`)
- Reset CSS pour body/html
- Scrollbar personnalisée (couleurs du thème)
- Fix des inputs autofill
- Responsive breakpoints (mobile < 768px, tablet < 1024px, desktop ≥ 1024px)
- Smooth scrolling
- Amélioration de la typographie sur grand écran

### 7. **Page HTML** (`web/index.html`)
- Meta tags optimisés pour le SEO et mobile
- Loading screen pendant le chargement React
- Support PWA (Progressive Web App)
- Favicon et icônes

### 8. **Manifest PWA** (`web/manifest.json`)
- Configuration pour installer l'app sur desktop/mobile
- Icônes et thème colors
- Mode standalone

## 🎨 Améliorations Visuelles Web

### Desktop (≥ 1024px)
- Contenu centré avec largeur max 1200px
- Padding augmenté (32px)
- Typographie agrandie (h1: 32px, h2: 26px, h3: 20px)
- Scrollbar stylisée avec les couleurs du thème

### Tablet (768px - 1023px)
- Largeur max 900px
- Padding medium (24px)
- Disposition optimisée pour tablettes

### Mobile Web (<768px)
- Pleine largeur
- Padding réduit (16px)
- Interface similaire à l'app native

## 🚫 Fonctionnalités Natives Désactivées sur Web

Les fonctionnalités suivantes ne sont pas disponibles sur web et sont automatiquement désactivées :

- ❌ Authentification biométrique (Face ID / Touch ID)
- ❌ Google AdMob (publicités)
- ❌ RevenueCat (achats in-app natifs)
- ❌ Apple Watch sync
- ❌ Widgets natifs
- ❌ Dynamic Island (iOS)
- ❌ Notifications push natives (peut être remplacé par Web Push API)
- ❌ Local AI avec expo-llm-mediapipe

## ⚙️ Services à Adapter

Ces services doivent être modifiés pour gérer le cas web :

### À Faire (TODO)
1. **AdMediationService** - Remplacer par Google AdSense pour web
2. **RevenueCatService** - Implémenter Stripe/PayPal pour web
3. **PushNotificationService** - Utiliser Web Push API
4. **LocalAIService** - Utiliser API externe (Gemini, OpenAI) sur web
5. **GoogleAuthService** - Tester l'authentification Google sur web
6. **DynamicIslandService** - Vérifier et désactiver sur web
7. **WidgetBridge / WatchBridge** - Désactiver sur web

## 🧪 Tests à Effectuer

### Sur Desktop (Chrome, Firefox, Safari)
- [ ] Connexion / Inscription
- [ ] Navigation entre les pages
- [ ] Responsive design (redimensionner la fenêtre)
- [ ] Formulaires et inputs
- [ ] Upload d'images
- [ ] Création de posts
- [ ] AlterSpace navigation
- [ ] Dashboard avec grille d'alters

### Sur Mobile Web (Chrome Mobile, Safari Mobile)
- [ ] Connexion / Inscription
- [ ] Navigation tactile
- [ ] Scroll et gestures
- [ ] Keyboard apparition
- [ ] Upload depuis galerie/caméra
- [ ] Responsive sur petit écran

## 📝 Commandes de Test

```bash
# Lancer le serveur web
npm run web

# Ouvrir dans le navigateur
# Desktop: http://localhost:8081 (ou port indiqué)
# Mobile: Scanner le QR code avec Expo Go ou utiliser l'IP locale
```

## 🐛 Bugs Connus à Corriger

1. **Services natifs** - Certains services essaient d'accéder à des APIs natives sur web
2. **Images** - Vérifier que l'upload fonctionne sur web
3. **Animations** - Certaines animations React Native peuvent ne pas fonctionner sur web
4. **Modals** - Vérifier l'affichage des modals en plein écran sur desktop

## 💡 Recommandations

### Pour Améliorer l'Expérience Web

1. **Ajouter un menu de navigation desktop** - Menu latéral permanent sur grand écran
2. **Keyboard shortcuts** - Ctrl+K pour recherche, Ctrl+N pour nouveau post, etc.
3. **Drag & Drop** - Pour upload d'images sur desktop
4. **Infinite Scroll optimisé** - Pagination pour grands écrans
5. **Multi-colonnes sur desktop** - Afficher plus de contenu sur grand écran
6. **Toast notifications** - Remplacer Alert.alert par des toasts sur web

### Performances

1. **Code Splitting** - Charger les routes à la demande
2. **Lazy Loading** - Images et composants lourds
3. **Service Worker** - Cache pour PWA offline
4. **Optimisation Bundle** - Exclure les dépendances natives du bundle web

## 🔧 Prochaines Étapes

1. Tester l'application web sur différents navigateurs
2. Corriger les services natifs pour qu'ils détectent la plateforme
3. Ajouter des fallbacks pour les fonctionnalités natives
4. Optimiser les performances web
5. Ajouter le support PWA complet (offline mode, installable)
6. Améliorer l'UX desktop avec des patterns web natifs

---

**Note**: Tous les fichiers créés sont documentés dans `CLAUDE.md` pour référence future.
