# Plural Connect - Documentation du Projet

> 📘 **Voir [ARCHITECTURE.md](file:///Users/leo/plural-connect/ARCHITECTURE.md) pour la documentation technique complète.**

## Terminologie / Lexique

Pour éviter toute confusion entre les différentes parties de l'application, nous utilisons les termes suivants :

### 1. System Dashboard (Tableau de Bord Système)
*   **Description** : C'est la partie "racine" de l'application. Celle qui s'affiche au démarrage ou quand on navigue via les onglets principaux (en bas de l'écran).
*   **Fonctionnalités** :
    *   Message de bienvenue ("Bonjour...").
    *   Sélection de qui "front" (est aux commandes).
    *   Paramètres globaux de l'application.
    *   Gestion globale du système.
*   **Fichiers Clés** : `app/(tabs)/dashboard.tsx`, `app/(tabs)/_layout.tsx`, `index.tsx`.

### 2. Alter Space (Espace Alter)
*   **Description** : La partie "Social / Instagram". C'est l'interface dédiée à un alter spécifique une fois qu'il est sélectionné ou qu'on clique sur son profil.
*   **Fonctionnalités** :
    *   Fil d'actualité personnel (Feed).
    *   Journal intime personnel.
    *   Profil public/privé, Amis, Galerie.
*   **Fichiers Clés** : `app/alter-space/[alterId]/*`.

---

## Règles de Développement
*   **Standardisation** : Utiliser ces termes dans les commits, les tickets et les discussions.
*   **Code** : `Dashboard` fait référence aux outils système. `AlterSpace` fait référence au contexte d'un alter.
