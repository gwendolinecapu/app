import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth/react-native';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialisation de Firestore
const db = getFirestore(app);

// Initialisation de Storage
import { getStorage } from 'firebase/storage';
const storage = getStorage(app);

export { auth, db, storage };
