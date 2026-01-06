export interface ILLMProvider {
    generateText(prompt: string, context?: any): Promise<string>;
    analyzeImage(imageBase64: string, prompt: string): Promise<any>;
    chat(messages: any[], context?: any): Promise<any>;
}
