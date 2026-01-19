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

    const fetchAlter = useCallback(async () => {
        if (!alterId) return;
        try {
            // Always fetch from Firestore to get latest data (especially password)
            const docRef = doc(db, 'alters', alterId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const firestoreAlter = { id: docSnap.id, ...docSnap.data() } as Alter;

                // For owned alters, merge with local data for faster cosmetic updates
                const localAlter = alters.find(a => a.id === alterId);
                if (localAlter) {
                    // Use Firestore data but prefer local cosmetic data for immediate updates
                    setAlter({
                        ...firestoreAlter,
                        equipped_items: localAlter.equipped_items || firestoreAlter.equipped_items,
                    });
                } else {
                    setAlter(firestoreAlter);
                }
            } else {
                setError('Alter non trouvé');
            }
        } catch (err) {
            console.error('Error fetching alter:', err);
            setError('Erreur lors du chargement du profil');
        }
    }, [alterId, alters]);

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
        await Promise.all([fetchAlter(), fetchStats(), fetchPosts()]);
        setRefreshing(false);
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            await Promise.all([fetchAlter(), fetchStats(), fetchPosts()]);
            if (mounted) setLoading(false);
        };

        if (alterId) {
            load();
        }

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alterId]);

    // Sync cosmetics from AuthContext.alters when it changes (e.g., after refreshAlters())
    // This ensures UI updates immediately when theme/cosmetics are equipped
    // But preserve password and other Firestore-only fields
    useEffect(() => {
        if (!alterId) return;
        const localAlter = alters.find(a => a.id === alterId);
        if (localAlter && alter) {
            // Only update cosmetics, keep the rest from Firestore (especially password)
            setAlter(prev => prev ? {
                ...prev,
                equipped_items: localAlter.equipped_items || prev.equipped_items,
            } : prev);
        }
    }, [alterId, alters, alter]);

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
