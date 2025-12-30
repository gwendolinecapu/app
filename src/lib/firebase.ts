import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is resolved via metro.config.js to RN bundle
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuration Firebase
// TODO: Remplacer par les vraies clés après création du projet
const firebaseConfig = {
    apiKey: "AIzaSyByyRNVyyz24J1JXS2J_xWb7F8PwSz6QRQ",
    authDomain: "app-tdi.firebaseapp.com",
    projectId: "app-tdi",
    storageBucket: "app-tdi.firebasestorage.app",
    messagingSenderId: "280489246228",
    appId: "1:280489246228:web:7b5e1177e193dc20caf101",
    measurementId: "G-Y5Y6LXVNS1"
};

// Initialisation de l'application Firebase (Singleton)
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialisation de l'Authentification avec persistance AsyncStorage pour React Native
// Initialisation de l'Authentification (Web vs Native)
const auth = Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });

// Initialisation de Firestore
const db = getFirestore(app);

// Activation de la persistance hors-ligne (IndexedDB pour Web, AsyncStorage pour React Native)
// Cela permet à l'app de fonctionner sans connexion et de synchroniser quand le réseau revient.
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required
        console.warn('Firestore persistence not supported in this environment');
    }
});

// Initialisation de Storage
const storage = getStorage(app);

export { auth, db, storage };

