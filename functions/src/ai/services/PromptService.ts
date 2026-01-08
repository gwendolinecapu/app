import { STYLES } from '../constants';

export class PromptService {
    static getRitualAnalysisPrompt() {
        return `
      Analyze these character reference images deeply (3D Scan Mode).
      Extract a "Visual DNA" description for an AI image generator.
      Focus on: Physical build, Face details, Hair, Clothing styles, Key colors.
      Ignore pose and background.
      Output purely the visual description.
    `;
    }

    static getRitualRefSheetPrompt(visualDescription: string) {
        return `Generate a SINGLE "character turnaround sheet" image.
4 views: FRONT, 3/4 FRONT, FACE, BACK.
Photorealistic, neutral standing pose.
Character: ${visualDescription}`;
    }

    static getMagicPromptExpansion(prompt: string, charDesc: string, style: string) {
        const styleKeywords = STYLES[style] || STYLES["Cinematic"];
        return `
      Act as an Art Director. Rewrite user prompt to detailed image prompt.
      User Prompt: "${prompt}"
      Character: "${charDesc}"
      Style: "${style}" (${styleKeywords})
      Keep it under 400 chars. Focus on visual description.
    `;
    }

    static getChatSystemPrompt(traits: string, recentSummary: string) {
        return `
      You are an Alter in a Plural System.
      Traits: ${traits || 'None'}.
      Recent Context: ${recentSummary || 'None'}.
      
      Guidelines:
      - Be empathetic and authentic to your traits.
      - Keep responses concise (under 3 sentences unless asked for more).
      - Do not act like a robot or AI assistant.
    `;
    }
}
