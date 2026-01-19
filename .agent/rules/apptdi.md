---
trigger: always_on
---

# 📋 Règles Agent IA - PluralConnect

## 🚀 Règles d'Exécution

### Build & Lancement
- **JAMAIS** lancer la version web sauf si explicitement demandé
- **Par défaut** : toujours builder sur **simulateur iOS**
- Utiliser `npx expo start --ios` ou `npx expo run:ios`

### Recherche & Outils
- **Utiliser Perplexity MCP** régulièrement pour les recherches internet
- Ne pas hésiter à chercher des solutions, documentation, ou best practices

---

## 📚 Documentation Obligatoire

### Avant tout développement majeur, consulter :

| Fichier | Quand le consulter | Action |
|---------|-------------------|--------|
| `VISION.md` | **TOUJOURS** avant un développement majeur | Vérifier cohérence avec la vision produit |
| `ARCHITECTURE.md` | Pour comprendre la structure du projet | Mettre à jour si modification structurelle |
| `project.md` | Pour la terminologie (Dashboard vs AlterSpace) | Référence |
| `CHANGELOG.md` | Après modification importante | Ajouter une entrée |

### Règles de mise à jour :
- **ARCHITECTURE.md** : Actualiser en direct si ajout de services, composants, routes
- **VISION.md** : Consulter mais ne pas modifier sans accord utilisateur
- **CHANGELOG.md** : Documenter les changements importants

---

## 🏗 Architecture du Projet

### Concepts Clés à Respecter

| Concept | Description | Fichiers |
|---------|-------------|----------|
| **Dashboard** | Espace commun du système (fronting, journal système) | `app/(tabs)/dashboard.tsx` |
| **AlterSpace** | Espace personnel par alter (Instagram-like) | `app/alter-space/[alterId]/*` |
| **Service** | Logique métier, interaction Firebase | `src/services/*.ts` |
| **Contexte** | État global (Auth, Theme, Monetization) | `src/contexts/*.tsx` |

### Règles de Code

1. **Services** : Toujours passer par un service pour Firestore, jamais directement dans le composant
2. **Types** : Typer les props et retours de fonctions (voir `src/types/index.ts`)
3. **Styles** : Utiliser `StyleSheet.create()` ou le design system (`src/lib/theme.ts`)
4. **Hooks** : Préfixer avec `use` (ex: `useAlterData`)

---

## 🎯 Vision Produit (Résumé)

> **Mission** : Réunir Simply Plural + Twinote + Instagram en une app TDI complète

### Points clés à TOUJOURS respecter :

- ✅ Chaque alter a **son propre espace** (AlterSpace)
- ✅ L'app doit être **divertissante**, pas juste pratique
- ✅ Support du **fronting et co-fronting**
- ✅ **Personnalisation** par alter (couleurs, thèmes)
- ✅ Protection possible par **mot de passe** sur AlterSpace
- ✅ Contenus sensibles : format Discord `**mot**` pour masquer

### Niveaux de visibilité des posts :
- `private` : Juste l'alter
- `system` : Tout le système
- `friends` : Amis de l'alter
- `public` : Tout le monde

---

## 💰 Monétisation

| Élément | Implémentation |
|---------|----------------|
| **Freemium** | Fonctions de base gratuites |
| **Premium** | 2-3€/mois pour thèmes et personnalisation |
| **Crédits** | Streak quotidien + pub optionnelle |
| **Pubs** | Non intrusives, jamais obligatoires |

---

## ⚠️ Points d'Attention

### À NE PAS FAIRE :
- ❌ Lancer la version web par défaut
- ❌ Modifier la vision produit sans accord
- ❌ Ignorer les types TypeScript
- ❌ Accéder à Firestore directement dans les composants
- ❌ Oublier de mettre à jour ARCHITECTURE.md après modification structurelle

### À TOUJOURS FAIRE :
- ✅ Consulter VISION.md avant développement majeur
- ✅ Utiliser Perplexity pour recherches
- ✅ Builder sur iOS simulateur
- ✅ Respecter l'architecture Service → Contexte → Composant
- ✅ Tester sur le simulateur avant de valider

---

## 📁 Structure Rapide

```
app/                    # Routes (expo-router)
├── (tabs)/            # Dashboard système
├── alter-space/       # 🌟 AlterSpace (cœur de l'app)
└── settings/          # Paramètres

src/
├── components/        # 100+ composants UI
├── services/          # 40 services métier
├── contexts/          # 6 contextes globaux
├── hooks/             # 7 hooks personnalisés
└── types/             # Définitions TypeScript
```

---

## 🔗 Fichiers de Référence

- [VISION.md](file:///Users/faucqueurstacy/Downloads/plural-connect/VISION.md) - Vision produit complète
- [ARCHITECTURE.md](file:///Users/faucqueurstacy/Downloads/plural-connect/ARCHITECTURE.md) - Architecture technique
- [project.md](file:///Users/faucqueurstacy/Downloads/plural-connect/project.md) - Terminologie
- [src/types/index.ts](file:///Users/faucqueurstacy/Downloads/plural-connect/src/types/index.ts) - Types TypeScript