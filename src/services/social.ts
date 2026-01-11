// Safely import CookieManager to avoid crashes in Expo Go or if native module is missing
let CookieManager: any;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    CookieManager = require('@react-native-cookies/cookies').default;
} catch {
    console.warn('[SocialSessionService] CookieManager native module not found. Session management will be disabled.');
    // Mock implementation to prevent crashes
    CookieManager = {
        clearAll: async () => { },
        get: async () => ({}),
        set: async () => { },
    };
}
import { Alter } from '../types';
import { AlterService } from './alters';

export type SupportedPlatform = 'tiktok' | 'instagram' | 'twitter' | 'youtube';

export const SocialSessionService = {
    /**
     * Switch the active session to the target alter's session for a specific platform.
     * This involves:
     * 1. Clearing current cookies for the domain.
     * 2. Injecting the saved cookies for the alter.
     */
    restoreSession: async (alter: Alter, platform: SupportedPlatform, domain: string) => {
        try {
            // 1. Clear current cookies to ensure clean slate (or previous alter's session is gone)
            await CookieManager.clearAll(); // Or clearByName/domain if possible, but clearAll is safer for isolation

            // 2. Find saved session
            const session = alter.social_sessions?.find(s => s.platform === platform);
            if (!session || !session.cookies) {
                return; // Start fresh - no saved session
            }

            // 3. Inject cookies
            // Cookies is stored as Record<string, any>. We need to convert back if needed.
            // Assuming we stored the full cookie object from CookieManager.get()
            const cookiePromises = Object.values(session.cookies).map(c =>
                CookieManager.set(domain, c as any)
            );
            await Promise.all(cookiePromises);
        } catch (error) {
            console.error('[SocialSession] Error restoring session:', error);
        }
    },

    /**
     * Save the current active session cookies to the alter's record.
     */
    saveSession: async (alterId: string, platform: SupportedPlatform, domain: string) => {
        try {
            // 1. Get current cookies
            const cookies = await CookieManager.get(domain);

            // 2. Fetch current alter data to preserve other sessions
            const alter = await AlterService.getAlter(alterId);
            if (!alter) return;

            const existingSessions = alter.social_sessions || [];

            // 3. Update or add the session for this platform
            const otherSessions = existingSessions.filter(s => s.platform !== platform);

            const newSession = {
                platform,
                cookies,
                last_active: new Date().toISOString()
            };

            const updatedSessions = [...otherSessions, newSession];

            // 4. Persist to DB
            await AlterService.updateAlter(alterId, { social_sessions: updatedSessions });
        } catch (error) {
            console.error('[SocialSession] Error saving session:', error);
        }
    }
};
