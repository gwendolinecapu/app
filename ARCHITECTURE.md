# Architecture du Projet Plural Connect

Ce document détaille l'architecture technique de l'application Plural Connect, la structure des dossiers, et l'utilité des principaux fichiers.

## 🏗 Stack Technique

- **Framework** : React Native avec [Expo](https://expo.dev/) (SDK 54).
- **Langage** : TypeScript.
- **Navigation** : `expo-router` (Routage basé sur les fichiers).
- **Backend (BaaS)** : Firebase (Auth, Firestore, Storage, Functions).
- **Base de données locale** : SQLite (via `expo-sqlite`).
- **Achats In-App** : RevenueCat (`react-native-purchases`).
- **Publicité** : Google AdMob (`react-native-google-mobile-ads`).

## 📂 Structure Globale

```
/
├── app/                  # Routes et Écrans de l'application (expo-router)
├── src/                  # Code source logique (Composants, Services, Hooks)
├── functions/            # Cloud Functions Firebase (Backend serverless)
├── assets/               # Images, Fontes, Icônes statiques
├── components/           # (Obsolète/Legacy) - Devrait être migré dans src/components ?
├── admin/                # Scripts d'administration ou panneau admin ?
├── scripts/              # Scripts utilitaires (ex: génération de textures)
└── ...fichiers de config (app.json, firebase.json, etc.)
```

---

## 📁 Détail des Dossiers et Fichiers

### 1. `app/` (Navigation & Écrans)
C'est le cœur de la navigation. Chaque fichier ou dossier ici correspond à une URL/Route.

- **`_layout.tsx`** : Le "Wrapper" global. Il configure les Providers (AuthContext, Theme, etc.) et la structure de navigation racine (Stack).
- **`index.tsx`** : La route racine (`/`). Redirige généralement vers le Dashboard ou l'Onboarding.
- **`(tabs)/`** : Dossier "Group". Les fichiers ici ne sont pas dans l'URL. Contient la navigation par onglets principale.
    - **`_layout.tsx`** : Configure la barre d'onglets (Tab Bar) en bas de l'écran.
    - **`dashboard.tsx`** : L'écran d'accueil principal (System Dashboard).
- **`(auth)/`** : Routes d'authentification (Login, Register).
- **`alter-space/[alterId]/`** : Route dynamique pour l'espace d'un alter spécifique.
    - **`index.tsx`** : Le profil/feed de l'alter.
    - **`_layout.tsx`** : Layout spécifique à l'espace alter (ex: Header personnalisé).

### 2. `src/` (Logique Métier)

- **`components/`** : Composants UI réutilisables.
    - **`ui/`** : Composants de base (Boutons, Inputs, Cards).
    - **`features/`** : Composants liés à une fonctionnalité précise (ex: `PostCard`, `AlterBubble`).
- **`services/`** : Interaction avec le Backend et APIs tierces. **C'est ici que réside la logique complexe.**
    - **`AuthService.ts`** : Gestion connexion/inscription Firebase Auth.
    - **`FirestoreService.ts`** : CRUD générique pour Firestore.
    - **`ConsentService.ts`** : Gestion du consentement GDPR (Google UMP).
    - **`RevenueCatService.ts`** : Gestion des abonnements Premium.
    - **`AdService.ts`** : Gestion des publicités (Bannières, Interstitiels).
- **`contexts/`** : Gestion de l'état global.
    - **`AuthContext.tsx`** : Stocke l'utilisateur connecté et l'état d'auth.
    - **`ThemeContext.tsx`** : Gestion du thème (Dark/Light).
- **`hooks/`** : Hooks React personnalisés (ex: `useAuth`, `useDebounce`).
- **`types/`** : Définitions TypeScript globales (Interfaces Alter, User, Post...).
- **`utils/`** : Fonctions utilitaires (formatage date, calculs...).

### 3. `functions/` (Backend)
Code qui tourne sur les serveurs Google (Node.js).

- **`index.ts`** : Point d'entrée des Cloud Functions.
- **`src/`** : Logique des fonctions (Triggers Firestore, Callbacks HTTPS, Tâches planifiées).
    - Ex: Notifications push quand un message est reçu, nettoyage de données, validation de paiements.

### 4. Fichiers de Configuration (Racine)

- **`app.json`** : Configuration Expo. Nom de l'app, permissions iOS/Android, identifiants Publicité, Plugins. **Crucial pour le build.**
- **`firebase.json`** : Configuration déploiement Firebase (Règles de sécu, indexes, hébergement hosting).
- **`firestore.rules`** : Règles de sécurité de la base de données. Définit qui peut lire/écrire quoi.
- **`package.json`** : Dépendances npm et scripts de lancement (`npm start`).
- **`tsconfig.json`** : Configuration TypeScript.
- **`babel.config.js` / `metro.config.js`** : Configuration du compilateur et du bundler.

---

## �️ Modèle de Données (Firestore)

L'application utilise une base de données NoSQL (Firestore). Voici les principales collections et leurs modèles associés (définis dans `src/types/index.ts`) :

### Collections Racines

- **`systems`** (`System`) : Représente un compte utilisateur (un "système").
    - Champs : `username`, `email`, `alter_count`, `headspace`, `isAdmin`...
- **`alters`** (`Alter`) : Les entités distinctes au sein d'un système.
    - Champs : `name`, `role_ids`, `avatar_url`, `is_active` (en front), `credits`, `xp`...
- **`posts`** (`Post`) : Publications du fil d'actualité.
    - Champs : `content`, `media_url`, `visibility` (public/amis/privé), `author_type` (single/co-front)...
- **`public_profiles`** (`PublicProfile`) : Profil public optimisé pour la recherche et le follow.
- **`follows`** (`Follow`) : Table de liaison pour les abonnements entre systèmes.

### Sous-Collections & Autres

- **`messages`** (`Message`) : Chat interne (système) ou externe (groupes).
- **`emotions`** (`Emotion`) : Suivi de l'humeur.
- **`journal_entries`** (`JournalEntry`) : Pages du journal intime.
- **`tasks`** (`Task`) : Gestionnaire de tâches avec gamification.
- **`stories`** (`Story`) : Stories éphémères (24h).

---

## 🧠 Services Principaux (`src/services/`)

Les services encapsulent la logique métier et les appels API.

### Noyau & Infrastructure
- **`AuthService.ts`** : Inscription, Connexion (Email/Password, Google), Gestion de session.
- **`FirestoreService.ts`** : Méthodes `get`, `add`, `update`, `delete`, `query` génériques.
- **`NotificationService.ts`** : Gestion centralisée des notifications locales et push.
- **`Context/ThemeContext.tsx`** : Gestion du mode Sombre/Clair.

### Fonctionnalités Métier
- **`FrontingCheckInService.ts`** : Gère l'historique de qui est "au front" (aux commandes).
- **`SocialService.ts`** / **`PostsService.ts`** : Création de posts, likes, commentaires.
- **`FeedbackService.ts`** : Envoi de bugs/idées par les utilisateurs.
- **`CalendarService.ts`** : Gestion des événements du système.

### Monétisation & Ads
- **`MonetizationContext.tsx`** : Gère le solde de Crédits et les abonnements.
- **`AdMediationService.ts`** : Wrapper sécurisé pour Google Mobile Ads (AdMob).
- **`RevenueCatService.ts`** : Gestion des achats In-App (Abonnements Premium).
- **`ConsentService.ts`** : Gestion du consentement GDPR (Google UMP message).

### Modules Spécifiques
- **`DynamicIslandService.ts`** : Interacton avec la Dynamic Island (iOS).
- **`WidgetBridge.ts`** : Communication avec les Widgets natifs (iOS/Android).

---

## �🔄 Flux de Données Typique

1.  **Utilisateur** interagit avec un **Composant** (dans `app/` ou `src/components`).
2.  Le Composant appelle un **Service** (dans `src/services`).
3.  Le Service parle à **Firebase/API**.
4.  Les données sont mises à jour dans un **Contexte** (`src/contexts`) ou retournées au composant.
5.  L'UI se met à jour.

## 🛠 Bonnes Pratiques dans ce Projet

- **Préfixe `use`** : Pour les hooks.
- **Services** : Toujours passer par un Service pour toucher à la DB, jamais directement dans le composant.
- **Types** : Toujours typer les props et les retours de fonctions.
- **Styles** : Utiliser `StyleSheet.create` ou les constantes de design system.
