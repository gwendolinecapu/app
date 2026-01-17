import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { GroupService } from '../src/services/groups';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';
import { Group } from '../src/types';
import { triggerHaptic } from '../src/lib/haptics';

export default function TeamHubScreen() {
    const { user, alters, activeFront } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, [user]);

    const loadGroups = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const userGroups = await GroupService.getUserGroups(user.uid);
            setGroups(userGroups);
        } catch (error) {
            console.error('[TeamHub] Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenInternalChat = () => {
        triggerHaptic.selection();
        router.push('/team-chat');
    };

    const handleOpenGroup = (groupId: string) => {
        triggerHaptic.selection();
        router.push({ pathname: '/group-chat/[groupId]', params: { groupId } });
    };

    const handleCreateGroup = () => {
        triggerHaptic.medium();
        router.push('/group-chat/create');
    };

    const renderGroup = ({ item }: { item: Group }) => (
        <TouchableOpacity
            style={styles.groupCard}
            onPress={() => handleOpenGroup(item.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.groupIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="people" size={24} color="white" />
            </View>
            <View style={styles.groupInfo}>
                <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.groupSubtitle} numberOfLines={1}>
                    {item.memberCount || item.members?.length || 0} membres
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Équipe</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Internal Discussion Card - Always visible */}
                <TouchableOpacity
                    style={styles.internalCard}
                    onPress={handleOpenInternalChat}
                    activeOpacity={0.8}
                >
                    <View style={styles.internalIconContainer}>
                        <View style={styles.internalIcon}>
                            <Ionicons name="home" size={28} color="white" />
                        </View>
                    </View>
                    <View style={styles.internalInfo}>
                        <Text style={styles.internalTitle}>Discussion Interne</Text>
                        <Text style={styles.internalSubtitle}>
                            Chat privé entre vos {alters.length} alters
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Groups Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Groupes</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Aucun groupe</Text>
                        <Text style={styles.emptySubtext}>
                            Créez un groupe pour discuter avec d'autres systèmes
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={groups}
                        renderItem={renderGroup}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreateGroup}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    // Internal Discussion Card
    internalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary + '40',
    },
    internalIconContainer: {
        marginRight: spacing.md,
    },
    internalIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    internalInfo: {
        flex: 1,
    },
    internalTitle: {
        ...typography.h5,
        color: colors.text,
        marginBottom: 4,
    },
    internalSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    // Section
    sectionHeader: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h5,
        color: colors.text,
    },
    // Group Cards
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    groupIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        ...typography.body,
        color: colors.text,
        fontWeight: '600',
    },
    groupSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.sm,
        paddingHorizontal: spacing.xl,
    },
    // FAB
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.xl + 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
