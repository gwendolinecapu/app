import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Alter } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { router } from 'expo-router';

interface FollowListModalProps {
    visible: boolean;
    title: string;
    userIds: string[];
    onClose: () => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ visible, title, userIds, onClose }) => {
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
            setLoading(true);
            const { AlterService } = await import('../../services/alters');
            const users = await AlterService.getAlters(userIds);
            setData(users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={false} // usage in Modal can be tricky with this on some versions, safer false or omit. web handles it. checking docs: default false.
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => {
                                    onClose();
                                    router.push(`/alter-space/${item.id}`);
                                }}
                            >
                                <View style={[styles.avatar, { backgroundColor: item.color || colors.primary }]}>
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
                                <Text style={styles.name}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                                <Text style={styles.emptyText}>Aucun utilisateur</Text>
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
    content: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '70%',
        paddingBottom: spacing.xl,
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
