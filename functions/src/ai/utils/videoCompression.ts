import * as admin from 'firebase-admin';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// FFmpeg imports
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

interface VideoCompressionOptions {
    maxHeight?: number;
    bitrate?: string;
    preset?: string;
}

export interface CompressionResult {
    outputPath: string;
    cleanup: () => void;
}

/**
 * Compress video to TikTok-style quality
 * - Max 1080p resolution
 * - H.264 codec
 * - 3-5 Mbps bitrate
 * - Maintains aspect ratio
 *
 * Returns path to compressed file instead of buffer to save memory.
 */
export async function compressVideo(
    inputBuffer: Buffer,
    options: VideoCompressionOptions = {}
): Promise<CompressionResult> {
    const {
        maxHeight = 1080,
        bitrate = '4M', // 4 Mbps - TikTok style
        preset = 'medium' // Good balance between speed and compression
    } = options;

    // Create temp files
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

    const cleanupFile = (file: string) => {
        try {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        } catch (err) {
            console.error(`Error cleaning up file ${file}:`, err);
        }
    };

    try {
        // Write input buffer to temp file
        await fs.promises.writeFile(inputPath, inputBuffer);

        // Compress with FFmpeg
        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .videoCodec('libx264') // H.264 codec
                .videoBitrate(bitrate) // Target bitrate
                .size('?x' + maxHeight) // Max height, width auto-calculated to maintain aspect ratio
                .outputOptions([
                    '-preset ' + preset,
                    '-movflags +faststart', // Enable streaming
                    '-pix_fmt yuv420p', // Compatibility
                    '-profile:v baseline', // Baseline profile for max compatibility
                    '-level 3.1'
                ])
                .output(outputPath)
                .on('end', () => resolve())
                .on('error', (err: Error) => reject(err))
                .run();
        });

        // Input is no longer needed
        cleanupFile(inputPath);
        // Read compressed video
        // const compressedBuffer = await fs.promises.readFile(outputPath);

        const stats = fs.statSync(outputPath);
        console.log(`Video compressed: ${inputBuffer.length} → ${stats.size} bytes (${Math.round(stats.size / 1024 / 1024)}MB)`);

        return {
            outputPath,
            cleanup: () => cleanupFile(outputPath)
        };

    } catch (err) {
        // Cleanup on error
        cleanupFile(inputPath);
        cleanupFile(outputPath);
        throw err;
    }
}

/**
 * Upload video to Firebase Storage with optional compression
 */
export async function uploadVideo(
    buffer: Buffer,
    path: string,
    compress = true
): Promise<string> {
    const bucket = admin.storage().bucket();
    const file = bucket.file(path);

    if (compress) {
        // Compress to 1080p max with TikTok-style quality
        // This now streams the upload instead of loading the result into memory
        const { outputPath, cleanup } = await compressVideo(buffer);

        try {
            await bucket.upload(outputPath, {
                destination: path,
                metadata: {
                    contentType: 'video/mp4',
                    cacheControl: 'public, max-age=31536000' // Cache for 1 year
                }
            });
        } finally {
            cleanup();
        }
    } else {
        await file.save(buffer, {
            metadata: {
                contentType: 'video/mp4',
                cacheControl: 'public, max-age=31536000' // Cache for 1 year
            }
        });
    }

    await file.makePublic();

    return file.publicUrl();
}
