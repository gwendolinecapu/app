import React from 'react';
import { Image } from 'expo-image';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Post } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { ThemeColors } from '../../lib/cosmetics';
import { GridMediaItem } from './GridMediaItem';

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
    alterId?: string; // Needed for fetching tagged posts
}


export const AlterGrid: React.FC<AlterGridProps> = ({
    posts,
    loading,
    refreshing,
    onRefresh,
    listHeaderComponent,
    alterName,
    themeColors,
    alterId
}) => {
    const [activeTab, setActiveTab] = React.useState<'grid' | 'tagged'>('grid');
    const [taggedPosts, setTaggedPosts] = React.useState<Post[]>([]);
    const [loadingTagged, setLoadingTagged] = React.useState(false);
    const [taggedLoaded, setTaggedLoaded] = React.useState(false);

    // Load tagged posts when tab changes
    React.useEffect(() => {
        if (activeTab === 'tagged' && !taggedLoaded && alterId) {
            loadTaggedPosts();
        }
    }, [activeTab, alterId]);

    const loadTaggedPosts = async () => {
        if (!alterId) return;
        setLoadingTagged(true);
        try {
            // Import dynamically or pass service? Better to import here since it's UI logic
            const { PostService } = require('../../services/posts');
            const result = await PostService.fetchTaggedPosts(alterId);
            setTaggedPosts(result.posts);
            setTaggedLoaded(true);
        } catch (error) {
            console.error("Failed to load tagged posts", error);
        } finally {
            setLoadingTagged(false);
        }
    };

    const displayPosts = activeTab === 'grid' ? posts : taggedPosts;
    const isListLoading = activeTab === 'grid' ? loading : loadingTagged;

    if (isListLoading && displayPosts.length === 0) {
        return (
            <FlatList
                key="skeleton-list"
                data={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                numColumns={3}
                keyExtractor={(item) => `skeleton-${item}`}
                ListHeaderComponent={() => (
                    <>
                        {listHeaderComponent}
                        <View style={[styles.tabsStrip, themeColors && { backgroundColor: themeColors.backgroundCard, borderColor: themeColors.border }]}>
                            <TouchableOpacity
                                style={[styles.tabIcon, activeTab === 'grid' && styles.tabIconActive, activeTab === 'grid' && themeColors && { borderBottomColor: themeColors.primary || themeColors.text }]}
                                onPress={() => setActiveTab('grid')}
                            >
                                <Ionicons name={activeTab === 'grid' ? "grid" : "grid-outline"} size={24} color={activeTab === 'grid' ? (themeColors?.primary || themeColors?.text || colors.text) : (themeColors?.textSecondary || colors.textMuted)} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabIcon, activeTab === 'tagged' && styles.tabIconActive, activeTab === 'tagged' && themeColors && { borderBottomColor: themeColors.primary || themeColors.text }]}
                                onPress={() => setActiveTab('tagged')}
                            >
                                <Ionicons name={activeTab === 'tagged' ? "person-circle" : "person-circle-outline"} size={26} color={activeTab === 'tagged' ? (themeColors?.primary || themeColors?.text || colors.text) : (themeColors?.textSecondary || colors.textMuted)} />
                            </TouchableOpacity>
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

    if (displayPosts.length === 0) {
        return (
            <FlatList
                key="empty-list"
                data={[]}
                renderItem={() => null}
                ListHeaderComponent={() => (
                    <>
                        {listHeaderComponent}
                        {/* Visual Tabs Strip */}
                        <View style={[styles.tabsStrip, themeColors && { backgroundColor: themeColors.backgroundCard, borderColor: themeColors.border }]}>
                            <TouchableOpacity
                                style={[styles.tabIcon, activeTab === 'grid' && styles.tabIconActive, activeTab === 'grid' && themeColors && { borderBottomColor: themeColors.primary || themeColors.text }]}
                                onPress={() => setActiveTab('grid')}
                            >
                                <Ionicons name={activeTab === 'grid' ? "grid" : "grid-outline"} size={24} color={activeTab === 'grid' ? (themeColors?.primary || themeColors?.text || colors.text) : (themeColors?.textSecondary || colors.textMuted)} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabIcon, activeTab === 'tagged' && styles.tabIconActive, activeTab === 'tagged' && themeColors && { borderBottomColor: themeColors.primary || themeColors.text }]}
                                onPress={() => setActiveTab('tagged')}
                            >
                                <Ionicons name={activeTab === 'tagged' ? "person-circle" : "person-circle-outline"} size={26} color={activeTab === 'tagged' ? (themeColors?.primary || themeColors?.text || colors.text) : (themeColors?.textSecondary || colors.textMuted)} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name={activeTab === 'grid' ? "camera-outline" : "pricetags-outline"} size={32} color={colors.textMuted} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {activeTab === 'grid' ? "Aucune publication" : "Aucun post identifié"}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'grid'
                                    ? `Les photos et posts de ${alterName} apparaîtront ici.`
                                    : `Les photos où ${alterName} est identifié apparaîtront ici.`
                                }
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
            key={activeTab}
            data={displayPosts}
            numColumns={3}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
                <>
                    {listHeaderComponent}
                    {/* Visual Tabs Strip */}
                    <View style={[styles.tabsStrip, themeColors && { backgroundColor: themeColors.backgroundCard, borderColor: themeColors.border }]}>
                        <TouchableOpacity style={[
                            styles.tabIcon,
                            activeTab === 'grid' && styles.tabIconActive,
                            activeTab === 'grid' && themeColors && { borderBottomColor: themeColors.primary || themeColors.text }
                        ]}
                            onPress={() => setActiveTab('grid')}
                        >
                            <Ionicons name={activeTab === 'grid' ? "grid" : "grid-outline"} size={24} color={activeTab === 'grid' ? (themeColors?.primary || themeColors?.text || colors.text) : (themeColors?.textSecondary || colors.textMuted)} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[
                            styles.tabIcon,
                            activeTab === 'tagged' && styles.tabIconActive,
                            activeTab === 'tagged' && themeColors && { borderBottomColor: themeColors.primary || themeColors.text }
                        ]}
                            onPress={() => setActiveTab('tagged')}
                        >
                            <Ionicons name={activeTab === 'tagged' ? "person-circle" : "person-circle-outline"} size={26} color={activeTab === 'tagged' ? (themeColors?.primary || themeColors?.text || colors.text) : (themeColors?.textSecondary || colors.textMuted)} />
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
                    onPress={() => {
                        const isVideo = item.media_url && (
                            item.media_url.endsWith('.mp4') ||
                            item.media_url.endsWith('.mov') ||
                            item.media_url.endsWith('.avi') ||
                            item.media_url.endsWith('.webm')
                        );

                        // Pass context for scrolling logic
                        // Only for grid view (authored posts)
                        const contextParams = activeTab === 'grid' && alterId
                            ? `?context=alter&contextId=${alterId}`
                            : '';

                        if (isVideo) {
                            router.push(`/post/video/${item.id}${contextParams}` as any);
                        } else {
                            router.push(`/post/${item.id}${contextParams}`);
                        }
                    }}
                >
                    {item.media_url ? (
                        <GridMediaItem
                            mediaUrl={item.media_url}
                            themeColors={themeColors}
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
