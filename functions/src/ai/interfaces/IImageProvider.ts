export interface ImageGenerationOptions {
    width?: number;
    height?: number;
    count?: number;
    style?: string;
    referenceImages?: string[]; // Base64 or URLs
    referenceStrength?: number;
    quality?: 'eco' | 'std' | 'high'; // Added for model comparison
    model?: string;
}

export interface IImageProvider {
    /**
     * Generate images from text prompt
     * Returns array of Base64 strings or URLs
     */
    generateInfoImage(prompt: string, options?: ImageGenerationOptions): Promise<Buffer[]>;
}
