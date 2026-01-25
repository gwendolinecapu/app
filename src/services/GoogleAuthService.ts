import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Dynamically import Google Sign-In only if not in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = null;

if (!isExpoGo && Platform.OS !== 'web') {
    try {
        const googleSignIn = require('@react-native-google-signin/google-signin');
        GoogleSignin = googleSignIn.GoogleSignin;
        statusCodes = googleSignIn.statusCodes;
    } catch (e) {
        console.warn('Google Sign-In module not available');
    }
}

class GoogleAuthService {
    private configured = false;

    constructor() {
        this.configure();
    }

    private configure() {
        if (Platform.OS === 'web' || isExpoGo || !GoogleSignin) return;

        try {
            GoogleSignin.configure({
                // Get this from Firebase Console -> Authentication -> Sign-in method -> Google -> Web SDK configuration
                // It's required for the 'idToken' to be returned
                webClientId: '280489246228-dspg418bku4kosdjlfvh74jnls284v8s.apps.googleusercontent.com',
                offlineAccess: true,
            });
            this.configured = true;
        } catch (e) {
            console.error('GoogleSignin configuration failed', e);
        }
    }

    async signIn() {
        // WEB Implementation
        if (Platform.OS === 'web') {
            try {
                const provider = new GoogleAuthProvider();
                return await signInWithPopup(auth, provider);
            } catch (error) {
                console.error('Google Sign-In Web Error:', error);
                throw error;
            }
        }

        // Expo Go - Google Sign-In not available
        if (isExpoGo || !GoogleSignin) {
            throw new Error('Google Sign-In n\'est pas disponible sur Expo Go. Utilisez email/mot de passe ou testez sur un development build.');
        }

        // NATIVE Implementation
        if (!this.configured) this.configure();

        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (!idToken) {
                throw new Error('No ID token found');
            }

            const credential = GoogleAuthProvider.credential(idToken);
            return await signInWithCredential(auth, credential);
        } catch (error: any) {
            if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
                throw new Error('Sign in cancelled');
            } else if (error.code === statusCodes?.IN_PROGRESS) {
                throw new Error('Sign in in progress');
            } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new Error('Play services not available');
            } else {
                console.error('Google Sign-In Native Error:', error);
                throw error;
            }
        }
    }

    async signOut() {
        if (Platform.OS === 'web' || isExpoGo || !GoogleSignin) return;
        try {
            await GoogleSignin.signOut();
        } catch (error) {
            console.error('Error signing out of Google:', error);
        }
    }
}

export default new GoogleAuthService();
