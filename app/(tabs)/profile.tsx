import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Post } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

export default function ProfileScreen() {
    const { currentAlter, system, alters, user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState({ posts: 0, friends: 0 });

    useEffect(() => {
        if (currentAlter && user) {
            fetchPosts();
        }
    }, [currentAlter, user]);

    const fetchPosts = async () => {
        if (!currentAlter || !user) return;

        try {
            const q = query(
                collection(db, 'posts'),
                where('system_id', '==', user.uid),
                where('alter_id', '==', currentAlter.id),
                orderBy('created_at', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const data: Post[] = [];

            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Post);
            });

            setPosts(data);
            setStats(prev => ({ ...prev, posts: data.length }));
        } catch (error) {
            console.error('Error fetching profile posts:', error);
        }
    };

    if (!currentAlter) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>👤</Text>
                    <Text style={styles.emptyTitle}>Aucun alter sélectionné</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/(tabs)/alters')}
                    >
                        <Text style={styles.buttonText}>Voir les alters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/alters')}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.username}>@{currentAlter.name.toLowerCase()}</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity onPress={() => router.push('/settings/' as any)}>
                            <Text style={styles.menuIcon}>⚙️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push(`/alter/${currentAlter.id}`)}>
                            <Text style={styles.menuIcon}>⋯</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={[styles.avatar, { backgroundColor: currentAlter.color }]}>
                        <Text style={styles.avatarText}>
                            {currentAlter.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.posts}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.friends}</Text>
                            <Text style={styles.statLabel}>Friends</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{alters.length}</Text>
                            <Text style={styles.statLabel}>Alters</Text>
                        </View>
                    </View>
                </View>

                {/* Bio */}
                <View style={styles.bioSection}>
                    <Text style={styles.name}>{currentAlter.name}</Text>
                    {currentAlter.pronouns && (
                        <Text style={styles.pronouns}>{currentAlter.pronouns}</Text>
                    )}
                    {currentAlter.bio && (
                        <Text style={styles.bio}>{currentAlter.bio}</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push(`/alter/${currentAlter.id}`)}
                    >
                        <Text style={styles.editButtonText}>Modifier le profil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statsButton}
                        onPress={() => router.push('/stats')}
                    >
                        <Text style={styles.statsButtonText}>📊</Text>
                    </TouchableOpacity>
                </View>

                {/* Posts Grid */}
                <View style={styles.postsGrid}>
                    {posts.length === 0 ? (
                        <View style={styles.noPostsContainer}>
                            <Text style={styles.noPosts}>Aucune publication</Text>
                            <TouchableOpacity
                                style={styles.createPostButton}
                                onPress={() => router.push('/post/create')}
                            >
                                <Text style={styles.createPostText}>Créer une publication</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        posts.map((post) => (
                            <TouchableOpacity key={post.id} style={styles.gridItem}>
                                <View style={styles.gridItemContent}>
                                    <Text style={styles.gridItemText} numberOfLines={3}>
                                        {post.content}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        paddingTop: spacing.xl,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    username: {
        ...typography.body,
        fontWeight: 'bold',
    },
    menuIcon: {
        fontSize: 24,
        color: colors.text,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.lg,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.text,
    },
    statsRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...typography.h3,
        color: colors.text,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    bioSection: {
        padding: spacing.md,
        paddingTop: 0,
    },
    name: {
        ...typography.body,
        fontWeight: 'bold',
    },
    pronouns: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    bio: {
        ...typography.body,
        marginTop: spacing.xs,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.sm,
    },
    editButton: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    editButtonText: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
    statsButton: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
    },
    statsButtonText: {
        fontSize: 20,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: GRID_SIZE,
        height: GRID_SIZE,
        borderWidth: 1,
        borderColor: colors.background,
    },
    gridItemContent: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.sm,
    },
    gridItemText: {
        ...typography.caption,
        textAlign: 'center',
    },
    noPostsContainer: {
        width: '100%',
        padding: spacing.xxl,
        alignItems: 'center',
    },
    noPosts: {
        ...typography.bodySmall,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    createPostButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    createPostText: {
        color: colors.text,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    buttonText: {
        color: colors.text,
        fontWeight: '600',
    },
});
