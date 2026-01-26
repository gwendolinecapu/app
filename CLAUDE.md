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
npm test -- --watch    # Run tests in watch mode
npm test -- path/to/file.test.ts  # Run a single test file

# Cloud Functions (from functions/ directory)
cd functions
npm run build          # Compile TypeScript
npm run build:watch    # Compile with watch mode
npm run serve          # Build + local Firebase emulator
npm run deploy         # Deploy to Firebase
npm run logs           # Stream function logs
```

## Tech Stack

- **Framework**: React Native 0.81 + Expo SDK 54 + TypeScript
- **Navigation**: expo-router (file-based routing)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions with Node.js 22)
- **State**: React Context API (AuthContext, MonetizationContext, NotificationContext, ThemeContext, NetworkContext, SuccessAnimationContext)
- **Monetization**: RevenueCat + Google AdMob
- **AI/ML**: Local AI with expo-llm-mediapipe (Gemma models for summaries/suggestions)
- **Testing**: Jest + jest-expo

## Architecture

### Key Terminology

- **System**: A user account representing a plural system (group of alters)
- **Alter**: An individual identity within a system
- **Subsystem**: Organizational grouping of alters within a system (e.g., "System A", "System B")
- **Dashboard** (`app/(tabs)/dashboard.tsx`): System-level tools - fronting management, global settings, system weather
- **AlterSpace** (`app/alter-space/[alterId]/`): Individual alter profiles - personal feed, journal, gallery, emotions, friends
- **Fronting**: Which alter(s) are currently active/present
- **Co-fronting**: Multiple alters fronting simultaneously
- **Headspace/InnerWorld**: Visual representation of the internal world where alters exist

### Directory Structure

```
app/                    # expo-router screens (file-based routing)
  (auth)/              # Login/register flows
  (tabs)/              # Main tabbed navigation (Dashboard)
  alter-space/         # AlterSpace routes per alter
  settings/            # Settings sub-routes (13 pages)
  post/                # Post creation and viewing
  story/               # Stories creation and viewing
  crisis/              # Crisis support tools
  help/                # Help request system
  inner-world/         # InnerWorld/headspace visualization
  journal/             # Journal entries
  tasks/               # Task management
  calendar/            # Calendar and events
  group-chat/          # Group messaging
  conversation/        # Direct messaging
  discover/            # Content discovery
  shop/                # In-app shop
  premium/             # Premium subscription
  admin/               # Admin panel
  onboarding/          # First-time user experience
  subsystem/           # Subsystem management
  _layout.tsx          # Root layout with navigation
  index.tsx            # Entry point with auth redirect

src/
  components/          # UI components organized by feature
    ui/               # Base components (Button, Input, Modal)
    dashboard/        # Dashboard-specific
    alter-space/      # AlterSpace-specific
    shop/             # Monetization components
    messaging/        # Chat components
    stories/          # Story components
    ads/              # Ad components
    effects/          # Visual effects (confetti, animations)
  services/           # Business logic (ALWAYS use services for Firestore)
  contexts/           # Global state (Auth, Monetization, Theme, etc.)
  hooks/              # Custom hooks (prefix with "use")
  lib/                # Utilities and config (firebase.ts, theme.ts)
  types/              # TypeScript definitions

functions/             # Firebase Cloud Functions (Node.js 22)
  src/                # TypeScript source
  lib/                # Compiled JavaScript (gitignored)
```

### Data Flow

1. Component calls a Service
2. Service communicates with Firebase
3. Data stored in Context
4. UI updates via context subscription

### Post Authorship & Visibility

**Author Types** (for posts):
- `single` - Single alter posting
- `co-front` - Multiple specific alters posting together
- `blurry` - Unclear who is fronting

**Visibility Levels**:
- `private` - Only the author alter can see
- `system` - Only alters within the same system can see
- `friends` - Friends of the author alter(s) can see
- `public` - Anyone can see

### Relationship Model

- **System-to-system**: Following relationships (`follows` collection)
- **Alter-to-alter**: Friend relationships within and between systems
- **Blocking**: System-level blocking for moderation

### Special Features

- **Local AI**: On-device AI using expo-llm-mediapipe with Gemma models for privacy-preserving summaries and suggestions
- **Monetization**: Dual economy with Credits (earned/purchased) and Dust (from duplicates) for cosmetic items
- **Daily Rewards**: Streak-based system with login bonuses and rewarded ads
- **Flash Sales**: Time-limited cosmetic offers in the shop
- **LootBoxes**: Gamified reward system with evolving chest mechanics
- **Dynamic Island**: iOS Live Activities integration for fronting status
- **Apple Watch**: Companion app for quick fronting changes
- **Widgets**: Native iOS/Android widgets for at-a-glance fronting info
- **AlterSpace Protection**: Optional password protection per alter space

## Firestore Data Model

### Key Collections

- `systems` - User accounts (plural systems)
- `alters` - Individual identities within systems
- `subsystems` - Organizational groupings of alters
- `posts` - Feed publications with visibility controls
- `stories` - Ephemeral 24h content (auto-deleted after 24h via Cloud Functions)
- `follows` - System-to-system relationships
- `fronting_history` - Who was fronting and when
- `messages` - Direct/group messaging
- `conversations` - Message threads
- `emotions` - Emotion tracking per alter
- `journal_entries` - Personal journals
- `tasks` - Task management with gamification
- `roles` - Custom alter roles (Protector, Gatekeeper, etc.)
- `inner_worlds` - InnerWorld/headspace definitions
- `help_requests` - Crisis support requests

### Important Type Aliases

Several fields have aliases for backward compatibility:
- Alter: `userId` = `systemId` = `system_id`
- Alter: `avatar` = `avatar_url`

## Code Conventions

- **CRITICAL**: Always access Firestore through services (`src/services/`), never directly in components
- Use `StyleSheet.create()` or `src/lib/theme.ts` for styling
- Type all props and function returns (strict TypeScript)
- Prefix hooks with `use` (e.g., `useAlterData`, `useNotifications`)
- Use camelCase for service files (e.g., `fronting.ts`, `posts.ts`)
- Service files that are classes use PascalCase (e.g., `NotificationService.ts`, `LocalAIService.ts`)

### Naming Patterns

Services follow two patterns:
1. **Functional services**: lowercase camelCase (`posts.ts`, `alters.ts`, `fronting.ts`)
2. **Class-based services**: PascalCase (`NotificationService.ts`, `RevenueCatService.ts`, `LocalAIService.ts`)

### Common Development Patterns

**Creating a new feature:**
1. Define types in `src/types/index.ts`
2. Create service in `src/services/` (use existing services as reference)
3. Add UI components in `src/components/`
4. Create route in `app/` if needed (expo-router)
5. Update Firestore rules in `firestore.rules` if adding collections
6. Add indexes in `firestore.indexes.json` if doing compound queries

**Adding a new collection:**
1. Define interface in `src/types/index.ts`
2. Create service with CRUD operations
3. Update `firestore.rules` with security rules
4. Add any necessary indexes to `firestore.indexes.json`

**Working with contexts:**
- Access via `useContext(ContextName)`
- AuthContext provides: `user`, `loading`, `signIn`, `signOut`, `system`, `currentAlter`
- MonetizationContext provides: `credits`, `isPremium`, `streak`, etc.

## Key Files Reference

### Configuration & Infrastructure
- `src/lib/firebase.ts` - Firebase configuration
- `src/lib/theme.ts` - Design system (colors, spacing, typography)
- `src/lib/cosmetics.ts` - Cosmetic items data (frames, themes, bubbles)
- `src/lib/emotions.ts` - Emotion mappings and emoji associations
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Composite indexes for queries
- `storage.rules` - Firebase Storage security rules
- `app.json` - Expo configuration (permissions, plugins)
- `eas.json` - EAS Build configuration

### State Management
- `src/contexts/AuthContext.tsx` - User session and auth state
- `src/contexts/MonetizationContext.tsx` - Credits, Premium status, daily streaks
- `src/contexts/NotificationContext.tsx` - Notification management
- `src/contexts/ThemeContext.tsx` - Dark/Light mode
- `src/contexts/NetworkContext.tsx` - Network connectivity status
- `src/contexts/SuccessAnimationContext.tsx` - Success animations

### Core Services
- `src/services/alters.ts` - Alter CRUD operations
- `src/services/fronting.ts` - Fronting state management
- `src/services/posts.ts` - Post creation, visibility, likes
- `src/services/LocalAIService.ts` - On-device AI (summaries, suggestions)
- `src/services/RevenueCatService.ts` - Subscription management

### Documentation
- `ARCHITECTURE.md` - Detailed architecture documentation (in French)
- `VISION.md` - Product vision and roadmap (in French)
- `CHANGELOG.md` - Version history
- `docs/TESTS_FONCTIONNELS_100.md` - Functional test scenarios (in French)

## Testing & Development

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run a specific test file
npm test -- src/services/groups.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Development Workflow

1. **Start Development Server**: `npm start`
2. **Choose Platform**: Press `i` (iOS), `a` (Android), or `w` (Web)
3. **Making Changes**:
   - Components → UI changes
   - Services → Business logic changes
   - Always read files before editing
   - Run tests after significant changes
4. **Cloud Functions**: Work in `functions/` directory, use `npm run build:watch` for live TypeScript compilation

### Important Development Notes

- **Expo Router**: File-based routing - file structure in `app/` determines routes
- **Hot Reload**: Changes auto-reload in development, but context changes may require app restart
- **Firebase Emulator**: Use `cd functions && npm run serve` for local Cloud Functions testing
- **TypeScript**: Strict mode enabled - all types must be explicit
- **Git Hooks**: Husky configured for pre-commit checks
