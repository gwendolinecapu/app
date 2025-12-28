import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Alter } from '../../src/types';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

interface ConversationItem {
    id: string;
    alter: Alter;
    lastMessage: string;
    time: string;
    unread: number;
}

export default function MessagesScreen() {
    const { alters, currentAlter } = useAuth();
    const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');

    // Create mock conversations from alters
    const internalConversations: ConversationItem[] = alters
        .filter(a => a.id !== currentAlter?.id)
        .map(alter => ({
            id: alter.id,
            alter,
            lastMessage: 'Appuyez pour discuter...',
            time: '',
            unread: 0,
        }));

    const renderConversation = ({ item }: { item: ConversationItem }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => router.push(`/conversation/${item.alter.id}?internal=true`)}
        >
            <View style={[styles.avatar, { backgroundColor: item.alter.color }]}>
                <Text style={styles.avatarText}>
                    {item.alter.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{item.alter.name}</Text>
                    {item.time && <Text style={styles.conversationTime}>{item.time}</Text>}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>
            {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySubtitle}>
                {activeTab === 'internal'
                    ? 'Ajoutez des alters pour discuter entre vous'
                    : 'Ajoutez des amis pour commencer à discuter'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header with current alter */}
            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>

                {/* Avatar Row */}
                <View style={styles.avatarRow}>
                    {alters.slice(0, 6).map((alter) => (
                        <TouchableOpacity
                            key={alter.id}
                            onPress={() => router.push(`/conversation/${alter.id}?internal=true`)}
                        >
                            <View
                                style={[
                                    styles.rowAvatar,
                                    { backgroundColor: alter.color },
                                    currentAlter?.id === alter.id && styles.rowAvatarActive,
                                ]}
                            >
                                <Text style={styles.rowAvatarText}>
                                    {alter.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {alters.length > 6 && (
                        <View style={[styles.rowAvatar, styles.moreAvatar]}>
                            <Text style={styles.moreText}>+{alters.length - 6}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'internal' && styles.tabActive]}
                    onPress={() => setActiveTab('internal')}
                >
                    <Text style={[styles.tabText, activeTab === 'internal' && styles.tabTextActive]}>
                        💜 Interne
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'external' && styles.tabActive]}
                    onPress={() => setActiveTab('external')}
                >
                    <Text style={[styles.tabText, activeTab === 'external' && styles.tabTextActive]}>
                        🌐 Amis
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Conversations List */}
            <FlatList
                data={activeTab === 'internal' ? internalConversations : []}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
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
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    title: {
        ...typography.h2,
        marginBottom: spacing.md,
    },
    avatarRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    rowAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    rowAvatarActive: {
        borderColor: colors.primary,
    },
    rowAvatarText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    moreAvatar: {
        backgroundColor: colors.backgroundCard,
    },
    moreText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.xs,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: colors.text,
    },
    listContent: {
        padding: spacing.md,
        paddingTop: 0,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    conversationContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    conversationName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    conversationTime: {
        ...typography.caption,
        color: colors.textMuted,
    },
    lastMessage: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    unreadBadge: {
        backgroundColor: colors.primary,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
