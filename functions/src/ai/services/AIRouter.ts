import { AIConfig, AIProviderRegistry } from "./AIProviderRegistry";

interface RouterResult<T> {
    result: T;
    providerUsed: string;
    fallbackUsed: boolean;
}

export class AIRouter {
    private registry = AIProviderRegistry.getInstance();

    async generateText(prompt: string, context?: { images?: string[], systemInstruction?: string }): Promise<RouterResult<string>> {
        const primaryKey = AIConfig.llm.default;
        const fallbackKey = AIConfig.llm.fallback;

        try {
            const provider = this.registry.getLLM(primaryKey);
            const result = await provider.generateText(prompt, context);
            return { result, providerUsed: primaryKey, fallbackUsed: false };
        } catch (error: any) {
            console.warn(`Primary LLM (${primaryKey}) failed: ${error.message}. Attempting fallback...`);

            // Check if error is fatal (e.g. invalid prompt) - assume validation errors are 400s or specific messages
            if (this.isFatalError(error)) throw error;

            if (primaryKey === fallbackKey) throw error; // No fallback possible

            try {
                const provider = this.registry.getLLM(fallbackKey);
                const result = await provider.generateText(prompt, context);
                return { result, providerUsed: fallbackKey, fallbackUsed: true };
            } catch (fallbackError: any) {
                console.error(`Fallback LLM (${fallbackKey}) failed: ${fallbackError.message}`);
                throw new Error(`AI Generation Failed: ${fallbackError.message}`);
            }
        }
    }

    async analyzeImage(imageBase64: string, prompt: string): Promise<RouterResult<string>> {
        const primaryKey = AIConfig.llm.default;
        const fallbackKey = AIConfig.llm.fallback; // Gemini Pro is better for Vision fallback

        try {
            const provider = this.registry.getLLM(primaryKey);
            const result = await provider.analyzeImage(imageBase64, prompt);
            return { result, providerUsed: primaryKey, fallbackUsed: false };
        } catch (error: any) {
            if (this.isFatalError(error)) throw error;
            if (primaryKey === fallbackKey) throw error;

            const provider = this.registry.getLLM(fallbackKey);
            const result = await provider.analyzeImage(imageBase64, prompt);
            return { result, providerUsed: fallbackKey, fallbackUsed: true };
        }
    }

    async generateImage(prompt: string, options?: any): Promise<RouterResult<Buffer[]>> {
        const primaryKey = AIConfig.image.default;
        const fallbackKey = AIConfig.image.fallback;

        try {
            const provider = this.registry.getImageGen(primaryKey);
            const result = await provider.generateInfoImage(prompt, options);
            return { result, providerUsed: primaryKey, fallbackUsed: false };
        } catch (error: any) {
            if (this.isFatalError(error)) throw error;
            if (primaryKey === fallbackKey) throw error;

            const provider = this.registry.getImageGen(fallbackKey);
            const result = await provider.generateInfoImage(prompt, options);
            return { result, providerUsed: fallbackKey, fallbackUsed: true };
        }
    }

    async chat(messages: any[], context?: any): Promise<RouterResult<string>> {
        const primaryKey = AIConfig.llm.default;
        // Chat likely uses same LLM Config
        const provider = this.registry.getLLM(primaryKey);
        // Fallback logic could be added here similar to generateText
        try {
            const result = await provider.chat(messages, context);
            return { result, providerUsed: primaryKey, fallbackUsed: false };
        } catch (error: any) {
            // Simplified fallback for chat
            if (this.isFatalError(error)) throw error;
            const fallbackKey = AIConfig.llm.fallback;
            const fallbackProvider = this.registry.getLLM(fallbackKey);
            const result = await fallbackProvider.chat(messages, context);
            return { result, providerUsed: fallbackKey, fallbackUsed: true };
        }
    }

    private isFatalError(error: any): boolean {
        const msg = error.message || "";
        // If 400 Bad Request, usually client error (prompt blocked, invalid param)
        if (msg.includes('400') || msg.includes('INVALID_ARGUMENT') || msg.includes('blocked')) return true;
        return false;
    }
}
