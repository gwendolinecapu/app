import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';
import { ShopItem, ShopItemType, COSMETIC_ITEMS } from '../../services/MonetizationTypes';
import DecorationService from '../../services/DecorationService';
import { useMonetization } from '../../contexts/MonetizationContext';
import { ShopItemCard } from './ShopItemCard';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'decoration' | 'frame' | 'theme' | 'bubble';

export function ShopInventoryScreen() {
    const { ownedItems, ownedShinyItems, equippedItems, equipItem } = useMonetization();
    const [filter, setFilter] = useState<FilterType>('all');

    const inventoryItems = useMemo<ShopItem[]>(() => {
        // Merge Catalog + Decorations
        const decorationsAsShopItems = DecorationService.getCatalog().map(d => ({
            ...d,
            type: (d.type === 'profile_frame' ? 'frame' : 'decoration') as ShopItemType,
            priceCredits: d.priceCredits,
        }));
        const allItems = [...COSMETIC_ITEMS, ...decorationsAsShopItems];

        // Filter owned
        const owned = allItems.filter(item => ownedItems.includes(item.id));

        // Deduplicate
        const uniqueItems = Array.from(new Map(owned.map(item => [item.id, item])).values()) as ShopItem[];

        if (filter === 'all') return uniqueItems;
        return uniqueItems.filter(item => item.type === filter);
    }, [ownedItems, filter]);

    const isEquipped = (id: string, type: ShopItemType) => equippedItems[type] === id;

    const renderHeader = () => (
        <View style={styles.filterRow}>
            {(['all', 'frame', 'theme', 'bubble', 'decoration'] as const).map((f) => (
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
                userCredits={0}
                isOwned={true}
                isEquipped={isEquipped(item.id, item.type)}
                onPress={() => equipItem(item.id, item.type)}
                containerStyle={{ width: '100%' }}
                isShiny={ownedShinyItems.includes(item.id)}
            // Simple equip on press for now, or show modal detailing
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}

            {inventoryItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={64} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyText}>Ton casier est vide.</Text>
                    <Text style={styles.emptySubtext}>Visite le catalogue pour obtenir des objets !</Text>
                </View>
            ) : (
                <FlatList
                    data={inventoryItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
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
        paddingBottom: 120, // Tab bar space
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    itemWrapper: {
        width: '48%',
        marginBottom: spacing.md,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
});
