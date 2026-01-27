import { Platform, NativeModules } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Dual implementation for Native (react-native-firebase) and Web (firebase/analytics)
let analytics: any = null;
let isWebAnalytics = false;

// Robust check for Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo';

if (Platform.OS === 'web') {
    // Web: Use Firebase Web SDK
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getAnalytics } = require('firebase/analytics');
        const { auth } = require('../lib/firebase'); // Get initialized app

        // Get the Firebase app instance from auth (which is already initialized)
        const app = auth.app;
        if (app) {
            analytics = getAnalytics(app);
            isWebAnalytics = true;
        }
    } catch (e) {
        console.warn('[AnalyticsService] Firebase Web Analytics initialization failed:', e);
    }
} else {
    // Native: Use react-native-firebase
    // GUARD: Skip if in Expo Go or if native module is missing
    try {
        // Safe access to NativeModules property
        const hasRNFB = !!(NativeModules && (NativeModules as any).RNFBAppModule);

        if (!isExpoGo && hasRNFB) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const analyticsModule = require('@react-native-firebase/analytics');
            analytics = analyticsModule.default;
        } else {
            // console.log('[AnalyticsService] Skipping Firebase Analytics in Expo Go or missing module.');
        }
    } catch (e) {
        console.warn('[AnalyticsService] Firebase Analytics native module check failed:', e);
    }
}



/**
 * Service centralisé pour l'analytics
 * Gère le tracking natif Firebase avec prise en charge spéciale pour les revenus publicitaires
 */
class AnalyticsService {
    private static instance: AnalyticsService;

    private constructor() { }

    static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    /**
     * Définit l'ID utilisateur pour tout le tracking futur
     * À appeler après le login
     */
    async setUserId(userId: string | null): Promise<void> {
        if (!analytics) return;

        try {
            if (isWebAnalytics) {
                // Web SDK uses setUserId from firebase/analytics
                const { setUserId: webSetUserId } = require('firebase/analytics');
                await webSetUserId(analytics, userId);
            } else {
                // Native SDK: analytics is a function that returns instance
                await analytics().setUserId(userId);
            }
        } catch (error) {
            console.warn('[Analytics] Failed to set user ID:', error);
        }
    }

    /**
     * Log un événement personnalisé
     */
    async logEvent(name: string, params: { [key: string]: any } = {}): Promise<void> {
        if (!analytics) return;

        try {
            if (isWebAnalytics) {
                // Web SDK uses logEvent from firebase/analytics
                const { logEvent: webLogEvent } = require('firebase/analytics');
                webLogEvent(analytics, name, params);
            } else {
                // Native SDK
                await analytics().logEvent(name, params);
            }
        } catch (error) {
            console.warn('[Analytics] Failed to log event:', error);
        }
    }

    /**
     * Enregistre une impression publicitaire avec revenu (Native Ad Revenue Tracking)
     * C'est la méthode CLÉ pour le calcul du LTV et ARPU dans Firebase
     */
    async logAdRevenue(params: {
        value: number; // Montant en micros (ou unités directes selon la source, mais on normalisera)
        currency: string;
        network: string; // 'admob', 'unity', 'applovin', etc.
        adUnitId: string;
        format: 'banner' | 'interstitial' | 'rewarded' | 'native';
        precision?: string; // e.g. 'ESTIMATED', 'PUBLISHER_PROVIDED', 'PRECISE'
    }): Promise<void> {
        if (!analytics) return;

        try {
            // Conversion micros -> standard si nécessaire (AdMob envoie souvent en micros 1e-6)
            // MAIS attention: logAdImpression attend-il des micros ou des unités ?
            // D'après la doc React Native Firebase:
            // "The value of the ad revenue." (Standard generic number)
            // Cependant, AdMob 'value' dans onPaidEvent est souvent en micros.
            // On va assumer que l'appelant nous passe la valeur BRUTE de l'événement et on la traite ici.

            // NOTE: Pour 'ad_impression', Firebase recommande d'utiliser les paramètres standards
            // ad_platform, ad_source, ad_unit_name, ad_format, value, currency

            // Conversion si c'est clairement des micros (très grand nombre) ou si on sait que ça vient d'AdMob
            // AdMob 'value' fields are usually micros. 1 USD = 1,000,000 micros.

            let revenueValue = params.value;
            // Heuristique simple: si revenu > 100 (cpm > 100$ est rare), c'est probablement des micros
            // OU si la source est AdMob

            if (params.value > 1000) {
                revenueValue = params.value / 1000000;
            }

            const eventParams = {
                ad_platform: Platform.OS === 'ios' ? 'ios' : 'android',
                ad_source: params.network,
                ad_unit_name: params.adUnitId,
                ad_format: params.format,
                value: revenueValue,
                currency: params.currency || 'USD', // Default to USD if missing
            };

            if (isWebAnalytics) {
                const { logEvent: webLogEvent } = require('firebase/analytics');
                webLogEvent(analytics, 'ad_impression', eventParams);
            } else {
                await analytics().logEvent('ad_impression', eventParams);
            }


        } catch (error) {
            console.error('[Analytics] Failed to log ad revenue:', error);
        }
    }
}

export default AnalyticsService.getInstance();
