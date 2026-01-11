/**
 * useLocalAI Hook
 * 
 * Custom hook for local AI summarization using expo-llm-mediapipe (Gemma).
 * Provides model download, loading, and text generation with progress tracking.
 * 
 * NOTE: Requires a development build. Not available in Expo Go.
 */

import { useState, useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const { LocalAI } = NativeModules;

// Check if we're in Expo Go (native modules not available)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import expo-llm-mediapipe only in dev builds
let useLLM: any = null;
if (!isExpoGo) {
    try {
        const mediapipe = require('expo-llm-mediapipe');
        useLLM = mediapipe.useLLM;
    } catch (e) {
        console.warn('[useLocalAI] expo-llm-mediapipe not available:', e);
    }
}

// ============================================
// Types
// ============================================

export type AIProvider = 'apple' | 'gemini' | 'gemma' | 'mock';
export type SummaryPeriod = 'day' | 'week' | 'month';

export interface LocalAIStatus {
    isModelDownloaded: boolean;
    isModelLoaded: boolean;
    isDownloading: boolean;
    isLoading: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    provider: AIProvider;
    error: string | null;
}

export interface SummaryResult {
    summary: string;
    provider: AIProvider;
}

// ============================================
// Constants
// ============================================

// Gemma 1.1 2B quantized model (smaller, faster for mobile)
const MODEL_CONFIG = {
    modelName: 'gemma-1.1-2b-it-int4.bin',
    modelUrl: 'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-int4.bin',
    maxTokens: 512,
    temperature: 0.7,
    topK: 40,
    randomSeed: Date.now(),
};

// ============================================
// Hook
// ============================================

export function useLocalAI() {
    const [status, setStatus] = useState<LocalAIStatus>({
        isModelDownloaded: false,
        isModelLoaded: false,
        isDownloading: false,
        isLoading: false,
        isGenerating: false,
        downloadProgress: 0,
        provider: isExpoGo ? 'mock' : 'gemma',
        error: isExpoGo ? 'Expo Go detected - native AI unavailable' : null,
    });

    // Initialize expo-llm-mediapipe (only if available)
    const llm = useLLM ? useLLM(MODEL_CONFIG) : null;

    // ============================================
    // Check Native AI Availability
    // ============================================

    const checkNativeAvailability = useCallback(async (): Promise<AIProvider | null> => {
        if (!LocalAI) return null;

        try {
            const available = await LocalAI.isAvailable();
            if (available) {
                return Platform.OS === 'ios' ? 'apple' : 'gemini';
            }
        } catch (e) {
            console.warn('[useLocalAI] Native check failed:', e);
        }
        return null;
    }, []);

    // ============================================
    // Download Model
    // ============================================

    const downloadModel = useCallback(async () => {
        if (isExpoGo || !llm) {
            throw new Error('Téléchargement non disponible dans Expo Go. Utilisez un development build.');
        }

        setStatus(prev => ({ ...prev, isDownloading: true, error: null, downloadProgress: 0 }));

        try {
            // Track progress (expo-llm-mediapipe may emit events)
            const progressInterval = setInterval(() => {
                setStatus(prev => ({
                    ...prev,
                    downloadProgress: Math.min(prev.downloadProgress + 5, 95)
                }));
            }, 500);

            await llm.downloadModel();

            clearInterval(progressInterval);
            setStatus(prev => ({
                ...prev,
                isDownloading: false,
                isModelDownloaded: true,
                downloadProgress: 100,
                provider: 'gemma',
            }));

            console.log('[useLocalAI] Model downloaded successfully');
        } catch (error: any) {
            setStatus(prev => ({
                ...prev,
                isDownloading: false,
                error: error.message || 'Échec du téléchargement',
            }));
            throw error;
        }
    }, [llm]);

    // ============================================
    // Load Model into Memory
    // ============================================

    const loadModel = useCallback(async () => {
        if (isExpoGo || !llm) {
            throw new Error('Chargement non disponible dans Expo Go. Utilisez un development build.');
        }

        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            await llm.loadModel();
            setStatus(prev => ({
                ...prev,
                isLoading: false,
                isModelLoaded: true,
            }));
            console.log('[useLocalAI] Model loaded into memory');
        } catch (error: any) {
            setStatus(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Échec du chargement',
            }));
            throw error;
        }
    }, [llm]);

    // ============================================
    // Generate Summary
    // ============================================

    const summarize = useCallback(async (
        content: string,
        period: SummaryPeriod
    ): Promise<SummaryResult> => {
        const periodLabel = period === 'day' ? 'journée' : period === 'week' ? 'semaine' : 'mois';

        // 0. If Expo Go, use mock immediately
        if (isExpoGo) {
            return {
                summary: await mockSummarize(content, periodLabel),
                provider: 'mock',
            };
        }

        // 1. Try Native AI first (Apple Intelligence / Gemini Nano)
        const nativeProvider = await checkNativeAvailability();
        if (nativeProvider && LocalAI) {
            try {
                const summary = await LocalAI.summarize(content);
                return { summary, provider: nativeProvider };
            } catch (e) {
                console.warn('[useLocalAI] Native summarization failed:', e);
            }
        }

        // 2. Use Gemma via expo-llm-mediapipe
        if (status.isModelLoaded && llm) {
            setStatus(prev => ({ ...prev, isGenerating: true }));

            try {
                const prompt = `Tu es un assistant qui résume des entrées de journal personnel. Voici les entrées de la ${periodLabel}:

${content}

Génère un résumé concis en français avec:
- Les activités principales
- Les émotions détectées
- Une recommandation personnalisée

Résumé:`;

                const result = await llm.generateResponse(prompt);

                setStatus(prev => ({ ...prev, isGenerating: false }));
                return { summary: result || 'Résumé indisponible', provider: 'gemma' };
            } catch (error: any) {
                setStatus(prev => ({ ...prev, isGenerating: false, error: error.message }));
                throw error;
            }
        }

        // 3. Fallback to mock in dev
        if (__DEV__) {
            return {
                summary: await mockSummarize(content, periodLabel),
                provider: 'mock',
            };
        }

        throw new Error('Aucun modèle IA disponible. Veuillez installer le modèle Gemma.');
    }, [llm, status.isModelLoaded, checkNativeAvailability]);

    // ============================================
    // Return Hook API
    // ============================================

    return {
        status,
        downloadModel,
        loadModel,
        summarize,
        modelSizeMB: 400, // Approximate
    };
}

// ============================================
// Mock Summarizer (Dev Only)
// ============================================

async function mockSummarize(text: string, period: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const wordCount = text.split(' ').length;
    const entries = text.split('\n\n').filter(e => e.trim()).length;

    return `📊 **Résumé de ta ${period}**

${entries} entrées analysées (${wordCount} mots)

**Points clés:**
• Activité principale: Journaling personnel
• Tendance émotionnelle: Stable
• Thèmes récurrents: Réflexion, activités quotidiennes

**Recommandation:**
Continue à écrire régulièrement pour un meilleur suivi !

_Généré localement sur ton appareil_ 🔒`;
}
