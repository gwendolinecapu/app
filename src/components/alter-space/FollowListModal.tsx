import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Alter } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { router } from 'expo-router';

import { ThemeColors } from '../../lib/cosmetics';

interface FollowListModalProps {
    visible: boolean;
    title: string;
    userIds: string[];
    onClose: () => void;
    themeColors?: ThemeColors | null;
    /** Callback to clean up missing/deleted users found during fetch */
    onSync?: (missingIds: string[], duplicateIds: string[]) => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ visible, title, userIds, onClose, themeColors, onSync }) => {
    const [data, setData] = React.useState<Alter[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (visible && userIds.length > 0) {
            loadUsers();
        } else {
            setData([]);
        }
    }, [visible, userIds]);

    const loadUsers = async () => {
        try {
            console.log('[FollowListModal] Loading users for IDs:', userIds);
            setLoading(true);
            const { AlterService } = await import('../../services/alters');

            // Deduplicate for fetching
            const uniqueIds = Array.from(new Set(userIds));
            const users = await AlterService.getAlters(uniqueIds);

            console.log('[FollowListModal] Fetched users:', users);
            setData(users);

            // Detect and handle missing users (ghosts) AND duplicates
            if (onSync) {
                const foundIds = new Set(users.map(u => u.id));
                const missingIds = uniqueIds.filter(id => !foundIds.has(id));

                // Find duplicates in original array
                const seen = new Set();
                const duplicateIds = userIds.filter(item => {
                    const k = item;
                    return seen.has(k) ? true : (seen.add(k), false);
                });

                if (missingIds.length > 0 || duplicateIds.length > 0) {
                    console.log('[FollowListModal] Found issues, triggering sync. Missing:', missingIds, 'Duplicates:', duplicateIds);
                    onSync(missingIds, duplicateIds);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic styles
    const backgroundColor = themeColors?.backgroundCard || colors.backgroundCard;
    const textColor = themeColors?.text || colors.text;
    const borderBottomColor = themeColors?.border || colors.border;
    const overlayColor = 'rgba(0,0,0,0.5)'; // Keep overlay dark for contrast

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={[styles.content, { backgroundColor }]}>
                    <View style={[styles.header, { borderBottomColor }]}>
                        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={textColor} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => {
                                    onClose();
                                    router.push(`/alter-space/${item.id}`);
                                }}
                            >
                                <View style={[styles.avatar, { backgroundColor: item.color || themeColors?.primary || colors.primary }]}>
                                    {item.avatar_url ? (
                                        <Image
                                            source={{ uri: item.avatar_url }}
                                            style={styles.avatarImage}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                    ) : (
                                        <Text style={styles.avatarText}>{item.name[0]}</Text>
                                    )}
                                </View>
                                <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={themeColors?.textSecondary || colors.textMuted} />
                                <Text style={[styles.emptyText, { color: themeColors?.textSecondary || colors.textMuted }]}>Aucun utilisateur</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '70%', // Changed to fixed height to cover bottom area properly or just ensure it looks substantial
        // maxHeight: '80%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h3,
        fontWeight: 'bold',
        color: colors.text,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    name: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
});
