import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../lib/theme';

export function ShopInventoryScreen() {
    return (
        <View style={styles.container}>
            {/* Content to be ported from InventoryModal */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    }
});
