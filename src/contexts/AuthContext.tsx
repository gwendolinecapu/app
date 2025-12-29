import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Alter, System } from '../types';

interface AuthContextType {
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
    const [user, setUser] = useState<User | null>(null);
    const [system, setSystem] = useState<System | null>(null);
    const [currentAlter, setCurrentAlter] = useState<Alter | null>(null);
    const [alters, setAlters] = useState<Alter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Écouter les changements d'auth Firebase
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchSystemData(firebaseUser.uid);
            } else {
                setSystem(null);
                setAlters([]);
                setCurrentAlter(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchSystemData = async (userId: string) => {
        try {
            // Récupérer le système depuis Firestore
            const systemRef = doc(db, 'systems', userId);
            const systemSnap = await getDoc(systemRef);

            let systemData = systemSnap.exists() ? (systemSnap.data() as System) : null;

            // Si le système n'existe pas, le créer (cas rare ou premier login après migration)
            if (!systemData && auth.currentUser) {
                const email = auth.currentUser.email || '';
                const username = email.split('@')[0] || 'user';

                const newSystem: System = {
                    id: userId,
                    email: email,
                    username: username,
                    created_at: new Date().toISOString(),
                };

                await setDoc(systemRef, newSystem);
                systemData = newSystem;
            }

            if (systemData) {
                setSystem(systemData);

                // Récupérer les alters
                const altersq = query(
                    collection(db, 'alters'),
                    where('system_id', '==', userId),
                    orderBy('created_at', 'asc')
                );

                const querySnapshot = await getDocs(altersq);
                const altersData: Alter[] = [];
                querySnapshot.forEach((doc) => {
                    altersData.push({ id: doc.id, ...doc.data() } as Alter);
                });

                setAlters(altersData);

                // Sélectionner l'alter actif ou le host par défaut
                const activeAlter = altersData.find(a => a.is_active) ||
                    altersData.find(a => a.is_host) ||
                    altersData[0];
                setCurrentAlter(activeAlter || null);
            }
        } catch (error) {
            console.error('Error fetching system data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshAlters = async () => {
        if (!user) return;

        try {
            const altersq = query(
                collection(db, 'alters'),
                where('system_id', '==', user.uid),
                orderBy('created_at', 'asc')
            );

            const querySnapshot = await getDocs(altersq);
            const altersData: Alter[] = [];
            querySnapshot.forEach((doc) => {
                altersData.push({ id: doc.id, ...doc.data() } as Alter);
            });

            setAlters(altersData);
        } catch (error) {
            console.error('Error refreshing alters:', error);
        }
    };

    const signUp = async (email: string, password: string, username: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            // Créer le document système dans Firestore
            await setDoc(doc(db, 'systems', newUser.uid), {
                id: newUser.uid,
                email,
                username,
                created_at: new Date().toISOString(),
            });

            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            // State cleanup handled by onAuthStateChanged
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const switchAlter = async (alter: Alter) => {
        if (!currentAlter || !user) return;

        // Optimistic UI update
        const previousAlter = currentAlter;
        setCurrentAlter(alter);

        try {
            // Mettre à jour is_active dans Firestore (batch write serait mieux mais on fait simple)
            // Désactiver l'ancien
            if (previousAlter) {
                const prevRef = doc(db, 'alters', previousAlter.id);
                await updateDoc(prevRef, { is_active: false });
            }

            // Activer le nouveau
            const newRef = doc(db, 'alters', alter.id);
            await updateDoc(newRef, { is_active: true });
        } catch (error) {
            console.error('Error switching alter:', error);
            // Rollback UI if needed
            setCurrentAlter(previousAlter);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user, // Firebase User object
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
