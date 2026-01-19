
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import FeedbackService from '../../../src/services/FeedbackService';
import { Feedback, FeedbackStatus, FeedbackType } from '../../../src/types/Feedback';

export default function AdminFeedbackListScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<FeedbackStatus | null>(null); // null = all
    const [filterType, setFilterType] = useState<FeedbackType | null>(null);

    const loadFeedbacks = async () => {
        try {
            const filter = {
                status: filterStatus || undefined,
                type: filterType || undefined
            };
            const { feedbacks: data } = await FeedbackService.getFeedbacks(filter);
            setFeedbacks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadFeedbacks();
    }, [filterStatus, filterType]);

    const onRefresh = () => {
        setRefreshing(true);
        loadFeedbacks();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return colors.info;
            case 'CONFIRMED_BUG': return colors.error;
            case 'DONE': return colors.success;
            case 'PLANNED': return colors.secondary;
            default: return colors.textMuted;
        }
    };

    const renderItem = ({ item }: { item: Feedback }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/admin/feedback/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: item.type === 'BUG' ? colors.error + '20' : colors.success + '20' }]}>
                    <Text style={[styles.badgeText, { color: item.type === 'BUG' ? colors.error : colors.success }]}>
                        {item.type}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20', marginLeft: 8 }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
                <Text style={[styles.date, { color: colors.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {item.title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
            </Text>

            {item.creditRewardAmount ? (
                <View style={styles.rewardTag}>
                    <Ionicons name="gift" size={12} color={colors.secondary} />
                    <Text style={[styles.rewardText, { color: colors.secondary }]}>
                        {item.creditRewardAmount} Crédits attribués
                    </Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Admin Feedback' }} />

            <View style={styles.filtersContainer}>
                <View style={styles.filterRow}>
                    <Text style={[styles.filterLabel, { color: colors.text }]}>Type:</Text>
                    {(['ALL', 'BUG', 'FEATURE'] as const).map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: (type === 'ALL' && !filterType) || filterType === type
                                        ? colors.primary
                                        : colors.surface
                                }
                            ]}
                            onPress={() => setFilterType(type === 'ALL' ? null : type as FeedbackType)}
                        >
                            <Text style={{
                                color: (type === 'ALL' && !filterType) || filterType === type
                                    ? '#FFF'
                                    : colors.text,
                                fontSize: 12,
                                fontWeight: '600'
                            }}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Text style={[styles.filterLabel, { color: colors.text }]}>Status:</Text>
                    {(['ALL', 'NEW', 'CONFIRMED_BUG', 'DONE', 'PLANNED', 'NEED_INFO', 'NOT_A_BUG', 'DUPLICATE', 'REJECTED'] as const).map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: (status === 'ALL' && !filterStatus) || filterStatus === status
                                        ? colors.primary
                                        : colors.surface
                                }
                            ]}
                            onPress={() => setFilterStatus(status === 'ALL' ? null : status as FeedbackStatus)}
                        >
                            <Text style={{
                                color: (status === 'ALL' && !filterStatus) || filterStatus === status
                                    ? '#FFF'
                                    : colors.text,
                                fontSize: 12,
                                fontWeight: '600'
                            }}>
                                {status === 'ALL' ? 'All' : status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={feedbacks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
                    }
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucun feedback trouvé</Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: 16,
        gap: 12,
    },
    card: {
        padding: 16,
        borderRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    date: {
        marginLeft: 'auto',
        fontSize: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
    rewardTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    rewardText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    filtersContainer: {
        padding: 16,
        paddingBottom: 0,
        gap: 12,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterLabel: {
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 4,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
});
