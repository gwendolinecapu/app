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
// Firebase Configuration
// ------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyDdteIZYO8VJEyXYPAvHzkiOjXW17s5exc",
    authDomain: "app-tdi.firebaseapp.com",
    projectId: "app-tdi",
    storageBucket: "app-tdi.firebasestorage.app",
    messagingSenderId: "280489246228",
    appId: "1:280489246228:web:7b5e1177e193dc20caf101",
    measurementId: "G-Y5Y6LXVNS1"
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
        // eslint-disable-next-line @typescript-eslint/no-var-requires
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

// Enable Persistence (Firestore)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this environment');
    }
});

export { auth, db, storage, functions };
