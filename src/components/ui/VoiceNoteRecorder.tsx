import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

// =====================================================
// VOICE NOTE RECORDER
// Component to record, preview, and delete voice notes
// =====================================================

interface VoiceNoteRecorderProps {
    onRecordingComplete: (uri: string | null) => void;
    onCancel: () => void;
}

export const VoiceNoteRecorder = ({ onRecordingComplete, onCancel }: VoiceNoteRecorderProps) => {
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [durationMillis, setDurationMillis] = useState(0); // Recording duration

    // Animation values
    const pulseAnim = useSharedValue(1);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
            if (sound) {
                sound.unloadAsync();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [recording, sound]);

    // Format duration helper
    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Animated styles
    const micAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: pulseAnim.value }],
        };
    });

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                const response = await requestPermission();
                if (response.status !== 'granted') {
                    Alert.alert('Permission requise', "L'accès au micro est nécessaire pour enregistrer un message vocal.");
                    return;
                }
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setIsRecording(true);
            setDurationMillis(0);

            // Start timer
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setDurationMillis(Date.now() - startTime);
            }, 100) as unknown as NodeJS.Timeout;

            // Start animation
            pulseAnim.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Erreur', "Impossible de démarrer l'enregistrement.");
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        pulseAnim.value = withTiming(1); // Reset animation
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordedUri(uri);
            setRecording(null);

            // Notify parent if needed immediately, but we usually wait for confirmation
            // onRecordingComplete(uri);
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    };

    const playSound = async () => {
        if (!recordedUri) return;

        try {
            if (sound) {
                // If already loaded, just play/pause
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                // Load new sound
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: recordedUri },
                    { shouldPlay: true },
                    (status) => {
                        if (status.isLoaded) {
                            if (status.didJustFinish) {
                                setIsPlaying(false);
                                newSound.setPositionAsync(0);
                            } else {
                                setIsPlaying(status.isPlaying);
                            }
                        }
                    }
                );
                setSound(newSound);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing sound', error);
        }
    };

    const deleteRecording = () => {
        setRecordedUri(null);
        if (sound) {
            sound.unloadAsync();
            setSound(null);
        }
        setIsPlaying(false);
        onRecordingComplete(null);
    };

    const confirmRecording = () => {
        if (recordedUri) {
            onRecordingComplete(recordedUri);
        }
    };

    // RENDER: PREVIEW MODE (After recording)
    if (recordedUri) {
        return (
            <View style={styles.previewContainer}>
                <TouchableOpacity onPress={playSound} style={styles.playButton}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.waveformContainer}>
                    <Text style={styles.durationText}>{formatDuration(durationMillis)}</Text>
                    <View style={styles.waveformLine} />
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={deleteRecording} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={24} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmRecording} style={styles.confirmButton}>
                        <Ionicons name="checkmark" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // RENDER: RECORDING MODE
    return (
        <View style={styles.container}>
            {isRecording ? (
                <View style={styles.recordingState}>
                    <Animated.View style={[styles.micIndicator, micAnimatedStyle]}>
                        <Ionicons name="mic" size={32} color="#FFF" />
                    </Animated.View>
                    <Text style={styles.timerText}>{formatDuration(durationMillis)}</Text>
                    <Text style={styles.statusText}>Enregistrement en cours...</Text>

                    <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
                        <View style={styles.stopIcon} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.initialState}>
                    <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
                        <Ionicons name="mic" size={32} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.hintText}>Appuyez pour enregistrer</Text>
                    <TouchableOpacity onPress={onCancel} style={styles.cancelLink}>
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        minHeight: 200,
    },
    initialState: {
        alignItems: 'center',
        gap: spacing.md,
    },
    recordingState: {
        alignItems: 'center',
        gap: spacing.md,
        width: '100%',
    },
    recordButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    stopButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    stopIcon: {
        width: 24,
        height: 24,
        backgroundColor: colors.error,
        borderRadius: 4,
    },
    micIndicator: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerText: {
        ...typography.h2,
        fontVariant: ['tabular-nums'],
    },
    hintText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    statusText: {
        ...typography.body,
        color: colors.error,
        fontWeight: '600',
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
        width: '100%',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveformContainer: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
    },
    durationText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    waveformLine: {
        height: 3,
        backgroundColor: colors.border,
        width: '100%',
        borderRadius: 1.5,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        padding: spacing.sm,
    },
    confirmButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelLink: {
        marginTop: spacing.sm,
    },
    cancelText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    }
});
