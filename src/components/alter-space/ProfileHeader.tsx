import React from 'react';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alter } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { AlterPrimers } from '../AlterPrimers';
import { SystemRelationships } from '../SystemRelationships';

import { Skeleton } from '../ui/Skeleton';

interface ProfileHeaderProps {
    alter: Alter;
    loading?: boolean;
    isOwner: boolean;
    stats: {
        posts: number;
        followers: number;
        following: number;
    };
    friendStatus: string;
    onFriendAction: () => void;
    onFollowersPress: () => void;
    onFollowingPress: () => void;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    alter,
    loading,
    isOwner,
    stats,
    friendStatus,
    onFriendAction,
    onFollowersPress,
    onFollowingPress
}) => {
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.topSection}>
                    <View style={styles.avatarColumn}>
                        <Skeleton shape="circle" width={80} height={80} style={{ marginBottom: spacing.xs }} />
                        <Skeleton shape="text" width={60} height={16} />
                    </View>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Skeleton shape="text" width={30} height={20} style={{ marginBottom: 4 }} />
                            <Skeleton shape="text" width={40} height={12} />
                        </View>
                        <View style={styles.statBox}>
                            <Skeleton shape="text" width={30} height={20} style={{ marginBottom: 4 }} />
                            <Skeleton shape="text" width={50} height={12} />
                        </View>
                        <View style={styles.statBox}>
                            <Skeleton shape="text" width={30} height={20} style={{ marginBottom: 4 }} />
                            <Skeleton shape="text" width={50} height={12} />
                        </View>
                    </View>
                </View>
                <View style={styles.bioContainer}>
                    <Skeleton shape="text" width={100} height={14} style={{ marginBottom: 8 }} />
                    <Skeleton shape="text" width="100%" height={14} style={{ marginBottom: 4 }} />
                    <Skeleton shape="text" width="80%" height={14} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Top Section: Avatar + Stats */}
            <View style={styles.topSection}>
                {/* Avatar Column */}
                <View style={styles.avatarColumn}>
                    <View style={[styles.avatarContainer, { borderColor: alter.color || colors.primary }]}>
                        <View style={[styles.avatar, { backgroundColor: alter.color || colors.primary }]}>

                            {alter.avatar_url ? (
                                <AnimatedImage
                                    source={{ uri: alter.avatar_url }}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                    transition={500}
                                    {...({ sharedTransitionTag: `avatar-${alter.id}` } as any)}
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {alter.name.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                    </View>
                    <Text style={styles.name} numberOfLines={1}>{alter.name}</Text>
                </View>

                {/* Stats Column */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{stats.posts}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <AnimatedPressable
                        style={styles.statBox}
                        onPress={onFollowersPress}
                    >
                        <Text style={styles.statValue}>{stats.followers}</Text>
                        <Text style={styles.statLabel}>Abonnés</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                        style={styles.statBox}
                        onPress={onFollowingPress}
                    >
                        <Text style={styles.statValue}>{stats.following}</Text>
                        <Text style={styles.statLabel}>Suivis</Text>
                    </AnimatedPressable>
                </View>
            </View>

            {/* Bio Section */}
            <View style={styles.bioContainer}>
                {alter.pronouns ? (
                    <Text style={styles.pronouns}>{alter.pronouns}</Text>
                ) : null}

                {alter.custom_fields?.find(f => f.label === 'Role')?.value && (
                    <View style={styles.roleRow}>
                        <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.roleText}>{alter.custom_fields.find(f => f.label === 'Role')?.value}</Text>
                    </View>
                )}

                {alter.bio ? (
                    <Text style={styles.bioText}>{alter.bio || "Aucune biographie"}</Text>
                ) : null}

                {/* Advanced Info */}
                <View style={{ marginTop: spacing.md }}>
                    <AlterPrimers alter={alter} editable={isOwner} />
                    <SystemRelationships alter={alter} editable={isOwner} />
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
                {isOwner ? (
                    <>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={styles.actionButton}
                            onPress={() => router.push(`/alter-space/${alter.id}/edit`)}
                        >
                            <Text style={styles.actionButtonText}>Modifier</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={styles.actionButton}
                            onPress={() => router.push('/history')}
                        >
                            <Text style={styles.actionButtonText}>Historique</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={styles.actionButton}
                            onPress={() => router.push('/settings')}
                        >
                            <Ionicons name="settings-outline" size={16} color={colors.text} />
                        </AnimatedPressable>
                    </>
                ) : (
                    <>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={[styles.actionButton, styles.primaryActionButton]}
                            onPress={onFriendAction}
                        >
                            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                                {friendStatus === 'friends' ? 'Abonnés' :
                                    friendStatus === 'pending' ? 'Demande envoyée' : 'S\'abonner'}
                            </Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={styles.actionButton}
                            onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: alter.id } })}
                        >
                            <Text style={styles.actionButtonText}>Message</Text>
                        </AnimatedPressable>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    avatarColumn: {
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    avatarContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        padding: 3,
        borderWidth: 2,
        marginBottom: spacing.xs,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        ...typography.h3,
        fontWeight: 'bold',
        marginTop: spacing.xs,
        maxWidth: 100,
        textAlign: 'center',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    bioContainer: {
        marginBottom: spacing.md,
    },
    pronouns: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    roleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        backgroundColor: colors.surface,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    roleText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    bioText: {
        ...typography.body,
        color: colors.text,
        lineHeight: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        backgroundColor: colors.surface,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 44, // Ensure accessible touch target
    },
    actionButtonText: {
        fontWeight: '600',
        color: colors.text,
        fontSize: 14,
    },
    primaryActionButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    primaryActionButtonText: {
        color: 'white',
    },
});
