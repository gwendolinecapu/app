# 🌟 VISION - PluralConnect

> **Document de référence officiel** - Ce fichier définit la vision produit de PluralConnect et doit être consulté avant tout développement majeur.
> 
> *Dernière mise à jour : 19 janvier 2026*

---

## 🎯 Mission Principale

**Réunir toutes les applications TDI (Simply Plural, Twinote, etc.) en une seule plateforme complète** qui combine :
- Gestion du fronting et co-fronting
- Journal système
- Galerie
- **Le concept révolutionnaire d'AlterSpace** : chaque alter a son propre "compte Instagram" avec feed, journal, galerie, émotions, bio, rôle, et peut accepter des amis/alters pour voir et commenter leurs posts

---

## 👥 Utilisateurs Cibles

| Type | Description |
|------|-------------|
| **Systèmes TDI** | Personnes ayant un TDI ou trouble dissociatif lié |
| **Singlets** | Personnes sans TDI souhaitant communiquer avec des amis ayant un système |
| **Communauté existante** | +100 personnes attendent déjà l'application |

---

## 💡 Proposition de Valeur Unique

### Ce qui différencie PluralConnect des autres apps :

| App concurrente | Limite | Solution PluralConnect |
|-----------------|--------|------------------------|
| Simply Plural | Pratique uniquement (fronting) | Ajoute le divertissement et le social |
| Twinote | Pas d'invitation d'amis, style Facebook sans divertissement | Mélange Instagram + Simply Plural + idées originales |
| Instagram | Un seul profil partagé par tout le système | **Chaque alter a SON propre espace** |

### La phrase clé :
> *"Chaque alter a son propre espace et peut partager ses posts avec les autres, sans conflits ni partage forcé."*

---

## 🏠 Architecture Conceptuelle

### 1. System Dashboard (Tableau de Bord Système)
L'espace commun pour tout le système :
- ✅ Sélection du fronting / co-fronting
- ✅ Journal système partagé
- ✅ Galerie système
- ✅ Discussion de groupe entre alters
- ✅ "Météo des alters" (émotions)
- ✅ Statistiques de fronting (top alter, historique)
- ✅ Ajout de systèmes amis
- 🔜 Catégories d'alters (Littles, Protecteurs, etc.)

### 2. AlterSpace (Espace Personnel d'un Alter)
L'espace individuel façon Instagram :
- ✅ Feed personnel
- ✅ Journal intime
- ✅ Galerie personnelle
- ✅ Émotions
- ✅ Bio et rôle
- ✅ Système d'amis (alters ou systèmes)
- ✅ Commentaires sur les posts
- ✅ Option mot de passe pour protéger l'accès
- ✅ Stories (24h, optionnelles)
- ✅ Personnalisation visuelle (couleurs, thèmes)

---

## 🔗 Relations & Interactions

### Système ↔ Alters
- Les alters d'un système peuvent s'ajouter mutuellement en amis (ou pas)
- Messagerie interne entre alters du même système
- Journal partageable (certaines pages seulement si souhaité)

### Système ↔ Système
- Ajout de systèmes amis dans le Dashboard
- Possibilité de suivre un système complet

### Alter ↔ Alter (inter-systèmes)
- Un alter peut ajouter un alter d'un autre système
- Amis différents selon l'alter (pas obligatoirement les mêmes)
- Blocage possible alter à alter

---

## 🎚️ Niveaux de Visibilité

### Posts
- [ ] Public mondial
- [ ] Amis seulement
- [ ] Système seulement
- [ ] Privé

### Profils/Contenus
- InnerWorld : partageable ou non par alter
- Pages de journal : sélection des pages à partager
- Alters "Little" : protégés par un alter protecteur qui gère les amitiés

---

## 🛡️ Sécurité & Modération

### Gestion des contenus sensibles
- **Style Discord** : mots entre `**mot**` pour les cacher, tap pour révéler
- Signalements utilisateurs
- Possible modération IA pour les TW (trigger warnings)

### Protection
- Pas de vérification d'identité obligatoire (anonymat possible)
- Pas de mesures strictes de vérification d'âge
- Mode Crise : animation respiration + ressources (déjà implémenté)
- Blocage : alter à alter OU système complet (retrait ami)

### Commentaires
- Pas d'anonymat par défaut (pour éviter les abus)
- Possible option à cocher "commentaire anonyme" (à valider avec la communauté)

---

## 💰 Modèle Économique

### Freemium + Abonnement Premium

| Élément | Détails |
|---------|---------|
| **Prix Premium** | 2-3€/mois |
| **Contenu Premium** | Thèmes de personnalisation |
| **Publicités** | Non intrusives, optionnelles (pour augmenter streak) |
| **Système de crédits** | Streak quotidien = points, Regarder pub = points, Booster = débloquer thèmes |
| **Achats in-app** | Acheter des points pour obtenir des thèmes |

### Objectif financier
- **5 ans** : Au moins 400€/mois de revenus

---

## 🎮 Gamification

| Fonctionnalité | Statut |
|----------------|--------|
| Streak quotidien | ✅ Oui |
| Points/Crédits | ✅ Oui |
| XP/Niveaux (via streak) | ✅ Oui |
| Badges/Achievements | ❌ Non |
| Désactivable | ❌ Non |

---

## 🔜 Fonctionnalités Futures

### Priorité haute
1. 🐛 **Correction des bugs actuels**
2. 🚀 **Sortie de l'application**

### Roadmap future
- **InnerWorld** : Représentation visuelle de l'espace intérieur (headspace)
- **Catégories d'alters** : Comme Simply Plural (Littles, Protecteurs, etc.)
- **"Je veux rencontrer des systèmes"** : Liste d'inscription pour rencontrer d'autres systèmes
- **Hashtags/mots populaires** : Dans le feed
- **Durée moyenne de fronting** : Dans les statistiques
- **Articles santé mentale** : À ajouter

---

## 🤖 Intelligence Artificielle Éthique (Tests)

> **Philosophie** : L'IA est un outil au service du système pour pallier les handicaps (amnésie, aphantasie), jamais un remplacement de l'humain.

### 1. 🧠 Le "Résumé de Rattrapage" (Journal Catch-up)
*Pour lutter contre l'amnésie post-switch.*
- **Problème** : Un alter arrive au front et ignore ce qui s'est passé.
- **Solution** : Bouton dans le Dashboard pour résumer la journée/semaine à partir du Journal **Public/Système** (jamais privé).
- **Technique** : 
  - ✅ **Priorité Locale (On-Device)** : L'IA tourne sur le téléphone (0 serveur, 0 coût, 0 fuite).
  - 🔄 **Fallback Serveur** (téléphones anciens) : Données chiffrées, traitées puis supprimées immédiatement. Pas d'entraînement.

### 2. 🎨 Le "Studio de Vie" (Life Studio)
*Pour aider à la visualisation et l'expression de soi.*
- **Problème** : Difficulté d'avoir des photos de soi en tant qu'alter.
- **Solution** : Génération d'un avatar "Reference Sheet" (planche de référence) à partir d'inspirations.
- **Usage** : Permet ensuite de générer des "scènes de vie" (ex: "Moi buvant un café") pour illustrer les posts.
- **Éthique & Compromis Communautaire** :
  - ✅ **Strictement Optionnel** : La fonctionnalité doit être activée volontairement. Si l'utilisateur est contre l'IA, il ne verra jamais ces options.
  - ⚠️ **Responsabilisation (Art Theft)** : Avertissement clair avant l'upload : *"N'utilisez pas d'œuvres d'artistes sans leur accord. Privilégiez vos propres croquis, des photos libres de droit ou des compositeurs d'avatar (Picrew)."*
  - ✅ **Transparence** : Clairement indiqué comme IA.
  - ✅ **Éphémère** : Photos de références supprimées du serveur (BytePlus) immédiatement après génération.

### 🛡️ Garanties TDI
- **Zero-Training** : Aucune donnée (texte ou image) ne sert à entraîner les modèles.
- **Chiffrement** : Les échanges avec les API externes sont chiffrés.
- **Contrôle** : Désactivable globalement dans les paramètres.

---

## 📱 Fonctionnalités Sociales Détaillées

### Feed & Posts
- Visibilité personnalisable par post
- Hashtags/mots populaires dans le feed
- Commentaires (non anonymes par défaut)

### Messagerie
- Individuelle ET groupée
- Interne au système (Dashboard)
- Externe avec amis (AlterSpace)

### Découverte
- Suivre des systèmes complets OU des alters individuellement
- Système de rencontre "Je veux rencontrer des systèmes"

### Groupes thématiques
- ❌ Pas prévu (pas de groupes type "Protecteurs", "Régional", etc.)

---

## 🎨 Personnalisation

- Chaque alter peut avoir son identité visuelle distincte
- Couleurs personnalisables
- Thèmes (Premium ou via crédits/streak)
- Bio et rôle affichés

---

## 📊 Statistiques & Tracking

### Fronting
- ✅ Historique complet
- ✅ Top alter (celui qui fronte le plus)
- 🔜 Durée moyenne de fronting

### Émotions
- ✅ "Météo des alters"
- ✅ Suivi des émotions par alter

---

## ⚠️ Points d'attention

> [!IMPORTANT]
> - L'app doit être **divertissante**, pas juste pratique
> - Les utilisateurs ne doivent **jamais s'ennuyer**
> - Chaque alter doit se sentir avoir **son propre espace**

> [!WARNING]
> - Éviter les publicités trop intrusives (santé mentale)
> - Gérer correctement les contenus sensibles (TW)
> - Protéger les alters Little des contenus adultes

---

## 🔍 Apps Inspirations

| App | Ce qu'on prend | Ce qu'on évite |
|-----|----------------|----------------|
| **Instagram** | Feed, Stories, Profil | Profil unique partagé |
| **Simply Plural** | Fronting, Catégories | Manque de divertissement |
| **Twinote** | Posts entre alters | Pas d'amis externes, style Facebook |
| **Discord** | Formatage TW avec `**` | - |

---

## ✅ Checklist Vision

Avant chaque développement majeur, vérifier :

- [ ] Cette fonctionnalité aide-t-elle les systèmes TDI ?
- [ ] Est-ce divertissant ET utile ?
- [ ] Respecte-t-elle l'individualité de chaque alter ?
- [ ] Est-elle cohérente avec le modèle AlterSpace/Dashboard ?
- [ ] Ne compromet-elle pas la sécurité des utilisateurs vulnérables ?

---

*Ce document doit être mis à jour à chaque évolution majeure de la vision produit.*
