import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../lib/theme';

// =====================================================
// VIDEO PLAYER
// Lecteur vidéo avec contrôles overlay
// Autoplay muet par défaut, tap pour play/pause
// =====================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
    uri: string;
    autoPlay?: boolean;
    style?: any;
    onPress?: () => void;
}

export const VideoPlayer = ({ uri, autoPlay = true, style, onPress }: VideoPlayerProps) => {
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const [showControls, setShowControls] = useState(false);

    const isPlaying = status?.isLoaded && status.isPlaying;
    const isMuted = status?.isLoaded && status.isMuted;
    const duration = status?.isLoaded ? status.durationMillis || 0 : 0;
    const position = status?.isLoaded ? status.positionMillis || 0 : 0;
    const progress = duration > 0 ? position / duration : 0;

    // Check if video is loading
    const isLoading = !status || !status.isLoaded || (status.isLoaded && status.isBuffering);

    const togglePlay = useCallback(async () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
    }, [isPlaying]);

    const toggleMute = useCallback(async () => {
        if (!videoRef.current || !status?.isLoaded) return;
        await videoRef.current.setIsMutedAsync(!isMuted);
    }, [isMuted, status]);

    const handlePress = () => {
        if (onPress) {
            onPress();
            return;
        }
        setShowControls(prev => !prev);
        // Auto-hide after 3s
        setTimeout(() => setShowControls(false), 3000);
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={handlePress}
            activeOpacity={1}
        >
            <Video
                ref={videoRef}
                source={{ uri }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={autoPlay}
                isMuted={true} // Start muted for autoplay
                isLooping
                onPlaybackStatusUpdate={setStatus}
            />

            {/* Controls Overlay */}
            {showControls && (
                <View style={styles.controlsOverlay}>
                    {/* Play/Pause */}
                    <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={48}
                            color="white"
                        />
                    </TouchableOpacity>

                    {/* Mute Button */}
                    <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                        <Ionicons
                            name={isMuted ? 'volume-mute' : 'volume-high'}
                            size={24}
                            color="white"
                        />
                    </TouchableOpacity>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.timeText}>
                            {formatTime(position)} / {formatTime(duration)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            {/* Mute indicator when not showing controls */}
            {!showControls && isMuted && (
                <View style={styles.muteIndicator}>
                    <Ionicons name="volume-mute" size={16} color="white" />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    muteButton: {
        position: 'absolute',
        bottom: 50,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 70,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    timeText: {
        color: 'white',
        fontSize: 11,
        marginTop: 4,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    muteIndicator: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        padding: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
    },
});
