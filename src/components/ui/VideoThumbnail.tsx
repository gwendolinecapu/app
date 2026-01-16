import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface VideoThumbnailProps {
    mediaUrl: string;
    style?: any;
    themeColors?: any;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ mediaUrl, style, themeColors }) => {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const generateThumbnail = async () => {
            if (!mediaUrl) return;

            setLoading(true);
            setError(false);

            // Try 1s first (often avoids black start frames), then 0, then others
            const timesToTry = [1000, 0, 2000, 500];

            for (const time of timesToTry) {
                try {
                    const { uri } = await VideoThumbnails.getThumbnailAsync(mediaUrl, {
                        time,
                        quality: 0.6,
                    });

                    if (isMounted) {
                        setThumbnail(uri);
                        setLoading(false);
                        return; // Success!
                    }
                } catch (e) {
                    // Silently fail - continue to next time
                    console.log(`Thumbnail generation failed for time ${time}:`, e);
                }
            }

            // If we're here, all attempts failed
            if (isMounted) {
                console.log("All thumbnail attempts failed, falling back to Video component");
                setError(true);
                setLoading(false);
            }
        };

        generateThumbnail();

        return () => {
            isMounted = false;
        };
    }, [mediaUrl]);

    // FALLBACK: If thumbnail generation failed, show the actual Video component
    // paused at 1s (to avoid black start), muted, as a pseudo-thumbnail.
    if (error) {
        return (
            <View style={[styles.container, style]}>
                <Video
                    source={{ uri: mediaUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isMuted={true}
                    positionMillis={1000}
                    useNativeControls={false}
                />
                <View style={styles.overlay}>
                    <Ionicons name="play" size={28} color="white" />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {thumbnail ? (
                <Image
                    source={{ uri: thumbnail }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={200}
                />
            ) : (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
                    {loading && <ActivityIndicator color="white" size="small" />}
                </View>
            )}

            {!loading && (
                <View style={styles.overlay}>
                    <Ionicons name="play" size={28} color="white" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    overlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 4,
    }
});
