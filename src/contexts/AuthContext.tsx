import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alter, System } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    system: System | null;
    currentAlter: Alter | null;
    alters: Alter[];
    loading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    switchAlter: (alter: Alter) => void;
    refreshAlters: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [system, setSystem] = useState<System | null>(null);
    const [currentAlter, setCurrentAlter] = useState<Alter | null>(null);
    const [alters, setAlters] = useState<Alter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Récupérer la session au démarrage
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchSystemData(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Écouter les changements d'auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchSystemData(session.user.id);
                } else {
                    setSystem(null);
                    setAlters([]);
                    setCurrentAlter(null);
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchSystemData = async (userId: string) => {
        try {
            // Récupérer le système
            let { data: systemData, error: systemError } = await supabase
                .from('systems')
                .select('*')
                .eq('id', userId)
                .single();

            // Si le système n'existe pas, le créer
            if (systemError && systemError.code === 'PGRST116') {
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                    const email = userData.user.email || '';
                    const username = email.split('@')[0] || 'user';

                    const { data: newSystem, error: createError } = await supabase
                        .from('systems')
                        .insert({
                            id: userId,
                            email: email,
                            username: username,
                        })
                        .select()
                        .single();

                    if (!createError && newSystem) {
                        systemData = newSystem;
                    }
                }
            }

            if (systemData) {
                setSystem(systemData);

                // Récupérer les alters
                const { data: altersData } = await supabase
                    .from('alters')
                    .select('*')
                    .eq('system_id', userId)
                    .order('created_at', { ascending: true });

                if (altersData) {
                    setAlters(altersData);
                    // Sélectionner l'alter actif ou le host par défaut
                    const activeAlter = altersData.find(a => a.is_active) ||
                        altersData.find(a => a.is_host) ||
                        altersData[0];
                    setCurrentAlter(activeAlter || null);
                }
            }
        } catch (error) {
            console.error('Error fetching system data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshAlters = async () => {
        if (!user) return;

        const { data: altersData } = await supabase
            .from('alters')
            .select('*')
            .eq('system_id', user.id)
            .order('created_at', { ascending: true });

        if (altersData) {
            setAlters(altersData);
        }
    };

    const signUp = async (email: string, password: string, username: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) return { error };

        // Créer le système dans la base (utiliser upsert pour éviter les erreurs si un trigger existe déjà)
        if (data.user) {
            const { error: systemError } = await supabase.from('systems').upsert({
                id: data.user.id,
                email,
                username,
            });

            // Si erreur, on la log mais on ne bloque pas l'inscription si l'utilisateur auth est créé
            if (systemError) {
                console.error('Error creating system entry:', systemError);
                // Si c'est une erreur de duplicata qui persiste malgré l'upsert (rare), on considère que c'est bon
                if (!systemError.message.includes('duplicate key')) {
                    return { error: systemError };
                }
            }
        }

        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setSystem(null);
        setAlters([]);
        setCurrentAlter(null);
    };

    const switchAlter = async (alter: Alter) => {
        setCurrentAlter(alter);

        // Mettre à jour is_active dans la base
        await supabase
            .from('alters')
            .update({ is_active: false })
            .eq('system_id', alter.system_id);

        await supabase
            .from('alters')
            .update({ is_active: true })
            .eq('id', alter.id);
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                system,
                currentAlter,
                alters,
                loading,
                signUp,
                signIn,
                signOut,
                switchAlter,
                refreshAlters,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
