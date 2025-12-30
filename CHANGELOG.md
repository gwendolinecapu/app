# Changelog

## [2025-12-30] Réorganisation Feed & Recherche 🔄

### Feed V2 amélioré
- **`src/components/Feed.tsx`** : Refonte complète
  - Tri par 📅 Récent / 📆 Ancien / 🔥 Populaire
  - Publicités intercalées tous les 5 posts (pas à la fin)
  - Header sticky avec menu déroulant

### Recherche déplacée
- **`app/(tabs)/profile.tsx`** : Bouton 🔍 ajouté dans le header
- Recherche accessible depuis Profil → 🔍

---

## [2025-12-30] Corrections Système d'Amis 🤝

### Recherche & Ajout d'Amis
- **`app/(tabs)/search.tsx`** :
  - Connexion réelle au `FriendService`
  - Boutons "Ajouter" fonctionnels
  - Affichage du statut (Amis, En attente, etc.)
  - Suggestions intelligentes basées sur les alters publics
  - Corrections d'interface (badges de statut)

---

## [2025-12-30] Onglet Notifications (Style Instagram) 🔔

### Nouvel Écran Notifications
- **`app/(tabs)/notifications.tsx`** : Écran dédié aux notifications
  - Section "Demandes d'amis" avec boutons Accepter/Refuser
  - Section "Activité récente" pour likes, commentaires, follows
  - Design Instagram-like avec icônes colorées
  - Pull-to-refresh pour actualiser

### Navigation
- **`app/(tabs)/_layout.tsx`** : 5ème onglet ajouté (icône ❤️)

---

## [2025-12-30] Corrections Firebase Permissions 🔒

### Firestore Rules
- **`friend_requests`** : Lecture ouverte aux utilisateurs authentifiés (senderId/receiverId sont des Alter IDs, pas des UIDs)
- **`friendships`** : Lecture ouverte pour les vérifications bilatérales d'amitié
- **`public_profiles`** : Vérification propriété via `profileId == auth.uid`

### Conversation Messages
- **`app/conversation/[id].tsx`** : Corrigé `system_tag: undefined` → `null` (Firestore n'accepte pas undefined)

### Profile Screen
- **`app/(tabs)/profile.tsx`** : Gestion gracieuse des erreurs de permission lors du chargement des stats

---

## [2025-12-30] Feed V2 - Expérience Sociale Complète 📱

### Phase 1 : Navigation Profil
- **`PostCard.tsx`** : Header auteur cliquable avec `onAuthorPress` callback
- Navigation vers `alter-space` ou `profile` selon le type d'auteur

### Phase 2 : Système de Commentaires
- **`src/services/comments.ts`** : Service Firebase (addComment, fetchComments, deleteComment)
- **`src/components/CommentsModal.tsx`** : Modal bottom-sheet avec liste et input
- Compteur `comments_count` mis à jour atomiquement sur les posts

### Phase 3 : Média Rich
- **`expo-av`** : Installé pour lecture audio/vidéo
- **`src/components/ui/ImageLightbox.tsx`** : Modal plein écran avec zoom pinch-to-zoom
- **`src/components/ui/VideoPlayer.tsx`** : Lecteur vidéo avec contrôles overlay et autoplay muet
- **`src/components/ui/AudioPlayer.tsx`** : Lecteur audio avec barre de progression et waveform

### Phase 4 : Stories (Instagram-style)
- **`src/services/stories.ts`** : Service Firebase complet
  - Création avec expiration 24h automatique
  - Fetch stories actives des amis
  - Marquage comme vu
  - Groupement par auteur
- **`src/components/StoriesBar.tsx`** : Barre horizontale en haut du feed
  - Cercles dégradés Instagram pour stories non-vues
  - Bouton "+" pour créer une story
- **`src/components/StoryViewer.tsx`** : Viewer plein écran
  - Progress bars animées
  - Tap gauche/droite pour naviguer
  - Auto-advance après 5s (images)
  - Support vidéo
- **`app/story/create.tsx`** : Écran création
  - Picker caméra/galerie
  - Upload vers Firebase Storage
  - Preview avant publication

### Phase 5 : Polish Features
- **`src/components/ui/ImageCarousel.tsx`** : Carrousel swipeable multi-images
  - Pagination dots animés
  - Support tap pour lightbox
- **`src/services/share.ts`** : Service de partage natif
  - `sharePost()` - Partage posts avec deep link
  - `shareAlterProfile()` - Partage profils
  - `shareStory()` - Partage stories
  - Fallback clipboard
- **`src/components/ui/ActiveFrontBadge.tsx`** : Badge "En Front"
  - Indicateur vert pour auteurs actuellement en front
  - `FrontIndicator` wrapper pour avatars

### Améliorations PostCard V2
- Support `media_urls[]` pour carrousel multi-images
- Badge "En front" dans header si `is_author_fronting`
- Bouton partage fonctionnel avec ShareService
- Lightbox individuel pour chaque image du carrousel

### Intégration Dashboard
- **`app/(tabs)/dashboard.tsx`** : StoriesBar + Feed + StoryViewer en mode "feed"

---

## [2025-12-29] Système de Monétisation Complet 💰

### Publicités (Médiation Multi-Régie)
- **AdMediationService** : Intégration SDK `react-native-google-mobile-ads`
- **BannerAd** : Composant bannière fonctionnel avec `AdMobBanner`
- **RewardedAd** : Chargement et affichage via `RewardedAd` API
- **App.json** : Configuration des SKAdNetworks et App IDs

### Premium & Trial
- Trial 14 jours automatique à l'inscription
- 30 jours offerts (1x après trial)
- 3 vidéos reward = 7 jours sans pub
- 15 vidéos reward = 7 jours premium

### Économie de Crédits
- Connexion quotidienne : +10 (free) / +25 (premium)
- Reward ad : +50 crédits
- Streak 7j: +100 bonus, 30j: +500 bonus
- Achats : sans pub, premium temporaire, décorations

### Boutique & Décorations
- Contours d'alter (4 raretés : common/rare/epic/legendary)
- Badges de profil, frames
- Packs de crédits IAP

### Fichiers Créés
- `src/services/MonetizationTypes.ts`
- `src/services/AdMediationService.ts`
- `src/services/PremiumService.ts`
- `src/services/CreditService.ts`
- `src/services/DecorationService.ts`
- `src/contexts/MonetizationContext.tsx`
- `src/components/ads/NativeAdCard.tsx`
- `src/components/ads/BannerAd.tsx`
- `src/components/ads/RewardedAdButton.tsx`
- `src/components/CreditBalance.tsx`
- `app/shop/index.tsx`

---

## [2025-12-29] Système de Notifications Complet 🔔

### Types de Notifications
- **Front**: Rappel "Qui est en front ?", Check-in matinal, Front longue durée
- **Humeur**: Check humeur, Rappel respiration, Post-switch check
- **Journal**: Rappel quotidien, Alerte streak, Milestones
- **Social**: Nouveau follower, Nouveau message, Réactions (Push)
- **Bien-être**: Affirmations, Auto-compassion, Messages entre alters

### Personnalisation Fréquences
- Toutes les heures → 1x/semaine
- Heures personnalisées
- Heures calmes configurables

### Notification Persistante
- Sélection d'alter depuis le fond d'écran
- Actions rapides pour switch
- iOS: Notification avec actions
- Android: Foreground Service

### Dynamic Island (iOS 16.1+)
- Live Activity pour front actuel
- Affiche alter, durée, co-fronters
- Mise à jour en temps réel

### Fichiers Créés
- `src/services/NotificationTypes.ts` - Types et configs
- `src/services/NotificationService.ts` - Service principal
- `src/services/PersistentNotificationService.ts` - Notif fond d'écran
- `src/services/DynamicIslandService.ts` - Live Activities iOS
- `src/services/PushNotificationService.ts` - Firebase Push
- `src/contexts/NotificationContext.tsx` - Context global
- `src/hooks/useNotifications.ts` - Hook React
- `src/hooks/useFrontNotifications.ts` - Sync front
- `ios/PluralConnect/LiveActivityModule.swift` - Module natif
- `ios/PluralConnect/LiveActivityModule.m` - Bridge ObjC
- `app/settings/notifications.tsx` (amélioré)

### Intégration
- NotificationProvider ajouté dans `app/_layout.tsx`
- Routing depuis notifications vers écrans appropriés

---

## [2025-12-29] 7 Widgets Android (AppWidgetProvider) 🤖

### Widgets Créés
1. **CurrentFrontWidgetProvider** : Alter en front + durée
2. **QuickSwitchWidgetProvider** : Grille 9 alters favoris
3. **MoodWidgetProvider** : Emoji + intensité colorée
4. **DailyStatsWidgetProvider** : Switches, top alter, streak
5. **QuickJournalWidgetProvider** : Bouton journal rapide
6. **CoFrontWidgetProvider** : Avatars empilés
7. **WellnessWidgetProvider** : Message positif

### Fichiers Kotlin
- **`SharedModels.kt`** : Types partagés
- **`WidgetDataManager.kt`** : Gestionnaire SharedPreferences
- **`WidgetModule.kt`** : Module React Native
- **`WidgetPackage.kt`** : Package RN

### Layouts XML
- 7 layouts widget + 1 composant slot alter
- 4 drawables (backgrounds, icônes)
- 7 configs appwidget-provider

### ⚠️ Configuration AndroidManifest Requise
Ajouter les 7 receivers dans AndroidManifest.xml

---

## [2025-12-29] 7 Widgets iOS (WidgetKit) 📱

### Extension WidgetKit
- **`ios/PluralConnectWidgets/PluralConnectWidgetsBundle.swift`** : Bundle regroupant les 7 widgets

### Widgets Créés
1. **CurrentFrontWidget** (S/M) : Alter en front + durée depuis le switch
2. **QuickSwitchWidget** (M/L) : Grille d'alters favoris pour changement rapide
3. **MoodWidget** (S) : Emoji humeur + intensité colorée
4. **DailyStatsWidget** (M) : Switches, alter top, streak journal
5. **QuickJournalWidget** (S) : Bouton rapide pour écrire
6. **CoFrontWidget** (M) : Avatars empilés pour co-front
7. **WellnessWidget** (S) : Message positif du jour

### Fichiers Shared
- **`SharedModels.swift`** : Types partagés (WidgetAlter, WidgetFront, etc.)
- **`AppGroupManager.swift`** : Gestionnaire App Groups pour lecture/écriture

### Bridge React Native
- **`src/native/WidgetBridge.ts`** : Interface TypeScript
- **`ios/PluralConnect/WidgetModule.swift`** : Module natif Swift
- **`ios/PluralConnect/WidgetModule.m`** : Bridge Objective-C
- **`src/hooks/useWidgetSync.ts`** : Hook auto-sync

### ⚠️ Configuration Xcode Requise
1. Ajouter target "Widget Extension" dans Xcode
2. Configurer App Group `group.com.pluralconnect.shared`
3. Ajouter les fichiers Swift au target

---

## [2025-12-29] Apple Watch App - Alter Selection ⌚

### Nouveaux Fichiers iOS (Swift)
- **`ios/PluralConnect/WatchSessionManager.swift`** : Module natif WatchConnectivity
- **`ios/PluralConnect/WatchSessionManager.m`** : Bridge Objective-C pour React Native

### Nouveaux Fichiers watchOS (SwiftUI)
- **`ios/PluralConnectWatch/PluralConnectWatchApp.swift`** : Entry point
- **`ios/PluralConnectWatch/WatchConnectivityManager.swift`** : Gestionnaire de communication
- **`ios/PluralConnectWatch/Views/ContentView.swift`** : Vue principale
- **`ios/PluralConnectWatch/Views/AlterSelectionView.swift`** : Grille de sélection d'alter
- **`ios/PluralConnectWatch/Views/MoodSelectionView.swift`** : Sélection d'humeur

### Nouveaux Fichiers React Native
- **`src/native/WatchBridge.ts`** : Interface TypeScript pour le module natif
- **`src/hooks/useWatchSync.ts`** : Hook pour synchroniser les données avec la montre

### Fonctionnalités
- Sélection d'alter en front (tap simple)
- Mode co-front (sélection multiple)
- Mode blurry/flou
- Sélection d'humeur avec intensité
- Synchronisation bidirectionnelle iOS ↔ watchOS

### ⚠️ Configuration Requise
- Exécuter `npx expo prebuild` (fait)
- Ajouter target watchOS manuellement dans Xcode
- Voir `ios/PluralConnectWatch/watch-config.json` pour les instructions

---

## [2025-12-29] Système de Follow Entre Systèmes (Social)

### Nouvelles Collections Firestore
- **`follows`** : Relations de suivi entre systèmes (follower_id, following_id)
- **`public_profiles`** : Profils publics avec bio, avatar, compteurs followers/following

### Nouveaux Services
- **`src/services/follows.ts`** : Fonctions followUser, unfollowUser, isFollowing, getFollowers, getFollowing, searchUsers, getPublicPosts

### Nouveaux Écrans
- **`app/discover/index.tsx`** : Page de recherche et découverte d'autres systèmes
- **`app/profile/[systemId].tsx`** : Vue du profil d'un autre système avec posts publics

### Modifications
- **`firestore.rules`** : Nouvelles règles pour follows et public_profiles, posts publics lisibles par tous
- **`app/(tabs)/feed.tsx`** : Bouton recherche ajouté dans le header
- **`app/(tabs)/profile.tsx`** : Compteurs followers/following fonctionnels
- **`app/_layout.tsx`** : Routes discover et profile externe ajoutées

---

## [2025-12-29] Correction Problèmes Illogiques (15+ fixes)

### Bugs Critiques
- **`dashboard.tsx`** : Route `alter-space` changée vers `/alter/[id]` (route existante)
- **`dashboard.tsx`** : FlatList avec `key={NUM_COLUMNS}` pour éviter crash numColumns dynamique
- **`feed.tsx`** : Couleur tip card corrigée (thème sombre au lieu de #FFFBE6 jaune clair)

### Routes Corrigées
- **5 fichiers** : `/crisis` → `/crisis/index` (emotions, messages, alters, journal, feed)

### Boutons Sans Action Corrigés
- **`feed.tsx`** : Boutons J'aime/Commenter/Partager avec Alert "coming soon"
- **`feed.tsx`** : Bouton ellipsis (menu) avec action
- **`feed.tsx`** : Bouton "En savoir plus" des tips avec action

### Dead Code Supprimé
- **`dashboard.tsx`** : Variable `pressedId` non utilisée supprimée
- **`dashboard.tsx`** : Logique `is_host` corrigée (false par défaut au lieu de alters.length === 0)

### UX Corrigé
- **`messages.tsx`** : Bordure active retirée sur alter actif (illogique de s'envoyer un message)

---

## [2025-12-29] Audit Sécurité & Auto-Fix

### Corrections critiques
- **`app/_layout.tsx`** : Supprimé la route `home` fantôme qui causait les warnings de navigation
- **`firestore.rules`** : Sécurisé collection `emotions` (restreint au propriétaire au lieu de tous les users auth)
- **`firestore.rules`** : Sécurisé `conversations` et `conversation_participants` (accès limité aux participants)
- **`src/services/groups.ts`** : Ajouté paramètre `senderId` requis par les règles Firestore
- **`app/groups/[id].tsx`** : Mis à jour l'appel `sendGroupMessage` avec `user.uid`
- **`app/settings/index.tsx`** : Corrigé routes `/roles` → `/roles/index` et `/help` → `/help/index`
- **`app/(tabs)/dashboard.tsx`** : Corrigé `/settings/` → `/settings/index`
- **`app/(tabs)/profile.tsx`** : Corrigé `/settings/` → `/settings/index`
- **`app/(tabs)/alters.tsx`** : Corrigé `/settings/` → `/settings/index`

### Impact
- 🔒 Vulnérabilité d'accès données corrigée pour émotions et conversations
- 🛠️ Warnings navigation "No route named home/settings" éliminés
- ✅ Messages de groupe fonctionnels avec senderId

---

## [2025-12-29] Correction Headers Navigation

### Correction
- **`app/_layout.tsx`** : Ajouté `headerShown: false` à tous les écrans avec leur propre header custom
  - Écrans concernés : `roles`, `help`, `journal`, `tasks`, `groups`, `crisis`, `emotions/history`, `fronting/history`, `stats`, `settings`, `alter/[id]`, `conversation/[id]`, `post/create`
- Le header de navigation Stack par défaut ("settings/index", "roles/index") ne s'affiche plus en double

---

## [2025-12-29] Corrections Firebase et Bulles Dynamiques

### Corrections critiques
- **`app/post/create.tsx`** : Corrigé le bug `media_url: undefined` qui crashait Firestore (Firestore n'accepte pas les valeurs undefined)
- **`app/journal/create.tsx`** : Ajouté `system_id` manquant pour matcher les règles de sécurité Firestore

### Améliorations Dashboard
- **Bulles dynamiques** : La taille des bulles s'adapte au nombre d'alters :
  - ≤ 5 alters : grandes bulles (80px) pour une meilleure visibilité
  - 6-20 alters : bulles moyennes (64px)
  - > 20 alters : petites bulles (48px) pour afficher plus d'alters
- Migration de `FlashList` vers `FlatList` natif avec optimisations (`removeClippedSubviews`, `windowSize`)

---

## [2025-12-29] Redesign Dashboard - Style Apple Watch

### Nouvelles fonctionnalités
- **Design Apple Watch** : Bulles d'alters avec design compact et élégant
- **Performance 2000+ alters** : Liste virtualisée ultra-performante
- **Barre de recherche** : Recherche instantanée d'alters (affichée automatiquement si > 10 alters)
- **Colonnes dynamiques** : Calcul automatique du nombre de colonnes selon la largeur de l'écran
- **Compteur d'alters** : Affichage du nombre d'alters filtrés

### Améliorations UI
- Icônes standardisées avec `Ionicons` (remplace les emojis)
- Ombres subtiles style Apple
- Animations de sélection améliorées
- Espacement optimisé pour une meilleure lisibilité

---

## [2025-12-29] Correction Bug JSX Layout

### Correction
- **`app/(tabs)/_layout.tsx`** : Ajouté la balise fermante `</Tabs>` manquante qui causait l'erreur de compilation `Expected corresponding JSX closing tag for <Tabs>`
- **Cause** : La structure JSX était mal fermée - les balises `</View>` étaient présentes mais `</Tabs>` était absent

### Résultat
✅ Compilation réussie - L'app se lance correctement dans le simulateur

---

## [2025-12-29] Migration Supabase vers Firebase

### Migration Backend
- **Notifications** : Ajout d'un système de rappels quotidiens et messages de soutien (`src/lib/notifications.ts`, `app/settings/notifications.tsx`).
- **Paramètres** : Nouvel écran de gestion des notifications accessible depuis le profil.
- **Migration** : Passage complet à Firebase (Auth, Firestore, Storage) pour toutes les fonctionnalités.
- Suppression des dépendances Supabase
- Mise à jour de tous les écrans (Feed, Home, Profile, Post, Alter, Conversation, AlterSpace)

### Refactoring
- Amélioration de la gestion des conversations (ID déterministe)
- Upload d'images via Firebase Storage

## [2025-12-29] Sprint 1 - Émotions & Journal

### Nouvelles fonctionnalités

#### Base de données
- `supabase/schema_emotions.sql` : Tables `emotions` et `journal_entries` avec RLS policies

#### Écrans Émotions
- `app/(tabs)/emotions.tsx` : Panneau de saisie d'émotion (8 types, intensité 1-5, note)
- `app/emotions/history.tsx` : Historique avec filtres (7j/30j/tout) et statistiques

#### Écrans Journal
- `app/(tabs)/journal.tsx` : Liste des entrées avec FAB de création
- `app/journal/create.tsx` : Création d'entrée (titre, contenu, mood, verrouillage)
- `app/journal/[id].tsx` : Détail d'une entrée

#### Types TypeScript
- `Emotion`, `EmotionType`, `JournalEntry` avec mappings emojis/labels

#### Navigation
- Réorganisation des onglets : Alters → Émotions → Journal → Messages

---

## [2025-12-29] Correction des erreurs de compilation TypeScript

### Corrections effectuées

#### 1. `app/(tabs)/_layout.tsx`
- **Problème**: `router` non défini à la ligne 74
- **Solution**: Ajout de `router` aux imports depuis `expo-router`

#### 2. `app/(tabs)/alters.tsx`
- **Problème**: `FlatList` non défini à la ligne 170
- **Solution**: Ajout de `FlatList` aux imports depuis `react-native`

#### 3. `app/(tabs)/profile.tsx`
- **Problème**: Variable `error` non définie aux lignes 41-42
- **Solution**: Ajout de `error` à la destructuration du résultat Supabase

#### 4. `src/lib/theme.ts`
- **Problème**: Propriétés `gradientStart` et `gradientEnd` manquantes dans `colors`
- **Solution**: Ajout des couleurs de gradient utilisées par `LinearGradient`:
  - `gradientStart: '#8B5CF6'` (violet)
  - `gradientEnd: '#6366F1'` (indigo)

### Résultat
✅ Compilation TypeScript réussie sans erreurs

## [2025-12-30] Sprint 5 - Groupes & Social

### Nouvelles fonctionnalités

#### Chat de Groupe
- **Service de Groupes** : `src/services/groups.ts` (Création, Ajout membres, Récupération, Envoi messages).
- **Interface Groupes** : Onglet "Groupes" dans l'écran Messages (`app/(tabs)/messages.tsx`).
- **Création de Groupe** : Écran avec nom et description (`app/groups/create.tsx`).
- **Discussion de Groupe** : Écran dédié (`app/groups/[id].tsx`) avec liste des membres.

#### Messages Enrichis
- **Composants Reutilisables** : 
    - `MessageInput` : Barre de saisie unifiée avec menu d'attachements.
    - `MessageBubble` : Affichage intelligent des types (Text, Poll, Note) et design distinct (Moi vs Autres).
- **Sondages** : 
    - Création via `PollCreatorModal` (Questions + Options dynamiques).
    - Affichage interactif avec barre de progression des votes.
    - Système de vote backend (`votePoll`).
- **Notes** :
    - Création via `NoteCreatorModal` (Titre + Contenu).
    - Affichage stylisé "Post-it".

#### Technique
- **Modèles** : Mise à jour de `Message` (champs `type`, `poll_options`, `poll_votes`, `reactions`).
- **Navigation** : Intégration dans `expo-router` via tabs et stack.

### Corrections TypeScript
- `MessageInput.tsx` : Corrigé `alignItems: 'end'` → `'flex-end'` et ajouté types explicites (`ViewStyle`, `TextStyle`).
- `PollCreatorModal.tsx` : Remplacé `typography.subtitle` par `typography.bodySmall`.

## [2025-12-29] Audit & Correction des 5 Sprints

### Corrections TypeScript
- **Type `Alter`** : Ajouté `avatar_url` comme alias de `avatar` pour compatibilité.
- **`app/index.tsx`** : Remplacé `session` par `user` (la prop correcte de `AuthContextType`).
- **`app/help/create.tsx`** : Réordonné les styles pour éviter la duplication de la propriété `color`.

### Résultat
✅ **0 erreurs TypeScript** - Compilation réussie

### Fix Firebase Auth React Native
- **Problème** : `firebase/auth/react-native` module introuvable.
- **Solution** : Créé `metro.config.js` avec `resolveRequest` personnalisé pour rediriger `firebase/auth` vers le bundle React Native (`@firebase/auth/dist/rn/index.js`).

### Fix Conflit de Routes expo-router
- **Problème** : `settings` résolvait vers deux écrans (`settings/index` et `settings`).
- **Solution** : Supprimé `app/settings.tsx` en double, conservé le dossier `app/settings/`. Mis à jour les liens dans `home.tsx`, `profile.tsx`, `alters.tsx`.

### Correctifs Proactifs & Améliorations
- **Error Handling** : Ajout d'une gestion d'erreur visuelle (bouton Réessayer) dans l'Historique de Front (`history.tsx`) pour gérer les problèmes réseaux/permissions.
- **Typage** : Correction des types `any` dans `GroupService` (`src/services/groups.ts`) pour utiliser l'interface `Message`.
- **Déploiement** : Création de `firestore.indexes.json` et déploiement des index composites requis pour :
    - `alters` (system_id ASC, created_at ASC)
    - `groups` (members CONTAINS, created_at DESC)
    - `fronting_history` (system_id ASC, start_time DESC)
- **Sécurité** : Déploiement complet des règles de sécurité Firestore.

## [2025-12-30] Interface & Navigation

### UI Improvements
- **Navigation Unifiée** : Suppression des en-têtes natifs en double sur tous les onglets.
- **En-têtes Personnalisés** : Harmonisés sur `Feed`, `Alters`, `Emotions`, `Journal`, `Messages`.
- **Bouton Crisis** : Accès rapide "SOS" (⚠️) ajouté dans l'en-tête de chaque écran principal.

### Correctifs

---

## [2025-12-30] IAP & Prix Premium 💎

### Nouveautés majeures
- **RevenueCat** : Intégration complète pour la gestion des abonnements.
- **Silent Trial** : 14 jours d'essai Premium offerts automatiquement sans carte bancaire pour tout nouvel utilisateur.
- **Conversion** : Popup "L'aventure continue !" à la fin de l'essai.
- **Plans Premium** : Mensuel (3.49€), Annuel (24.99€), Lifetime (49.99€).

### Modifications
- **Boutique** : Nouvel onglet "Premium" et accès aux packs de crédits (IAP).
- **Service** : `PremiumService` mis à jour pour vérifier RevenueCat + Silent Trial.
- **Types** : `ShopItem` supporte `revenueCatPackageId`.
