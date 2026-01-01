import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { AdRewardCard } from './AdRewardCard';
import { DailyRewardCard } from './DailyRewardCard';
import { ShopItemCard } from './ShopItemCard';
import { FeaturedCarousel } from './FeaturedCarousel';
import { ShopItemModal } from './ShopItemModal';
import { ShopItem } from '../../services/MonetizationTypes';

// Dimensions
const { width } = Dimensions.get('window');

// Categories (products only - inventory is in header)
const CATEGORIES = [
    { id: 'themes', label: 'Thèmes', icon: 'color-palette-outline' },
    { id: 'frames', label: 'Cadres', icon: 'scan-outline' },
    { id: 'bubbles', label: 'Bulles', icon: 'chatbubble-outline' },
];

// Sort options
const SORT_OPTIONS = [
    { id: 'default', label: 'Par défaut' },
    { id: 'price_asc', label: 'Prix ↑' },
    { id: 'price_desc', label: 'Prix ↓' },
    { id: 'name', label: 'A-Z' },
];

// Filter options
const FILTER_OPTIONS = [
    { id: 'all', label: 'Tous' },
    { id: 'free', label: 'Gratuits' },
    { id: 'affordable', label: 'Accessibles' },
    { id: 'premium', label: 'Premium' },
];

interface ShopUIProps {
    isEmbedded?: boolean;
}

export function ShopUI({ isEmbedded = false }: ShopUIProps) {
    const router = useRouter();
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const {
        credits,
        shopItems,
        purchaseItem,
        getEquippedDecorationId,
        equipDecoration,
        loading,
        refresh,
        isPremium,
    } = useMonetization();
    const { user, alters } = useAuth();

    // State
    const [selectedCategory, setSelectedCategory] = useState('themes');
    const [sortBy, setSortBy] = useState('default');
    const [filterBy, setFilterBy] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showInventory, setShowInventory] = useState(false); // Toggle inventory view

    // Owned items - persisted in AsyncStorage + synced with purchases
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [equippedItems, setEquippedItems] = useState<{ frame?: string, theme?: string, bubble?: string }>({});

    // Modal state
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Load owned items from user data on mount
    useEffect(() => {
        refresh();
        loadOwnedItems();
    }, [alterId]); // Re-load when alterId changes

    // Load owned items from Firestore alters collection
    const loadOwnedItems = useCallback(async () => {
        try {
            const owned: string[] = [];

            // Add default free items - always owned
            const freeItems = shopItems.filter(item => (item.priceCredits || 0) === 0);
            freeItems.forEach(item => owned.push(item.id));

            // Fetch owned items from Firestore if alterId is available
            if (alterId) {
                const currentAlter = alters?.find((a: any) => a.id === alterId) as any;

                // Read owned_items from the alter document (this is where DecorationService saves)
                if (currentAlter?.owned_items && Array.isArray(currentAlter.owned_items)) {
                    currentAlter.owned_items.forEach((itemId: string) => {
                        if (!owned.includes(itemId)) {
                            owned.push(itemId);
                        }
                    });
                }

                // Read equipped items from equipped_items field
                if (currentAlter?.equipped_items) {
                    setEquippedItems({
                        frame: currentAlter.equipped_items.frame,
                        theme: currentAlter.equipped_items.theme,
                        bubble: currentAlter.equipped_items.bubble,
                    });
                }
            }

            setOwnedItems(owned);
        } catch (error) {
            console.error('[ShopUI] Error loading owned items:', error);
        }
    }, [shopItems, user, alterId, alters]);

    // Filter and sort items
    const getFilteredItems = useCallback(() => {
        let items = [...shopItems];

        // If showing inventory, filter to only owned items
        if (showInventory) {
            items = items.filter(item => ownedItems.includes(item.id));
            // Still respect sort
            if (sortBy === 'price_asc') {
                items.sort((a, b) => (a.priceCredits || 0) - (b.priceCredits || 0));
            } else if (sortBy === 'price_desc') {
                items.sort((a, b) => (b.priceCredits || 0) - (a.priceCredits || 0));
            } else if (sortBy === 'name') {
                items.sort((a, b) => a.name.localeCompare(b.name));
            }
            return items;
        }

        // Filter by category (shop mode)
        if (selectedCategory === 'themes') {
            items = items.filter(item => item.type === 'theme');
        } else if (selectedCategory === 'frames') {
            items = items.filter(item => item.type === 'frame');
        } else if (selectedCategory === 'bubbles') {
            items = items.filter(item => item.type === 'bubble');
        }

        // Apply filter
        if (filterBy === 'free') {
            items = items.filter(item => (item.priceCredits || 0) === 0);
        } else if (filterBy === 'affordable') {
            items = items.filter(item => (item.priceCredits || 0) <= credits);
        } else if (filterBy === 'premium') {
            items = items.filter(item => item.isPremium);
        }

        // Apply sort
        if (sortBy === 'price_asc') {
            items.sort((a, b) => (a.priceCredits || 0) - (b.priceCredits || 0));
        } else if (sortBy === 'price_desc') {
            items.sort((a, b) => (b.priceCredits || 0) - (a.priceCredits || 0));
        } else if (sortBy === 'name') {
            items.sort((a, b) => a.name.localeCompare(b.name));
        }

        return items;
    }, [shopItems, selectedCategory, filterBy, sortBy, credits, ownedItems, showInventory]);

    const filteredItems = getFilteredItems();

    // Handle item click - open modal
    const handleItemPress = (item: ShopItem) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    // Handle purchase with confirmation (from modal)
    const handlePurchase = async (item: ShopItem): Promise<boolean> => {
        try {
            const success = await purchaseItem(item, alterId);
            if (success) {
                Alert.alert('✨ Succès !', `Vous avez acquis : ${item.name}`);
                setOwnedItems(prev => [...prev, item.id]);
                return true;
            } else {
                Alert.alert('❌ Erreur', 'Pas assez de crédits ou une erreur est survenue.');
                return false;
            }
        } catch (error) {
            Alert.alert('❌ Erreur', 'Impossible de procéder à l\'achat.');
            return false;
        }
    };

    // Handle equip
    const handleEquip = async (item: ShopItem): Promise<void> => {
        if (!alterId) {
            Alert.alert('Info', 'Sélectionnez d\'abord un alter pour équiper cet item.');
            return;
        }

        try {
            const typeMap: Record<string, 'frame' | 'theme' | 'bubble'> = {
                'theme': 'theme',
                'frame': 'frame',
                'bubble': 'bubble'
            };
            const decorationType = typeMap[item.type];
            if (decorationType) {
                await equipDecoration(alterId, item.id, decorationType);
                setEquippedItems(prev => ({ ...prev, [decorationType]: item.id }));
                Alert.alert('✅ Équipé !', `${item.name} est maintenant équipé.`);
            }
        } catch (e) {
            Alert.alert('❌ Erreur', 'Impossible d\'équiper cet item.');
        }
    };

    // Check ownership
    const isOwned = (itemId: string) => ownedItems.includes(itemId);
    const isEquipped = (itemId: string, type: string) => equippedItems[type as keyof typeof equippedItems] === itemId;

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Chargement de la boutique...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: isEmbedded ? spacing.sm : 60 }]}>
                <View style={styles.headerTop}>
                    {!isEmbedded && (
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Boutique</Text>
                        <Text style={styles.headerSubtitle}>Personnalise ton espace</Text>
                    </View>

                    {/* Inventory Button */}
                    <TouchableOpacity
                        style={[styles.inventoryButton, showInventory && styles.inventoryButtonActive]}
                        onPress={() => setShowInventory(!showInventory)}
                    >
                        <Ionicons name="briefcase" size={18} color={showInventory ? '#FFF' : colors.text} />
                        {ownedItems.length > 0 && (
                            <View style={styles.inventoryBadge}>
                                <Text style={styles.inventoryBadgeText}>{ownedItems.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Credits Badge */}
                    <View style={styles.creditsBadge}>
                        <Ionicons name="diamond" size={16} color={colors.secondary} />
                        <Text style={styles.creditsText}>{credits}</Text>
                        <TouchableOpacity style={styles.addCreditsBtn} onPress={() => router.push('/premium')}>
                            <Ionicons name="add" size={12} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.categoriesContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContent}
                    >
                        {CATEGORIES.map(cat => {
                            const isActive = selectedCategory === cat.id;
                            const inventoryCount = cat.id === 'inventory' ? ownedItems.length : 0;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={16}
                                        color={isActive ? '#FFF' : colors.textSecondary}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                        {cat.label}
                                    </Text>
                                    {cat.id === 'inventory' && inventoryCount > 0 && (
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryBadgeText}>{inventoryCount}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Filters & Sort */}
                {selectedCategory !== 'inventory' && (
                    <View style={styles.filtersRow}>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <Ionicons name="options-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.filterButtonText}>Filtres</Text>
                        </TouchableOpacity>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.sortOptions}
                        >
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.sortPill, sortBy === opt.id && styles.sortPillActive]}
                                    onPress={() => setSortBy(opt.id)}
                                >
                                    <Text style={[
                                        styles.sortPillText,
                                        sortBy === opt.id && styles.sortPillTextActive
                                    ]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Filter options dropdown */}
                {showFilters && selectedCategory !== 'inventory' && (
                    <View style={styles.filterDropdown}>
                        {FILTER_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.filterOption, filterBy === opt.id && styles.filterOptionActive]}
                                onPress={() => {
                                    setFilterBy(opt.id);
                                    setShowFilters(false);
                                }}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    filterBy === opt.id && styles.filterOptionTextActive
                                ]}>
                                    {opt.label}
                                </Text>
                                {filterBy === opt.id && (
                                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Featured Carousel - only show on main categories */}
                {selectedCategory !== 'inventory' && (
                    <FeaturedCarousel
                        onItemPress={handleItemPress}
                        userCredits={credits}
                    />
                )}

                {/* Rewards Section - show on all categories except inventory */}
                {selectedCategory !== 'inventory' && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>🎁 Récompenses</Text>
                        <DailyRewardCard alterId={alterId} />
                        <AdRewardCard alterId={alterId} />
                    </View>
                )}

                {/* Premium Banner */}
                {!isPremium && selectedCategory === 'themes' && (
                    <TouchableOpacity
                        style={styles.premiumBanner}
                        onPress={() => router.push('/premium')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#4C1D95', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumGradient}
                        >
                            <View style={styles.premiumContent}>
                                <View style={styles.premiumIconCircle}>
                                    <Ionicons name="star" size={24} color="#FFD700" />
                                </View>
                                <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
                                    <Text style={styles.premiumTitle}>Plural Premium</Text>
                                    <Text style={styles.premiumDesc}>Accès illimité à toute la boutique + sans pubs</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#FFF" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Results count */}
                <View style={styles.resultInfo}>
                    <Text style={styles.resultCount}>
                        {filteredItems.length} article{filteredItems.length > 1 ? 's' : ''}
                        {selectedCategory === 'inventory' ? ' dans ton inventaire' : ''}
                    </Text>
                </View>

                {/* Grid Content */}
                <View style={styles.gridContainer}>
                    {filteredItems.length > 0 ? (
                        <View style={styles.grid}>
                            {filteredItems.map(item => (
                                <ShopItemCard
                                    key={item.id}
                                    item={item}
                                    userCredits={credits}
                                    isOwned={isOwned(item.id)}
                                    isEquipped={isEquipped(item.id, item.type)}
                                    onPress={handleItemPress}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name={selectedCategory === 'inventory' ? "basket-outline" : "search-outline"}
                                size={48}
                                color={colors.textMuted}
                            />
                            <Text style={styles.emptyTitle}>
                                {selectedCategory === 'inventory'
                                    ? 'Ton inventaire est vide'
                                    : 'Aucun article trouvé'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {selectedCategory === 'inventory'
                                    ? 'Achète des items dans la boutique pour les voir ici !'
                                    : 'Essaie de modifier les filtres'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Item Detail Modal */}
            <ShopItemModal
                visible={modalVisible}
                item={selectedItem}
                userCredits={credits}
                isOwned={selectedItem ? isOwned(selectedItem.id) : false}
                isEquipped={selectedItem ? isEquipped(selectedItem.id, selectedItem.type) : false}
                isPremiumUser={isPremium}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedItem(null);
                }}
                onPurchase={handlePurchase}
                onEquip={handleEquip}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
    },
    header: {
        backgroundColor: colors.surface,
        paddingBottom: spacing.sm,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    backButton: {
        marginRight: spacing.md,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 6,
    },
    creditsText: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 14,
    },
    addCreditsBtn: {
        backgroundColor: colors.primary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inventoryButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        position: 'relative' as const,
    },
    inventoryButtonActive: {
        backgroundColor: colors.primary,
    },
    inventoryBadge: {
        position: 'absolute' as const,
        top: -2,
        right: -2,
        backgroundColor: colors.success,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    inventoryBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold' as const,
    },
    categoriesContainer: {
        paddingTop: spacing.xs,
    },
    categoriesContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
    },
    categoryBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    filtersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        gap: spacing.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: borderRadius.md,
        gap: 4,
    },
    filterButtonText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    sortOptions: {
        gap: spacing.xs,
    },
    sortPill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: borderRadius.md,
        backgroundColor: 'transparent',
    },
    sortPillActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    sortPillText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    sortPillTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    filterDropdown: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    filterOptionActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    filterOptionText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    filterOptionTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    scrollContent: {
        padding: spacing.lg,
    },
    sectionContainer: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    premiumBanner: {
        marginBottom: spacing.xl,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    premiumGradient: {
        padding: spacing.md,
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    premiumIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    premiumDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    resultInfo: {
        marginBottom: spacing.sm,
    },
    resultCount: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    gridContainer: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl * 2,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginTop: spacing.md,
    },
    emptyText: {
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    }
});
