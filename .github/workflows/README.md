# Workflows GitHub Actions

## ⚠️ Auto-merge des Pull Requests

### Fichiers disponibles

1. **`auto-merge.yml`** (ACTIF) - Mode sécurisé
   - Attend que les tests passent avant de merger
   - Approuve automatiquement la PR
   - Merge dans `main` seulement si les checks sont verts

2. **`auto-merge-aggressive.yml.example`** - Mode ultra-agressif (DÉSACTIVÉ)
   - Merge **immédiatement** sans aucune vérification
   - Aucun garde-fou
   - Pour activer : renommer en `.yml`

### Configuration actuelle

Le workflow **sécurisé** est actif. Il va :
1. ✅ Attendre les tests (si configurés)
2. ✅ Auto-approuver la PR
3. ✅ Merger dans main si tout est vert

### Passer en mode agressif (merge immédiat)

**Option 1 : Éditer le fichier actuel**
```bash
# Décommenter les lignes 18-26 et commenter les lignes 28-54 dans auto-merge.yml
```

**Option 2 : Utiliser le fichier agressif**
```bash
mv .github/workflows/auto-merge-aggressive.yml.example .github/workflows/auto-merge.yml
```

### ⚠️ AVERTISSEMENTS

#### Risques du mode agressif :
- ❌ Code cassé peut être mergé directement dans main
- ❌ Vulnérabilités de sécurité non détectées
- ❌ Conflits de merge non résolus
- ❌ Tests qui échouent ignorés
- ❌ Pas de review humaine

#### Recommandations :
- ✅ Gardez le mode sécurisé (fichier par défaut)
- ✅ Configurez des tests automatiques
- ✅ Utilisez des branch protection rules
- ✅ Activez les required reviews pour main

### Configuration GitHub nécessaire

Pour que le workflow fonctionne, vérifier dans **Settings > Actions > General** :
- ✅ "Allow GitHub Actions to create and approve pull requests" activé
- ✅ "Read and write permissions" pour GITHUB_TOKEN

### Désactiver l'auto-merge

Renommez `auto-merge.yml` en `auto-merge.yml.disabled`
