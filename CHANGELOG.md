# Changelog

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
- **Alters Screen** : Migration de `switchAlter` vers `setFronting` pour corriger une erreur TypeScript.
