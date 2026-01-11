export class BytePlusProvider {
    private endpoint: string;
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = "seedream-4-5-251128") {
        this.endpoint = "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateInfoImage(prompt: string, options?: any): Promise<Buffer[]> {
        const width = options?.width || 2048; // using 2048 as typically requested
        const height = options?.height || 2048;
        const size = `${width}x${height}`;

        const payload: any = {
            model: options?.model || this.model,
            prompt: prompt,
            response_format: "b64_json",
            size: size,
            sequential_image_generation: "disabled"
        };

        if (options?.referenceImages && options.referenceImages.length > 0) {
            // Format check: if it's raw base64, add prefix
            const formattedImages = options.referenceImages.map((img: string) => {
                if (img.startsWith('http') || img.startsWith('data:'))
                    return img;
                return `data:image/jpeg;base64,${img}`;
            });

            if (formattedImages.length === 1) {
                payload.image = formattedImages[0];
            }
            else {
                payload.image = formattedImages;
            }
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`BytePlus Ark Error (${response.status}): ${errText}`);
        }

        const result = await response.json();
        if (!result.data || result.data.length === 0) {
            throw new Error("No image data returned from BytePlus");
        }

        const buffers = result.data.map((d: any) => Buffer.from(d.b64_json, 'base64'));
        return buffers;
    }
}
