import React from 'react';
import { Image } from 'expo-image';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Post } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { ThemeColors } from '../../lib/cosmetics';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 430;

interface AlterGridProps {
    posts: Post[];
    loading?: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    listHeaderComponent?: React.ReactNode;
    alterName: string;
    themeColors?: ThemeColors | null;
}


export const AlterGrid: React.FC<AlterGridProps> = ({
    posts,
    loading,
    refreshing,
    onRefresh,
    listHeaderComponent,
    alterName,
    themeColors
}) => {
    console.log('[AlterGrid] Rendering with theme:', themeColors ? 'Yes' : 'No');
    if (themeColors) console.log('[AlterGrid] Theme Primary:', themeColors.primary);

    if (loading && posts.length === 0) {
        return (
            <FlatList
                data={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                numColumns={3}
                keyExtractor={(item) => `skeleton-${item}`}
                ListHeaderComponent={() => (
                    <>
                        {listHeaderComponent}
                        <View style={styles.tabsStrip}>
                            <View style={styles.tabIcon}>
                                <View style={{ width: 24, height: 24, backgroundColor: colors.border, borderRadius: 12, opacity: 0.3 }} />
                            </View>
                            <View style={styles.tabIcon}>
                                <View style={{ width: 24, height: 24, backgroundColor: colors.border, borderRadius: 12, opacity: 0.3 }} />
                            </View>
                        </View>
                    </>
                )}
                renderItem={() => (
                    <View style={styles.gridItem}>
                        <View style={{ width: '100%', height: '100%', backgroundColor: colors.backgroundLight, overflow: 'hidden' }}>
                            <View style={{ width: '100%', height: '100%', backgroundColor: colors.border, opacity: 0.2 }} />
                        </View>
                    </View>
                )}
            />
        );
    }
    if (posts.length === 0) {
        return (
            <FlatList
                data={[]}
                renderItem={() => null}
                ListHeaderComponent={() => (
                    <>
                        {listHeaderComponent}
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                            </View>
                            <Text style={styles.emptyTitle}>Aucune publication</Text>
                            <Text style={styles.emptySubtitle}>
                                Les photos et posts de {alterName} apparaîtront ici.
                            </Text>
                        </View>
                    </>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            />
        );
    }

    return (
        <FlatList
            data={posts}
            numColumns={3}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
                <>
                    {listHeaderComponent}
                    {/* Visual Tabs Strip */}
                    <View style={[styles.tabsStrip, themeColors && { backgroundColor: themeColors.backgroundCard, borderColor: themeColors.border }]}>
                        <TouchableOpacity style={[
                            styles.tabIcon,
                            styles.tabIconActive,
                            themeColors && { borderBottomColor: themeColors.primary || themeColors.text }
                        ]}>
                            <Ionicons name="grid" size={24} color={themeColors?.primary || themeColors?.text || colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tabIcon}>
                            <Ionicons name="person-circle-outline" size={26} color={themeColors?.textSecondary || colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </>
            )}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                />
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => router.push(`/post/${item.id}`)}
                >
                    {item.media_url ? (
                        <Image
                            source={{ uri: item.media_url }}
                            style={styles.gridImage}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View style={[styles.gridTextContent, themeColors && { backgroundColor: themeColors.backgroundCard }]}>
                            <Text style={[styles.gridText, themeColors && { color: themeColors.text }]} numberOfLines={3}>
                                {item.content}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: spacing.xxl,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: colors.textMuted,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        opacity: 0.5,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        maxWidth: 250,
    },
    tabsStrip: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        marginTop: spacing.sm,
    },
    tabIcon: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    tabIconActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.text,
    },
    gridItem: {
        width: width / 3,
        height: width / 3,
        borderWidth: 0.5,
        borderColor: colors.background,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridTextContent: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.surface,
        padding: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridText: {
        fontSize: 10,
        color: colors.text,
        textAlign: 'center',
    },
});
