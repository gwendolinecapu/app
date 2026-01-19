import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    updateDoc,
    deleteDoc,
    writeBatch,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';
import { useToast } from '../components/ui/Toast';
import { FrontingService } from '../services/fronting';
import { triggerHaptic } from '../lib/haptics';


import { Alter, System } from '../types';
import { storage } from '../lib/storage';




interface FrontStatus {
    type: 'single' | 'co-front' | 'blurry';
    alters: Alter[];
    customStatus?: string;
}

interface AuthContextType {
    user: User | null;
    system: System | null;
    activeFront: FrontStatus;
    alters: Alter[];
    loading: boolean;
    signUp: (email: string, password: string, username: string, alterCount?: number) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    setFronting: (frontAlters: Alter[], type: 'single' | 'co-front' | 'blurry', customStatus?: string) => Promise<void>;
    refreshAlters: () => Promise<void>;
    togglePin: (alterId: string) => Promise<void>;
    toggleArchive: (alterId: string) => Promise<void>;
    updateHeadspace: (mood: string) => Promise<void>;
    currentAlter: Alter | null;
    isBiometricEnabled: boolean;
    toggleBiometric: () => Promise<void>;
    signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [systemData, setSystemData] = useState<System | null>(null);
    const { showToast } = useToast();
    const [activeFront, setActiveFront] = useState<FrontStatus>({ type: 'single', alters: [] });
    const [alters, setAlters] = useState<Alter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);

    useEffect(() => {
        storage.isBiometricsEnabled().then(setIsBiometricEnabled);
    }, []);

    useEffect(() => {
        let unsubscribeSystem: Unsubscribe | null = null;
        let unsubscribeAlters: Unsubscribe | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {

            // Set User ID for Analytics
            const AnalyticsService = require('../services/AnalyticsService').default;
            await AnalyticsService.setUserId(firebaseUser ? firebaseUser.uid : null);

            setUser(firebaseUser);
            if (firebaseUser) {
                setLoading(true); // Prevent flicker while fetching system/alters

                const systemRef = doc(db, 'systems', firebaseUser.uid);
                unsubscribeSystem = onSnapshot(systemRef, async (docSnap) => {

                    if (docSnap.exists()) {
                        setSystemData(docSnap.data() as System);
                    } else {
                        // Creates system if not exists
                        const email = firebaseUser.email || '';
                        const username = email.split('@')[0] || 'user';
                        const newSystem: System = {
                            id: firebaseUser.uid,
                            email: email,
                            username: username,
                            created_at: new Date().toISOString(),
                        };
                        try {
                            await setDoc(systemRef, newSystem);
                            // Snapshot will fire again
                        } catch (e) {
                            console.error("Error creating system", e);
                        }
                    }
                }, (error) => {
                    console.error("System snapshot error", error);
                });

                // 2. Subscribe to Alters
                const altersq = query(
                    collection(db, 'alters'),
                    where('system_id', '==', firebaseUser.uid),
                    orderBy('created_at', 'asc')
                );

                unsubscribeAlters = onSnapshot(altersq, (querySnapshot) => {

                    const altersData: Alter[] = [];
                    querySnapshot.forEach((doc) => {
                        altersData.push({ id: doc.id, ...doc.data() } as Alter);
                    });
                    setAlters(altersData);

                    // Update Active Front based on new data
                    updateActiveFront(altersData);
                    setLoading(false);
                }, (error) => {
                    console.error("Alters snapshot error", error);
                    setLoading(false);
                });

            } else {
                setSystemData(null);
                setAlters([]);
                setActiveFront({ type: 'single', alters: [] });
                setLoading(false);
                if (unsubscribeSystem) unsubscribeSystem();
                if (unsubscribeAlters) unsubscribeAlters();
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSystem) unsubscribeSystem();
            if (unsubscribeAlters) unsubscribeAlters();
        };
    }, []);

    // 3. AppState Listener for Session Management
    const appState = useRef(AppState.currentState);
    const hasInitialSessionStarted = useRef(false);

    useEffect(() => {
        // Start session on mount if active
        if (user && activeFront.alters.length > 0 && !hasInitialSessionStarted.current) {
            FrontingService.startSession(user.uid, activeFront.alters[0].id);
            hasInitialSessionStarted.current = true;
        }

        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (!user) return;

            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to the foreground
                if (activeFront.alters.length > 0) {
                    await FrontingService.startSession(user.uid, activeFront.alters[0].id);
                }
            } else if (
                appState.current === 'active' &&
                nextAppState.match(/inactive|background/)
            ) {
                // App has gone to the background
                await FrontingService.stopActiveSessions(user.uid);
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [user, activeFront.alters]); // Changed dependency to whole array instead of [0].id to be safer

    const updateActiveFront = (currentAlters: Alter[]) => {
        const activeAlters = currentAlters.filter(a => a.is_active);
        if (activeAlters.length === 1) {
            setActiveFront({ type: 'single', alters: activeAlters });
        } else if (activeAlters.length > 1) {
            setActiveFront({ type: 'co-front', alters: activeAlters });
        } else {
            const host = currentAlters.find(a => a.is_host);
            const firstAlter = currentAlters[0];
            if (host) {
                setActiveFront({ type: 'single', alters: [host] });
            } else if (firstAlter) {
                setActiveFront({ type: 'single', alters: [firstAlter] });
            } else {
                setActiveFront({
                    type: 'blurry',
                    alters: [],
                    customStatus: 'Mode Système'
                });
            }
        }
    };

    // No-op for compatibility as functionality is now realtime
    const refreshAlters = async () => { };

    const signUp = async (email: string, password: string, username: string, alterCount?: number) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            const newSystemData: System = {
                id: newUser.uid,
                email,
                username,
                created_at: new Date().toISOString(),
            };

            if (alterCount) {
                newSystemData.alter_count = alterCount;
            }

            await setDoc(doc(db, 'systems', newUser.uid), newSystemData);
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

    const signInWithGoogle = async () => {
        try {
            const GoogleAuthService = require('../services/GoogleAuthService').default;
            await GoogleAuthService.signIn();

            // If new user, we might want to create system data, but onAuthStateChanged handles it mostly.
            // However, onAuthStateChanged logic for creating system (lines 95-110) relies on email extraction.
            // It should work fine for Google users too.

            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signOut = async () => {
        try {
            if (user) {
                await FrontingService.stopActiveSessions(user.uid);
            }
            try {
                const GoogleAuthService = require('../services/GoogleAuthService').default;
                await GoogleAuthService.signOut();
            } catch (e) {
                // Ignore if not signed in with Google
            }
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

    const toggleBiometric = async () => {
        const newValue = !isBiometricEnabled;
        setIsBiometricEnabled(newValue);
        await storage.setBiometricsEnabled(newValue);
        if (newValue) {
            triggerHaptic.success();
        } else {
            triggerHaptic.selection();
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
                currentAlter: activeFront.alters[0] || null,
                isBiometricEnabled,
                toggleBiometric,
                signInWithGoogle
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
