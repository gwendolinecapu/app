import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { BlockingService } from '../../src/services/blocking';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { System } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';

export default function BlockedUsersScreen() {
    const { user } = useAuth();
    const [blockedUsers, setBlockedUsers] = useState<System[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlockedUsers();
    }, [user]);

    const loadBlockedUsers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const users = await BlockingService.getBlockedUsers(user.uid);
            setBlockedUsers(users);
        } catch (error) {
            console.error('Failed to load blocked users', error);
            Alert.alert('Erreur', 'Impossible de charger la liste des utilisateurs bloqués');
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (targetId: string, username: string) => {
        if (!user) return;

        Alert.alert(
            'Débloquer',
            `Voulez-vous vraiment débloquer ${username} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Débloquer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await BlockingService.unblockUser(user.uid, targetId);
                            setBlockedUsers(prev => prev.filter(u => u.id !== targetId));
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de débloquer cet utilisateur');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: System }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {item.username?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.username}>{item.username || 'Utilisateur inconnu'}</Text>
                    {/* item.systemName removed as it does not exist on System type */}
                </View>
            </View>

            <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblock(item.id, item.username || 'Utilisateur')}
            >
                <Text style={styles.unblockText}>Débloquer</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Utilisateurs bloqués</Text>
            </View>

            <FlatList
                data={blockedUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading ? (
                        <EmptyState
                            icon="shield-checkmark-outline"
                            title="Aucun utilisateur bloqué"
                            message="Vous n'avez bloqué personne pour le moment."
                        />
                    ) : null
                }
                refreshing={loading}
                onRefresh={loadBlockedUsers}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
    },
    backButton: {
        marginRight: spacing.md,
    },
    headerTitle: {
        ...typography.h3,
        fontSize: 18,
    },
    listContent: {
        padding: spacing.md,
        flexGrow: 1,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    textContainer: {
        flex: 1,
    },
    username: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    systemName: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    unblockButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderWidth: 1,
        borderColor: colors.textSecondary,
        borderRadius: borderRadius.full,
    },
    unblockText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
