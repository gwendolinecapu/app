import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { FriendService } from '../../services/friends';
import { ThemeColors } from '../../lib/cosmetics';

interface Props {
    visible: boolean;
    onClose: () => void;
    currentAlterId: string;
    themeColors?: ThemeColors | null;
}

export const SystemFriendSelector = ({ visible, onClose, currentAlterId, themeColors }: Props) => {
    const { alters, refreshAlters, user } = useAuth();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [statuses, setStatuses] = useState<Record<string, string>>({});

    const systemAlters = alters.filter(a => a.id !== currentAlterId);

    // Load initial statuses
    React.useEffect(() => {
        if (visible) {
            loadStatuses();
        }
    }, [visible, currentAlterId, systemAlters]);

    const loadStatuses = async () => {
        const newStatuses: Record<string, string> = {};
        await Promise.all(systemAlters.map(async (alter) => {
            try {
                const status = await FriendService.checkStatus(currentAlterId, alter.id);
                newStatuses[alter.id] = status;
            } catch (e) {
                console.error("Error checking status for", alter.id, e);
                newStatuses[alter.id] = 'none';
            }
        }));
        setStatuses(newStatuses);
    };

    const handleToggleFriend = async (targetAlterId: string) => {
        setLoadingMap(prev => ({ ...prev, [targetAlterId]: true }));
        try {
            const currentStatus = statuses[targetAlterId] || 'none';

            if (currentStatus === 'friends') {
                // Remove friend
                await FriendService.removeFriend(currentAlterId, targetAlterId);
                setStatuses(prev => ({ ...prev, [targetAlterId]: 'none' }));
            } else if (currentStatus === 'pending') {
                // Cancel request
                await FriendService.cancelRequest(currentAlterId, targetAlterId);
                setStatuses(prev => ({ ...prev, [targetAlterId]: 'none' }));
            } else {
                // Send request
                await FriendService.sendRequest(currentAlterId, targetAlterId);
                setStatuses(prev => ({ ...prev, [targetAlterId]: 'pending' }));
            }

            // Refresh alters to sync any deep changes if needed, mainly for other components
            refreshAlters();

        } catch (error) {
            console.error("Error toggling friend:", error);
        } finally {
            setLoadingMap(prev => ({ ...prev, [targetAlterId]: false }));
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, themeColors && { backgroundColor: themeColors.background }]}>
                <View style={[styles.header, themeColors && { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.title, themeColors && { color: themeColors.text }]}>Membres du Système</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={themeColors?.text || colors.text} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={systemAlters}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const status = statuses[item.id] || 'none';
                        const isLoading = loadingMap[item.id];

                        let btnText = "Ajouter";
                        let btnIcon: any = "add"; // explicit any for icon name
                        let isActionActive = false; // Blue/Primary background

                        if (status === 'friends') {
                            btnText = "Ami·e";
                            btnIcon = "checkmark";
                            isActionActive = true; // "Ami-e" is active state (but maybe outlines?)
                            // Actually user said "si accepté alors ami". 
                        } else if (status === 'pending') {
                            btnText = "Demande envoyée";
                            btnIcon = "time-outline";
                            isActionActive = false; // Or a different color? Usually gray or outlined.
                        }

                        // Style logic matches original intent:
                        // Friends -> Outlined/Transparent (Already added)
                        // Pending -> Outlined/Gray?
                        // Add -> Primary Color

                        // Let's refine based on typical UI:
                        // Add -> Primary (Blue/Pink)
                        // Pending -> Gray/Muted
                        // Friends -> Green or Outlined

                        const isAdded = status === 'friends';
                        const isPending = status === 'pending';

                        return (
                            <View style={[styles.item, themeColors && { backgroundColor: themeColors.backgroundCard }]}>
                                <View style={styles.avatarRow}>
                                    <View style={[styles.avatar, { backgroundColor: item.color || colors.primary }]}>
                                        {item.avatar_url ? (
                                            <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
                                        ) : (
                                            <Text style={styles.avatarText}>{item.name[0]}</Text>
                                        )}
                                    </View>
                                    <Text style={[styles.name, themeColors && { color: themeColors.text }]}>{item.name}</Text>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.actionBtn,
                                        // Base styles based on state
                                        !isAdded && !isPending && styles.btnAdd, // "Ajouter"
                                        (isAdded || isPending) && styles.btnRemove, // Outlinedish

                                        // Dynamic Theme Overrides
                                        themeColors && !isAdded && !isPending && { backgroundColor: themeColors.primary },
                                        themeColors && (isAdded || isPending) && { borderColor: themeColors.border, backgroundColor: 'transparent' }
                                    ]}
                                    onPress={() => handleToggleFriend(item.id)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={(!isAdded && !isPending) ? 'white' : colors.text} size="small" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={isAdded ? "checkmark" : isPending ? "time-outline" : "add"}
                                                size={16}
                                                color={(!isAdded && !isPending) ? 'white' : (themeColors?.text || colors.text)}
                                            />
                                            <Text style={[
                                                styles.btnText,
                                                (!isAdded && !isPending) ? { color: 'white' } : { color: themeColors?.text || colors.text }
                                            ]}>
                                                {status === 'friends' ? 'Ami·e' : status === 'pending' ? 'Demande envoyée' : 'Ajouter'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />
            </View>
        </Modal>
    );
};

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
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    closeBtn: {
        padding: spacing.xs,
    },
    list: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    name: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    btnAdd: {
        backgroundColor: colors.primary,
    },
    btnRemove: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '600',
    }
});
