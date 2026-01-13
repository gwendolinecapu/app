import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface VideoThumbnailProps {
    mediaUrl: string;
    style?: any;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ mediaUrl, style }) => {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const generateThumbnail = async () => {
            if (!mediaUrl) return;

            setLoading(true);
            setError(false);

            // Try different times in case the video is very short
            const timesToTry = [2000, 1000, 500, 0];

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
                    // Silently fail - caller handles error display
                }
            }

            // If we're here, all attempts failed
            if (isMounted) {
                setError(true);
                setLoading(false);
            }
        };

        generateThumbnail();

        return () => {
            isMounted = false;
        };
    }, [mediaUrl]);

    return (
        <View style={[styles.container, style]}>
            {thumbnail ? (
                <Image
                    source={{ uri: thumbnail }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
            ) : (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
                    {loading && <ActivityIndicator color="white" size="small" />}
                    {error && <Ionicons name="videocam-off-outline" size={24} color="#666" />}
                </View>
            )}

            {!loading && !error && (
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
    },
    overlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
    }
});
