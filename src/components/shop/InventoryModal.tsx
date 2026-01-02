/**
 * InventoryModal.tsx
 * Modal to view and manage owned items.
 */

import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    FlatList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { ShopItem, ShopItemType, COSMETIC_ITEMS } from '../../services/MonetizationTypes';
import DecorationService from '../../services/DecorationService';
import { ShopItemCard } from './ShopItemCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMonetization } from '../../contexts/MonetizationContext';

const { width, height } = Dimensions.get('window');

interface InventoryModalProps {
    visible: boolean;
    onClose: () => void;
    onEquip: (item: ShopItem) => void;
}

export function InventoryModal({ visible, onClose, onEquip }: InventoryModalProps) {
    const insets = useSafeAreaInsets();
    const { ownedItems, equippedItems } = useMonetization();

    // Filter COSMETIC_ITEMS and DECORATIONS that are owned
    // Filter COSMETIC_ITEMS and DECORATIONS that are owned
    const inventoryItems = useMemo<ShopItem[]>(() => {
        const decorationsAsShopItems = DecorationService.getCatalog().map(d => ({
            ...d,
            type: (d.type === 'profile_frame' ? 'frame' : 'decoration') as ShopItemType,
            priceCredits: d.priceCredits,
        }));

        const allItems = [...COSMETIC_ITEMS, ...decorationsAsShopItems];

        console.log('[InventoryModal] OwnedItems:', ownedItems);
        const owned = allItems.filter(item => {
            const isOwned = ownedItems.includes(item.id);
            if (item.id === 'theme_cafe_cosy') console.log('Checking Cafe Cosy:', isOwned);
            return isOwned;
        });

        // Remove duplicates if any ID exists in both lists
        const uniqueItems = Array.from(new Map(owned.map(item => [item.id, item])).values());

        console.log('[InventoryModal] Filtered Inventory Items:', uniqueItems.length);
        return uniqueItems as ShopItem[];
    }, [ownedItems]);

    const isEquipped = (id: string, type: ShopItemType) => equippedItems[type] === id;

    const renderItem = ({ item }: { item: ShopItem }) => (
        <View style={styles.itemWrapper}>
            <ShopItemCard
                item={item}
                userCredits={0} // Not needed for inventory
                isOwned={true}
                isEquipped={isEquipped(item.id, item.type)}
                onPress={() => onEquip(item)}
                containerStyle={{ width: '100%' }}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <BlurView intensity={20} tint="dark" style={styles.container}>
                <View style={[styles.content, { marginTop: insets.top + 20 }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>MON INVENTAIRE</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {inventoryItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={64} color="rgba(255,255,255,0.2)" />
                            <Text style={styles.emptyText}>Ton inventaire est vide.</Text>
                            <Text style={styles.emptySubtext}>Visite la boutique pour obtenir des objets !</Text>
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
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        flex: 1,
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: colors.backgroundCard,
    },
    title: {
        ...typography.h3,
        color: '#FFF',
    },
    closeBtn: {
        padding: 4,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
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
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptySubtext: {
        color: colors.textSecondary,
        fontSize: 14,
    },
});
