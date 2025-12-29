/**
 * Écran Discover - Recherche et découverte d'autres systèmes
 * Permet de trouver et suivre d'autres utilisateurs de l'application
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { FollowService } from '../../src/services/follows';
import { PublicProfile } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

export default function DiscoverScreen() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<PublicProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

    // Rechercher des utilisateurs
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const profiles = await FollowService.searchUsers(searchQuery);
            // Exclure son propre profil
            const filtered = profiles.filter(p => p.system_id !== user?.uid);
            setResults(filtered);

            // Vérifier le statut de follow pour chaque résultat
            if (user) {
                const statuses: Record<string, boolean> = {};
                for (const profile of filtered) {
                    statuses[profile.system_id] = await FollowService.isFollowing(user.uid, profile.system_id);
                }
                setFollowingStatus(statuses);
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Erreur', 'Impossible de rechercher');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, user]);

    // Debounce la recherche
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    // Suivre/Ne plus suivre
    const handleToggleFollow = async (profileId: string) => {
        if (!user) return;

        const isCurrentlyFollowing = followingStatus[profileId];

        try {
            if (isCurrentlyFollowing) {
                await FollowService.unfollowUser(user.uid, profileId);
            } else {
                await FollowService.followUser(user.uid, profileId);
            }

            // Mettre à jour le statut local
            setFollowingStatus(prev => ({
                ...prev,
                [profileId]: !isCurrentlyFollowing,
            }));

            // Mettre à jour le compteur dans les résultats
            setResults(prev => prev.map(p => {
                if (p.system_id === profileId) {
                    return {
                        ...p,
                        follower_count: isCurrentlyFollowing
                            ? p.follower_count - 1
                            : p.follower_count + 1,
                    };
                }
                return p;
            }));
        } catch (error) {
            console.error('Follow error:', error);
            Alert.alert('Erreur', 'Action impossible');
        }
    };

    const renderProfile = ({ item }: { item: PublicProfile }) => {
        const isFollowing = followingStatus[item.system_id];

        return (
            <TouchableOpacity
                style={styles.profileCard}
                onPress={() => router.push(`/profile/${item.system_id}` as any)}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {item.display_name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.profileInfo}>
                    <Text style={styles.displayName}>{item.display_name}</Text>
                    {item.bio && (
                        <Text style={styles.bio} numberOfLines={1}>
                            {item.bio}
                        </Text>
                    )}
                    <Text style={styles.stats}>
                        {item.follower_count} followers
                    </Text>
                </View>

                {/* Follow Button */}
                <TouchableOpacity
                    style={[
                        styles.followButton,
                        isFollowing && styles.followingButton,
                    ]}
                    onPress={() => handleToggleFollow(item.system_id)}
                >
                    <Text style={[
                        styles.followButtonText,
                        isFollowing && styles.followingButtonText,
                    ]}>
                        {isFollowing ? 'Suivi' : 'Suivre'}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Découvrir</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher des systèmes..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.system_id}
                    renderItem={renderProfile}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>
                                {searchQuery.length >= 2
                                    ? 'Aucun résultat'
                                    : 'Rechercher des systèmes'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery.length >= 2
                                    ? 'Essayez un autre terme'
                                    : 'Tapez au moins 2 caractères pour chercher'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.text,
        paddingVertical: spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.md,
        paddingTop: 0,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    avatarContainer: {
        marginRight: spacing.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    profileInfo: {
        flex: 1,
    },
    displayName: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    bio: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    stats: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: 2,
    },
    followButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    followingButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
    followButtonText: {
        ...typography.bodySmall,
        color: 'white',
        fontWeight: '600',
    },
    followingButtonText: {
        color: colors.text,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
});
