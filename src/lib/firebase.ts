import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ------------------------------------------------------------------
// FIX: Using Compat SDK for Initialization to resolve Web/Metro issues
// ("Component auth has not been registered yet")
// ------------------------------------------------------------------
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Import Modular types for exports
import { getAuth, initializeAuth } from 'firebase/auth';

import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// ------------------------------------------------------------------
// Firebase Configuration - Using Environment Variables
// ------------------------------------------------------------------
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialisation (Compat Mode guarantees registration)
let app: any; // Type 'any' to avoid compatibility issues between Modular and Compat SDKs
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

// Auth Initialization
let auth: any; // Type 'any' due to mixed Modular/Compat usage
if (Platform.OS === 'web') {
    // Web: Use compat auth instance which is fully initialized
    auth = firebase.auth();
} else {
    // Native: Use modular auth with persistence, forcing registration via side-effects above
    // Native: Use modular auth with persistence
    try {
        // Explicitly try to initialize with React Native Persistence first

        const { getReactNativePersistence } = require('firebase/auth');
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } catch {
        // If already initialized (e.g. by compat), get the existing instance
        // Note: use compat/auth imports might auto-init without persistence, 
        // so strictly speaking we prefer the above to succeed first.
        auth = getAuth(app);
    }
}

// Firestore & Storage
// We use modular instances because the rest of the app might use modular methods
// Compat app instance IS a modular app instance (mostly).
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

// Enable Persistence (Firestore) - only on web, native handles it differently
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence not supported in this environment');
        }
        // Ignore other errors (like already started)
    });
}

export { auth, db, storage, functions };
