import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';
import { ShopItem, ShopItemType, COSMETIC_ITEMS, CRAFT_PRICES } from '../../services/MonetizationTypes';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShopItemCard } from './ShopItemCard';
import { ShopItemModal } from './ShopItemModal';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'theme' | 'frame' | 'bubble';

export function ShopForgeScreen() {
    const { ownedItems, equippedItems, dust, craftItem, isPremium } = useMonetization();
    const { currentAlter } = useAuth();

    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Filter items that can be crafted (have a rarity)
    const forgeItems = useMemo<ShopItem[]>(() => {
        let items = COSMETIC_ITEMS.filter(item => item.rarity); // Only items with rarity
        if (filter !== 'all') {
            items = items.filter(item => item.type === filter);
        }
        // sort by rarity (common -> legendary)
        const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        items.sort((a, b) => (rarityOrder[a.rarity || 'common'] - rarityOrder[b.rarity || 'common']));
        return items;
    }, [filter]);

    const isOwned = (id: string) => ownedItems.includes(id);
    const getCraftPrice = (item: ShopItem) => CRAFT_PRICES[item.rarity || 'common'];

    const handlePress = (item: ShopItem) => {
        if (isOwned(item.id)) {
            // Show details only? Or just nothing?
            // Let's show details for consistency
            setSelectedItem(item);
            setModalVisible(true);
            return;
        }

        const price = getCraftPrice(item);
        if (dust < price) {
            Alert.alert(
                "Pas assez de Poussière",
                `Il vous faut ${price} Poussières d'étoile pour créer cet item.`
            );
            return;
        }

        Alert.alert(
            "Créer cet item ?",
            `Voulez-vous dépenser ${price} Poussières pour créer "${item.name}" ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Créer",
                    onPress: async () => {
                        const success = await craftItem(item);
                        if (success) {
                            Alert.alert("Succès", `Vous avez créé ${item.name} !`);
                        } else {
                            Alert.alert("Erreur", "La création a échoué.");
                        }
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Balance Display */}
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>VOTRE SOLDE</Text>
                <View style={styles.balanceValue}>
                    <Ionicons name="sparkles" size={20} color="#E879F9" />
                    <Text style={styles.dustText}>{dust}</Text>
                </View>
                <Text style={styles.balanceSub}>Poussière d'étoile</Text>
            </View>

            {/* Filters */}
            <View style={styles.filterRow}>
                {(['all', 'theme', 'frame', 'bubble'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterPill, filter === f && styles.filterPillActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'all' ? 'TOUT' : f.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: ShopItem }) => (
        <View style={styles.itemWrapper}>
            <ShopItemCard
                item={item}
                userCredits={dust} // Pass dust as 'userCredits' for fallback logic if needed, but we used priceOverride
                isOwned={isOwned(item.id)}
                isEquipped={false} // Forge doesn't handle equipping directy
                onPress={handlePress}
                avatarUrl={currentAlter?.avatar_url}
                priceOverride={getCraftPrice(item)}
                currencyType="dust"
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}

            <FlatList
                data={forgeItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />

            {/* Reusing ShopItemModal strictly for viewing details if owned */}
            {selectedItem && (
                <ShopItemModal
                    visible={modalVisible}
                    item={selectedItem}
                    userCredits={0} // Irrelevant here as we disable buy
                    isOwned={true}
                    isEquipped={false}
                    isPremiumUser={isPremium}
                    onClose={() => setModalVisible(false)}
                    onPurchase={() => Promise.resolve(false)}
                    onEquip={() => Promise.resolve()}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    headerContainer: {
        paddingTop: spacing.md,
        backgroundColor: '#0F172A',
    },
    balanceContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    balanceLabel: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4,
    },
    balanceValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dustText: {
        color: '#E879F9',
        fontSize: 32,
        fontWeight: '900',
    },
    balanceSub: {
        color: '#E879F9',
        fontSize: 12,
        opacity: 0.8,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterPillActive: {
        backgroundColor: '#E879F9',
        borderColor: '#E879F9',
    },
    filterText: {
        color: '#9CA3AF',
        fontWeight: '600',
        fontSize: 12,
    },
    filterTextActive: {
        color: '#FFF',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 120,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    itemWrapper: {
        width: '48%',
        marginBottom: spacing.md,
    },
});
