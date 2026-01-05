import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { VideoThumbnail } from '../ui/VideoThumbnail';
import { colors } from '../../lib/theme';
import { ThemeColors } from '../../lib/cosmetics';

interface GridMediaItemProps {
    mediaUrl: string;
    themeColors?: ThemeColors | null;
}

export const GridMediaItem: React.FC<GridMediaItemProps> = ({ mediaUrl, themeColors }) => {
    const isVideo = React.useMemo(() => {
        if (!mediaUrl) return false;
        const cleanUrl = mediaUrl.split('?')[0].toLowerCase();
        return (
            cleanUrl.endsWith('.mp4') ||
            cleanUrl.endsWith('.mov') ||
            cleanUrl.endsWith('.avi') ||
            cleanUrl.endsWith('.webm')
        );
    }, [mediaUrl]);

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
            <VideoThumbnail
                mediaUrl={mediaUrl}
                style={styles.image}
            />
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
