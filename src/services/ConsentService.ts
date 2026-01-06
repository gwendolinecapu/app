import { Platform } from 'react-native';

let AdsConsent: any;
let AdsConsentStatus: any;
let requestTrackingPermissionsAsync: any;

try {
    if (Platform.OS !== 'web') {
        const mobileAds = require('react-native-google-mobile-ads');
        AdsConsent = mobileAds.AdsConsent;
        AdsConsentStatus = mobileAds.AdsConsentStatus;

        requestTrackingPermissionsAsync = require('expo-tracking-transparency').requestTrackingPermissionsAsync;
    } else {
        throw new Error("Web platform");
    }
} catch (e) {
    console.warn('[ConsentService] Native modules not found (web or dev client). Consent features will be disabled.');
    AdsConsent = {
        requestInfoUpdate: async () => ({ isConsentFormAvailable: false, status: 'UNKNOWN' }),
        loadAndShowConsentFormIfRequired: async () => ({ status: 'UNKNOWN' }),
        showPrivacyOptionsForm: async () => ({ status: 'UNKNOWN' }),
    };
    AdsConsentStatus = { REQUIRED: 'REQUIRED' };
    requestTrackingPermissionsAsync = async () => ({ status: 'granted' });
}

class ConsentService {
    private static instance: ConsentService;
    private initialized: boolean = false;

    private constructor() { }

    static getInstance(): ConsentService {
        if (!ConsentService.instance) {
            ConsentService.instance = new ConsentService();
        }
        return ConsentService.instance;
    }

    /**
     * Request consent information and show generic form if required.
     * Should be called on app startup.
     */
    async requestConsent(): Promise<void> {
        if (Platform.OS === 'web') return; // Not supported on web

        try {
            // 1. Request consent info update
            const consentInfo = await AdsConsent.requestInfoUpdate();

            // 2. Load and show consent form if required (e.g. first time or expired)
            if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
                const { status } = await AdsConsent.loadAndShowConsentFormIfRequired();
                console.log('[ConsentService] Consent form shown, status:', status);
            } else {
                console.log('[ConsentService] Consent form not required or not available, status:', consentInfo.status);
            }

            // 3. (iOS Only) Explicitly request App Tracking Transparency (ATT) permission
            // This is "Fail-Safe": if UMP didn't show it, we show it. 
            // If UMP showed it, this returns the status immediately without a second prompt.
            if (Platform.OS === 'ios') {
                const { status: trackingStatus } = await requestTrackingPermissionsAsync();
                console.log('[ConsentService] iOS ATT Status:', trackingStatus);
            }

            this.initialized = true;
        } catch (error) {
            console.warn('[ConsentService] Failed to request consent (non-critical):', error);
            // Non-blocking error, allow app to proceed
        }
    }

    /**
     * Check if privacy options form is required (for GDPR/CPRA settings in app)
     */
    async isPrivacyOptionsRequired(): Promise<boolean> {
        if (Platform.OS === 'web') return false;
        try {
            const consentInfo = await AdsConsent.requestInfoUpdate();
            return consentInfo.privacyOptionsRequirementStatus === 'REQUIRED';
        } catch (error) {
            console.warn('[ConsentService] Failed to check privacy options requirement:', error);
            return false;
        }
    }

    /**
     * Show the privacy options form (for user to change consent)
     */
    async showPrivacyOptions(): Promise<void> {
        if (Platform.OS === 'web') return;

        try {
            const { status } = await AdsConsent.showPrivacyOptionsForm();
            console.log('[ConsentService] Privacy options form shown, status:', status);
        } catch (error) {
            console.error('[ConsentService] Failed to show privacy options form:', error);
            throw error;
        }
    }

    /**
     * Get current consent boolean mostly for knowing if we can track personal data
     * Note: UMP is complex, but generally if we have personalized ads consent we can track.
     * This is a simplification.
     */
    async canPersonalizeAds(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        // This is a rough check. Ideally you check specific Purpose consents.
        // For AdMob, initialization handles this automatically based on UMP status.
        return true;
    }
}

export default ConsentService.getInstance();
