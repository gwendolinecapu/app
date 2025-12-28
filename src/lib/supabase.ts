import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Configuration Supabase
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Storage adapter qui fonctionne sur web ET mobile
const createStorageAdapter = () => {
    // Sur le web, utiliser AsyncStorage (qui utilise localStorage)
    if (Platform.OS === 'web') {
        return {
            getItem: async (key: string) => {
                try {
                    const value = await AsyncStorage.getItem(key);
                    return value;
                } catch {
                    return null;
                }
            },
            setItem: async (key: string, value: string) => {
                try {
                    await AsyncStorage.setItem(key, value);
                } catch {
                    // Fallback silencieux
                }
            },
            removeItem: async (key: string) => {
                try {
                    await AsyncStorage.removeItem(key);
                } catch {
                    // Fallback silencieux
                }
            },
        };
    }

    // Sur mobile, utiliser SecureStore (plus sécurisé)
    return {
        getItem: async (key: string) => {
            try {
                return await SecureStore.getItemAsync(key);
            } catch {
                // Fallback vers AsyncStorage en cas d'erreur
                return await AsyncStorage.getItem(key);
            }
        },
        setItem: async (key: string, value: string) => {
            try {
                await SecureStore.setItemAsync(key, value);
            } catch {
                // Fallback vers AsyncStorage
                await AsyncStorage.setItem(key, value);
            }
        },
        removeItem: async (key: string) => {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch {
                await AsyncStorage.removeItem(key);
            }
        },
    };
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: createStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Types pour les tables Supabase
export type Database = {
    public: {
        Tables: {
            systems: {
                Row: {
                    id: string;
                    email: string;
                    username: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['systems']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['systems']['Insert']>;
            };
            alters: {
                Row: {
                    id: string;
                    system_id: string;
                    name: string;
                    avatar_url: string | null;
                    bio: string | null;
                    pronouns: string | null;
                    color: string;
                    is_host: boolean;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['alters']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['alters']['Insert']>;
            };
            posts: {
                Row: {
                    id: string;
                    system_id: string;
                    alter_id: string;
                    content: string;
                    media_url: string | null;
                    visibility: 'private' | 'system' | 'friends' | 'public';
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['posts']['Insert']>;
            };
            messages: {
                Row: {
                    id: string;
                    sender_alter_id: string;
                    receiver_alter_id: string;
                    conversation_id: string;
                    content: string;
                    is_internal: boolean;
                    is_read: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['messages']['Insert']>;
            };
        };
    };
};
