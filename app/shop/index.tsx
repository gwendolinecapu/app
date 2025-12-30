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

// function getItemIconInfo deleted


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

// ==================== RENDERING HELPERS ====================

const getFrameStyle = (id: string, isPreview = false) => {
    const base = {
        borderWidth: isPreview ? 3 : 2,
        borderColor: '#94a3b8',
        borderRadius: 999,
        borderStyle: 'solid' as 'solid' | 'dotted' | 'dashed',
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    };

    if (id.includes('basic')) return { ...base, borderWidth: 1, borderColor: '#cbd5e1' };
    if (id.includes('double')) return { ...base, borderWidth: 4, borderColor: '#fff' };
    if (id.includes('dashed')) return { ...base, borderStyle: 'dashed' as const, borderColor: '#fff' };
    if (id.includes('square')) return { ...base, borderRadius: 12, borderColor: '#fff' };

    // Colorful Frames
    if (id.includes('neon')) return {
        ...base, borderColor: '#0ff',
        shadowColor: '#0ff', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10, borderWidth: 2
    };
    if (id.includes('gold')) return { ...base, borderColor: '#ffd700', borderWidth: 2 };
    if (id.includes('leaves') || id.includes('floral')) return { ...base, borderColor: '#4ade80', borderStyle: 'dashed' as const };
    if (id.includes('flames')) return { ...base, borderColor: '#f87171', borderWidth: 3 };
    if (id.includes('ice')) return { ...base, borderColor: '#a5f3fc', borderWidth: 2 };
    if (id.includes('water')) return { ...base, borderColor: '#38bdf8' };
    if (id.includes('rainbow')) return { ...base, borderColor: '#c084fc', borderWidth: 3 };
    if (id.includes('glitch')) return { ...base, borderColor: '#a78bfa', borderWidth: 2, borderStyle: 'dotted' as const };
    if (id.includes('crown')) return { ...base, borderColor: '#fbbf24', borderWidth: 3 };

    return base;
};

const getBubbleStyle = (id: string) => {
    const base = {
        backgroundColor: '#334155',
        borderRadius: 16,
        padding: 8,
        borderWidth: 0,
        borderColor: 'transparent',
    };

    if (id.includes('round')) return { ...base, borderRadius: 24 };
    if (id.includes('square')) return { ...base, borderRadius: 4 };
    if (id.includes('minimal')) return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#94a3b8' };
    if (id.includes('cloud')) return { ...base, borderRadius: 20, backgroundColor: '#f1f5f9' };
    if (id.includes('comic')) return { ...base, borderRadius: 0, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' };
    if (id.includes('pixel')) return { ...base, borderRadius: 0, borderWidth: 1, borderColor: '#fff', backgroundColor: '#000' };
    if (id.includes('paper')) return { ...base, backgroundColor: '#fecaca', borderRadius: 2 }; // Pinkish paper
    if (id.includes('terminal')) return { ...base, backgroundColor: '#000', borderWidth: 1, borderColor: '#4ade80' };
    if (id.includes('neon')) return { ...base, borderWidth: 1, borderColor: '#0ff', backgroundColor: 'rgba(0, 255, 255, 0.1)' };
    if (id.includes('glass')) return { ...base, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' };
    if (id.includes('gold')) return { ...base, backgroundColor: '#000', borderWidth: 1, borderColor: '#ffd700' };

    return base;
};

// ==================== COMPONENTS ====================

const ItemPreview = ({ item }: { item: ShopItem }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const isAnimated = item.id.includes('anim') || item.id.includes('neon') || item.id.includes('magic') || item.id.includes('lava') || item.id.includes('galaxy');

        if (isAnimated) {
            const isRotation = item.id.includes('galaxy');
            const duration = isRotation ? 6000 : 2000;

            const mainAnim = Animated.loop(
                isRotation
                    ? Animated.timing(anim, {
                        toValue: 1,
                        duration,
                        easing: Easing.linear,
                        useNativeDriver: true
                    })
                    : Animated.sequence([
                        Animated.timing(anim, { toValue: 1, duration, easing: Easing.sin, useNativeDriver: false }),
                        Animated.timing(anim, { toValue: 0, duration, easing: Easing.sin, useNativeDriver: false })
                    ])
            );

            const pulseAnim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.sin, useNativeDriver: true }),
                    Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.sin, useNativeDriver: true })
                ])
            );

            mainAnim.start();
            pulseAnim.start();
            return () => {
                mainAnim.stop();
                pulseAnim.stop();
            };
        }
    }, [item.id]);

    // 1. THEMES
    if (item.type === 'theme') {
        const isAurora = item.id.includes('aurora');

        if (isAurora) {
            const displayColor = anim.interpolate({
                inputRange: [0, 0.33, 0.66, 1],
                outputRange: ['#3b82f6', '#10b981', '#8b5cf6', '#3b82f6']
            });

            return (
                <View style={styles.previewBase}>
                    <Animated.View style={[styles.themePreviewCard, { backgroundColor: displayColor, borderColor: 'rgba(255,255,255,0.3)' }]}>
                        <View style={styles.themePreviewHeader} />
                        <View style={styles.themePreviewBody}>
                            <View style={styles.themePreviewRow} />
                            <View style={[styles.themePreviewRow, { width: '60%' }]} />
                        </View>
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
                            style={[StyleSheet.absoluteFill, { transform: [{ rotate: '45deg' }, { translateY: -40 }] }]}
                        />
                    </Animated.View>
                </View>
            );
        }

        return (
            <View style={styles.previewBase}>
                <View style={[styles.themePreviewCard, { backgroundColor: item.preview || '#0f172a' }]}>
                    <View style={styles.themePreviewHeader} />
                    <View style={styles.themePreviewBody}>
                        <View style={styles.themePreviewRow} />
                        <View style={[styles.themePreviewRow, { width: '60%' }]} />
                    </View>
                </View>
            </View>
        );
    }

    // 2. FRAMES
    if (item.type === 'frame') {
        const frameStyle = getFrameStyle(item.id, true);
        const isNeon = item.id.includes('neon_pulse');
        const isGalaxy = item.id.includes('galaxy');

        if (isNeon) {
            const glowSize = pulse.interpolate({ inputRange: [0, 1], outputRange: [4, 12] });
            const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

            return (
                <View style={styles.previewBase}>
                    <Animated.View style={[
                        styles.framePreviewAvatar,
                        frameStyle,
                        {
                            borderColor: '#00f2ff',
                            shadowColor: '#00f2ff',
                            shadowRadius: glowSize,
                            shadowOpacity: glowOpacity,
                            elevation: 10
                        }
                    ]}>
                        <Ionicons name="person" size={20} color="#cbd5e1" />
                    </Animated.View>
                </View>
            );
        }

        if (isGalaxy) {
            const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
            const rotateReverse = anim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

            return (
                <View style={styles.previewBase}>
                    <Animated.View style={[styles.framePreviewAvatar, { borderColor: 'transparent', transform: [{ rotate }] }]}>
                        <LinearGradient
                            colors={['#ec4899', '#8b5cf6', '#3b82f6']}
                            style={StyleSheet.absoluteFill}
                        />
                        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateReverse }], margin: 2, backgroundColor: '#020617', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="person" size={20} color="#cbd5e1" />
                        </Animated.View>
                    </Animated.View>
                </View>
            );
        }

        return (
            <View style={styles.previewBase}>
                <View style={[styles.framePreviewAvatar, frameStyle]}>
                    <Ionicons name="person" size={20} color="#64748b" />
                </View>
            </View>
        );
    }

    // 3. BUBBLES
    if (item.type === 'bubble') {
        const bubbleStyle = getBubbleStyle(item.id);
        const isMagic = item.id.includes('magic');
        const isLava = item.id.includes('lava');

        if (isMagic) {
            const starOpacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] });
            const starScale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.2, 0.8] });

            return (
                <View style={styles.previewBase}>
                    <View style={[styles.bubblePreviewContainer, bubbleStyle, { overflow: 'hidden' }]}>
                        <LinearGradient colors={['#6366f1', '#a855f7']} style={StyleSheet.absoluteFill} />
                        <Animated.View style={{ opacity: starOpacity, transform: [{ scale: starScale }], position: 'absolute', top: 4, right: 4 }}>
                            <Ionicons name="sparkles" size={14} color="#fff" />
                        </Animated.View>
                        <Animated.View style={{ opacity: starOpacity, transform: [{ scale: starScale }], position: 'absolute', bottom: 4, left: 4 }}>
                            <Ionicons name="star" size={8} color="#fff" />
                        </Animated.View>
                    </View>
                </View>
            );
        }

        if (isLava) {
            const lavaColor = anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['#ef4444', '#f97316', '#ef4444']
            });

            return (
                <View style={styles.previewBase}>
                    <Animated.View style={[styles.bubblePreviewContainer, bubbleStyle, { backgroundColor: lavaColor, borderColor: '#7f1d1d', borderWidth: 1 }]}>
                        <View style={[styles.bubbleLine, { backgroundColor: '#fff', opacity: 0.8, width: 24 }]} />
                        <View style={[styles.bubbleLine, { backgroundColor: '#fff', opacity: 0.5, width: 14, marginTop: 4 }]} />
                    </Animated.View>
                </View>
            );
        }

        const isDarkContent = item.id.includes('cloud') || item.id.includes('comic') || item.id.includes('paper');
        const textColor = isDarkContent ? '#000' : '#fff';

        return (
            <View style={styles.previewBase}>
                <View style={[styles.bubblePreviewContainer, bubbleStyle]}>
                    <View style={[styles.bubbleLine, { backgroundColor: textColor, opacity: 0.6, width: 24 }]} />
                    <View style={[styles.bubbleLine, { backgroundColor: textColor, opacity: 0.4, width: 16, marginTop: 4 }]} />
                </View>
            </View>
        );
    }

    // Fallback
    return (
        <View style={styles.previewBase}>
            <Ionicons name={item.icon as any || "cube-outline"} size={32} color="#94a3b8" />
        </View>
    );
};

const PremiumBanner = ({ onPress }: { onPress: () => void }) => {
    const shine = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shine, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true }),
                Animated.delay(3000)
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shine.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width]
    });

    return (
        <AnimatedTouchable onPress={onPress}>
            <BlurView intensity={20} tint="light" style={styles.premiumBannerBlur}>
                <LinearGradient
                    colors={['rgba(99, 102, 241, 0.8)', 'rgba(168, 85, 247, 0.6)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumBanner}
                >
                    <Animated.View style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            width: width / 3,
                            transform: [{ skewX: '-25deg' }, { translateX }]
                        }
                    ]} />

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
};

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
                            activeOpacity={0.8}
                        >
                            {isActive ? (
                                <LinearGradient
                                    colors={['#8b5cf6', '#6366f1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.tabItem, styles.tabItemActive]}
                                >
                                    <Text style={[styles.tabText, styles.tabTextActive]}>{item.label}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.tabItem}>
                                    <Text style={styles.tabText}>{item.label}</Text>
                                </View>
                            )}
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
            <AnimatedTouchable onPress={() => onAction(item)}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.cardContainer}
                >
                    <View style={styles.cardPreviewContainer}>
                        <ItemPreview item={item} />

                        {isEquipped && (
                            <BlurView intensity={20} style={styles.equippedBadge}>
                                <Ionicons name="checkmark" size={10} color="#FFF" />
                                <Text style={styles.equippedText}>ACTIF</Text>
                            </BlurView>
                        )}
                    </View>

                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>

                        <View style={styles.cardActionRow}>
                            {isOwned ? (
                                <View style={styles.statusPill}>
                                    <View style={[styles.statusDot, { backgroundColor: isEquipped ? '#4ade80' : '#94a3b8' }]} />
                                    <Text style={[styles.labelOwned, { color: isEquipped ? '#4ade80' : '#94a3b8' }]}>{isEquipped ? 'Équipé' : 'Acquis'}</Text>
                                </View>
                            ) : item.isPremium ? (
                                <View style={[styles.priceRow, styles.priceRowPremium]}>
                                    <Ionicons name="diamond" size={10} color={isLocked ? "#db2777" : "#FFF"} />
                                    <Text style={[styles.priceText, { color: isLocked ? "#db2777" : "#FFF" }]}>
                                        {isLocked ? 'Premium' : 'Inclus'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.priceRow}>
                                    <Ionicons name="star" size={10} color={canAfford ? "#fbbf24" : "#64748b"} />
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
                            <BlurView intensity={10} style={StyleSheet.absoluteFill} />
                            <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.8)" />
                        </View>
                    )}
                </LinearGradient>
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
                                Alert.alert("Succès", `Vous possédez maintenant ${item.name}.`);
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
            <PremiumBanner onPress={() => router.push('/premium')} />
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
        <LinearGradient
            colors={['#1e1b4b', '#020617']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />

            <View style={[styles.topBar, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.topBarActions}>
                    <TouchableOpacity onPress={presentPaywall} style={styles.iconButton}>
                        <LinearGradient
                            colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                        />
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
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)', // Gold border
        backgroundColor: 'rgba(251, 191, 36, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: spacing.md,
    },
    balanceText: {
        ...typography.body,
        fontWeight: 'bold',
        color: '#fbbf24',
        textShadowColor: 'rgba(251, 191, 36, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
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
        marginHorizontal: -spacing.md,
        paddingHorizontal: spacing.md,
    },
    tabsContent: {
        gap: 8,
        paddingRight: spacing.md,
        paddingVertical: 4,
    },
    tabItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabItemActive: {
        backgroundColor: 'transparent', // Gradient handles bg
        borderWidth: 0,
        paddingVertical: 9, // Adjust for lack of border
        paddingHorizontal: 17,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    tabText: {
        ...typography.caption,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
    },
    tabTextActive: {
        color: '#FFF',
        fontWeight: '700',
    },

    // Card
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    cardContainer: {
        width: ITEM_WIDTH,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    cardPreviewContainer: {
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.4)', // Slate 900 with opacity
    },
    previewBase: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themePreviewCard: {
        width: 48,
        height: 80, // Aspect ratio phone
        borderRadius: 6,
        padding: 4,
        justifyContent: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    themePreviewHeader: {
        height: 8,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginBottom: 6,
    },
    themePreviewBody: {
        gap: 4,
    },
    themePreviewRow: {
        height: 6,
        width: '80%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
    },
    framePreviewAvatar: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e293b',
    },
    bubblePreviewContainer: {
        minWidth: 40,
        minHeight: 30,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    bubbleLine: {
        height: 3,
        borderRadius: 1.5,
    },
    cardInfo: {
        padding: 10,
    },
    cardTitle: {
        ...typography.caption,
        color: '#e2e8f0',
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 12,
    },
    cardActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 24,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    labelOwned: {
        ...typography.caption,
        fontSize: 10,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        gap: 4,
    },
    priceRowPremium: {
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
    },
    priceText: {
        ...typography.caption,
        fontWeight: '700',
        fontSize: 11,
    },
    equippedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.9)', // Emerald 500
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 3,
        overflow: 'hidden',
    },
    equippedText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
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
