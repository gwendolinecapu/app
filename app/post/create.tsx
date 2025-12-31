import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { PostService } from '../../src/services/posts';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { VoiceNoteRecorder } from '../../src/components/ui/VoiceNoteRecorder';
import { VideoPlayer } from '../../src/components/ui/VideoPlayer';
import { AudioPlayer } from '../../src/components/ui/AudioPlayer';

import { useSuccessAnimation } from '../../src/contexts/SuccessAnimationContext';

type PostType = 'text' | 'photo' | 'video' | 'audio';

import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_STORAGE_KEY = 'post_draft_v1';

export default function CreatePostScreen() {
    const { activeFront, system, currentAlter } = useAuth();
    const { play: playSuccessAnimation } = useSuccessAnimation();
    const [postType, setPostType] = useState<PostType>('text');
    const [content, setContent] = useState('');
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    useEffect(() => {
        checkDraft();
    }, []);

    useEffect(() => {
        // Auto-save draft when content changes
        if (isDraftLoaded) {
            saveDraft();
        }
    }, [content, mediaUri, audioUri, postType, isDraftLoaded]);

    const checkDraft = async () => {
        try {
            const draftJson = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
            if (draftJson) {
                const draft = JSON.parse(draftJson);
                // Check if draft has meaningful content
                if (draft.content || draft.mediaUri || draft.audioUri) {
                    Alert.alert(
                        'Brouillon trouvé',
                        'Voulez-vous reprendre votre dernier post ?',
                        [
                            {
                                text: 'Non',
                                style: 'cancel',
                                onPress: () => {
                                    clearDraft();
                                    setIsDraftLoaded(true);
                                }
                            },
                            {
                                text: 'Oui',
                                onPress: () => {
                                    setContent(draft.content || '');
                                    setMediaUri(draft.mediaUri || null);
                                    setAudioUri(draft.audioUri || null);
                                    setPostType(draft.postType || 'text');
                                    setIsDraftLoaded(true);
                                }
                            }
                        ]
                    );
                    return;
                }
            }
            setIsDraftLoaded(true);
        } catch (e) {
            console.error('Failed to load draft', e);
            setIsDraftLoaded(true);
        }
    };

    const saveDraft = async () => {
        try {
            if (!content && !mediaUri && !audioUri) {
                return;
            }
            const draft = {
                content,
                mediaUri,
                audioUri,
                postType,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        } catch (e) {
            console.error('Failed to save draft', e);
        }
    };

    const clearDraft = async () => {
        try {
            await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear draft', e);
        }
    };

    useEffect(() => {
        // Request permissions on mount just in case
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
                }
            }
        })();
    }, []);

    const pickMedia = async (type: 'photo' | 'video') => {
        // If we switch to photo/video, clear audio
        setAudioUri(null);

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false, // Disabled to support GIFs and original aspect ratios
            quality: 0.8, // Basic compression
        });

        if (!result.canceled) {
            setMediaUri(result.assets[0].uri);
            setPostType(type);
        }
    };

    const handleVoiceRecording = (uri: string | null) => {
        if (uri) {
            setAudioUri(uri);
            // Clear other media
            setMediaUri(null);
        } else {
            setAudioUri(null);
        }
    };

    const handlePost = async () => {
        const trimmedContent = content.trim();

        if (!trimmedContent && !mediaUri && !audioUri) {
            Alert.alert('Erreur', 'Ajoutez du contenu à votre post !');
            return;
        }

        if (trimmedContent.length > 500) {
            Alert.alert('Erreur', 'Le post ne doit pas dépasser 500 caractères');
            return;
        }

        if (!system) {
            Alert.alert('Erreur', 'Système non identifié');
            return;
        }

        // Validation check for active front
        if (!activeFront) {
            Alert.alert('Erreur', 'Aucun alter actif détecté');
            return;
        }


        setLoading(true);
        try {
            let mediaUrl = undefined;

            if (mediaUri) {
                mediaUrl = await PostService.uploadImage(mediaUri, system.id);
            } else if (audioUri) {
                mediaUrl = await PostService.uploadAudio(audioUri, system.id);
            }

            // Construct post data based on activeFront
            const postData: any = {
                system_id: system.id,
                content: content.trim(),
                visibility: 'public', // Could be selectable
                author_type: activeFront.type,
            };

            // Ajouter media_url seulement si elle existe
            if (mediaUrl) {
                postData.media_url = mediaUrl;
            }

            if (activeFront.type === 'single' && activeFront.alters.length > 0) {
                postData.alter_id = activeFront.alters[0].id;
            } else if (activeFront.type === 'co-front') {
                postData.co_front_alter_ids = activeFront.alters.map(a => a.id);
                if (activeFront.alters.length > 0) postData.alter_id = activeFront.alters[0].id;
            } else if (activeFront.type === 'blurry') {
                // No specific alter_id
            }

            await PostService.createPost(postData);

            // Clear draft on success
            await clearDraft();

            playSuccessAnimation();

            // Wait a bit for animation to be seen
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.message || "Erreur lors de la publication");
        } finally {
            setLoading(false);
        }
    };

    const renderTypeSelector = () => (
        <View style={styles.typeSelector}>
            <TouchableOpacity
                style={[styles.typeButton, postType === 'text' && styles.typeButtonActive]}
                onPress={() => {
                    setPostType('text');
                    setMediaUri(null);
                    setAudioUri(null);
                }}
            >
                <Ionicons name="text" size={20} color={postType === 'text' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.typeText, postType === 'text' && styles.typeTextActive]}>Tweet</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.typeButton, postType === 'photo' && styles.typeButtonActive]}
                onPress={() => pickMedia('photo')}
            >
                <Ionicons name="image" size={20} color={postType === 'photo' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.typeText, postType === 'photo' && styles.typeTextActive]}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.typeButton, postType === 'video' && styles.typeButtonActive]}
                onPress={() => pickMedia('video')}
            >
                <Ionicons name="videocam" size={20} color={postType === 'video' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.typeText, postType === 'video' && styles.typeTextActive]}>Vidéo</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.typeButton, postType === 'audio' && styles.typeButtonActive]}
                onPress={() => {
                    setPostType('audio');
                    setMediaUri(null);
                }}
            >
                <Ionicons name="mic" size={20} color={postType === 'audio' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.typeText, postType === 'audio' && styles.typeTextActive]}>Vocal</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouveau post</Text>
                <TouchableOpacity
                    onPress={handlePost}
                    disabled={loading || (!content.trim() && !mediaUri && !audioUri)}
                >
                    <LinearGradient
                        colors={
                            (content.trim() || mediaUri || audioUri)
                                ? [colors.gradientStart, colors.gradientEnd]
                                : [colors.textMuted, colors.textMuted]
                        }
                        style={styles.postButton}
                    >
                        <Text style={styles.postButtonText}>
                            {loading ? '...' : 'Publier'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.alterInfo}>
                    <View
                        style={[
                            styles.avatar,
                            { backgroundColor: activeFront?.type === 'blurry' ? colors.textMuted : (activeFront?.alters[0]?.color || colors.primary) },
                        ]}
                    >
                        {activeFront?.type === 'blurry' ? (
                            <Ionicons name="eye-off-outline" size={24} color="#FFF" />
                        ) : activeFront?.alters[0]?.avatar_url ? (
                            <Image source={{ uri: activeFront.alters[0].avatar_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {activeFront?.alters[0]?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        )}
                    </View>
                    <View>
                        <Text style={styles.alterName}>
                            {activeFront?.type === 'blurry'
                                ? 'Mode Flou / Système'
                                : activeFront?.type === 'co-front'
                                    ? activeFront.alters.map(a => a.name).join(' & ')
                                    : activeFront?.alters[0]?.name || 'Anonyme'}
                        </Text>
                        <Text style={styles.visibility}>
                            {activeFront?.type === 'co-front' ? '👥 Co-Front' : activeFront?.type === 'blurry' ? '🌫️ Blurry' : '👤 Single'} • 🔒 Public
                        </Text>
                    </View>
                </View>

                {renderTypeSelector()}

                <View style={styles.contentContainer}>
                    {/* Voice Note Recorder Section */}
                    {postType === 'audio' && !mediaUri && (
                        <View style={styles.recorderContainer}>
                            <VoiceNoteRecorder
                                onRecordingComplete={handleVoiceRecording}
                                onCancel={() => setPostType('text')}
                            />
                        </View>
                    )}

                    {/* Preview Areas */}
                    {audioUri && postType !== 'audio' && (
                        <View style={styles.audioPreview}>
                            <AudioPlayer uri={audioUri} />
                            <TouchableOpacity
                                style={styles.removeMedia}
                                onPress={() => setAudioUri(null)}
                            >
                                <Ionicons name="close-circle" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder={postType === 'audio' ? "Ajoutez une description..." : (postType === 'text' ? "Quoi de neuf ?" : "Ajoutez une légende...")}
                        placeholderTextColor={colors.textMuted}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={500}
                    />

                    {mediaUri && (
                        <View style={styles.mediaPreview}>
                            {postType === 'video' ? (
                                <VideoPlayer uri={mediaUri} autoPlay={false} />
                            ) : (
                                <Image source={{ uri: mediaUri }} style={styles.mediaImage} />
                            )}

                            <TouchableOpacity
                                style={styles.removeMedia}
                                onPress={() => {
                                    setMediaUri(null);
                                    setPostType('text');
                                }}
                            >
                                <Ionicons name="close-circle" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: 60,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        ...typography.h3,
        fontSize: 16,
    },
    cancelText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    postButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
    },
    postButtonText: {
        color: colors.text,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: spacing.lg,
    },
    alterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        overflow: 'hidden',
    },
    avatarText: {
        color: colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    alterName: {
        ...typography.body,
        fontWeight: 'bold',
    },
    visibility: {
        ...typography.caption,
        marginTop: 2,
        color: colors.success,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.xs,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    typeButtonActive: {
        backgroundColor: colors.backgroundLight,
    },
    typeText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 11,
    },
    typeTextActive: {
        color: colors.text,
    },
    contentContainer: {
        flex: 1,
    },
    recorderContainer: {
        marginBottom: spacing.md,
    },
    input: {
        ...typography.body,
        fontSize: 18,
        textAlignVertical: 'top',
        minHeight: 100,
        marginBottom: spacing.md,
        marginTop: spacing.md,
    },
    mediaPreview: {
        width: '100%',
        height: 300,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: colors.backgroundCard,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    audioPreview: {
        marginBottom: spacing.md,
        position: 'relative',
    },
    removeMedia: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
        zIndex: 10,
    },
    videoBadge: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
