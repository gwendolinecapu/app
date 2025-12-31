import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    HAS_SEEN_ONBOARDING: 'HAS_SEEN_ONBOARDING',
};

export const storage = {
    async hasSeenOnboarding(): Promise<boolean> {
        try {
            const value = await AsyncStorage.getItem(KEYS.HAS_SEEN_ONBOARDING);
            return value === 'true';
        } catch (e) {
            console.error('Failed to load onboarding status', e);
            return false;
        }
    },

    async setHasSeenOnboarding(value: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.HAS_SEEN_ONBOARDING, String(value));
        } catch (e) {
            console.error('Failed to save onboarding status', e);
        }
    },

    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (e) {
            console.error('Failed to clear storage', e);
        }
    }
};
