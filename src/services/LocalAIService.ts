import { NativeModules, Platform } from 'react-native';

const { LocalAI } = NativeModules;

export interface LocalAIServiceType {
    summarize(text: string): Promise<string>;
    isAvailable(): Promise<boolean>;
}

/**
 * Service to handle Local AI summarization.
 * Connects to Native Modules (Apple Intelligence / Gemini Nano) if available.
 * Falls back to a mock implementation in development or if unsupported.
 */
export const LocalAIService = {
    /**
     * Checks if the device supports local AI generation.
     */
    isAvailable: async (): Promise<boolean> => {
        if (!LocalAI) {
            // In development or if module not linked, return true to allow testing mock logic
            if (__DEV__) return true;
            return false;
        }
        try {
            return await LocalAI.isAvailable();
        } catch (e) {
            console.warn('LocalAIService check failed:', e);
            return false;
        }
    },

    /**
     * Summarizes the provided text using on-device models.
     * @param text The text to summarize (e.g., aggregated journal entries).
     * @returns A Promise resolving to the summary string.
     */
    summarize: async (text: string): Promise<string> => {
        // 1. Mock Logic for Dev / Web / Simulators
        if (!LocalAI) {
            console.log('[LocalAIService] Native module not found, using Mock.');
            return mockSummarize(text);
        }

        // 2. Mock Logic if native wrapper exists but fails check (optional safety)
        try {
            const available = await LocalAI.isAvailable();
            if (!available) {
                throw new Error('Device does not support Local AI (OS version or Hardware limitation).');
            }
            return await LocalAI.summarize(text);
        } catch (error) {
            console.error('[LocalAIService] Error during summarization:', error);
            // Fallback to mock if it fails? Or re-throw? 
            // For now, let's allow fallback in DEV, strict throw in PROD.
            if (__DEV__) return mockSummarize(text);
            throw error;
        }
    }
};

/**
 * Simple mock summarizer for testing UI without real AI.
 */
function mockSummarize(text: string): string {
    // Simulate network/processing delay
    const wordCount = text.split(' ').length;
    const summaryLength = Math.min(50, Math.ceil(wordCount / 5)); // ~20% of original

    return `[MOCK AI SUMMARY]
  
Voici un résumé généré localement (Simulation):
  
${text.substring(0, 100)}...

Points clés:
- Activité détectée: Journaling
- Humeur: Neutre
- Contenu principal: ${wordCount} mots analysés.

(Ce résumé est un placeholder en attendant l'intégration native Apple Intelligence / Gemini)`;
}
