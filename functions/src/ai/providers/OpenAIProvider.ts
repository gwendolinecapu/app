
import { IImageProvider, ImageGenerationOptions } from "../interfaces/IImageProvider";

export class OpenAIProvider implements IImageProvider {
    private apiKey: string;
    private model: string; // 'dall-e-3' or 'dall-e-2'

    constructor(apiKey: string, model: string = "dall-e-3") {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateInfoImage(prompt: string, options?: ImageGenerationOptions): Promise<Buffer[]> {
        // Map abstract quality to OpenAI specific quality for gpt-image-1.5
        // Interface: 'eco' | 'std' | 'high'
        // User Request: 'low' | 'mid'
        // Mapping: eco -> low, std -> medium, high -> high
        let targetQuality = 'standard';
        if (this.model === 'gpt-image-1.5') {
            if (options?.quality === 'eco') targetQuality = 'low';
            else if (options?.quality === 'std') targetQuality = 'medium';
            else if (options?.quality === 'high') targetQuality = 'high';
        } else {
            // Fallback for DALL-E 3
            targetQuality = options?.quality === 'high' ? 'hd' : 'standard';
        }

        const size = "1024x1024";

        const payload: any = {
            model: this.model,
            prompt: prompt,
            n: 1,
            size: size,
            quality: targetQuality,
            response_format: "b64_json"
        };

        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI Error (${response.status}): ${errText}`);
        }

        const result = await response.json();
        const buffers = result.data.map((d: any) => Buffer.from(d.b64_json, 'base64'));
        return buffers;
    }
}
