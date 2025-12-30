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
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { triggerHaptic } from '../lib/haptics';
import { useToast } from '../components/ui/Toast';
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
    togglePin: (alterId: string) => Promise<void>;
    toggleArchive: (alterId: string) => Promise<void>;
    updateHeadspace: (mood: string) => Promise<void>;
    // Helpers for compatibility
    currentAlter: Alter | null; // Derived from activeFront (first alter or null)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [systemData, setSystemData] = useState<System | null>(null);
    const { showToast } = useToast();
    const [activeFront, setActiveFront] = useState<FrontStatus>({ type: 'single', alters: [] });
    const [alters, setAlters] = useState<Alter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchSystemData(firebaseUser.uid);
            } else {
                setSystemData(null);
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
                setSystemData(systemData);

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
                    // Fallback : chercher l'hôte, sinon premier alter, sinon "Mode Système" virtuel
                    const host = altersData.find(a => a.is_host);
                    const firstAlter = altersData[0];

                    if (host) {
                        setActiveFront({ type: 'single', alters: [host] });
                    } else if (firstAlter) {
                        setActiveFront({ type: 'single', alters: [firstAlter] });
                    } else {
                        // Aucun alter : mode "Système" (blurry avec message explicatif)
                        // L'UI devra gérer ce cas en affichant le profil système
                        setActiveFront({
                            type: 'blurry',
                            alters: [],
                            customStatus: 'Mode Système'
                        });
                    }
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
            const batch = writeBatch(db);

            // 1. Reset currently active alters
            const currentActiveIds = alters.filter(a => a.is_active).map(a => a.id);
            const newActiveIds = frontAlters.map(a => a.id);

            // Deactivate old ones that are no longer active
            currentActiveIds.forEach(id => {
                if (!newActiveIds.includes(id)) {
                    batch.update(doc(db, 'alters', id), { is_active: false });
                }
            });

            // Activate new ones
            newActiveIds.forEach(id => {
                if (!currentActiveIds.includes(id)) {
                    batch.update(doc(db, 'alters', id), { is_active: true });
                }
            });

            await batch.commit();

            // 2. Log history using FrontingService
            // Future improvement: Support batch logging
            try {
                if (type !== 'blurry' && frontAlters.length > 0) {
                    await FrontingService.switchAlter(user.uid, frontAlters[0].id);
                }
            } catch (historyError) {
                console.error('Error logging fronting history:', historyError);
                // Don't revert UI/DB for history failure, just log it.
                // We might want to show a warning toast specifically for this?
                // showToast('Front updated but history failed', 'warning');
            }

            triggerHaptic.success();
            showToast('Fronting updated successfully', 'success');

        } catch (error) {
            console.error('Error switching front:', error);
            triggerHaptic.error();
            showToast('Failed to update active front', 'error');
            setActiveFront(previousFront); // Revert optimistic update only if DB update failed
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

    const togglePin = async (alterId: string) => {
        if (!user) return;
        const alter = alters.find(a => a.id === alterId);
        if (!alter) return;

        const newPinnedStatus = !alter.isPinned;

        // Optimistic update
        setAlters(prev => prev.map(a =>
            a.id === alterId ? { ...a, isPinned: newPinnedStatus } : a
        ));

        try {
            const alterRef = doc(db, 'alters', alterId);
            await updateDoc(alterRef, { isPinned: newPinnedStatus });
            if (newPinnedStatus) {
                triggerHaptic.selection();
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
            // Revert
            setAlters(prev => prev.map(a =>
                a.id === alterId ? { ...a, isPinned: !newPinnedStatus } : a
            ));
            showToast('Erreur lors de la modification', 'error');
        }
    };

    const toggleArchive = async (alterId: string) => {
        if (!user) return;
        const alter = alters.find(a => a.id === alterId);
        if (!alter) return;

        const newArchivedStatus = !alter.isArchived;

        // Optimistic update
        setAlters(prev => prev.map(a =>
            a.id === alterId ? { ...a, isArchived: newArchivedStatus } : a
        ));

        try {
            const alterRef = doc(db, 'alters', alterId);
            await updateDoc(alterRef, { isArchived: newArchivedStatus });
            if (newArchivedStatus) {
                triggerHaptic.success();
                showToast('Alter archivé', 'success');
            } else {
                triggerHaptic.selection();
                showToast('Alter désarchivé', 'success');
            }
        } catch (error) {
            console.error('Error toggling archive:', error);
            // Revert
            setAlters(prev => prev.map(a =>
                a.id === alterId ? { ...a, isArchived: !newArchivedStatus } : a
            ));
            showToast('Erreur lors de la modification', 'error');
        }
    };

    const updateHeadspace = async (mood: string) => {
        if (!user || !systemData) return;

        // Optimistic update
        setSystemData(prev => prev ? { ...prev, headspace: mood } : null);

        try {
            const systemRef = doc(db, 'systems', user.uid);
            await updateDoc(systemRef, { headspace: mood });
            triggerHaptic.light();
        } catch (error) {
            console.error('Error updating headspace:', error);
            // Revert would go here implementation dependent
            showToast('Erreur mise à jour météo', 'error');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                system: systemData,
                activeFront,
                alters,
                loading,
                signUp,
                signIn,
                signOut,
                deleteAccount,
                setFronting,
                refreshAlters,
                togglePin,
                toggleArchive,
                updateHeadspace,
                currentAlter: activeFront.alters[0] || null
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
