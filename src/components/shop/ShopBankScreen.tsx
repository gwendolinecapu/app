import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../lib/theme';

export function ShopBankScreen() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Content to be ported from BankModal */}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 100,
    }
});
