/**
 * AdMediationService.ts
 * Service de médiation publicitaire multi-régie
 * 
 * Supporte: Google AdMob, Unity Ads, AppLovin MAX
 * Stratégie waterfall pour maximiser les revenus
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    AdType,
    AdNetwork,
    RewardResult,
    NativeAdData,
    BannerPlacement,
    AD_CONFIG,
} from './MonetizationTypes';

// Configuration des App IDs (à remplacer par les vraies valeurs)
const AD_CONFIG_KEYS = {
    // Google AdMob
    ADMOB_APP_ID_IOS: 'ca-app-pub-XXXXX~YYYYY',
    ADMOB_APP_ID_ANDROID: 'ca-app-pub-XXXXX~ZZZZZ',
    ADMOB_BANNER_ID: 'ca-app-pub-XXXXX/banner',
    ADMOB_NATIVE_ID: 'ca-app-pub-XXXXX/native',
    ADMOB_REWARDED_ID: 'ca-app-pub-XXXXX/rewarded',

    // Unity Ads
    UNITY_GAME_ID_IOS: '4XXXXX',
    UNITY_GAME_ID_ANDROID: '4YYYYY',
    UNITY_BANNER_PLACEMENT: 'Banner_iOS',
    UNITY_REWARDED_PLACEMENT: 'Rewarded_iOS',

    // AppLovin MAX
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

    // Ads préchargées
    private preloadedRewarded: { network: AdNetwork; loaded: boolean }[] = [];
    private preloadedNative: NativeAdData | null = null;

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

            // Initialiser chaque réseau en parallèle
            await Promise.all([
                this.initAdMob(),
                this.initUnityAds(),
                this.initAppLovin(),
            ]);

            // Précharger les pubs reward
            this.preloadRewardedAds();

            this.initialized = true;
            console.log('[AdMediation] Initialized successfully');
        } catch (error) {
            console.error('[AdMediation] Initialization failed:', error);
        }
    }

    private async initAdMob(): Promise<void> {
        // Note: Nécessite react-native-google-mobile-ads
        // import mobileAds from 'react-native-google-mobile-ads';
        // await mobileAds().initialize();
        console.log('[AdMediation] AdMob initialized (stub)');
    }

    private async initUnityAds(): Promise<void> {
        // Note: Nécessite react-native-unity-ads
        // import UnityAds from 'react-native-unity-ads';
        // await UnityAds.initialize(UNITY_GAME_ID, true);
        console.log('[AdMediation] Unity Ads initialized (stub)');
    }

    private async initAppLovin(): Promise<void> {
        // Note: Nécessite react-native-applovin-max
        // import AppLovinMAX from 'react-native-applovin-max';
        // await AppLovinMAX.initialize(APPLOVIN_SDK_KEY);
        console.log('[AdMediation] AppLovin MAX initialized (stub)');
    }

    // ==================== REWARDED ADS ====================

    /**
     * Précharge les pubs reward de chaque réseau (waterfall)
     */
    private async preloadRewardedAds(): Promise<void> {
        // Ordre de priorité: AppLovin > Unity > AdMob
        this.preloadedRewarded = [
            { network: 'applovin', loaded: false },
            { network: 'unity', loaded: false },
            { network: 'admob', loaded: false },
        ];

        // Charger en parallèle
        await Promise.all([
            this.loadRewardedAd('applovin'),
            this.loadRewardedAd('unity'),
            this.loadRewardedAd('admob'),
        ]);
    }

    private async loadRewardedAd(network: AdNetwork): Promise<void> {
        try {
            // Simuler le chargement (à remplacer par les vrais SDKs)
            await new Promise(resolve => setTimeout(resolve, 500));

            const index = this.preloadedRewarded.findIndex(r => r.network === network);
            if (index !== -1) {
                this.preloadedRewarded[index].loaded = true;
            }

            console.log(`[AdMediation] Rewarded ad loaded from ${network}`);
        } catch (error) {
            console.error(`[AdMediation] Failed to load rewarded from ${network}:`, error);
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

        // Trouver le premier réseau avec une pub chargée
        const available = this.preloadedRewarded.find(r => r.loaded);
        if (!available) {
            console.warn('[AdMediation] No rewarded ad available');
            return {
                completed: false,
                rewardType: 'credits',
                rewardAmount: 0,
                network: 'admob',
            };
        }

        try {
            // Afficher la pub (à implémenter avec les vrais SDKs)
            const completed = await this.displayRewardedAd(available.network);

            if (completed) {
                // Mettre à jour l'état
                available.loaded = false;
                this.state.rewardAdsToday++;
                await this.saveState();

                // Recharger une nouvelle pub
                this.loadRewardedAd(available.network);

                return {
                    completed: true,
                    rewardType: 'credits',
                    rewardAmount: 50, // Défini dans CREDIT_REWARDS.REWARD_AD
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
        // Placeholder - à remplacer par les vrais SDKs
        console.log(`[AdMediation] Displaying rewarded ad from ${network}`);

        // Simuler le visionnage complet
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
            console.log('[AdMediation] Showing interstitial');
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
