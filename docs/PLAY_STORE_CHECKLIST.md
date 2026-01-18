# ✅ Checklist 100 Points - Publication Google Play Store

> **Application : PluralConnect**  
> **Stack : React Native (Expo) / Firebase / RevenueCat / AdMob**

Cette checklist complète vous guide de A à Z pour publier votre application sur le Google Play Store en 2025.

---

## 📋 SECTION 1 : Configuration Compte & Console (Points 1-10)

### Compte Développeur
- [ ] **1.** Créer un compte Google Play Console (frais unique de 25$)
- [ ] **2.** Vérifier l'identité du développeur (personnel ou organisation)
- [ ] **3.** Configurer les informations de paiement pour les revenus
- [ ] **4.** Ajouter les coordonnées de contact développeur (email public)
- [ ] **5.** Configurer l'authentification à 2 facteurs (2FA) sur le compte

### Configuration Console
- [ ] **6.** Créer une nouvelle application dans la Play Console
- [ ] **7.** Sélectionner la langue par défaut (Français)
- [ ] **8.** Définir le type d'application (App vs Jeu)
- [ ] **9.** Confirmer si l'app est gratuite ou payante (irréversible si gratuite)
- [ ] **10.** Activer Play App Signing pour la gestion sécurisée des clés

---

## 🔧 SECTION 2 : Exigences Techniques (Points 11-25)

### Build & Packaging
- [ ] **11.** Générer un Android App Bundle (.aab) et non un APK
- [ ] **12.** Cibler Android 15 (API level 35) minimum (obligatoire août 2025)
- [ ] **13.** Configurer `minSdkVersion` approprié (recommandé : 24+)
- [ ] **14.** Vérifier le `versionCode` (doit être incrémenté à chaque release)
- [ ] **15.** Vérifier le `versionName` format sémantique (ex: 1.0.0)

### Expo Spécifique
- [ ] **16.** Vérifier `expo.android.package` dans app.json (ex: com.pluralconnect.app)
- [ ] **17.** Configurer les permissions Android nécessaires dans app.json
- [ ] **18.** S'assurer que tous les plugins natifs sont listés dans `plugins[]`
- [ ] **19.** Build avec `eas build --platform android --profile production`
- [ ] **20.** Tester le build release sur un appareil physique

### Performances
- [ ] **21.** Activer ProGuard/R8 pour l'obfuscation et optimisation
- [ ] **22.** Vérifier que l'app ne dépasse pas 150 MB (limite AAB)
- [ ] **23.** Optimiser les images et assets (compression WebP)
- [ ] **24.** S'assurer du temps de démarrage < 5 secondes (cold start)
- [ ] **25.** Vérifier l'absence de fuites mémoire majeures

---

## 🔐 SECTION 3 : Sécurité (Points 26-40)

### Sécurité du Code
- [ ] **26.** Supprimer tous les `console.log` en production
- [ ] **27.** Ne jamais stocker de clés API en dur dans le code
- [ ] **28.** Utiliser des variables d'environnement pour les secrets
- [ ] **29.** Vérifier que les fichiers `.env` sont dans `.gitignore`
- [ ] **30.** Activer le certificate pinning pour les API critiques

### Firebase Security
- [ ] **31.** Auditer les règles Firestore (`firestore.rules`) - pas de lecture/écriture ouverte
- [ ] **32.** Auditer les règles Storage (`storage.rules`)
- [ ] **33.** Vérifier les règles d'authentification Firebase
- [ ] **34.** S'assurer que les Cloud Functions valident les inputs
- [ ] **35.** Activer App Check pour protéger les APIs

### Protection des Données
- [ ] **36.** Implémenter le chiffrement des données sensibles locales
- [ ] **37.** Utiliser HTTPS pour toutes les communications réseau
- [ ] **38.** Ne pas logger d'informations personnelles (PII)
- [ ] **39.** Implémenter la déconnexion automatique après inactivité
- [ ] **40.** Protéger l'accès par biométrie si disponible

---

## 🔏 SECTION 4 : Confidentialité & RGPD (Points 41-55)

### Politique de Confidentialité
- [ ] **41.** Rédiger une politique de confidentialité complète
- [ ] **42.** Héberger la politique sur une URL publique accessible
- [ ] **43.** Ajouter l'URL dans la Play Console
- [ ] **44.** Inclure un lien vers la politique dans l'app (Settings)
- [ ] **45.** Traduire la politique dans les langues ciblées

### Formulaire de Sécurité des Données (Play Console)
- [ ] **46.** Remplir le Data Safety Form complètement
- [ ] **47.** Déclarer tous les types de données collectées
- [ ] **48.** Indiquer si les données sont partagées avec des tiers
- [ ] **49.** Expliquer les finalités de collecte (analytics, pub, etc.)
- [ ] **50.** Déclarer les pratiques de chiffrement

### Conformité RGPD/CCPA
- [ ] **51.** Implémenter le consentement GDPR avec Google UMP
- [ ] **52.** Permettre le refus des cookies/tracking
- [ ] **53.** Implémenter la fonctionnalité "Supprimer mon compte"
- [ ] **54.** Permettre l'export des données personnelles
- [ ] **55.** Documenter la durée de rétention des données

---

## 📊 SECTION 5 : Classification du Contenu (Points 56-65)

### Questionnaire de Classification
- [ ] **56.** Remplir le questionnaire IARC (International Age Rating Coalition)
- [ ] **57.** Répondre honnêtement sur la violence dans l'app
- [ ] **58.** Déclarer le contenu généré par utilisateurs (UGC)
- [ ] **59.** Indiquer la présence de publicités
- [ ] **60.** Mentionner les achats in-app

### Exigences Spécifiques
- [ ] **61.** Si UGC : implémenter système de signalement
- [ ] **62.** Si UGC : implémenter système de blocage utilisateur
- [ ] **63.** Si UGC : modérer le contenu (automatique ou manuel)
- [ ] **64.** Si enfants ciblés : conformité COPPA (pas applicable ici)
- [ ] **65.** Obtenir le rating approprié (probablement 12+ ou 16+)

---

## 🎨 SECTION 6 : Assets Store Listing (Points 66-78)

### Icône & Graphics
- [ ] **66.** Icône haute résolution 512x512 px (PNG, max 1024 KB)
- [ ] **67.** Feature Graphic 1024x500 px (bannière promotionnelle)
- [ ] **68.** Ne pas inclure de texte promotionnel dans le feature graphic
- [ ] **69.** Vérifier que l'icône est lisible à petite taille

### Screenshots
- [ ] **70.** Minimum 2 screenshots (idéalement 8)
- [ ] **71.** Screenshots pour téléphone (16:9 ou 9:16)
- [ ] **72.** Screenshots pour tablette 7" (optionnel mais recommandé)
- [ ] **73.** Screenshots pour tablette 10" (optionnel)
- [ ] **74.** Résolution min 320px, max 3840px

### Descriptions
- [ ] **75.** Titre de l'app (max 30 caractères)
- [ ] **76.** Description courte (max 80 caractères) - accrocheuse
- [ ] **77.** Description complète (max 4000 caractères) - avec mots-clés
- [ ] **78.** Vidéo promotionnelle YouTube (optionnel mais recommandé)

---

## 🧪 SECTION 7 : Tests & Qualité (Points 79-88)

### Tests Pré-lancement
- [ ] **79.** Exécuter les Pre-launch Reports de Google Play
- [ ] **80.** Tester sur minimum 5 appareils Android différents
- [ ] **81.** Tester sur différentes versions Android (10, 11, 12, 13, 14)
- [ ] **82.** Vérifier le comportement en mode avion
- [ ] **83.** Tester les rotations d'écran (portrait/paysage)

### Tests Fonctionnels
- [ ] **84.** Tester tout le flow d'inscription/connexion
- [ ] **85.** Vérifier les achats in-app en mode sandbox
- [ ] **86.** Tester les notifications push sur appareil réel
- [ ] **87.** Vérifier le comportement avec permissions refusées
- [ ] **88.** Tester l'upload/download de médias

---

## ♿ SECTION 8 : Accessibilité (Points 89-93)

- [ ] **89.** Implémenter les labels d'accessibilité (`accessibilityLabel`)
- [ ] **90.** Vérifier le contraste des couleurs (ratio 4.5:1 minimum)
- [ ] **91.** Supporter les tailles de police système (Dynamic Type)
- [ ] **92.** Tester avec TalkBack (lecteur d'écran Android)
- [ ] **93.** S'assurer que tous les boutons sont tapables (48x48 dp min)

---

## 💰 SECTION 9 : Monétisation (Points 94-98)

### Achats In-App (RevenueCat)
- [ ] **94.** Configurer les produits dans Play Console
- [ ] **95.** Lier les produits dans RevenueCat Dashboard
- [ ] **96.** Tester les achats avec licence test
- [ ] **97.** Afficher clairement les prix avant achat
- [ ] **98.** Implémenter la restauration des achats

---

## 📢 SECTION 10 : Publicités (Points 99-100)

### AdMob
- [ ] **99.** Déclarer l'app-ads.txt sur votre site web
- [ ] **100.** Vérifier que les pubs ne sont pas intrusives (respect policies Google Ads)

---

## 🚀 CHECKLIST FINALE PRÉ-SOUMISSION

```
□ Bundle .aab généré et signé
□ Toutes les sections Play Console remplies
□ Formulaire Data Safety complété
□ Rating IARC obtenu
□ Politique de confidentialité en ligne
□ Tests sur appareils réels OK
□ Aucune violation de politique détectée
□ Version de test interne validée (14 jours + 20 testeurs si nouveau compte)
```

---

## 📅 Délais à Prévoir

| Étape | Durée Estimée |
|-------|---------------|
| Préparation assets | 2-3 jours |
| Tests internes | 14 jours minimum (nouveaux comptes) |
| Review Google | 3-7 jours (première app) |
| Corrections éventuelles | Variable |

---

## ⚠️ Raisons Courantes de Rejet

1. **Politique de confidentialité manquante ou incorrecte**
2. **Formulaire Data Safety incomplet**
3. **Permissions inutiles demandées**
4. **Contenu trompeur dans les screenshots/description**
5. **Fonctionnalités cassées ou crashs fréquents**
6. **Pas de système de signalement pour UGC**
7. **Publicités trop intrusives**
8. **Infraction aux guidelines de marque**

---

## 📚 Ressources Utiles

- [Google Play Console](https://play.google.com/console)
- [Politiques Développeur Google Play](https://play.google.com/about/developer-content-policy/)
- [Guide de Publication Expo EAS](https://docs.expo.dev/submit/android/)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Générateur de Politique de Confidentialité](https://app-privacy-policy-generator.nisrulz.com/)

---

> 💡 **Conseil** : Commencez par la version Alpha/Beta interne pour valider tous les points avant la release officielle.
