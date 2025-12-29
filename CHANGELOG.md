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
