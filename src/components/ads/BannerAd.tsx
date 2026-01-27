/**
 * BannerAd.tsx
 * Bannière publicitaire discrète (50px)
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, NativeModules } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { useMonetization } from '../../contexts/MonetizationContext';
import { BannerPlacement } from '../../services/MonetizationTypes';

import Constants, { ExecutionEnvironment } from 'expo-constants';

// AdMob types/mock
let AdMobBanner: any = null;
let BannerAdSize: any = { BANNER: 'BANNER' };
let TestIds: any = { BANNER: 'ca-app-pub-3940256099942544/2934735716' };

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo';

if (!isExpoGo && Platform.OS !== 'web') {
    try {
        const hasAdMob = !!(NativeModules && (NativeModules as any).RNGoogleMobileAdsModule);

        if (hasAdMob) {
            const AdMobModule = require('react-native-google-mobile-ads');
            AdMobBanner = AdMobModule.BannerAd;
            BannerAdSize = AdMobModule.BannerAdSize;
            TestIds = AdMobModule.TestIds;
        }
    } catch (e) {
        console.warn('[BannerAd] AdMob native module not available');
    }
}


interface BannerAdProps {
    placement: BannerPlacement;
}

export function BannerAd({ placement }: BannerAdProps) {
    const { isAdFree } = useMonetization();
    const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY';

    // Ne pas afficher si premium/ad-free
    if (isAdFree) {
        return null;
    }

    // Fallback if AdMob is not available (Expo Go or Web or Missing Native)
    if (!AdMobBanner) {
        return (
            <View style={styles.container}>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>Publicité (Mockée - Expo Go)</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AdMobBanner
                unitId={adUnitId}
                size={BannerAdSize.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onPaid={(event: any) => {
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
