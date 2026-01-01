import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';

import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { AdRewardCard } from './AdRewardCard';
import { DailyRewardCard } from './DailyRewardCard';
import { ShopItemCard } from './ShopItemCard';
import { ShopItem } from '../../services/MonetizationTypes';

// Dimensions
const { width } = Dimensions.get('window');

// Categories
const CATEGORIES = [
    { id: 'themes', label: 'Thèmes', icon: 'color-palette-outline' },
    { id: 'frames', label: 'Cadres', icon: 'scan-outline' },
    { id: 'bubbles', label: 'Bulles', icon: 'chatbubble-outline' },
    { id: 'inventory', label: 'Inventaire', icon: 'briefcase-outline' } // Inventaire moved to end
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
        refresh
    } = useMonetization();
    const { user } = useAuth();

    // State
    const [selectedCategory, setSelectedCategory] = useState('themes');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [equippedItems, setEquippedItems] = useState<{ frame?: string, theme?: string, bubble?: string }>({});

    // Fetch owned items (Simplified logic for now, in a real app this would be in Context)
    // We'll rely on the context to tell us if we own it, OR we fetch it.
    // Since checkStatus/purchase returns boolean, we track locally or rely on refresh.
    // For now, let's assume `user.decorations` or similar exists, but MonetizationContext keeps `decorations` in `status`.
    // We'll mock "Inventory" based on `MonetizationContext` state if possible, or just local assumptions for demo.
    // The `MonetizationContext` exposes `getOwnedDecorations` but it returns empty array in the file I saw.
    // I will assume for this redesign that I need to Fetch/Update logic later, but for UI I will render items.

    useEffect(() => {
        refresh();
    }, []);

    // Filter Items
    const filteredItems = shopItems.filter(item => {
        // Map raw types to categories
        if (selectedCategory === 'themes') return item.type === 'theme';
        if (selectedCategory === 'frames') return item.type === 'frame';
        if (selectedCategory === 'bubbles') return item.type === 'bubble';
        return false;
    });

    const handlePurchase = async (item: ShopItem) => {
        if (processingId) return;
        setProcessingId(item.id);

        try {
            const success = await purchaseItem(item, alterId);
            if (success) {
                Alert.alert('Succès', `Vous avez acquis : ${item.name}`);
                // Refresh local state/inventory
                setOwnedItems(prev => [...prev, item.id]);
            } else {
                Alert.alert('Erreur', 'Pas assez de crédits ou une erreur est survenue.');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de procéder à l\'achat.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleEquip = async (item: ShopItem) => {
        if (!alterId) return;
        setProcessingId(item.id);
        try {
            const typeMap: any = { 'theme': 'theme', 'frame': 'frame', 'bubble': 'bubble' };
            await equipDecoration(alterId, item.id, typeMap[item.type]);
            // Update equipped local state for immediate feedback
            setEquippedItems(prev => ({ ...prev, [typeMap[item.type]]: item.id }));
        } catch (e) {
            // Error
        } finally {
            setProcessingId(null);
        }
    };

    // Helper to check ownership (To be replaced by real context check)
    const isOwned = (itemId: string) => ownedItems.includes(itemId); // Mock
    const isEquipped = (itemId: string, type: string) => equippedItems[type as keyof typeof equippedItems] === itemId;

    return (
        <View style={styles.container}>
            {/* Header - Custom Glassy Look */}
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

                    {/* Credits Badge */}
                    <View style={styles.creditsBadge}>
                        <Ionicons name="diamond" size={16} color={colors.secondary} />
                        <Text style={styles.creditsText}>{credits}</Text>
                        <TouchableOpacity style={styles.addCreditsBtn} onPress={() => router.push('/premium')}>
                            <Ionicons name="add" size={12} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories - Horizontal Scroll */}
                <View style={styles.categoriesContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContent}
                    >
                        {CATEGORIES.map(cat => {
                            const isActive = selectedCategory === cat.id;
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
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Rewards Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Récompenses</Text>
                    {alterId && <DailyRewardCard alterId={alterId} />}
                    <AdRewardCard alterId={alterId} />
                </View>

                {/* Premium Banner */}
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

                {/* Grid Content */}
                <View style={styles.gridContainer}>
                    {selectedCategory === 'inventory' ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="basket-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Ton inventaire est affiché ici</Text>
                        </View>
                    ) : filteredItems.length > 0 ? (
                        <View style={styles.grid}>
                            {filteredItems.map(item => (
                                <ShopItemCard
                                    key={item.id}
                                    item={item}
                                    userCredits={credits}
                                    isOwned={isOwned(item.id)}
                                    isEquipped={isEquipped(item.id, item.type)}
                                    onPress={isOwned(item.id) ? handleEquip : handlePurchase}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Aucun article disponible</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        paddingBottom: spacing.md,
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
        padding: spacing.xl,
        opacity: 0.5,
    },
    emptyText: {
        color: colors.textSecondary,
        marginTop: spacing.md,
    }
});
