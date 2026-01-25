import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Alter, Post } from '../types';
import { FriendService } from '../services/friends';
import { useAuth } from '../contexts/AuthContext';

export interface AlterData {
    alter: Alter | null;
    posts: Post[];
    friendCount: number;
    followingCount: number;
    friendIds: string[];
    followingIds: string[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useAlterData = (alterId: string | undefined): AlterData => {
    const { alters } = useAuth();
    const [alter, setAlter] = useState<Alter | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [friendCount, setFriendCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [friendIds, setFriendIds] = useState<string[]>([]);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!alterId) return;
        try {
            const [friends, following] = await Promise.all([
                FriendService.getFriends(alterId),
                FriendService.getFollowing(alterId).catch(() => [])
            ]);
            setFriendCount(following.length); // friendCount maps to Followers in UI
            setFollowingCount(friends.length); // followingCount maps to Following in UI
            setFriendIds(following); // friendIds used for followers list
            setFollowingIds(friends); // followingIds used for following list
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, [alterId]);

    const fetchPosts = useCallback(async () => {
        if (!alterId) return;
        try {
            const q = query(
                collection(db, 'posts'),
                where('alter_id', '==', alterId),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const data: Post[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Post);
            });
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    }, [alterId]);

    const refresh = async () => {
        setRefreshing(true);
        // OnSnapshot updates automatically, so we mainly need to refresh lists that are not real-time here
        await Promise.all([fetchStats(), fetchPosts()]);
        setRefreshing(false);
    };

    // Real-time listener for Alter data
    useEffect(() => {
        if (!alterId) return;

        setLoading(true);
        const { onSnapshot } = require('firebase/firestore');
        const docRef = doc(db, 'alters', alterId);

        const unsubscribe = onSnapshot(docRef, (docSnap: any) => {
            if (docSnap.exists()) {
                const firestoreAlter = { id: docSnap.id, ...docSnap.data() } as Alter;

                // For owned alters, merge with local data for faster cosmetic updates if available
                const localAlter = alters.find(a => a.id === alterId);
                if (localAlter) {
                    setAlter({
                        ...firestoreAlter,
                        // Prefer Firestore data for truth, but keeping local optimization pattern if desired
                        // Actually, onSnapshot is fast enough, so we can trust firestoreAlter mostly.
                        // But let's keep cosmetic override logic if it was serving a specific purpose (like optimistic updates from context)
                        equipped_items: localAlter.equipped_items || firestoreAlter.equipped_items,
                    });
                } else {
                    setAlter(firestoreAlter);
                }
                setError(null);
            } else {
                setError('Alter non trouvé');
                setAlter(null);
            }
            setLoading(false);
        }, (err: any) => {
            console.error('Error listening to alter:', err);
            setError('Erreur lors du chargement du profil');
            setLoading(false);
        });

        // Initial fetch for stats and posts (keep these as one-time or separate listeners if needed)
        // For now, keep them as one-time to avoid too many listeners, unless requested.
        fetchStats();
        fetchPosts();

        return () => unsubscribe();
    }, [alterId, alters, fetchStats, fetchPosts]);

    // Sync cosmetics from AuthContext.alters when it changes (e.g., after refreshAlters())
    // This ensures UI updates immediately when theme/cosmetics are equipped
    // But preserve password and other Firestore-only fields
    useEffect(() => {
        if (!alterId) return;
        const localAlter = alters.find(a => a.id === alterId);
        if (localAlter) {
            // Only update if equipped_items actually changed (prevent infinite loop)
            setAlter(prev => {
                if (!prev) return prev;

                // Compare equipped_items to prevent unnecessary updates
                const prevItems = JSON.stringify(prev.equipped_items || {});
                const newItems = JSON.stringify(localAlter.equipped_items || {});

                if (prevItems !== newItems) {
                    return {
                        ...prev,
                        equipped_items: localAlter.equipped_items || prev.equipped_items,
                    };
                }
                return prev;
            });
        }
    }, [alterId, alters]); // Removed 'alter' from dependencies to prevent infinite loop

    return {
        alter,
        posts,
        friendCount,
        followingCount,
        friendIds,
        followingIds,
        loading,
        refreshing,
        error,
        refresh
    };
};
