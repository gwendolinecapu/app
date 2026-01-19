import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';

// =====================================================
// AUDIO PLAYER
// Lecteur audio avec barre de progression animée
// Pour messages vocaux et autres fichiers audio
// =====================================================

interface AudioPlayerProps {
    uri: string;
    duration?: number; // Duration in ms if known
}

export const AudioPlayer = ({ uri, duration: initialDuration }: AudioPlayerProps) => {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(initialDuration || 0);
    const [position, setPosition] = useState(0);

    const progress = duration > 0 ? position / duration : 0;

    const loadSound = async () => {
        if (soundRef.current) return;

        try {
            const { sound, status } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false },
                onPlaybackStatusUpdate
            );
            soundRef.current = sound;

            if (status.isLoaded && status.durationMillis) {
                setDuration(status.durationMillis);
            }
        } catch (error) {
            console.error('Failed to load audio:', error);
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        setPosition(status.positionMillis || 0);
        setIsPlaying(status.isPlaying);

        if (status.durationMillis && !duration) {
            setDuration(status.durationMillis);
        }

        // Reset when finished
        if (status.didJustFinish) {
            setPosition(0);
            setIsPlaying(false);
        }
    };

    const togglePlay = async () => {
        if (!soundRef.current) {
            await loadSound();
        }

        if (!soundRef.current) return;

        if (isPlaying) {
            await soundRef.current.pauseAsync();
        } else {
            await soundRef.current.playAsync();
        }
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* Play/Pause Button */}
            <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={24}
                    color="white"
                />
            </TouchableOpacity>

            {/* Waveform/Progress Area */}
            <View style={styles.progressArea}>
                {/* Progress bar background */}
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>

                {/* Waveform effect (decorative) */}
                <View style={styles.waveform}>
                    {Array.from({ length: 25 }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.waveBar,
                                {
                                    height: 8 + Math.sin(i * 0.5) * 8 + Math.random() * 6,
                                    opacity: i / 25 <= progress ? 1 : 0.3,
                                }
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Duration */}
            <Text style={styles.duration}>
                {isPlaying ? formatTime(position) : formatTime(duration)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        gap: spacing.sm,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressArea: {
        flex: 1,
        height: 32,
        justifyContent: 'center',
        position: 'relative',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        top: '50%',
        marginTop: -2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
    },
    waveBar: {
        width: 3,
        backgroundColor: colors.primary,
        borderRadius: 1.5,
    },
    duration: {
        ...typography.caption,
        color: colors.textSecondary,
        minWidth: 40,
        textAlign: 'right',
    },
});
