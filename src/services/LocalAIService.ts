import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { GemmaTokenizer } from '@xenova/transformers';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

const { LocalAI } = NativeModules;

// ============================================
// Constants
// ============================================

const MODEL_ID = 'gemma-3n-e2b-it';
const MODEL_STORAGE_KEY = '@local_ai_model_installed';
// Helper getters for model paths (documentDirectory can be null on web)
const getModelDir = () => {
    if (Platform.OS === 'web') return 'models/';
    return `${(FileSystem as any).documentDirectory || ''}models/`;
};
const getModelFile = () => `${getModelDir()}${MODEL_ID}.onnx`;

// Hugging Face model URL (ONNX quantized version)
const MODEL_URL = 'https://huggingface.co/google/gemma-3n-E2B-it-ONNX/resolve/main/model_q4.onnx';
const TOKENIZER_URL = 'https://huggingface.co/google/gemma-3n-E2B-it-ONNX/resolve/main/tokenizer.json';
const TOKENIZER_CONFIG_URL = 'https://huggingface.co/google/gemma-3n-E2B-it-ONNX/resolve/main/tokenizer_config.json';

const getTokenizerFile = () => `${getModelDir()}tokenizer.json`;
const getTokenizerConfigFile = () => `${getModelDir()}tokenizer_config.json`;

const MODEL_SIZE_MB = 400; // Approximate size for progress estimation

// ============================================
// State
// ============================================

let tokenizer: GemmaTokenizer | null = null;
let inferenceSession: InferenceSession | null = null;

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
        // Web check: always mock
        if (Platform.OS === 'web') {
            return {
                isInstalled: __DEV__, // Only "installed" if dev mock is acceptable
                isDownloading: false,
                downloadProgress: 0,
                provider: 'mock',
            };
        }

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
        if (Platform.OS === 'web') return false;
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
        if (Platform.OS === 'web') return false;
        try {
            const modelInfo = await FileSystem.getInfoAsync(getModelFile());
            const tokenizerInfo = await FileSystem.getInfoAsync(getTokenizerFile());
            const tokenizerConfigInfo = await FileSystem.getInfoAsync(getTokenizerConfigFile());
            return modelInfo.exists && tokenizerInfo.exists && tokenizerConfigInfo.exists;
        } catch {
            return false;
        }
    },

    /**
     * Download the Gemma model for on-device inference.
     * @param onProgress Callback for download progress (0-100)
     */
    downloadModel: async (onProgress?: DownloadProgressCallback): Promise<void> => {
        if (Platform.OS === 'web') {
            throw new Error("Le téléchargement de modèles n'est pas supporté sur le web.");
        }

        // Ensure model directory exists
        const dirInfo = await FileSystem.getInfoAsync(getModelDir());
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(getModelDir(), { intermediates: true });
        }

        // Helper to download a file
        const downloadFile = async (url: string, file: string, reportProgress: boolean = false) => {
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                file,
                {},
                (downloadProgress) => {
                    if (reportProgress && onProgress) {
                        const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
                        onProgress(Math.round(progress));
                    }
                }
            );
            return downloadResumable.downloadAsync();
        };

        try {
            // Download tokenizer files first (small)
            await downloadFile(TOKENIZER_URL, getTokenizerFile());
            await downloadFile(TOKENIZER_CONFIG_URL, getTokenizerConfigFile());

            // Download model (large, reports progress)
            const result = await downloadFile(MODEL_URL, getModelFile(), true);

            if (result?.uri) {
                await AsyncStorage.setItem(MODEL_STORAGE_KEY, 'true');
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
        if (Platform.OS === 'web') return;
        try {
            await FileSystem.deleteAsync(getModelFile(), { idempotent: true });
            await FileSystem.deleteAsync(getTokenizerFile(), { idempotent: true });
            await FileSystem.deleteAsync(getTokenizerConfigFile(), { idempotent: true });
            await AsyncStorage.removeItem(MODEL_STORAGE_KEY);
        } catch (error) {
            console.error('[LocalAI] Delete failed:', error);
        }
    },

    /**
     * Get estimated model size in MB.
     */
    getModelSizeMB: (): number => MODEL_SIZE_MB,

    /**
     * Load resources (model and tokenizer) into memory.
     */
    loadResources: async () => {
        if (Platform.OS === 'web') return;
        if (!tokenizer) {
            const tokenizerJson = JSON.parse(await FileSystem.readAsStringAsync(getTokenizerFile()));
            const tokenizerConfig = JSON.parse(await FileSystem.readAsStringAsync(getTokenizerConfigFile()));
            tokenizer = new GemmaTokenizer(tokenizerJson, tokenizerConfig);
        }
        if (!inferenceSession) {
            // @ts-ignore
            inferenceSession = await InferenceSession.create(getModelFile());
        }
    },

    /**
     * Summarizes the provided text using on-device models.
     * Priority: Native → ONNX Gemma → Mock
     */
    summarize: async (text: string, period?: 'day' | 'week' | 'month'): Promise<{ summary: string; provider: AIProvider }> => {
        const periodLabel = period === 'day' ? 'journée' : period === 'week' ? 'semaine' : 'mois';

        if (Platform.OS === 'web') {
             return {
                summary: await mockSummarizeWithPeriod(text, periodLabel),
                provider: 'mock',
            };
        }

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
                await LocalAIService.loadResources();
                if (!tokenizer || !inferenceSession) throw new Error("Failed to load resources");

                // Construct prompt with period context and explicit French instruction to match app localization
                const prompt = `<start_of_turn>user\nSummarize the following journal entries for this ${period || 'period'} in French:\n${text}<end_of_turn>\n<start_of_turn>model\n`;
                const { input_ids } = tokenizer(prompt, { return_tensor: false, padding: true, truncation: true });

                // Convert to BigInt64Array for ONNX
                const inputIdsBigInt = input_ids.map((id: number) => BigInt(id));
                let sequence = [...inputIdsBigInt];

                const maxNewTokens = 200;

                // Simple greedy generation loop
                for (let i = 0; i < maxNewTokens; i++) {
                    // Yield to event loop every 5 tokens to avoid blocking UI
                    if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));

                    const inputTensor = new Tensor('int64', new BigInt64Array(sequence), [1, sequence.length]);
                    const attentionMask = new Tensor('int64', new BigInt64Array(new Array(sequence.length).fill(1n)), [1, sequence.length]);

                    const feeds = {
                        input_ids: inputTensor,
                        attention_mask: attentionMask
                    };

                    const results = await inferenceSession.run(feeds);
                    const logits = results.logits; // [1, seq_len, vocab_size]

                    const vocabSize = logits.dims[2];
                    const seqLen = logits.dims[1];
                    const lastTokenOffset = (seqLen - 1) * vocabSize;
                    const lastTokenLogits = logits.data.slice(lastTokenOffset, lastTokenOffset + vocabSize) as Float32Array;

                    let maxLogit = -Infinity;
                    let nextToken = -1;

                    for (let j = 0; j < lastTokenLogits.length; j++) {
                        if (lastTokenLogits[j] > maxLogit) {
                            maxLogit = lastTokenLogits[j];
                            nextToken = j;
                        }
                    }

                    if (nextToken === tokenizer.eos_token_id) break;

                    sequence.push(BigInt(nextToken));
                }

                const newTokens = sequence.slice(inputIdsBigInt.length).map(n => Number(n));
                const generatedText = tokenizer.decode(newTokens, { skip_special_tokens: true });

                // Format output to match the mock style (preserving the header/footer)
                const header = `📊 **Résumé de ta ${periodLabel}**\n\n`;
                const footer = `\n\n_Généré par Gemma localement_ 🔒`;
                const summary = header + generatedText + footer;

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
