import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { ThemeColors } from '../../lib/cosmetics';

interface GridMediaItemProps {
    mediaUrl: string;
    themeColors?: ThemeColors | null;
}

export const GridMediaItem: React.FC<GridMediaItemProps> = ({ mediaUrl, themeColors }) => {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const isVideo = mediaUrl && (
        mediaUrl.toLowerCase().endsWith('.mp4') ||
        mediaUrl.toLowerCase().endsWith('.mov') ||
        mediaUrl.toLowerCase().endsWith('.avi') ||
        mediaUrl.toLowerCase().endsWith('.webm')
    );

    useEffect(() => {
        let isMounted = true;

        const generateThumbnail = async () => {
            if (!isVideo) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                // Generate thumbnail from the video
                // We request a frame at 100ms to be safer than 0ms
                const { uri } = await VideoThumbnails.getThumbnailAsync(
                    mediaUrl,
                    {
                        time: 100,
                        quality: 0.5,
                    }
                );
                if (isMounted) {
                    setThumbnail(uri);
                    setLoading(false);
                }
            } catch (e) {
                console.warn("Could not generate thumbnail for", mediaUrl, e);
                // If generation fails, we will fallback to Video component
                if (isMounted) setLoading(false);
            }
        };

        generateThumbnail();

        return () => {
            isMounted = false;
        };
    }, [mediaUrl, isVideo]);

    if (!isVideo) {
        return (
            <Image
                source={{ uri: mediaUrl }}
                style={styles.image}
                contentFit="cover"
                transition={200}
            />
        );
    }

    return (
        <View style={styles.container}>
            {thumbnail ? (
                <Image
                    source={{ uri: thumbnail }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                />
            ) : (
                // Fallback: If thumbnail generation failed or is stuck, use actual Video component paused
                <View style={[styles.placeholder, { backgroundColor: themeColors?.surface || colors.surface }]}>
                    <Video
                        source={{ uri: mediaUrl }}
                        style={styles.image}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted={true}
                        positionMillis={100} // Try to show first frame
                        onLoad={() => setLoading(false)}
                        onError={() => setLoading(false)}
                    />
                    {loading && (
                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                            <ActivityIndicator size="small" color={themeColors?.primary || colors.primary} />
                        </View>
                    )}
                </View>
            )}
            <View style={styles.videoOverlay}>
                <Ionicons name="play" size={20} color="white" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#000', // Default black background for videos
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoOverlay: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 4,
    }
});
