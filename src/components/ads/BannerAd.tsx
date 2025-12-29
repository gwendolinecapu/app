/**
 * BannerAd.tsx
 * Bannière publicitaire discrète (50px)
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { useMonetization } from '../../contexts/MonetizationContext';
import { BannerPlacement } from '../../services/MonetizationTypes';

interface BannerAdProps {
    placement: BannerPlacement;
}

export function BannerAd({ placement }: BannerAdProps) {
    const { isAdFree } = useMonetization();

    // Ne pas afficher si premium/ad-free
    if (isAdFree) {
        return null;
    }

    // Placeholder - À remplacer par le vrai SDK
    // Exemple avec AppLovin MAX:
    // import { MaxAdView, AdFormat } from 'react-native-applovin-max';
    // return <MaxAdView adUnitId={adUnitId} adFormat={AdFormat.BANNER} />;

    return (
        <View style={styles.container}>
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Espace Publicitaire</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 50,
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 10,
        color: colors.textMuted,
    },
});

export default BannerAd;
