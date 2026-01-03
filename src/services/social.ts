import CookieManager from '@react-native-cookies/cookies';
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
                console.log(`[SocialSession] No saved session found for ${alter.name} on ${platform}`);
                return; // Start fresh
            }

            // 3. Inject cookies
            // Cookies is stored as Record<string, any>. We need to convert back if needed.
            // Assuming we stored the full cookie object from CookieManager.get()
            const cookiePromises = Object.values(session.cookies).map(c =>
                CookieManager.set(domain, c as any)
            );
            await Promise.all(cookiePromises);
            console.log(`[SocialSession] Restored session for ${alter.name} on ${platform}`);
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
            console.log(`[SocialSession] Saved session for alter ${alterId} on ${platform}`);
        } catch (error) {
            console.error('[SocialSession] Error saving session:', error);
        }
    }
};
