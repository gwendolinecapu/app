import { STYLES } from '../constants';

export class PromptService {
  static getRitualRefSheetPrompt() {
    return `Create a single, wide character reference sheet on a pure white seamless background in landscape format.

COMPOSITION
- One single horizontal image (no panels, no split-screen, no collage).
- 4 views of the SAME character aligned on the same baseline, side-by-side in ONE row:
  1) Full-body FRONT view (distant shot, entire character visible)
  2) Full-body SIDE PROFILE view (distant shot, facing right)
  3) Full-body BACK view (distant shot, facing away)
  4) CLOSE-UP of the FACE (detailed facial features, shoulders visible)
- Equal spacing between the four views, consistent scale for the full-body shots.

STYLE & QUALITY
- High-end photorealistic character concept art, ultra-detailed, sharp focus, 8k look.
- Neutral studio lighting, soft shadow under the feet for full-body views.
- Professional portrait lighting for the face close-up.
- No text, no labels, no watermark.

STRICT NEGATIVES (MUST NOT APPEAR)
- No grid lines, no frames, no borders, no separators, no panels.
- No split screen, no quad layout, no "four images stitched together".
- No background gradient, no props, no extra objects, no environment.

CONSISTENCY RULES
- Same character identity across all views: face, body shape, hairstyle, skin tone, accessories.
- Same outfit and materials in all views (identical clothing, colors, logos, textures).
- Same camera height for the three full-body shots.
- Face close-up must match exactly the character's facial features from full-body views.

REFERENCE COMPLIANCE
- Match the reference images exactly for character appearance and clothing details.
- Do not stylize or redesign the character. Do not add or remove accessories.`;
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
