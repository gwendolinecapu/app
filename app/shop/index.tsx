import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Dimensions,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../src/lib/theme';
import { triggerHaptic } from '../../src/lib/haptics';
import { useMonetization } from '../../src/contexts/MonetizationContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { ShopItem } from '../../src/services/MonetizationTypes';
import { SHOP_ITEMS } from '../../src/services/ShopData';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Types for shop categories - Added 'inventory'
type ShopCategory = 'themes' | 'frames' | 'bubbles' | 'inventory';

const { width } = Dimensions.get('window');

// ==================== ANIMATED CARD COMPONENT ====================
// Provides scale animation on press for tactile feedback
const AnimatedCard = ({ children, onPress, disabled, style }: {
    children: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    style?: any;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 8,
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
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function ShopScreen() {
    const router = useRouter();
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

    const [activeCategory, setActiveCategory] = useState<ShopCategory>('themes');
    const [adLoading, setAdLoading] = useState(false);

    // ==================== DATA HELPERS ====================

    // Get items for the active category
    // For 'inventory', we filter all items owned by the current alter
    const getCategoryItems = useCallback((): ShopItem[] => {
        if (activeCategory === 'inventory') {
            if (!currentAlter?.owned_items?.length) return [];
            // Flatten all shop items and filter by ownership
            const allItems = [
                ...SHOP_ITEMS.themes,
                ...SHOP_ITEMS.frames,
                ...SHOP_ITEMS.bubbles
            ];
            return allItems.filter(item => currentAlter.owned_items?.includes(item.id));
        }
        return SHOP_ITEMS[activeCategory] || [];
    }, [activeCategory, currentAlter?.owned_items]);

    // Count items per category (owned for inventory, total for others)
    const getInventoryCount = useCallback((): number => {
        return currentAlter?.owned_items?.length || 0;
    }, [currentAlter?.owned_items]);

    // ==================== ACTIONS ====================

    const handlePurchase = async (item: ShopItem) => {
        triggerHaptic.selection();

        // Decorations require an active alter
        if (!currentAlter && item.type === 'decoration') {
            Alert.alert("Mode Système", "Veuillez sélectionner un alter pour acheter des décorations.");
            return;
        }

        // Premium-only items
        if (item.isPremium && !isPremium) {
            Alert.alert(
                "Réservé au Premium",
                "Cet objet est exclusif aux membres Plural Connect Premium.",
                [
                    { text: "Plus tard", style: "cancel" },
                    { text: "Voir les offres", onPress: () => presentPaywall() }
                ]
            );
            return;
        }

        // Already owned check
        const isOwned = currentAlter?.owned_items?.includes(item.id);
        if (isOwned) {
            Alert.alert("Déjà possédé", "Vous avez déjà cet objet !");
            return;
        }

        // Not enough credits check
        if ((item.priceCredits ?? 0) > credits) {
            Alert.alert("Crédits insuffisants", `Il vous manque ${(item.priceCredits ?? 0) - credits}★ pour acheter cet objet.`);
            return;
        }

        // Proceed with purchase
        const alterId = item.type === 'decoration' ? currentAlter?.id : undefined;
        const success = await purchaseItem(item, alterId);

        if (success) {
            triggerHaptic.success();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            Alert.alert("🎉 Succès", `Vous avez obtenu : ${item.name}`);
        } else {
            triggerHaptic.error();
            Alert.alert("Erreur", "L'achat a échoué. Veuillez réessayer.");
        }
    };

    // Handle equipping an owned item
    const handleEquip = async (item: ShopItem) => {
        if (!currentAlter) {
            Alert.alert("Mode Système", "Veuillez sélectionner un alter pour équiper.");
            return;
        }

        triggerHaptic.selection();

        // Map item type to decoration slot
        const slotMap: { [key: string]: 'frame' | 'theme' | 'bubble' } = {
            'frame': 'frame',
            'theme': 'theme',
            'bubble': 'bubble'
        };
        const slot = slotMap[item.type];
        if (!slot) return;

        const success = await equipDecoration(currentAlter.id, item.id, slot);
        if (success) {
            triggerHaptic.success();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            Alert.alert("✨ Équipé", `${item.name} est maintenant actif !`);
        } else {
            triggerHaptic.error();
            Alert.alert("Erreur", "Impossible d'équiper cet objet.");
        }
    };

    const handleItemPress = async (item: ShopItem) => {
        const isOwned = currentAlter?.owned_items?.includes(item.id);

        if (isOwned) {
            // Show equip options
            const slotMap: { [key: string]: 'frame' | 'theme' | 'bubble' } = {
                'frame': 'frame',
                'theme': 'theme',
                'bubble': 'bubble'
            };
            const slot = slotMap[item.type];
            const isEquipped = slot && getEquippedDecorationId(currentAlter, slot) === item.id;

            if (isEquipped) {
                Alert.alert("Déjà équipé", "Cet objet est actuellement actif.");
            } else {
                Alert.alert(
                    item.name,
                    item.description,
                    [
                        { text: "Annuler", style: "cancel" },
                        { text: "Équiper", onPress: () => handleEquip(item) }
                    ]
                );
            }
        } else {
            // Purchase flow
            handlePurchase(item);
        }
    };

    const handleWatchAd = async () => {
        if (!currentAlter) {
            Alert.alert("Mode Système", "Veuillez sélectionner un alter pour recevoir la récompense.");
            return;
        }
        triggerHaptic.selection();
        setAdLoading(true);
        try {
            await watchRewardAd(currentAlter.id);
        } catch (e) {
            console.error('Ad failed:', e);
        } finally {
            setAdLoading(false);
        }
    };

    const handleCategoryChange = (category: ShopCategory) => {
        if (category === activeCategory) return;
        triggerHaptic.light();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveCategory(category);
    };

    // ==================== RENDER HELPERS ====================

    const renderCategoryTab = (category: ShopCategory, label: string, icon?: string, count?: number) => {
        const isActive = activeCategory === category;
        return (
            <TouchableOpacity
                key={category}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => handleCategoryChange(category)}
            >
                {icon && <Text style={{ marginRight: 4 }}>{icon}</Text>}
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                    {label}
                </Text>
                {count !== undefined && count > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{count}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderItem = (item: ShopItem) => {
        const isUnlocked = item.isPremium && isPremium;
        const isOwned = currentAlter?.owned_items?.includes(item.id);

        // Check if this item is currently equipped
        const slotMap: { [key: string]: 'frame' | 'theme' | 'bubble' } = {
            'frame': 'frame',
            'theme': 'theme',
            'bubble': 'bubble'
        };
        const slot = slotMap[item.type];
        const isEquipped = isOwned && slot && getEquippedDecorationId(currentAlter, slot) === item.id;

        return (
            <AnimatedCard
                key={item.id}
                style={[styles.itemCard, isEquipped && styles.itemCardEquipped]}
                onPress={() => handleItemPress(item)}
                disabled={loading}
            >
                {/* Preview Section */}
                <View style={[
                    styles.itemPreview,
                    { backgroundColor: item.preview?.startsWith('#') ? item.preview : '#333' }
                ]}>
                    {item.type === 'frame' && <Text style={styles.previewEmoji}>👤</Text>}
                    {item.type === 'bubble' && <Text style={styles.previewEmoji}>💬</Text>}
                    {item.type === 'theme' && <Text style={styles.previewEmoji}>🎨</Text>}
                    {item.type === 'frame' && item.preview && (
                        <Text style={styles.previewOverlay}>{item.preview}</Text>
                    )}

                    {/* Equipped Indicator */}
                    {isEquipped && (
                        <View style={styles.equippedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#3BA55C" />
                        </View>
                    )}
                </View>

                {/* Content Section */}
                <View style={styles.itemContent}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>

                    <View style={styles.priceRow}>
                        {isOwned ? (
                            <View style={[styles.badge, isEquipped ? styles.badgeEquipped : styles.badgeOwned]}>
                                <Ionicons name={isEquipped ? "checkmark" : "bag-check"} size={10} color="white" />
                                <Text style={styles.badgeText}>{isEquipped ? "Équipé" : "Possédé"}</Text>
                            </View>
                        ) : item.isPremium ? (
                            <View style={[styles.badge, isUnlocked ? styles.badgeOwned : styles.badgePremium]}>
                                <Ionicons name="diamond" size={10} color="white" />
                                <Text style={styles.badgeText}>{isUnlocked ? "Inclus" : "Premium"}</Text>
                            </View>
                        ) : (
                            <View style={styles.badge}>
                                <Ionicons name="star" size={10} color={colors.primary} />
                                <Text style={[styles.badgeText, { color: colors.primary }]}>{item.priceCredits}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </AnimatedCard>
        );
    };

    const renderEmptyInventory = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎒</Text>
            <Text style={styles.emptyTitle}>Inventaire vide</Text>
            <Text style={styles.emptySubtitle}>
                {currentAlter
                    ? `${currentAlter.name} n'a pas encore de décorations.`
                    : "Sélectionnez un alter pour voir son inventaire."
                }
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => handleCategoryChange('themes')}
            >
                <Text style={styles.emptyButtonText}>Explorer la boutique</Text>
            </TouchableOpacity>
        </View>
    );

    // ==================== MAIN RENDER ====================

    const items = getCategoryItems();
    const inventoryCount = getInventoryCount();

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Header */}
                <SafeAreaView edges={['top']} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Boutique</Text>
                    <View style={styles.creditsPill}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.creditsText}>{credits}</Text>
                    </View>
                </SafeAreaView>

                {/* Premium Banner (Nitro Style) */}
                <TouchableOpacity onPress={() => presentPaywall()} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#5865F2', '#EB459E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.premiumBanner}
                    >
                        <View style={styles.bannerContent}>
                            <View>
                                <Text style={styles.bannerTitle}>Plural Premium</Text>
                                <Text style={styles.bannerSubtitle}>Débloquez tout. Exprimez-vous.</Text>
                            </View>
                            <View style={styles.bannerButton}>
                                <Text style={styles.bannerButtonText}>Voir les offres</Text>
                            </View>
                        </View>
                        {/* Abstract Shapes */}
                        <View style={[styles.shape, { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', top: -20, right: -20 }]} />
                        <View style={[styles.shape, { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', bottom: 10, left: 20 }]} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Current Alter Info */}
                <View style={styles.alterInfo}>
                    <Text style={styles.alterInfoText}>
                        Pour : <Text style={styles.alterName}>{currentAlter?.name || 'Système'}</Text>
                    </Text>
                </View>

                {/* Categories */}
                <View style={styles.tabsContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsScroll}
                    >
                        {renderCategoryTab('themes', 'Thèmes', '🎨')}
                        {renderCategoryTab('frames', 'Cadres', '🖼️')}
                        {renderCategoryTab('bubbles', 'Bulles', '💬')}
                        {renderCategoryTab('inventory', 'Inventaire', '🎒', inventoryCount)}
                    </ScrollView>
                </View>

                {/* Items Grid or Empty State */}
                {activeCategory === 'inventory' && items.length === 0 ? (
                    renderEmptyInventory()
                ) : (
                    <View style={styles.grid}>
                        {items.map(renderItem)}
                    </View>
                )}

                {/* Rewarded Ad CTA */}
                <TouchableOpacity
                    style={[styles.adCard, !currentAlter && { opacity: 0.5 }]}
                    onPress={handleWatchAd}
                    disabled={adLoading || !currentAlter}
                >
                    <LinearGradient colors={['#23272A', '#2C2F33']} style={styles.adGradient}>
                        <View style={styles.adIcon}>
                            <Ionicons name={adLoading ? "hourglass" : "videocam"} size={24} color={colors.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.adTitle}>Besoin de crédits ?</Text>
                            <Text style={styles.adSubtitle}>Regarder une pub pour +50★</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#202225',
    },
    scrollContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    creditsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    creditsText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    premiumBanner: {
        margin: spacing.md,
        height: 120,
        borderRadius: 16,
        padding: spacing.lg,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 4,
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
    },
    bannerButton: {
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    bannerButtonText: {
        color: '#5865F2',
        fontWeight: 'bold',
        fontSize: 12,
    },
    shape: {
        position: 'absolute',
    },
    alterInfo: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    alterInfoText: {
        color: '#72767D',
        fontSize: 12,
    },
    alterName: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    tabsContainer: {
        marginBottom: spacing.md,
    },
    tabsScroll: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#2F3136',
    },
    categoryTabActive: {
        backgroundColor: '#5865F2',
    },
    categoryTabText: {
        color: '#B9BBBE',
        fontWeight: '600',
        fontSize: 13,
    },
    categoryTabTextActive: {
        color: '#FFF',
    },
    countBadge: {
        marginLeft: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: spacing.md,
    },
    itemCard: {
        width: (width - spacing.md * 3) / 2,
        backgroundColor: '#2F3136',
        borderRadius: 12,
        overflow: 'hidden',
    },
    itemCardEquipped: {
        borderWidth: 2,
        borderColor: '#3BA55C',
    },
    itemPreview: {
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    previewEmoji: {
        fontSize: 32,
    },
    previewOverlay: {
        position: 'absolute',
        fontSize: 50,
    },
    equippedBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#2F3136',
        borderRadius: 10,
        padding: 2,
    },
    itemContent: {
        padding: spacing.sm,
    },
    itemName: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 2,
    },
    itemDesc: {
        color: '#72767D',
        fontSize: 10,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    badgePremium: {
        backgroundColor: '#EB459E',
    },
    badgeOwned: {
        backgroundColor: '#5865F2',
    },
    badgeEquipped: {
        backgroundColor: '#3BA55C',
    },
    badgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 10,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
        paddingHorizontal: spacing.lg,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        color: '#72767D',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    emptyButton: {
        backgroundColor: '#5865F2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    emptyButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    adCard: {
        margin: spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: spacing.xl,
    },
    adGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    adIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#202225',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    adSubtitle: {
        color: '#B9BBBE',
        fontSize: 12,
    },
});
