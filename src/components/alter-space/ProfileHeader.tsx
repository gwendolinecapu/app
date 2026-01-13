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
import { getFrameStyle, ThemeColors, getCosmeticItem } from '../../lib/cosmetics';
import { SakuraFrame } from '../effects/SakuraPetals';
import { TropicalFrame } from '../effects/TropicalLeaves';
import { FlameFrame } from '../effects/FlameFrame';
import { NatureMysticFrame } from '../effects/NatureMysticFrame';
import { StoryHighlights } from '../stories/StoryHighlights';

const ROLE_DEFINITIONS: Record<string, string> = {
    'host': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hote': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'hôte': "L'alter qui utilise le corps le plus souvent et gère la vie quotidienne.",
    'protector': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'protecteur': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
    'protectrice': "Protège le système, le corps ou d'autres alters des menaces ou des traumas.",
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
    onAvatarPress?: () => void;
    friendIds?: string[];
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
    themeColors,
    onAvatarPress,
    friendIds = []
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
    const AvatarContent = ({ imageStyle }: { imageStyle?: any }) => (
        <View style={[styles.avatar, { backgroundColor: alter.color || colors.primary }, imageStyle]}>
            {alter.avatar_url ? (
                <AnimatedImage
                    source={{ uri: alter.avatar_url }}
                    style={[styles.avatarImage, imageStyle]}
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

    const renderAvatar = () => (
        <>
            {isSakuraFrame ? (
                // Cadre Sakura animé avec pétales
                <SakuraFrame size={88}>
                    <AvatarContent imageStyle={frameStyle.imageStyle} />
                </SakuraFrame>
            ) : alter.equipped_items?.frame === 'frame_tropical' ? (
                // Cadre Tropical animé avec feuilles
                <TropicalFrame size={88}>
                    <AvatarContent imageStyle={frameStyle.imageStyle} />
                </TropicalFrame>
            ) : alter.equipped_items?.frame === 'frame_flames' ? (
                // Cadre Flammes animé
                <FlameFrame size={88}>
                    <AvatarContent imageStyle={frameStyle.imageStyle} />
                </FlameFrame>
            ) : alter.equipped_items?.frame === 'frame_nature_mystic' ? (
                // Cadre Nature Mystic animé
                <NatureMysticFrame size={88}>
                    <AvatarContent imageStyle={frameStyle.imageStyle} />
                </NatureMysticFrame>
            ) : (
                // Cadre standard ou Image Frame
                <View style={[
                    styles.avatarContainer,
                    { borderColor: alter.color || colors.primary },
                    frameStyle.containerStyle,
                    frameStyle.imageSource ? { borderWidth: 0, backgroundColor: 'transparent', overflow: 'visible' } : undefined
                ]}>
                    <AvatarContent imageStyle={frameStyle.imageStyle} />
                    {frameStyle.imageSource && (
                        <Image
                            source={frameStyle.imageSource}
                            style={{
                                position: 'absolute',
                                width: '130%',
                                height: '130%',
                                top: '-15%',
                                left: '-15%',
                                zIndex: 10,
                            }}
                            contentFit="contain"
                            pointerEvents="none"
                        />
                    )}
                </View>
            )}

            {/* Ajout indicateur si animé non-sakura si besoin */}
            {alter.equipped_items?.frame && getCosmeticItem(alter.equipped_items.frame)?.rarity === 'mythic' && (
                <View style={{ position: 'absolute', bottom: -5, right: -5, zIndex: 20 }}>
                    <Text style={{ fontSize: 16 }}>✨</Text>
                </View>
            )}
        </>
    );

    return (
        <View style={styles.container}>
            {/* Top Section: Avatar + Stats */}
            <View style={styles.topSection}>
                {/* Avatar Column */}
                <View style={styles.avatarColumn}>
                    <AnimatedPressable onPress={onAvatarPress} disabled={!onAvatarPress}>
                        {renderAvatar()}
                    </AnimatedPressable>
                    <Text style={[styles.name, themeColors && { color: themeColors.text }]} numberOfLines={1}>{alter.name}</Text>
                </View>



                {/* Stats Column */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, themeColors && { color: themeColors.text }]}>{stats.posts}</Text>
                        <Text style={[styles.statLabel, themeColors && { color: themeColors.textSecondary }]}>Posts</Text>
                    </View>
                    <AnimatedPressable
                        style={styles.statBox}
                        onPress={onFollowersPress}
                    >
                        <Text style={[styles.statValue, themeColors && { color: themeColors.text }]}>{stats.followers}</Text>
                        <Text style={[styles.statLabel, themeColors && { color: themeColors.textSecondary }]}>Abonnés</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                        style={styles.statBox}
                        onPress={onFollowingPress}
                    >
                        <Text style={[styles.statValue, themeColors && { color: themeColors.text }]}>{stats.following}</Text>
                        <Text style={[styles.statLabel, themeColors && { color: themeColors.textSecondary }]}>Suivis</Text>
                    </AnimatedPressable>
                </View>
            </View>

            {/* Bio Section */}
            <View style={styles.bioContainer}>
                {alter.pronouns ? (
                    <Text style={[styles.pronouns, themeColors && { color: themeColors.textSecondary }]}>{alter.pronouns}</Text>
                ) : null}

                {/* MAJOR ROLES - Always visible as badges */}
                {alter.custom_fields?.find(f => f.label === 'MajorRole')?.value && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {alter.custom_fields.find(f => f.label === 'MajorRole')?.value.split(',').map((majorRole, index) => (
                            <AnimatedPressable
                                key={index}
                                style={[
                                    styles.roleRow,
                                    themeColors ? { backgroundColor: themeColors.primary } : { backgroundColor: colors.primary }
                                ]}
                                onPress={() => {
                                    const roleName = majorRole.trim();
                                    Alert.alert("Définition du rôle", getRoleDefinition(roleName));
                                }}
                            >
                                <Ionicons name="information-circle" size={14} color="white" style={{ marginRight: 4 }} />
                                <Text style={[styles.roleText, { color: 'white', fontWeight: 'bold' }]}>{majorRole.trim()}</Text>
                            </AnimatedPressable>
                        ))}
                    </View>
                )}

                {/* SECONDARY ROLES - Collapsible menu */}
                {alter.custom_fields?.find(f => f.label === 'Role')?.value && (
                    <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, color: themeColors?.textSecondary || colors.textSecondary }}>
                            + {alter.custom_fields.find(f => f.label === 'Role')?.value}
                        </Text>
                    </View>
                )}

                {alter.bio ? (
                    <Text style={[styles.bioText, themeColors && { color: themeColors.text }]}>{alter.bio || "Aucune biographie"}</Text>
                ) : null}

                {/* Dates Display */}
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                    {formatDate(alter.birthDate) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={14} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.bioText, { marginTop: 0, fontSize: 12 }, themeColors ? { color: themeColors.textSecondary } : { color: colors.textSecondary }]}>
                                Né(e) le {formatDate(alter.birthDate)}
                            </Text>
                        </View>
                    )}
                    {formatDate(alter.arrivalDate) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="airplane-outline" size={14} color={themeColors?.textSecondary || colors.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.bioText, { marginTop: 0, fontSize: 12 }, themeColors ? { color: themeColors.textSecondary } : { color: colors.textSecondary }]}>
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

            {/* HIGHLIGHTS SECTION */}
            {/* Strict Privacy: Only show highlights if owner or friends */}
            {(isOwner || friendStatus === 'friends') && (
                <StoryHighlights
                    authorId={alter.id}
                    systemId={alter.systemId || alter.system_id || alter.userId || 'unknown'}
                    isOwner={isOwner}
                    themeColor={themeColors?.primary || colors.primary}
                    friendIds={friendIds}
                />
            )}

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
        marginBottom: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20, // Rounded pill shape
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roleText: {
        fontSize: 12,
        color: 'white',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
