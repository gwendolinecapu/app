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
    StatusBar,
    Easing
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

// ==================== HELPERS ====================

const getItemIconInfo = (item: ShopItem): { name: keyof typeof Ionicons.glyphMap, color: string } => {
    // Mapping item IDs to Icons for a better look than emojis
    const id = item.id;

    // Frames
    if (id.includes('leaves') || id.includes('floral')) return { name: 'leaf', color: '#4ade80' };
    if (id.includes('flames')) return { name: 'flame', color: '#f87171' };
    if (id.includes('neon')) return { name: 'flash', color: '#facc15' };
    if (id.includes('glitch')) return { name: 'code-slash', color: '#a78bfa' };
    if (id.includes('crown')) return { name: 'trophy', color: '#fbbf24' };
    if (id.includes('circuit')) return { name: 'hardware-chip', color: '#60a5fa' };
    if (id.includes('stars')) return { name: 'star', color: '#fbbf24' };
    if (id.includes('vintage')) return { name: 'film', color: '#d1d5db' };
    if (id.includes('water')) return { name: 'water', color: '#38bdf8' };
    if (id.includes('ice')) return { name: 'snow', color: '#a5f3fc' };
    if (id.includes('gold')) return { name: 'medal', color: '#fbbf24' };
    if (id.includes('rainbow')) return { name: 'color-palette', color: '#c084fc' };

    // Bubbles
    if (id.includes('cloud')) return { name: 'cloud', color: '#e5e7eb' };
    if (id.includes('comic')) return { name: 'chatbubble', color: '#fbbf24' };
    if (id.includes('pixel')) return { name: 'grid', color: '#a5b4fc' };
    if (id.includes('terminal')) return { name: 'terminal', color: '#4ade80' };
    if (id.includes('heart')) return { name: 'heart', color: '#f43f5e' };
    if (id.includes('star')) return { name: 'star', color: '#fbbf24' };
    if (id.includes('glass')) return { name: 'prism', color: '#a5f3fc' };
    if (id.includes('paper')) return { name: 'document-text', color: '#fca5a5' };
    if (id.includes('wood')) return { name: 'leaf', color: '#d97706' };
    if (id.includes('stone')) return { name: 'ellipse', color: '#9ca3af' };
    if (id.includes('gradient')) return { name: 'color-filter', color: '#c084fc' };
    if (id.includes('thought')) return { name: 'cloud-circle', color: '#e5e7eb' };

    // Defaults based on type
    if (item.type === 'frame') return { name: 'scan-outline', color: '#94a3b8' };
    if (item.type === 'bubble') return { name: 'chatbubble-ellipses-outline', color: '#94a3b8' };
    if (item.type === 'theme') {
        const previewColor = item.preview && item.preview.startsWith('#') ? item.preview : '#94a3b8';
        return { name: 'color-wand', color: previewColor };
    }

    return { name: 'cube-outline', color: '#94a3b8' };
};

// ==================== ANIMATIONS ====================

const AnimatedTouchable = ({ onPress, children, style, disabled }: { onPress: () => void, children: ReactNode, style?: any, disabled?: boolean }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
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

// Wrapper that fades in elements when they mount
const FadeInView = ({ children, delay = 0, style }: { children: ReactNode, delay?: number, style?: any }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 500,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            })
        ]).start();
    }, [delay]);

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
};

// ==================== COMPONENTS ====================

const ItemPreview = ({ item }: { item: ShopItem }) => {
    // Special rendering for Themes (Color Circles)
    if (item.type === 'theme' && item.preview && item.preview.startsWith('#')) {
        return (
            <View style={[styles.previewBase, styles.themePreviewBase]}>
                <View style={[styles.themeCircle, { backgroundColor: item.preview }]} />
            </View>
        );
    }

    // Special rendering for Frames (Border Styles)
    if (item.type === 'frame') {
        let frameStyle: any = { borderWidth: 2, borderColor: '#fff' };
        if (item.id.includes('basic')) frameStyle = { borderWidth: 1, borderColor: '#cbd5e1' };
        if (item.id.includes('double')) frameStyle = { borderWidth: 4, borderColor: '#fff', borderStyle: 'solid' };
        if (item.id.includes('dashed')) frameStyle = { borderWidth: 2, borderColor: '#fff', borderStyle: 'dashed' };
        if (item.id.includes('neon')) frameStyle = { borderWidth: 2, borderColor: '#0ff', shadowColor: '#0ff', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 };
        if (item.id.includes('gold')) frameStyle = { borderWidth: 2, borderColor: '#ffd700' };
        if (item.id.includes('square')) frameStyle = { borderWidth: 2, borderColor: '#fff', borderRadius: 8 };

        // If simple geometric frame, render CSS shape
        if (['frame_basic', 'frame_double', 'frame_dashed', 'frame_square', 'frame_neon', 'frame_gold'].includes(item.id)) {
            return (
                <View style={styles.previewBase}>
                    <View style={[styles.framePreview, frameStyle]} />
                </View>
            );
        }
    }

    // Default to Icon lookup for complex frames and bubbles
    const iconInfo = getItemIconInfo(item);
    return (
        <View style={styles.previewBase}>
            <Ionicons name={iconInfo.name} size={40} color={iconInfo.color} />
        </View>
    );
};

const PremiumBanner = ({ onPress }: { onPress: () => void }) => (
    <AnimatedTouchable onPress={onPress}>
        <BlurView intensity={20} tint="light" style={styles.premiumBannerBlur}>
            <LinearGradient
                colors={['rgba(99, 102, 241, 0.8)', 'rgba(168, 85, 247, 0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBanner}
            >
                <View style={styles.premiumContent}>
                    <View style={styles.premiumIconCircle}>
                        <Ionicons name="sparkles" size={24} color="#FFF" />
                    </View>
                    <View style={styles.premiumTextContainer}>
                        <Text style={styles.premiumTitle}>Plural Premium</Text>
                        <Text style={styles.premiumSubtitle}>Accès illimité à toute la boutique</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                </View>
            </LinearGradient>
        </BlurView>
    </AnimatedTouchable>
);

const AdRewardCard = ({ onPress, loading, disabled }: { onPress: () => void, loading: boolean, disabled: boolean }) => (
    <AnimatedTouchable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.6 : 1 }}>
        <LinearGradient
            colors={['#1e293b', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.adCard}
        >
            <View style={styles.adContent}>
                <View style={[styles.adIconContainer, loading && styles.adIconLoading]}>
                    <Ionicons name={loading ? "hourglass-outline" : "gift-outline"} size={22} color="#fbbf24" />
                </View>
                <View style={styles.adTextContainer}>
                    <Text style={styles.adTitle}>Crédits Gratuits</Text>
                    <Text style={styles.adSubtitle}>+50 crédits instantanés</Text>
                </View>
                <Ionicons name="play-circle" size={24} color="#fbbf24" />
            </View>
        </LinearGradient>
    </AnimatedTouchable>
);

const CategoryTabs = ({ activeCategory, onSelect }: { activeCategory: ShopCategory, onSelect: (c: ShopCategory) => void }) => {
    const categories: { id: ShopCategory, label: string }[] = [
        { id: 'themes', label: 'Thèmes' },
        { id: 'frames', label: 'Cadres' },
        { id: 'bubbles', label: 'Bulles' },
        { id: 'inventory', label: 'Inventaire' },
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
                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

const ShopItemCard = ({ item, isOwned, isEquipped, isLocked, userCredits, onAction, index }: {
    item: ShopItem,
    isOwned: boolean,
    isEquipped: boolean,
    isLocked: boolean,
    userCredits: number,
    onAction: (item: ShopItem) => void,
    index: number
}) => {
    const canAfford = userCredits >= (item.priceCredits || 0);

    return (
        <FadeInView delay={index * 50}>
            <AnimatedTouchable onPress={() => onAction(item)} style={styles.cardContainer}>
                <View style={styles.cardPreviewContainer}>
                    <ItemPreview item={item} />

                    {isEquipped && (
                        <View style={styles.equippedBadge}>
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                            <Text style={styles.equippedText}>ACTIF</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>

                    <View style={styles.cardActionRow}>
                        {isOwned ? (
                            <Text style={styles.labelOwned}>{isEquipped ? 'Équipé' : 'Possédé'}</Text>
                        ) : item.isPremium ? (
                            <View style={styles.priceRow}>
                                <Ionicons name="diamond" size={12} color={isLocked ? "#db2777" : "#10b981"} />
                                <Text style={[styles.priceText, { color: isLocked ? "#db2777" : "#10b981" }]}>
                                    {isLocked ? 'Premium' : 'Inclus'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.priceRow}>
                                <Ionicons name="star" size={12} color={canAfford ? "#fbbf24" : "#64748b"} />
                                <Text style={[styles.priceText, { color: canAfford ? "#fbbf24" : "#64748b" }]}>
                                    {item.priceCredits}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Overlay for Locked Items */}
                {isLocked && (
                    <View style={styles.lockedOverlay}>
                        <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                )}
            </AnimatedTouchable>
        </FadeInView>
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
        watchRewardAd,
        equipDecoration,
        getEquippedDecorationId
    } = useMonetization();
    const { currentAlter } = useAuth();

    const [items] = useState(SHOP_ITEMS);
    const [activeCategory, setActiveCategory] = useState<ShopCategory>('themes');
    const [adLoading, setAdLoading] = useState(false);
    const [filteredItems, setFilteredItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        let targetItems: ShopItem[] = [];
        if (activeCategory === 'inventory') {
            const allDocs = [...items.themes, ...items.frames, ...items.bubbles];
            targetItems = allDocs.filter(i => currentAlter?.owned_items?.includes(i.id));
        } else {
            targetItems = items[activeCategory] || [];
        }
        setFilteredItems(targetItems);
    }, [activeCategory, items, currentAlter?.owned_items]);

    const handleCategorySelect = (category: ShopCategory) => {
        triggerHaptic.selection();
        setActiveCategory(category);
    };

    const handleAction = async (item: ShopItem) => {
        triggerHaptic.selection();

        if (!currentAlter) {
            Alert.alert("Mode Système", "Veuillez sélectionner un alter pour gérer les objets.");
            return;
        }

        const isOwned = currentAlter.owned_items?.includes(item.id);

        if (isOwned) {
            const slotMap: Record<string, 'frame' | 'theme' | 'bubble'> = {
                'frame': 'frame', 'theme': 'theme', 'bubble': 'bubble'
            };
            const slot = slotMap[item.type];
            if (!slot) return;

            // Check equipped status safely
            let isEquipped = false;
            if (currentAlter?.equipped_items) {
                if (item.type === 'frame') isEquipped = currentAlter.equipped_items.frame === item.id;
                if (item.type === 'theme') isEquipped = currentAlter.equipped_items.theme === item.id;
                if (item.type === 'bubble') isEquipped = currentAlter.equipped_items.bubble === item.id;
            }

            if (isEquipped) {
                // Option to unequip? Or just say already active
                return;
            }

            Alert.alert(
                "Équiper l'objet",
                `Activer ${item.name} ?`,
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Confirmer",
                        style: "default",
                        onPress: async () => {
                            const success = await equipDecoration(currentAlter.id, item.id, slot);
                            if (success) triggerHaptic.success();
                            else triggerHaptic.error();
                        }
                    }
                ]
            );
        } else {
            if (item.isPremium && !isPremium) {
                presentPaywall();
                return;
            }
            if ((item.priceCredits || 0) > credits) {
                Alert.alert("Crédits insuffisants", "Besoin de plus de crédits pour cet objet.");
                return;
            }

            Alert.alert(
                "Confirmer l'achat",
                `${item.priceCredits} crédits pour ${item.name}`,
                [
                    { text: "Non", style: "cancel" },
                    {
                        text: "Acheter",
                        onPress: async () => {
                            const success = await purchaseItem(item, currentAlter.id);
                            if (success) {
                                triggerHaptic.success();
                                Alert.alert("Succès ✨", `Vous possédez maintenant ${item.name}.`);
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
            <Text style={styles.headerTitle}>{activeCategory === 'inventory' ? 'Mon Inventaire' : 'Boutique'}</Text>

            <View style={styles.balanceContainer}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.balanceText}>{credits.toLocaleString()}</Text>
            </View>

            <View style={styles.spacingMd} />
            <PremiumBanner onPress={presentPaywall} />
            <View style={styles.spacingSm} />
            <CategoryTabs activeCategory={activeCategory} onSelect={handleCategorySelect} />
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Ionicons name="basket-outline" size={32} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.emptyText}>Rien ici pour le moment</Text>
            {activeCategory === 'inventory' && (
                <TouchableOpacity onPress={() => handleCategorySelect('themes')} style={styles.linkButton}>
                    <Text style={styles.linkButtonText}>Parcourir la boutique</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={[styles.topBar, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.topBarActions}>
                    <TouchableOpacity onPress={presentPaywall} style={styles.iconButton}>
                        <Ionicons name="diamond-outline" size={22} color="#ec4899" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 80 }
                ]}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={() => (
                    <View style={styles.footerContainer}>
                        <AdRewardCard onPress={handleWatchAd} loading={adLoading} disabled={adLoading || !currentAlter} />
                    </View>
                )}
                ListEmptyComponent={renderEmpty}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                    // Re-calculate derived state
                    const isOwned = currentAlter?.owned_items?.includes(item.id) || false;
                    let isEquipped = false;
                    if (isOwned && currentAlter?.equipped_items) {
                        if (item.type === 'frame') isEquipped = currentAlter.equipped_items.frame === item.id;
                        if (item.type === 'theme') isEquipped = currentAlter.equipped_items.theme === item.id;
                        if (item.type === 'bubble') isEquipped = currentAlter.equipped_items.bubble === item.id;
                    }
                    const isLocked: boolean = !!(item.isPremium && !isPremium && !isOwned);

                    return (
                        <ShopItemCard
                            item={item}
                            index={index}
                            isOwned={isOwned}
                            isEquipped={isEquipped}
                            isLocked={isLocked}
                            userCredits={credits}
                            onAction={handleAction}
                        />
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617', // Slate 950 - Darker background
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        zIndex: 10,
    },
    topBarActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingHorizontal: spacing.md,
    },
    headerContainer: {
        marginBottom: spacing.md,
    },
    headerTitle: {
        ...typography.h1,
        color: '#FFF',
        fontSize: 32,
        marginBottom: 8,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
        marginBottom: spacing.md,
    },
    balanceText: {
        ...typography.body,
        fontWeight: 'bold',
        color: '#fbbf24',
    },
    spacingMd: { height: spacing.md },
    spacingSm: { height: spacing.sm },

    // Premium Banner
    premiumBannerBlur: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    premiumBanner: {
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    premiumContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    premiumIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumTitle: {
        ...typography.h3,
        color: '#FFF',
        fontSize: 16,
    },
    premiumSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
    },

    // Tabs
    tabsContainer: {
        marginHorizontal: -spacing.md, // Full width bleed
        paddingHorizontal: spacing.md,
    },
    tabsContent: {
        gap: 8,
        paddingRight: spacing.md,
    },
    tabItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    tabItemActive: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    tabText: {
        ...typography.caption,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    tabTextActive: {
        color: '#000',
    },

    // Card
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    cardContainer: {
        width: ITEM_WIDTH,
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // Slate 800 with opacity
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardPreviewContainer: {
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    previewBase: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themePreviewBase: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 32,
    },
    themeCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    framePreview: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    cardInfo: {
        padding: spacing.sm,
    },
    cardTitle: {
        ...typography.caption,
        color: '#FFF',
        fontWeight: 'bold',
        marginBottom: 6,
    },
    cardActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    labelOwned: {
        ...typography.caption,
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priceText: {
        ...typography.caption,
        fontWeight: 'bold',
        fontSize: 11,
    },
    equippedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        gap: 2,
    },
    equippedText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#FFF',
    },
    lockedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Ad Card
    footerContainer: {
        marginTop: spacing.md,
    },
    adCard: {
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    adContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    adIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    adIconLoading: {
        opacity: 0.7,
    },
    adTextContainer: {
        flex: 1,
    },
    adTitle: {
        ...typography.h3,
        fontSize: 16,
        color: '#FFF',
        marginBottom: 2,
    },
    adSubtitle: {
        ...typography.caption,
        color: '#94a3b8',
    },

    // Empty
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptyText: {
        ...typography.body,
        color: '#64748b',
        marginBottom: spacing.lg,
    },
    linkButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    linkButtonText: {
        ...typography.button,
        fontSize: 14,
        color: '#FFF',
    },
});
