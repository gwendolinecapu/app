import React from 'react';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alter } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { AlterPrimers } from '../AlterPrimers';
import { SystemRelationships } from '../SystemRelationships';
import { Skeleton } from '../ui/Skeleton';
import { getFrameStyle, ThemeColors } from '../../lib/cosmetics';
import { SakuraFrame } from '../effects/SakuraPetals';

const ROLE_DEFINITIONS: Record<string, string> = {
    'host': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hote': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hôte': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'protector': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'protecteur': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'gatekeeper': "Contrôle les switchs (changements), l'accès aux souvenirs ou aux zones du monde intérieur.",
    'persecutor': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'persecuteur': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'persécuteur': "Peut agir de manière nuisible envers le système, souvent par mécanisme de défense déformé ou traumatisme.",
    'little': "Un alter enfant, souvent porteur d'innocence ou de souvenirs traumatiques précoces.",
    'caretaker': "Prend soin des autres alters (souvent les littles) ou apaise le système.",
    'soigneur': "Prend soin des autres alters (souvent les littles) ou apaise le système.",
    'trauma holder': "Détient les souvenirs ou les émotions liés aux traumas pour protéger les autres.",
    'porteur de trauma': "Détient les souvenirs ou les émotions liés aux traumas pour protéger les autres.",
    'fictive': "Introject basé sur un personnage de fiction.",
    'factive': "Introject basé sur une personne réelle.",
};

const getRoleDefinition = (roleName: string) => {
    const key = roleName.toLowerCase().trim();
    if (ROLE_DEFINITIONS[key]) return ROLE_DEFINITIONS[key];
    const found = Object.keys(ROLE_DEFINITIONS).find(k => key.includes(k));
    if (found) return ROLE_DEFINITIONS[found];
    return "Définition non disponible pour ce rôle spécifique.";
};

const formatDate = (date: any) => {
    if (!date) return null;
    try {
        // Handle Firestore Timestamp
        if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate().toLocaleDateString();
        }
        // Handle String or Date
        const d = new Date(date);
        if (isNaN(d.getTime())) return null; // Invalid date
        return d.toLocaleDateString();
    } catch (e) {
        return null; // Fallback
    }
};

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
    themeColors?: ThemeColors | null;
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
    onFollowingPress,
    themeColors
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

    const frameStyle = getFrameStyle(alter.equipped_items?.frame);
    const isSakuraFrame = alter.equipped_items?.frame === 'frame_anim_sakura';

    // Composant Avatar interne (réutilisable avec ou sans Sakura)
    const AvatarContent = () => (
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
    );

    return (
        <View style={styles.container}>
            {/* Top Section: Avatar + Stats */}
            <View style={styles.topSection}>
                {/* Avatar Column */}
                <View style={styles.avatarColumn}>
                    {isSakuraFrame ? (
                        // Cadre Sakura animé avec pétales
                        <SakuraFrame size={88}>
                            <AvatarContent />
                        </SakuraFrame>
                    ) : (
                        // Cadre standard
                        <View style={[
                            styles.avatarContainer,
                            { borderColor: alter.color || colors.primary },
                            frameStyle.containerStyle
                        ]}>
                            <AvatarContent />
                        </View>
                    )}
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
                    <AnimatedPressable
                        style={styles.roleRow}
                        onPress={() => {
                            const role = alter.custom_fields?.find(f => f.label === 'Role')?.value || '';
                            Alert.alert("Définition du rôle", getRoleDefinition(role));
                        }}
                    >
                        <Ionicons name="information-circle" size={14} color={themeColors?.primary || colors.primaryLight} style={{ marginRight: 4 }} />
                        <Text style={styles.roleText}>{alter.custom_fields.find(f => f.label === 'Role')?.value}</Text>
                    </AnimatedPressable>
                )}

                {alter.bio ? (
                    <Text style={styles.bioText}>{alter.bio || "Aucune biographie"}</Text>
                ) : null}

                {/* Dates Display */}
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                    {formatDate(alter.birthDate) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={14} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.bioText, { marginTop: 0, fontSize: 12, color: colors.textSecondary }]}>
                                Né(e) le {formatDate(alter.birthDate)}
                            </Text>
                        </View>
                    )}
                    {formatDate(alter.arrivalDate) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="airplane-outline" size={14} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.bioText, { marginTop: 0, fontSize: 12, color: colors.textSecondary }]}>
                                Arrivé(e) le {formatDate(alter.arrivalDate)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Advanced Info */}
                <View style={{ marginTop: spacing.md }}>
                    <AlterPrimers alter={alter} editable={isOwner} themeColors={themeColors} />
                    <SystemRelationships alter={alter} editable={isOwner} themeColors={themeColors} />
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
                {isOwner ? (
                    <>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={[styles.actionButton, themeColors && { backgroundColor: themeColors.backgroundCard, borderColor: themeColors.border }]}
                            onPress={() => router.push(`/alter-space/${alter.id}/edit`)}
                        >
                            <Text style={[styles.actionButtonText, themeColors && { color: themeColors.text }]}>Modifier</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={[styles.actionButton, themeColors && { backgroundColor: themeColors.backgroundCard, borderColor: themeColors.border }]}
                            onPress={() => router.push('/history')}
                        >
                            <Text style={[styles.actionButtonText, themeColors && { color: themeColors.text }]}>Historique</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={[styles.actionButton, themeColors && { backgroundColor: themeColors.backgroundCard, borderColor: themeColors.border }]}
                            onPress={() => router.push('/settings')}
                        >
                            <Ionicons name="settings-outline" size={16} color={themeColors?.text || colors.text} />
                        </AnimatedPressable>
                    </>
                ) : (
                    <>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={[styles.actionButton, styles.primaryActionButton]}
                            onPress={onFriendAction}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                {friendStatus === 'friends' && <Ionicons name="checkmark" size={16} color="white" />}
                                <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                                    {friendStatus === 'friends' ? 'Abonné' :
                                        friendStatus === 'pending' ? 'Demande envoyée' : 'S\'abonner'}
                                </Text>
                            </View>
                        </AnimatedPressable>
                        <AnimatedPressable
                            containerStyle={{ flex: 1 }}
                            style={styles.actionButton}
                            onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: alter.id, receiver: alter.id } })}
                        >
                            <Text style={styles.actionButtonText}>Message</Text>
                        </AnimatedPressable>

                        {alter.custom_fields?.find(f => f.label.toLowerCase() === 'role')?.value?.toLowerCase() !== 'singlet' && (
                            <AnimatedPressable
                                containerStyle={{ flex: 1 }}
                                style={styles.actionButton}
                                onPress={() => {
                                    const systemId = alter.systemId || alter.system_id || alter.userId;
                                    if (systemId) {
                                        router.push(`/system-profile/${systemId}`);
                                    } else {
                                        Alert.alert("Erreur", "Système introuvable");
                                    }
                                }}
                            >
                                <Text style={styles.actionButtonText}>Voir système</Text>
                            </AnimatedPressable>
                        )}
                    </>
                )}
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        // backgroundColor: colors.background, // Let container decide or transparent
        // For consistent look with AlterSpaceScreen theme:
        backgroundColor: 'transparent',
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
