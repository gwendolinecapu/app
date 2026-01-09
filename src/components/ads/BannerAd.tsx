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

import { BannerAd as AdMobBanner, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export function BannerAd({ placement }: BannerAdProps) {
    const { isAdFree } = useMonetization();
    const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';

    // Ne pas afficher si premium/ad-free
    if (isAdFree) {
        return null;
    }

    return (
        <View style={styles.container}>
            <AdMobBanner
                unitId={adUnitId}
                size={BannerAdSize.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onPaid={(event) => {
                    const AnalyticsService = require('../../services/AnalyticsService').default;
                    AnalyticsService.logAdRevenue({
                        value: event.value,
                        currency: event.currency,
                        network: 'admob',
                        adUnitId: adUnitId,
                        format: 'banner',
                        precision: event.precision
                    });
                }}
            />
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
