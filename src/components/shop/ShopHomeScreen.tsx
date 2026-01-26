import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../lib/theme';
// Will import actual content later

export function ShopHomeScreen() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Content to be ported from ShopUI */}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 100,
    }
});
