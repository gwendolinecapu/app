/**
 * Configuration du client Supabase
 * Ce fichier initialise et exporte le client Supabase pour toute l'application
 * 
 * Les clés sont chargées depuis les variables d'environnement (fichier .env)
 * EXPO_PUBLIC_SUPABASE_URL - URL de votre projet Supabase
 * EXPO_PUBLIC_SUPABASE_ANON_KEY - Clé publique anonyme
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Récupération des variables d'environnement
// Le préfixe EXPO_PUBLIC_ permet à Expo de les exposer côté client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Création du client Supabase avec configuration pour React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Utilise AsyncStorage pour persister la session sur mobile
        storage: AsyncStorage,
        // Rafraîchit automatiquement le token avant expiration
        autoRefreshToken: true,
        // Persiste la session entre les ouvertures de l'app
        persistSession: true,
        // Détecte automatiquement les changements de session
        detectSessionInUrl: false,
    },
});
