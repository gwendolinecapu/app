export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ILLMProvider {
    /**
     * Generate text from prompt (and optional images for Vision)
     */
    generateText(prompt: string, context?: { images?: string[], systemInstruction?: string }): Promise<string>;

    /**
     * Chat completion
     */
    chat(messages: ChatMessage[], context?: { systemInstruction?: string }): Promise<string>;

    /**
     * Analyze images specific for "Visual DNA" or tagging
     */
    analyzeImage(imageBase64: string, prompt: string): Promise<string>;
}
