import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';
import { ShopItem, ShopItemType, COSMETIC_ITEMS } from '../../services/MonetizationTypes';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShopItemCard } from './ShopItemCard';
import { ShopItemModal } from './ShopItemModal';
import { LootBoxService } from '../../services/LootBoxService';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'decoration' | 'frame' | 'theme' | 'bubble';

export function ShopCatalogScreen() {
    const { ownedItems, equippedItems, credits, purchaseItem, equipItem, isPremium } = useMonetization();
    const { currentAlter } = useAuth();

    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // DAILY ITEMS for reference (to perhaps duplicate or ensure visibility? Catalog shows ALL currently)
    // Actually, COSMETIC_ITEMS are "The Catalog".
    // We should filter so current Daily Rotation items are ALSO visible here? 
    // Usually Catalog = All Items.
    // The previous implementation filtered OUT daily items from catalog to avoid duplication in the main view.
    // Here, since it's a separate tab, we can probably show everything or filter if we want.
    // Let's show EVERYTHING that is in COSMETIC_ITEMS.

    // In ShopUI: const catalogItems = COSMETIC_ITEMS.filter(item => !dailyIds.includes(item.id));
    // Let's stick onto showing all COSMETIC_ITEMS here.

    const catalogItems = useMemo<ShopItem[]>(() => {
        let items = [...COSMETIC_ITEMS];
        if (filter !== 'all') {
            items = items.filter(item => item.type === filter);
        }
        return items;
    }, [filter]);

    const isOwned = (id: string) => ownedItems.includes(id);
    const isEquipped = (id: string, type: ShopItemType) => equippedItems[type] === id;

    const navToDetail = (item: ShopItem) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const renderHeader = () => (
        <View style={styles.filterRow}>
            {(['all', 'frame', 'theme', 'bubble'] as const).map((f) => (
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
    );

    const renderItem = ({ item }: { item: ShopItem }) => (
        <View style={styles.itemWrapper}>
            <ShopItemCard
                item={item}
                userCredits={credits}
                isOwned={isOwned(item.id)}
                isEquipped={isEquipped(item.id, item.type)}
                onPress={navToDetail}
                avatarUrl={currentAlter?.avatar_url}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}

            <FlatList
                data={catalogItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />

            <ShopItemModal
                visible={modalVisible}
                item={selectedItem}
                userCredits={credits}
                isOwned={selectedItem ? isOwned(selectedItem.id) : false}
                isEquipped={selectedItem ? isEquipped(selectedItem.id, selectedItem.type) : false}
                isPremiumUser={isPremium}
                onClose={() => setModalVisible(false)}
                onPurchase={async (item) => {
                    if (!currentAlter) return false;
                    const s = await purchaseItem(item, currentAlter.id);
                    if (s) setModalVisible(false);
                    return s;
                }}
                onEquip={async (item) => {
                    await equipItem(item.id, item.type);
                    setModalVisible(false);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
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
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
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
