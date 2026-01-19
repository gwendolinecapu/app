/**
 * Service de gestion des follows (relations de suivi entre systèmes)
 * Permet aux utilisateurs de suivre d'autres systèmes et voir leurs posts publics
 */

import { db } from '../lib/firebase';
import {
    collection,
    doc,
    setDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    updateDoc,
    writeBatch,
    addDoc,
} from 'firebase/firestore';
import { PublicProfile } from '../types';

// ============================================
// Follow Management
// ============================================

/**
 * Suivre un autre système
 * @param followerId - ID du système qui suit
 * @param followingId - ID du système à suivre
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
        throw new Error("Vous ne pouvez pas vous suivre vous-même");
    }

    const batch = writeBatch(db);
    const followId = `${followerId}_${followingId}`;

    // Créer le document de follow
    const followRef = doc(db, 'follows', followId);
    batch.set(followRef, {
        id: followId,
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
    });

    // Incrémenter les compteurs (profils publics)
    const followerProfileRef = doc(db, 'public_profiles', followerId);
    const followingProfileRef = doc(db, 'public_profiles', followingId);

    batch.update(followerProfileRef, {
        following_count: increment(1),
        updated_at: new Date().toISOString(),
    });

    batch.update(followingProfileRef, {
        follower_count: increment(1),
        updated_at: new Date().toISOString(),
    });

    await batch.commit();

    // Create Notification and Send Push (outside batch since it's a different concern/collection logic potentially)
    try {
        // Need to fetch follower name to enrich notification
        let followerName = 'Un utilisateur';

        const followerProfile = await getPublicProfile(followerId);
        if (followerProfile) {
            followerName = followerProfile.display_name;
        } else {
            // Fallback fetch if public profile not ready/found
            const systemDoc = await getDoc(doc(db, 'systems', followerId));
            if (systemDoc.exists()) {
                followerName = systemDoc.data().username || followerName;
            }
        }

        const notificationRef = collection(db, 'notifications');
        await addDoc(notificationRef, {
            type: 'follow',
            recipientId: followingId,
            senderId: followerId,
            actorName: followerName,
            actorAvatar: followerProfile?.avatar_url || null,
            read: false,
            created_at: new Date(), // Using client date or serverTimestamp() is fine
            title: "Nouvel abonné",
            body: `${followerName} a commencé à vous suivre`,
        });

        const { default: PushService } = await import('./PushNotificationService');
        await PushService.sendNewFollowerNotification(
            followingId,
            followerName
        );

    } catch (error) {
        console.error('Error sending follow notification:', error);
    }
}

/**
 * Ne plus suivre un système
 * @param followerId - ID du système qui ne veut plus suivre
 * @param followingId - ID du système à ne plus suivre
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
    const batch = writeBatch(db);
    const followId = `${followerId}_${followingId}`;

    // Supprimer le document de follow
    const followRef = doc(db, 'follows', followId);
    batch.delete(followRef);

    // Décrémenter les compteurs
    const followerProfileRef = doc(db, 'public_profiles', followerId);
    const followingProfileRef = doc(db, 'public_profiles', followingId);

    batch.update(followerProfileRef, {
        following_count: increment(-1),
        updated_at: new Date().toISOString(),
    });

    batch.update(followingProfileRef, {
        follower_count: increment(-1),
        updated_at: new Date().toISOString(),
    });

    await batch.commit();
}

/**
 * Vérifier si un système en suit un autre
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
    // Use query instead of getDoc to avoid Permission Denied if doc doesn't exist 
    // (Rules often check resource.data which fails on missing docs)
    const q = query(
        collection(db, 'follows'),
        where('follower_id', '==', followerId),
        where('following_id', '==', followingId),
        limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

/**
 * Récupérer la liste des followers d'un système
 */
export async function getFollowers(systemId: string): Promise<PublicProfile[]> {
    const q = query(
        collection(db, 'follows'),
        where('following_id', '==', systemId),
        orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    const followerIds = snapshot.docs.map(doc => doc.data().follower_id);

    // Récupérer les profils publics des followers
    const profiles: PublicProfile[] = [];
    for (const id of followerIds) {
        const profile = await getPublicProfile(id);
        if (profile) {
            profiles.push(profile);
        }
    }

    return profiles;
}

/**
 * Récupérer la liste des systèmes suivis
 */
export async function getFollowing(systemId: string): Promise<PublicProfile[]> {
    const q = query(
        collection(db, 'follows'),
        where('follower_id', '==', systemId),
        orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    const followingIds = snapshot.docs.map(doc => doc.data().following_id);

    // Récupérer les profils publics des suivis
    const profiles: PublicProfile[] = [];
    for (const id of followingIds) {
        const profile = await getPublicProfile(id);
        if (profile) {
            profiles.push(profile);
        }
    }

    return profiles;
}

// ============================================
// Public Profile Management
// ============================================

/**
 * Créer ou mettre à jour le profil public d'un système
 */
export async function createOrUpdatePublicProfile(
    systemId: string,
    data: Partial<Omit<PublicProfile, 'system_id' | 'follower_count' | 'following_count'>>
): Promise<void> {
    const profileRef = doc(db, 'public_profiles', systemId);
    const existing = await getDoc(profileRef);

    if (existing.exists()) {
        // Mise à jour
        await updateDoc(profileRef, {
            ...data,
            updated_at: new Date().toISOString(),
        });
    } else {
        // Création
        await setDoc(profileRef, {
            system_id: systemId,
            display_name: data.display_name || 'Système',
            email: data.email || null,
            bio: data.bio || null,
            avatar_url: data.avatar_url || null,
            is_public: data.is_public ?? false, // Privé par défaut
            follower_count: 0,
            following_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    }
}

/**
 * Récupérer le profil public d'un système
 */
export async function getPublicProfile(systemId: string): Promise<PublicProfile | null> {
    const profileRef = doc(db, 'public_profiles', systemId);
    const profileDoc = await getDoc(profileRef);

    if (!profileDoc.exists()) {
        return null;
    }

    return profileDoc.data() as PublicProfile;
}

/**
 * Rechercher des utilisateurs par nom
 * Ne retourne que les profils publics
 */
export async function searchUsers(searchQuery: string, maxResults: number = 20): Promise<PublicProfile[]> {
    // Firestore ne supporte pas la recherche fuzzy, on fait une recherche prefix
    const normalizedQuery = searchQuery.toLowerCase().trim();

    if (!normalizedQuery) {
        return [];
    }

    // Récupérer tous les profils publics et filtrer côté client
    // (Pour une vraie app, utiliser Algolia ou Elasticsearch)
    const q = query(
        collection(db, 'public_profiles'),
        where('is_public', '==', true),
        limit(100) // Limite pour éviter de charger trop de données
    );

    const snapshot = await getDocs(q);
    const profiles: PublicProfile[] = [];

    snapshot.forEach(doc => {
        const profile = doc.data() as PublicProfile;
        // Filtrer par nom ou email (case insensitive)
        const nameMatch = profile.display_name.toLowerCase().includes(normalizedQuery);
        const emailMatch = profile.email?.toLowerCase().includes(normalizedQuery);

        if (nameMatch || emailMatch) {
            profiles.push(profile);
        }
    });

    // Limiter les résultats
    return profiles.slice(0, maxResults);
}

/**
 * Récupérer les posts publics d'un système
 */
export async function getPublicPosts(systemId: string, limitCount: number = 20) {
    const q = query(
        collection(db, 'posts'),
        where('system_id', '==', systemId),
        where('visibility', '==', 'public'),
        orderBy('created_at', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Export du service
export const FollowService = {
    followUser,
    unfollowUser,
    isFollowing,
    getFollowers,
    getFollowing,
    createOrUpdatePublicProfile,
    getPublicProfile,
    searchUsers,
    getPublicPosts,
};
