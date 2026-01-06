import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ILLMProvider, ChatMessage } from "../interfaces/ILLMProvider";

export class GeminiProvider implements ILLMProvider {
    private genAI: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, modelName: string = "gemini-1.5-flash") {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    private getModel(systemInstruction?: string) {
        return this.genAI.getGenerativeModel({
            model: this.modelName,
            systemInstruction: systemInstruction,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ]
        });
    }

    async generateText(prompt: string, context?: { images?: string[], systemInstruction?: string }): Promise<string> {
        const model = this.getModel(context?.systemInstruction);

        const parts: any[] = [{ text: prompt }];

        if (context?.images) {
            context.images.forEach(b64 => {
                parts.push({
                    inlineData: {
                        mimeType: 'image/jpeg', // Assuming jpeg for simplicity, could be dynamic
                        data: b64
                    }
                });
            });
        }

        const result = await model.generateContent(parts);
        return result.response.text();
    }

    async chat(messages: ChatMessage[], context?: { systemInstruction?: string }): Promise<string> {
        const model = this.getModel(context?.systemInstruction);

        // Convert messages to Gemini format
        // Gemini history shouldn't include System message (it's separate) or the last user message (it's sent in sendMessage)
        const history = messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || lastMsg.role !== 'user') throw new Error("Last message must be user");

        const chatSession = model.startChat({
            history: history,
        });

        const result = await chatSession.sendMessage(lastMsg.content);
        return result.response.text();
    }

    async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
        return this.generateText(prompt, { images: [imageBase64] });
    }
}
