import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../lib/theme';

export function ShopCatalogScreen() {
    return (
        <View style={styles.container}>
            {/* Catalog Grid Content */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    }
});
