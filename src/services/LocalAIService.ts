import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const { LocalAI } = NativeModules;

// ============================================
// Constants
// ============================================

const MODEL_ID = 'gemma-3n-e2b-it';
const MODEL_STORAGE_KEY = '@local_ai_model_installed';
// Helper getters for model paths (documentDirectory can be null on web)
const getModelDir = () => `${FileSystem.documentDirectory || ''}models/`;
const getModelFile = () => `${getModelDir()}${MODEL_ID}.onnx`;

// Hugging Face model URL (ONNX quantized version)
const MODEL_URL = 'https://huggingface.co/google/gemma-3n-E2B-it-ONNX/resolve/main/model_q4.onnx';
const MODEL_SIZE_MB = 400; // Approximate size for progress estimation

// ============================================
// Types
// ============================================

export type AIProvider = 'apple' | 'gemini' | 'gemma' | 'mock';

export interface ModelStatus {
    isInstalled: boolean;
    isDownloading: boolean;
    downloadProgress: number; // 0-100
    provider: AIProvider;
}

export type DownloadProgressCallback = (progress: number) => void;

// ============================================
// LocalAI Service
// ============================================

/**
 * Service to handle Local AI summarization with on-demand model download.
 * Priority: Native (Apple/Gemini) → ONNX (Gemma) → Mock
 */
export const LocalAIService = {
    /**
     * Get current AI status and provider.
     */
    getStatus: async (): Promise<ModelStatus> => {
        // 1. Check native modules first
        if (LocalAI) {
            try {
                const nativeAvailable = await LocalAI.isAvailable();
                if (nativeAvailable) {
                    return {
                        isInstalled: true,
                        isDownloading: false,
                        downloadProgress: 100,
                        provider: Platform.OS === 'ios' ? 'apple' : 'gemini',
                    };
                }
            } catch (e) {
                console.warn('[LocalAI] Native check failed:', e);
            }
        }

        // 2. Check if Gemma model is downloaded
        const gemmaInstalled = await LocalAIService.isModelInstalled();

        return {
            isInstalled: gemmaInstalled || __DEV__,
            isDownloading: false,
            downloadProgress: gemmaInstalled ? 100 : 0,
            provider: gemmaInstalled ? 'gemma' : 'mock',
        };
    },

    /**
     * Check if native AI (Apple Intelligence / Gemini Nano) is available.
     */
    isNativeAvailable: async (): Promise<boolean> => {
        if (!LocalAI) return false;
        try {
            return await LocalAI.isAvailable();
        } catch {
            return false;
        }
    },

    /**
     * Check if the Gemma ONNX model is installed locally.
     */
    isModelInstalled: async (): Promise<boolean> => {
        try {
            const info = await FileSystem.getInfoAsync(getModelFile());
            return info.exists;
        } catch {
            return false;
        }
    },

    /**
     * Download the Gemma model for on-device inference.
     * @param onProgress Callback for download progress (0-100)
     */
    downloadModel: async (onProgress?: DownloadProgressCallback): Promise<void> => {
        // Ensure model directory exists
        const dirInfo = await FileSystem.getInfoAsync(getModelDir());
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(getModelDir(), { intermediates: true });
        }

        // Download with progress
        const downloadResumable = FileSystem.createDownloadResumable(
            MODEL_URL,
            getModelFile(),
            {},
            (downloadProgress) => {
                const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
                onProgress?.(Math.round(progress));
            }
        );

        try {
            const result = await downloadResumable.downloadAsync();
            if (result?.uri) {
                await AsyncStorage.setItem(MODEL_STORAGE_KEY, 'true');
                console.log('[LocalAI] Model downloaded successfully:', result.uri);
            }
        } catch (error) {
            console.error('[LocalAI] Download failed:', error);
            throw new Error('Échec du téléchargement du modèle IA');
        }
    },

    /**
     * Delete the downloaded model to free up space.
     */
    deleteModel: async (): Promise<void> => {
        try {
            await FileSystem.deleteAsync(getModelFile(), { idempotent: true });
            await AsyncStorage.removeItem(MODEL_STORAGE_KEY);
            console.log('[LocalAI] Model deleted');
        } catch (error) {
            console.error('[LocalAI] Delete failed:', error);
        }
    },

    /**
     * Get estimated model size in MB.
     */
    getModelSizeMB: (): number => MODEL_SIZE_MB,

    /**
     * Summarizes the provided text using on-device models.
     * Priority: Native → ONNX Gemma → Mock
     */
    summarize: async (text: string, period?: 'day' | 'week' | 'month'): Promise<{ summary: string; provider: AIProvider }> => {
        const periodLabel = period === 'day' ? 'journée' : period === 'week' ? 'semaine' : 'mois';

        // 1. Try native module first (Apple Intelligence / Gemini Nano)
        if (LocalAI) {
            try {
                const available = await LocalAI.isAvailable();
                if (available) {
                    const summary = await LocalAI.summarize(text);
                    return {
                        summary,
                        provider: Platform.OS === 'ios' ? 'apple' : 'gemini',
                    };
                }
            } catch (e) {
                console.warn('[LocalAI] Native summarization failed:', e);
            }
        }

        // 2. Try ONNX Gemma model
        const modelInstalled = await LocalAIService.isModelInstalled();
        if (modelInstalled) {
            try {
                // TODO: Integrate ONNX Runtime inference here
                // For now, return enhanced mock with period context
                const summary = await mockSummarizeWithPeriod(text, periodLabel);
                return { summary, provider: 'gemma' };
            } catch (e) {
                console.error('[LocalAI] ONNX inference failed:', e);
            }
        }

        // 3. Fallback to mock
        if (__DEV__) {
            return {
                summary: await mockSummarizeWithPeriod(text, periodLabel),
                provider: 'mock',
            };
        }

        throw new Error('Aucun modèle IA disponible. Veuillez installer le modèle Gemma.');
    },

    /**
     * Legacy method for backwards compatibility.
     */
    isAvailable: async (): Promise<boolean> => {
        const status = await LocalAIService.getStatus();
        return status.isInstalled;
    },
};

// ============================================
// Mock Summarizer
// ============================================

async function mockSummarizeWithPeriod(text: string, period: string): Promise<string> {
    // Simulate processing delay
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
