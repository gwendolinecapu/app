# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PluralConnect is a React Native mobile app (with web support) built for people with Dissociative Identity Disorder (DID). It combines system management tools with a social platform where each alter (identity) has their own Instagram-like profile space.

## Development Commands

```bash
# Main app (Expo)
npm start              # Start Expo dev server
npm run ios            # Build and run on iOS simulator
npm run android        # Build and run on Android emulator
npm run web            # Run web version
npm run lint           # Run ESLint
npm test               # Run Jest tests

# Cloud Functions (from functions/ directory)
cd functions
npm run build          # Compile TypeScript
npm run serve          # Local Firebase emulator
npm run deploy         # Deploy to Firebase
npm run logs           # Stream function logs
```

## Tech Stack

- **Framework**: React Native 0.81 + Expo SDK 54 + TypeScript
- **Navigation**: expo-router (file-based routing)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **State**: React Context API (6 providers)
- **Monetization**: RevenueCat + Google AdMob

## Architecture

### Key Terminology

- **Dashboard** (`app/(tabs)/dashboard.tsx`): System-level tools - fronting management, global settings, system weather
- **AlterSpace** (`app/alter-space/[alterId]/`): Individual alter profiles - personal feed, journal, gallery, emotions, friends

### Directory Structure

```
app/                    # expo-router screens (file-based routing)
  (auth)/              # Login/register flows
  (tabs)/              # Main tabbed navigation (Dashboard)
  alter-space/         # AlterSpace routes per alter
  settings/            # Settings sub-routes

src/
  components/          # 100+ UI components organized by feature
    ui/               # Base components (Button, Input, Modal)
    dashboard/        # Dashboard-specific
    alter-space/      # AlterSpace-specific
    shop/             # Monetization components
  services/           # Business logic (always use services for Firestore access)
  contexts/           # Global state (Auth, Monetization, Theme, etc.)
  hooks/              # Custom hooks (prefix with "use")
  lib/                # Utilities and config (firebase.ts, theme.ts)
  types/              # TypeScript definitions

functions/             # Firebase Cloud Functions (Node.js 22)
```

### Data Flow

1. Component calls a Service
2. Service communicates with Firebase
3. Data stored in Context
4. UI updates via context subscription

### Post Visibility Levels

Posts support 4 visibility levels: `private` | `system` | `friends` | `public`

### Relationship Model

- Systems follow systems (inter-system)
- Alters befriend alters (intra-system)

## Code Conventions

- Always access Firestore through services, never directly in components
- Use `StyleSheet.create()` or `src/lib/theme.ts` for styling
- Type all props and function returns (strict TypeScript)
- Prefix hooks with `use`
- Use camelCase for services

## Key Files Reference

- `src/lib/firebase.ts` - Firebase configuration
- `src/lib/theme.ts` - Design system (colors, spacing)
- `src/contexts/AuthContext.tsx` - User session and auth state
- `src/contexts/MonetizationContext.tsx` - Credits, Premium, streaks
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Composite indexes for queries
