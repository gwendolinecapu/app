# Configuration PluralConnect

## 🔐 Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les valeurs suivantes :

```bash
# Supabase (récupérez ces valeurs depuis votre dashboard Supabase)
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key

# PowerSync (optionnel pour l'instant)
EXPO_PUBLIC_POWERSYNC_URL=https://votre-instance.powersync.com
```

## 📦 Installation Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **Settings > API** pour récupérer :
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Allez dans **SQL Editor** et exécutez le contenu de `supabase/schema.sql`

## 🚀 Lancer l'application

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Lancer en mode développement
npx expo start
```

Scannez le QR code avec l'app **Expo Go** sur votre téléphone.

## 📱 Tester sur iOS Simulator

```bash
npx expo start --ios
```

## 🤖 Tester sur Android Emulator

```bash
npx expo start --android
```
 