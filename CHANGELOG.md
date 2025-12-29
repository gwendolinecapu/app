# Changelog

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
