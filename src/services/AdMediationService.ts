/**
 * AdMediationService.ts
 * Service de médiation publicitaire multi-régie
 * 
 * Supporte: Google AdMob, Unity Ads, AppLovin MAX
 * Stratégie waterfall pour maximiser les revenus
 * 
 * NOTE: En mode Expo Go, les publicités sont mockées car
 * react-native-google-mobile-ads nécessite un build natif
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
    AdType,
    AdNetwork,
    RewardResult,
    NativeAdData,
    BannerPlacement,
    AD_CONFIG,
    REWARD_AD_AMOUNT,
} from './MonetizationTypes';

// =====================================================
// SAFE IMPORT FOR EXPO GO
// En Expo Go, les modules natifs AdMob ne sont pas disponibles
// On utilise des mocks pour éviter les crashes
// =====================================================
const isExpoGo = Constants.appOwnership === 'expo';

import AnalyticsService from './AnalyticsService';

// Declare types for AdMob to avoid TS errors
let mobileAds: any = null;
let RewardedAd: any = null;
let TestIds: any = { BANNER: '', REWARDED: '' };
let RewardedAdEventType: any = { LOADED: '', EARNED_REWARD: '', PAID: '' };
let AdEventType: any = { ERROR: '', PAID: '' };

if (!isExpoGo) {
    try {
        // Only import in native builds
        const AdMobModule = require('react-native-google-mobile-ads');
        mobileAds = AdMobModule.default;
        RewardedAd = AdMobModule.RewardedAd;
        TestIds = AdMobModule.TestIds;
        RewardedAdEventType = AdMobModule.RewardedAdEventType;
        AdEventType = AdMobModule.AdEventType;
    } catch (e) {
        console.warn('[AdMediationService] AdMob module not available:', e);
    }
} else {

}

// =====================================================
// CONFIGURATION AVANCÉE
// =====================================================
// ⚠️ DANGER : Mettre à TRUE uniquement pour tester les vraies pubs avant release.
// NE JAMAIS CLIQUER SUR VOS PROPRES PUBS, VOUS SEREZ BANNI PAR GOOGLE.
// Ajoutez votre appareil en "Test Device" dans la console AdMob pour éviter les problèmes.
const FORCE_REAL_ADS = false;

// Configuration des App IDs (Production AdMob)
const AD_CONFIG_KEYS = {
    // Google AdMob - Production IDs (iOS)
    ADMOB_APP_ID_IOS: 'ca-app-pub-7014088517639318~1112284921',
    ADMOB_NATIVE_ID_IOS: 'ca-app-pub-7014088517639318/3546876579', // Natif iOS (entre posts)

    // Google AdMob - Production IDs (Android)
    ADMOB_APP_ID_ANDROID: 'ca-app-pub-7014088517639318~7514041741',
    ADMOB_NATIVE_ID_ANDROID: 'ca-app-pub-7014088517639318/6321036117', // Natif Android

    // Blocs d'annonces partagés iOS/Android
    ADMOB_BANNER_ID_IOS: 'ca-app-pub-7014088517639318/7961420846', // Bannière iOS
    ADMOB_BANNER_ID_ANDROID: 'ca-app-pub-7014088517639318/8064706081', // Bannière Android
    ADMOB_REWARDED_ID_IOS: 'ca-app-pub-7014088517639318/1623243206', // Récompense iOS 50 crédits
    ADMOB_REWARDED_ID_ANDROID: 'ca-app-pub-7014088517639318/6129464424', // Récompense Android 50 crédits

    // Unity Ads
    UNITY_GAME_ID_IOS: '6022245',
    UNITY_GAME_ID_ANDROID: '6022244',
    UNITY_BANNER_PLACEMENT: 'Banner_iOS',
    UNITY_REWARDED_PLACEMENT: 'Rewarded_iOS',

    // AppLovin MAX (placeholder - à configurer si utilisé)
    APPLOVIN_SDK_KEY: 'XXXXXXXXXXXXXXXX',
    APPLOVIN_BANNER_AD_UNIT: 'XXXXXXX',
    APPLOVIN_NATIVE_AD_UNIT: 'XXXXXXX',
    APPLOVIN_REWARDED_AD_UNIT: 'XXXXXXX',
};

const STORAGE_KEY = '@ad_mediation_state';

interface AdMediationState {
    lastInterstitialTime: number;
    rewardAdsToday: number;
    lastRewardAdDate: string; // YYYY-MM-DD
    dailyEarnings: number;
}

class AdMediationService {
    private static instance: AdMediationService;
    private initialized: boolean = false;
    private state: AdMediationState = {
        lastInterstitialTime: 0,
        rewardAdsToday: 0,
        lastRewardAdDate: '',
        dailyEarnings: 0,
    };

    private isShowingAd: boolean = false;

    // Ads préchargées
    private preloadedRewarded: { network: AdNetwork; loaded: boolean }[] = [];
    private preloadedNative: NativeAdData | null = null;

    private rewardedAd: any = null; // Type varies based on Expo Go vs native build
    private nativeAd: any = null; // Placeholder pour native

    private constructor() { }

    static getInstance(): AdMediationService {
        if (!AdMediationService.instance) {
            AdMediationService.instance = new AdMediationService();
        }
        return AdMediationService.instance;
    }

    // ==================== INITIALIZATION ====================

    /**
     * Initialise tous les réseaux publicitaires
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.loadState();
            this.checkDailyReset();

            // Initialiser le consentement (GDPR / UMP)
            // Cela affichera le formulaire si nécessaire
            try {
                // Check if AdMob valid IDs are configured, else skip to prevent UMP crash
                if (!AD_CONFIG_KEYS.ADMOB_APP_ID_IOS.startsWith('ca-app-pub-') || AD_CONFIG_KEYS.ADMOB_APP_ID_IOS.includes('YOUR_')) {

                } else {
                    const ConsentService = require('./ConsentService').default;
                    await ConsentService.requestConsent();

                }
            } catch (consentError) {
                // Warning only - don't block app init
                console.warn('[AdMediation] Consent flow skipped or failed:', consentError);
            }

            // Initialiser Google Mobile Ads (skip in Expo Go where mobileAds is null)
            if (mobileAds) {
                await mobileAds().initialize();
                // Précharger les pubs reward AdMob (only if SDK is available)
                this.preloadRewardedAds();
            } else {
                // AdMob disabled in Expo Go
            }

            // Initialiser les autres réseaux (placeholders pour l'instant)
            await Promise.all([
                this.initUnityAds(),
                this.initAppLovin(),
            ]);

            this.initialized = true;
        } catch (error) {
            console.error('[AdMediation] Initialization failed:', error);
        }
    }

    private async initUnityAds(): Promise<void> {
        // Placeholder Unity Ads
    }

    private async initAppLovin(): Promise<void> {
        // Placeholder AppLovin
    }

    // ==================== REWARDED ADS ====================

    /**
     * Précharge les pubs reward
     * NOTE: Only call this if mobileAds/RewardedAd are available (native build)
     */
    private async preloadRewardedAds(): Promise<void> {
        // Guard: Skip if AdMob SDK not available (Expo Go)
        if (!RewardedAd) {
            return;
        }

        // Créer l'instance AdMob
        // LOGIQUE FORCE_REAL_ADS : Si FORCE_REAL_ADS est true, on ignore __DEV__
        const shouldUseRealAds = FORCE_REAL_ADS || !__DEV__;

        const adUnitId = shouldUseRealAds
            ? (Platform.OS === 'ios' ? AD_CONFIG_KEYS.ADMOB_REWARDED_ID_IOS : AD_CONFIG_KEYS.ADMOB_REWARDED_ID_ANDROID)
            : TestIds.REWARDED;



        this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        // Écouter les événements
        this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
            const index = this.preloadedRewarded.findIndex(r => r.network === 'admob');
            if (index === -1) {
                this.preloadedRewarded.push({ network: 'admob', loaded: true });
            } else {
                this.preloadedRewarded[index].loaded = true;
            }
        });

        this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: { type: string; amount: number }) => {
        });

        this.rewardedAd.addAdEventListener(AdEventType.PAID, (event: any) => {

            AnalyticsService.logAdRevenue({
                value: event.value,
                currency: event.currency,
                network: 'admob',
                adUnitId: adUnitId,
                format: 'rewarded',
                precision: event.precision
            });
        });

        // Charger
        this.rewardedAd.load();
    }

    private async loadRewardedAd(network: AdNetwork): Promise<void> {
        if (network === 'admob' && this.rewardedAd) {
            this.rewardedAd.load();
        }
    }

    /**
     * Vérifie si une pub reward est disponible
     */
    isRewardedAdReady(): boolean {
        return this.preloadedRewarded.some(r => r.loaded);
    }

    /**
     * Vérifie si l'utilisateur peut encore regarder des reward ads aujourd'hui
     */
    canWatchRewardAd(): boolean {
        this.checkDailyReset();
        return this.state.rewardAdsToday < AD_CONFIG.MAX_REWARD_ADS_PER_DAY;
    }

    /**
     * Affiche une pub reward (waterfall)
     */
    async showRewardedAd(): Promise<RewardResult> {
        this.checkDailyReset();

        if (!this.canWatchRewardAd()) {
            return {
                completed: false,
                rewardType: 'credits',
                rewardAmount: 0,
                network: 'admob',
            };
        }

        if (this.isShowingAd) {
            return {
                completed: false,
                rewardType: 'credits',
                rewardAmount: 0,
                network: 'admob',
            };
        }

        // Trouver le premier réseau avec une pub chargée
        const available = this.preloadedRewarded.find(r => r.loaded);
        if (!available) {
            console.log('[AdMediation] No rewarded ad available');
            return {
                completed: false,
                rewardType: 'credits',
                rewardAmount: 0,
                network: 'admob',
            };
        }

        try {
            this.isShowingAd = true;
            // Mark as consumed immediately to prevent double-tapping
            available.loaded = false;

            // Afficher la pub (à implémenter avec les vrais SDKs)
            const completed = await this.displayRewardedAd(available.network);

            this.isShowingAd = false;

            if (completed) {
                // Mettre à jour l'état
                this.state.rewardAdsToday++;
                await this.saveState();

                // Recharger une nouvelle pub
                this.loadRewardedAd(available.network);

                return {
                    completed: true,
                    rewardType: 'credits',
                    rewardAmount: REWARD_AD_AMOUNT,
                    network: available.network,
                };
            }

            return {
                completed: false,
                rewardType: 'credits',
                rewardAmount: 0,
                network: available.network,
            };

        } catch (error) {
            this.isShowingAd = false;
            console.error('[AdMediation] Rewarded ad error:', error);
            return {
                completed: false,
                rewardType: 'credits',
                rewardAmount: 0,
                network: available.network,
            };
        }
    }

    private async displayRewardedAd(network: AdNetwork): Promise<boolean> {

        if (network === 'admob' && this.rewardedAd && this.rewardedAd.loaded) {
            return new Promise((resolve) => {
                let earned = false;

                // On doit réattacher les listeners pour cette instance d'affichage spécifique
                const cleanup = () => {
                    if (unsubscribeEarned) unsubscribeEarned();
                    if (unsubscribeClosed) unsubscribeClosed();
                };

                const unsubscribeEarned = this.rewardedAd!.addAdEventListener(
                    RewardedAdEventType.EARNED_REWARD,
                    (reward: any) => {
                        console.log('[AdMediation] Reward earned:', reward);
                        earned = true;
                    }
                );

                const unsubscribeClosed = this.rewardedAd!.addAdEventListener(
                    AdEventType.CLOSED,
                    () => {
                        console.log('[AdMediation] Ad closed');
                        cleanup();
                        resolve(earned);
                    }
                );

                // Add error listener just in case
                const unsubscribeError = this.rewardedAd!.addAdEventListener(
                    AdEventType.ERROR,
                    (error: any) => {
                        console.error('[AdMediation] Ad error:', error);
                        cleanup();
                        // If error happens during show, we probably didn't earn reward
                        resolve(false);
                    }
                );

                // Override cleanup to include error listener
                const originalCleanup = cleanup;
                // @ts-ignore
                cleanup = () => {
                    originalCleanup();
                    if (unsubscribeError) unsubscribeError();
                };

                try {
                    this.rewardedAd!.show();
                } catch (e) {
                    console.error('[AdMediation] Show failed:', e);
                    console.error('[AdMediation] Show failed:', e);
                    cleanup();
                    resolve(false);
                }
            });
        }

        // Pour les autres réseaux (placeholders)
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }

    // ==================== BANNER ADS ====================

    /**
     * Obtient l'ID de bannière pour le placement
     */
    getBannerAdUnitId(placement: BannerPlacement): string {
        // Utiliser AppLovin comme principal (meilleur eCPM)
        return AD_CONFIG_KEYS.APPLOVIN_BANNER_AD_UNIT;
    }

    /**
     * Vérifie si les bannières sont supportées
     */
    isBannerSupported(): boolean {
        return Platform.OS === 'ios' || Platform.OS === 'android';
    }

    // ==================== NATIVE ADS ====================

    /**
     * Charge une pub native pour le feed
     */
    async loadNativeAd(): Promise<NativeAdData | null> {
        try {
            // Placeholder - à remplacer par les vrais SDKs
            // AppLovin MAX Native, puis fallback AdMob Native

            const mockNativeAd: NativeAdData = {
                headline: 'Découvrez notre app partenaire',
                body: 'Une expérience unique vous attend',
                callToAction: 'En savoir plus',
                imageUrl: 'https://via.placeholder.com/400x200',
                iconUrl: 'https://via.placeholder.com/50x50',
                advertiser: 'Sponsored',
                network: 'applovin',
            };

            this.preloadedNative = mockNativeAd;
            return mockNativeAd;

        } catch (error) {
            console.error('[AdMediation] Failed to load native ad:', error);
            return null;
        }
    }

    /**
     * Obtient la pub native préchargée
     */
    getPreloadedNativeAd(): NativeAdData | null {
        const ad = this.preloadedNative;
        this.preloadedNative = null;

        // Précharger la prochaine
        this.loadNativeAd();

        return ad;
    }

    // ==================== INTERSTITIAL ADS ====================

    /**
     * Vérifie si un interstitiel peut être affiché (cooldown)
     */
    canShowInterstitial(): boolean {
        const now = Date.now();
        const cooldown = AD_CONFIG.INTERSTITIAL_COOLDOWN * 1000;
        return now - this.state.lastInterstitialTime >= cooldown;
    }

    /**
     * Affiche un interstitiel (rarement utilisé pour ne pas gêner)
     */
    async showInterstitial(): Promise<boolean> {
        if (!this.canShowInterstitial()) {
            return false;
        }

        try {
            // Placeholder - à remplacer par les vrais SDKs
            this.state.lastInterstitialTime = Date.now();
            await this.saveState();
            return true;
        } catch (error) {
            console.error('[AdMediation] Interstitial error:', error);
            return false;
        }
    }

    // ==================== STATE MANAGEMENT ====================

    private async loadState(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.state = { ...this.state, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('[AdMediation] Failed to load state:', error);
        }
    }

    private async saveState(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (error) {
            console.error('[AdMediation] Failed to save state:', error);
        }
    }

    private checkDailyReset(): void {
        const today = new Date().toISOString().split('T')[0];
        if (this.state.lastRewardAdDate !== today) {
            this.state.rewardAdsToday = 0;
            this.state.lastRewardAdDate = today;
            this.state.dailyEarnings = 0;
        }
    }

    // ==================== GETTERS ====================

    getRewardAdsWatchedToday(): number {
        this.checkDailyReset();
        return this.state.rewardAdsToday;
    }

    getRemainingRewardAds(): number {
        this.checkDailyReset();
        return AD_CONFIG.MAX_REWARD_ADS_PER_DAY - this.state.rewardAdsToday;
    }
}

export default AdMediationService.getInstance();
