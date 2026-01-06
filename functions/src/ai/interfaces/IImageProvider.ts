export interface IImageProvider {
    generateInfoImage(prompt: string, options?: any): Promise<Buffer[]>;
}
