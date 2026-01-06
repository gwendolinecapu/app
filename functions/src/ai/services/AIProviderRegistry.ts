import { ILLMProvider } from "../interfaces/ILLMProvider";
import { IImageProvider } from "../interfaces/IImageProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { BytePlusProvider } from "../providers/BytePlusProvider";
import { OpenAIProvider } from "../providers/OpenAIProvider";

export interface AIProviderConfig {
    llm: {
        default: string;
        fallback: string;
    };
    image: {
        default: string;
        fallback: string;
    };
    models: {
        [key: string]: {
            provider: string;
            modelName: string;
            apiKeyEnv: string;
        };
    };
}

export const AIConfig: AIProviderConfig = {
    llm: {
        default: "gemini_flash",
        fallback: "gemini_pro"
    },
    image: {
        default: "seedream",
        fallback: "seedream" // No other provider yet
    },
    models: {
        "gemini_flash": {
            provider: "gemini",
            modelName: "gemini-1.5-flash",
            apiKeyEnv: "GOOGLE_AI_API_KEY"
        },
        "gemini_pro": {
            provider: "gemini",
            modelName: "gemini-1.5-pro",
            apiKeyEnv: "GOOGLE_AI_API_KEY"
        },
        "seedream": {
            provider: "byteplus",
            modelName: "seedream-4-5-251128",
            apiKeyEnv: "BYTEPLUS_API_KEY"
        },
        "openai": {
            provider: "openai",
            modelName: "dall-e-3", // Default, specific model passed in options overrides this
            apiKeyEnv: "OPENAI_API_KEY"
        }
    }
};

export class AIProviderRegistry {
    private static instance: AIProviderRegistry;
    private providers: Map<string, ILLMProvider | IImageProvider> = new Map();

    private constructor() { }

    static getInstance(): AIProviderRegistry {
        if (!AIProviderRegistry.instance) {
            AIProviderRegistry.instance = new AIProviderRegistry();
        }
        return AIProviderRegistry.instance;
    }

    getLLM(configKey: string): ILLMProvider {
        if (this.providers.has(configKey)) return this.providers.get(configKey) as ILLMProvider;

        const config = AIConfig.models[configKey];
        if (!config) throw new Error(`Model config not found: ${configKey}`);

        const apiKey = process.env[config.apiKeyEnv];
        if (!apiKey) throw new Error(`Missing API Key: ${config.apiKeyEnv}`);

        let provider: ILLMProvider;
        if (config.provider === 'gemini') {
            provider = new GeminiProvider(apiKey, config.modelName);
        } else {
            throw new Error(`Unknown LLM provider type: ${config.provider}`);
        }

        this.providers.set(configKey, provider);
        return provider;
    }

    getImageGen(configKey: string): IImageProvider {
        if (this.providers.has(configKey)) return this.providers.get(configKey) as IImageProvider;

        const config = AIConfig.models[configKey];
        if (!config) throw new Error(`Model config not found: ${configKey}`);

        const apiKey = process.env[config.apiKeyEnv];
        if (!apiKey) throw new Error(`Missing API Key: ${config.apiKeyEnv}`);

        let provider: IImageProvider;
        if (config.provider === 'byteplus') {
            provider = new BytePlusProvider(apiKey, config.modelName);
        } else if (config.provider === 'openai') {
            provider = new OpenAIProvider(apiKey, config.modelName);
        } else {
            throw new Error(`Unknown Image provider type: ${config.provider}`);
        }

        this.providers.set(configKey, provider);
        return provider;
    }
}
