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

/**
 * Compress video to TikTok-style quality
 * - Max 1080p resolution
 * - H.264 codec
 * - 3-5 Mbps bitrate
 * - Maintains aspect ratio
 */
export async function compressVideo(
    inputBuffer: Buffer,
    options: VideoCompressionOptions = {}
): Promise<Buffer> {
    const {
        maxHeight = 1080,
        bitrate = '4M', // 4 Mbps - TikTok style
        preset = 'medium' // Good balance between speed and compression
    } = options;

    // Create temp files
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);

    try {
        // Write input buffer to temp file
        fs.writeFileSync(inputPath, inputBuffer);

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

        // Read compressed video
        const compressedBuffer = fs.readFileSync(outputPath);

        console.log(`Video compressed: ${inputBuffer.length} → ${compressedBuffer.length} bytes (${Math.round(compressedBuffer.length / 1024 / 1024)}MB)`);

        return compressedBuffer;
    } finally {
        // Cleanup temp files
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }
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

    let finalBuffer = buffer;

    if (compress) {
        // Compress to 1080p max with TikTok-style quality
        finalBuffer = await compressVideo(buffer);
    }

    await file.save(finalBuffer, {
        metadata: {
            contentType: 'video/mp4',
            cacheControl: 'public, max-age=31536000' // Cache for 1 year
        }
    });
    await file.makePublic();

    return file.publicUrl();
}
