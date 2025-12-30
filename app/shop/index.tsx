import React, { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Dimensions,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
    FlatList,
    Image,
    StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { ShopItem } from '../../src/services/MonetizationTypes';
import { SHOP_ITEMS } from '../../src/services/ShopData';
import Constants from 'expo-constants';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Types for shop categories
type ShopCategory = 'themes' | 'frames' | 'bubbles' | 'inventory';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SPACING = spacing.md;
const ITEM_WIDTH = (width - spacing.md * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

// ==================== ANIMATIONS ====================

const AnimatedTouchable = ({ onPress, children, style, disabled }: { onPress: () => void, children: ReactNode, style?: any, disabled?: boolean }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
        >
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ==================== COMPONENTS ====================

const PremiumBanner = ({ onPress }: { onPress: () => void }) => (
    <AnimatedTouchable onPress={onPress} style={styles.premiumBannerContainer}>
        <LinearGradient
            colors={['#6366f1', '#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumBanner}
        >
            <View style={styles.premiumContent}>
                <View style={styles.premiumTextContainer}>
                    <Text style={styles.premiumTitle}>Plural Premium ✨</Text>
                    <Text style={styles.premiumSubtitle}>Débloquez tout l'univers.</Text>
                </View>
                <View style={styles.premiumButton}>
                    <Text style={styles.premiumButtonText}>Voir l'offre</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6366f1" />
                </View>
            </View>
            <View style={styles.premiumShine} />
        </LinearGradient>
    </AnimatedTouchable>
);

const AdRewardCard = ({ onPress, loading, disabled }: { onPress: () => void, loading: boolean, disabled: boolean }) => (
    <AnimatedTouchable onPress={onPress} disabled={disabled} style={[styles.adCard, disabled && { opacity: 0.6 }]}>
        <LinearGradient
            colors={['#1f2937', '#111827']}
            style={styles.adGradient}
        >
            <View style={styles.adContent}>
                <View style={styles.adIconContainer}>
                    <Ionicons name={loading ? "hourglass" : "play-circle"} size={28} color="#fbbf24" />
                </View>
                <View style={styles.adTextContainer}>
                    <Text style={styles.adTitle}>Crédits Gratuits</Text>
                    <Text style={styles.adSubtitle}>Regarder une pub (+50 <Ionicons name="star" size={10} color="#fbbf24" />)</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
        </LinearGradient>
    </AnimatedTouchable>
);

const CategoryTabs = ({ activeCategory, onSelect, counts }: { activeCategory: ShopCategory, onSelect: (c: ShopCategory) => void, counts?: any }) => {
    const categories: { id: ShopCategory, label: string, icon: string }[] = [
        { id: 'themes', label: 'Thèmes', icon: 'color-palette' },
        { id: 'frames', label: 'Cadres', icon: 'image' },
        { id: 'bubbles', label: 'Bulles', icon: 'chatbubble' },
        { id: 'inventory', label: 'Moi', icon: 'person' },
    ];

    return (
        <View style={styles.tabsContainer}>
            <FlatList
                horizontal
                data={categories}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContent}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                    const isActive = activeCategory === item.id;
                    return (
                        <TouchableOpacity
                            onPress={() => onSelect(item.id)}
                            style={[styles.tabItem, isActive && styles.tabItemActive]}
                        >
                            <Ionicons name={item.icon as any} size={16} color={isActive ? '#FFF' : '#9ca3af'} />
                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

const ShopItemCard = ({ item, isOwned, isEquipped, isLocked, userCredits, onAction }: {
    item: ShopItem,
    isOwned: boolean,
    isEquipped: boolean,
    isLocked: boolean,
    userCredits: number,
    onAction: (item: ShopItem) => void
}) => {
    const canAfford = userCredits >= (item.priceCredits || 0);

    const getPreview = () => {
        if (item.preview?.startsWith('#')) {
            return <View style={[styles.colorPreview, { backgroundColor: item.preview }]} />;
        }
        return <Text style={styles.emojiPreview}>{item.preview}</Text>;
    };

    return (
        <AnimatedTouchable onPress={() => onAction(item)} style={styles.cardContainer}>
            <View style={styles.cardPreviewContainer}>
                {getPreview()}
                {isEquipped && (
                    <View style={styles.equippedIndicator}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    </View>
                )}
            </View>

            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>

                <View style={styles.cardFooter}>
                    {isOwned ? (
                        <View style={[styles.statusBadge, isEquipped ? styles.statusEquipped : styles.statusOwned]}>
                            <Text style={styles.statusText}>{isEquipped ? 'Équipé' : 'Possédé'}</Text>
                        </View>
                    ) : item.isPremium ? (
                        <View style={[styles.priceTag, !isLocked && styles.priceTagUnlocked]}>
                            <Ionicons name="diamond" size={12} color={!isLocked ? "#FFF" : "#ec4899"} />
                            <Text style={[styles.priceText, !isLocked && { color: '#FFF' }]}>{!isLocked ? 'Inclus' : 'Premium'}</Text>
                        </View>
                    ) : (
                        <View style={[styles.priceTag, !canAfford && styles.priceTagDisabled]}>
                            <Ionicons name="star" size={12} color={canAfford ? "#fbbf24" : "#6b7280"} />
                            <Text style={[styles.priceText, !canAfford && { color: "#6b7280" }]}>{item.priceCredits}</Text>
                        </View>
                    )}
                </View>
            </View>
        </AnimatedTouchable>
    );
};

// ==================== MAIN SCREEN ====================

export default function ShopScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        credits,
        isPremium,
        purchaseItem,
        presentPaywall,
        loading,
        watchRewardAd,
        equipDecoration,
        getEquippedDecorationId
    } = useMonetization();
    const { currentAlter } = useAuth();

    // Create a local state that defaults to existing Shop Items if loading
    const [items] = useState(SHOP_ITEMS);

    const [activeCategory, setActiveCategory] = useState<ShopCategory>('themes');
    const [adLoading, setAdLoading] = useState(false);

    // Re-render when category changes or ownership changes
    const [filteredItems, setFilteredItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        const updateItems = () => {
            if (activeCategory === 'inventory') {
                if (!currentAlter?.owned_items?.length) {
                    setFilteredItems([]);
                    return;
                }
                const allDocs = [...items.themes, ...items.frames, ...items.bubbles];
                setFilteredItems(allDocs.filter(i => currentAlter.owned_items?.includes(i.id)));
            } else {
                setFilteredItems(items[activeCategory] || []);
            }
        };
        updateItems();
    }, [activeCategory, items, currentAlter?.owned_items]);

    const handleCategorySelect = (category: ShopCategory) => {
        if (activeCategory !== category) {
            triggerHaptic.selection();
            setActiveCategory(category);
        }
    };

    const handleAction = async (item: ShopItem) => {
        triggerHaptic.selection();

        if (!currentAlter) {
            Alert.alert("Mode Système", "Veuillez sélectionner un alter pour gérer les objets.");
            return;
        }

        const isOwned = currentAlter.owned_items?.includes(item.id);

        if (isOwned) {
            // Equip Logic
            const slotMap: Record<string, 'frame' | 'theme' | 'bubble'> = {
                'frame': 'frame', 'theme': 'theme', 'bubble': 'bubble'
            };
            const slot = slotMap[item.type];
            if (!slot) return;

            const isEquipped = getEquippedDecorationId(currentAlter, slot) === item.id;

            if (isEquipped) {
                Alert.alert("Déjà équipé", "Cet objet est déjà actif sur votre profil.");
                return;
            }

            Alert.alert(
                "Équiper l'objet ?",
                `Voulez-vous utiliser ${item.name} ?`,
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Équiper",
                        onPress: async () => {
                            const success = await equipDecoration(currentAlter.id, item.id, slot);
                            if (success) {
                                triggerHaptic.success();
                            } else {
                                triggerHaptic.error();
                            }
                        }
                    }
                ]
            );
        } else {
            // Purchase Logic
            if (item.isPremium && !isPremium) {
                presentPaywall();
                return;
            }

            if ((item.priceCredits || 0) > credits) {
                Alert.alert("Pas assez de crédits", "Regardez une publicité pour en gagner plus !");
                return;
            }

            Alert.alert(
                "Confirmer l'achat",
                `Acheter ${item.name} pour ${item.priceCredits} crédits ?`,
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Acheter",
                        onPress: async () => {
                            const success = await purchaseItem(item, currentAlter.id);
                            if (success) {
                                triggerHaptic.success();
                                Alert.alert("Félicitations ! 🎉", `Vous possédez maintenant ${item.name}.`);
                            } else {
                                triggerHaptic.error();
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleWatchAd = async () => {
        if (!currentAlter) return;
        setAdLoading(true);
        try {
            await watchRewardAd(currentAlter.id);
        } finally {
            setAdLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <PremiumBanner onPress={presentPaywall} />
            <View style={styles.creditsBar}>
                <Text style={styles.sectionTitle}>
                    {activeCategory === 'inventory' ? `Inventaire de ${currentAlter?.name || 'Système'}` : 'Boutique'}
                </Text>
                <View style={styles.creditsBubble}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.creditsText}>{credits}</Text>
                </View>
            </View>
            <CategoryTabs activeCategory={activeCategory} onSelect={handleCategorySelect} />
        </View>
    );

    const renderFooter = () => (
        <View style={styles.listFooter}>
            <AdRewardCard onPress={handleWatchAd} loading={adLoading} disabled={adLoading || !currentAlter} />
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🕸️</Text>
            <Text style={styles.emptyText}>Rien à voir ici pour l'instant.</Text>
            {activeCategory === 'inventory' && (
                <TouchableOpacity onPress={() => handleCategorySelect('themes')} style={styles.emptyButton}>
                    <Text style={styles.emptyButtonText}>Aller à la boutique</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Custom Header Bar */}
            <View style={[styles.topBar, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Boutique</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                renderItem={({ item }) => {
                    const isOwned = currentAlter?.owned_items?.includes(item.id) || false;

                    // Check equipped status safely
                    let isEquipped = false;
                    if (isOwned && currentAlter) {
                        if (item.type === 'frame') isEquipped = currentAlter.avatar_frame === item.id;
                        if (item.type === 'theme') isEquipped = currentAlter.themeId === item.id;
                        if (item.type === 'bubble') isEquipped = currentAlter.bubbleStyle === item.id;
                    }

                    const isLocked = item.isPremium && !isPremium && !isOwned;

                    return (
                        <ShopItemCard
                            item={item}
                            isOwned={isOwned}
                            isEquipped={isEquipped}
                            isLocked={isLocked}
                            userCredits={credits}
                            onAction={handleAction}
                        />
                    );
                }}
                columnWrapperStyle={styles.columnWrapper}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Slate 900
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: '#0f172a',
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        ...typography.h3,
        color: '#FFF',
    },
    headerContainer: {
        marginBottom: spacing.md,
    },
    listContent: {
        paddingHorizontal: spacing.md,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    listFooter: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    // Premium Banner
    premiumBannerContainer: {
        marginBottom: spacing.lg,
        borderRadius: borderRadius.xl,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    premiumBanner: {
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        position: 'relative',
        overflow: 'hidden',
    },
    premiumContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1,
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumTitle: {
        ...typography.h2,
        color: '#FFF',
        fontSize: 20,
        marginBottom: 4,
    },
    premiumSubtitle: {
        ...typography.body,
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
    },
    premiumButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    premiumButtonText: {
        ...typography.caption,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    premiumShine: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    // Sections & Credits
    creditsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: '#FFF',
        fontSize: 18,
    },
    creditsBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    creditsText: {
        ...typography.body,
        fontWeight: 'bold',
        color: '#fbbf24',
    },
    // Tabs
    tabsContainer: {
        marginBottom: spacing.md,
    },
    tabsContent: {

    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: spacing.sm,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    tabItemActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)', // Indigo tint
        borderColor: '#6366f1',
    },
    tabText: {
        ...typography.caption,
        fontWeight: '600',
        color: '#9ca3af',
    },
    tabTextActive: {
        color: '#FFF',
    },
    // Item Card
    cardContainer: {
        width: ITEM_WIDTH,
        backgroundColor: '#1e293b', // Slate 800
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardPreviewContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    colorPreview: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    emojiPreview: {
        fontSize: 40,
    },
    equippedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    cardInfo: {
        padding: spacing.sm,
    },
    cardTitle: {
        ...typography.body,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 13,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    priceTagUnlocked: {
        backgroundColor: '#10b981', // Emerald
    },
    priceTagDisabled: {
        opacity: 0.5,
    },
    priceText: {
        ...typography.caption,
        fontWeight: 'bold',
        color: '#fbbf24',
        fontSize: 11,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusOwned: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
    },
    statusEquipped: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusText: {
        ...typography.caption,
        fontWeight: 'bold',
        color: '#a5b4fc',
        fontSize: 11,
    },
    // Ad Card
    adCard: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    adGradient: {
        padding: spacing.md,
    },
    adContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    adIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adTextContainer: {
        flex: 1,
    },
    adTitle: {
        ...typography.h4,
        color: '#FFF',
        fontSize: 15,
        marginBottom: 2,
    },
    adSubtitle: {
        ...typography.caption,
        color: '#9ca3af',
    },
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    emptyButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#6366f1',
        borderRadius: 20,
    },
    emptyButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
