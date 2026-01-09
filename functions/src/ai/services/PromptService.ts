import { STYLES } from '../constants';

export class PromptService {
  static getRitualAnalysisPrompt() {
    return `
      Analyze these character reference images deeply (3D Scan Mode).
      Extract a "Visual DNA" description for an AI image generator.
      Focus on: Physical build, Face details, Hair, Clothing styles, Key colors, specific markings.
      Ignore: Pose, Background, Art Style (do not say 'cartoon', 'drawing', etc. - describe the subject as real).
      Output purely the physical visual description.
    `;
  }

  static getRitualRefSheetPrompt(visualDescription: string) {
    return `Generate a wide character reference sheet.
Layout: 3 or 4 distinct views standing SIDE-BY-SIDE in a single row (Front, Side, Back).
Style: High quality photorealistic character concept art, 8k.
IMPORTANT: NO GRID LINES, NO SPLIT SCREEN. Uniform white background.
The character should simply be standing next to themselves in different angles.
Constraint: Same character in all views, consistent clothing and details.
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
