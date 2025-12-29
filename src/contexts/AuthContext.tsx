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
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Alter, System } from '../types';
import { FrontingService } from '../services/fronting';

// New interface for Active Front
export type FrontStatus = {
    type: 'single' | 'co-front' | 'blurry';
    alters: Alter[]; // Empty if blurry
    customStatus?: string; // Optional custom status for blurry mode
};

interface AuthContextType {
    user: User | null;
    system: System | null;
    activeFront: FrontStatus; // Replaces currentAlter
    alters: Alter[];
    loading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    setFronting: (alters: Alter[], type: 'single' | 'co-front' | 'blurry', customStatus?: string) => Promise<void>;
    refreshAlters: () => Promise<void>;
    // Helpers for compatibility
    currentAlter: Alter | null; // Derived from activeFront (first alter or null)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [system, setSystem] = useState<System | null>(null);
    const [activeFront, setActiveFront] = useState<FrontStatus>({ type: 'single', alters: [] });
    const [alters, setAlters] = useState<Alter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchSystemData(firebaseUser.uid);
            } else {
                setSystem(null);
                setAlters([]);
                setActiveFront({ type: 'single', alters: [] });
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchSystemData = async (userId: string) => {
        try {
            const systemRef = doc(db, 'systems', userId);
            const systemSnap = await getDoc(systemRef);
            let systemData = systemSnap.exists() ? (systemSnap.data() as System) : null;

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

                // Initialiser activeFront basé sur is_active
                const activeAlters = altersData.filter(a => a.is_active);
                if (activeAlters.length === 1) {
                    setActiveFront({ type: 'single', alters: activeAlters });
                } else if (activeAlters.length > 1) {
                    setActiveFront({ type: 'co-front', alters: activeAlters });
                } else {
                    // Fallback to host or empty
                    const host = altersData.find(a => a.is_host) || altersData[0];
                    setActiveFront({ type: 'single', alters: host ? [host] : [] });
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
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const setFronting = async (frontAlters: Alter[], type: 'single' | 'co-front' | 'blurry', customStatus?: string) => {
        if (!user) return;

        // Optimistic UI update
        const previousFront = activeFront;
        const newFront: FrontStatus = { type, alters: frontAlters, customStatus };
        setActiveFront(newFront);

        try {
            // 1. Reset all active alters first (to handle transitions cleanly)
            // Note: This might be expensive if many alters, but simpler for consistency.
            // Ideally we only update changed ones.
            const currentActiveIds = alters.filter(a => a.is_active).map(a => a.id);
            const newActiveIds = frontAlters.map(a => a.id);

            // Deactivate old ones that are no longer active
            const toDeactivate = currentActiveIds.filter(id => !newActiveIds.includes(id));
            const toActivate = newActiveIds.filter(id => !currentActiveIds.includes(id));

            await Promise.all([
                ...toDeactivate.map(id => updateDoc(doc(db, 'alters', id), { is_active: false })),
                ...toActivate.map(id => updateDoc(doc(db, 'alters', id), { is_active: true }))
            ]);

            // 2. Log history using FrontingService
            // For now, FrontingService only supports single switch.
            // We need to update FrontingService or handle multiple entries.
            // For MVP: Log the primary confronter or "Blurry" entry.
            // This is a simplified implementation. Ideally FrontingService needs an upgrade too.
            if (type !== 'blurry' && frontAlters.length > 0) {
                // Log for the first one for now as 'switch'
                // FUTURE: Support batch log or co-front log in FrontingService
                await FrontingService.switchAlter(user.uid, frontAlters[0].id);
            }

        } catch (error) {
            console.error('Error switching front:', error);
            setActiveFront(previousFront);
        }
    };

    const deleteAccount = async () => {
        if (!user) return;
        try {
            // 1. Delete Firestore Data
            // Note: In a real production app, use Cloud Functions for recursive delete.
            // Here we try to clean up best effort.

            // Delete Alters
            const altersq = query(collection(db, 'alters'), where('system_id', '==', user.uid));
            const snapshot = await getDocs(altersq);
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete System
            await deleteDoc(doc(db, 'systems', user.uid));

            // 2. Delete Auth User
            await user.delete();

        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                system,
                activeFront,
                alters,
                loading,
                signUp,
                signIn,
                signOut,
                deleteAccount,
                setFronting,
                refreshAlters,
                currentAlter: activeFront.alters.length > 0 ? activeFront.alters[0] : null,
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
