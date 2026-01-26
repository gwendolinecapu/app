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
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { PostService } from '../../src/services/posts';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { getThemeColors } from '../../src/lib/cosmetics';
import { VoiceNoteRecorder } from '../../src/components/ui/VoiceNoteRecorder';
import { VideoPlayer } from '../../src/components/ui/VideoPlayer';
import { AudioPlayer } from '../../src/components/ui/AudioPlayer';
import { MentionList, MentionSuggestion } from '../../src/components/ui/MentionList';
import { FriendService } from '../../src/services/friends';
import { AlterService } from '../../src/services/alters';

import { useSuccessAnimation } from '../../src/contexts/SuccessAnimationContext';
import { MagicPostGenerator } from '../../src/components/posts/MagicPostGenerator';

import AsyncStorage from '@react-native-async-storage/async-storage';

type PostType = 'text' | 'photo' | 'video' | 'audio';

const DRAFT_STORAGE_KEY = 'post_draft_v1';

export default function CreatePostScreen() {
    const { activeFront, system, currentAlter, alters } = useAuth();
    const { play: playSuccessAnimation } = useSuccessAnimation();
    const [postType, setPostType] = useState<PostType>('text');
    const [content, setContent] = useState('');
    const [mediaUris, setMediaUris] = useState<string[]>([]); // Changed to array
    const [audioUri, setAudioUri] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    // --- MENTIONS ---
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [allSuggestions, setAllSuggestions] = useState<MentionSuggestion[]>([]);
    const [filteredMentions, setFilteredMentions] = useState<MentionSuggestion[]>([]);
    const [mentionedIds, setMentionedIds] = useState<Set<string>>(new Set());
    const [cursorPosition, setCursorPosition] = useState(0);
    const [showMagicModal, setShowMagicModal] = useState(false);

    // --- COSMETICS ---
    const themeId = activeFront?.type === 'single' ? activeFront?.alters[0]?.equipped_items?.theme : undefined;
    const themeColors = getThemeColors(themeId);
    const backgroundStyle = { backgroundColor: themeColors?.background || colors.background };

    const { type } = useLocalSearchParams<{ type?: string }>();

    useEffect(() => {
        checkDraft();
    }, []);

    useEffect(() => {
        if (type === 'magic') {
            setShowMagicModal(true);
        }
    }, [type]);

    useEffect(() => {
        // Auto-save draft when content changes
        if (isDraftLoaded) {
            saveDraft();
        }
    }, [content, mediaUris, audioUri, postType, isDraftLoaded]);

    // Load suggestions on mount
    useEffect(() => {
        loadSuggestions();
    }, [currentAlter]);

    const loadSuggestions = async () => {
        if (!currentAlter) return;

        try {
            // 1. Own Alters (Internal)
            const internalOptions: MentionSuggestion[] = alters.map(a => ({
                id: a.id,
                name: a.name,
                username: a.name.replace(/\s+/g, '').toLowerCase(), // rough handle
                avatar: a.avatar || a.avatar_url,
                type: 'alter'
            }));

            // 2. Friends (External Alters)
            const friendIds = await FriendService.getFriends(currentAlter.id);
            const friendsData = await AlterService.getAlters(friendIds);
            const friendOptions: MentionSuggestion[] = friendsData.map(f => ({
                id: f.id,
                name: f.name,
                username: f.name.replace(/\s+/g, '').toLowerCase(),
                avatar: f.avatar || f.avatar_url,
                type: 'alter'
            }));

            // Merge and dedup
            const all = [...internalOptions, ...friendOptions];
            // Simple dedup by ID
            const seen = new Set();
            const unique = all.filter(item => {
                const duplicate = seen.has(item.id);
                seen.add(item.id);
                return !duplicate;
            });

            setAllSuggestions(unique);
        } catch (e) {
            console.error("Error loading mention suggestions:", e);
        }
    };

    const handleTextChange = (text: string) => {
        setContent(text);

        const lastWord = text.split(/\s+/).pop();
        if (lastWord && lastWord.startsWith('@')) {
            const query = lastWord.substring(1).toLowerCase();
            setMentionQuery(query);
            setShowMentions(true);

            // Filter
            const matches = allSuggestions.filter(s =>
                s.name.toLowerCase().includes(query) ||
                (s.username && s.username.toLowerCase().includes(query))
            );
            setFilteredMentions(matches.slice(0, 5)); // Limit to 5
        } else {
            setShowMentions(false);
        }
    };

    const handleMentionSelect = (item: MentionSuggestion) => {
        const lastIndex = content.lastIndexOf('@' + mentionQuery);
        if (lastIndex !== -1) {
            const prefix = content.substring(0, lastIndex);

            const mentionText = `@${item.name}`;

            const newContent = prefix + mentionText + ' ';
            setContent(newContent);
            setShowMentions(false);

            // Track mentioned ID
            if (item.type === 'alter') {
                setMentionedIds(prev => new Set(prev).add(item.id));
            }
        }
    };

    const checkDraft = async () => {
        try {
            const draftJson = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
            if (draftJson) {
                const draft = JSON.parse(draftJson);
                // Check if draft has meaningful content
                if (draft.content || (draft.mediaUris && draft.mediaUris.length > 0) || draft.audioUri) {
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
                                    setMediaUris(draft.mediaUris || []);
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
            if (!content && mediaUris.length === 0 && !audioUri) {
                return;
            }
            const draft = {
                content,
                mediaUris,
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

    // Permission sera demandée seulement lors du clic sur photo/vidéo (dans pickMedia)

    const pickMedia = async (type: 'photo' | 'video') => {
        // Demander la permission d'abord
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
                return;
            }
        }

        // If we switch to photo/video, clear audio
        setAudioUri(null);

        // If clicking same type, we append? No, standard behavior is usually new selection or append
        // Let's assume append for photos, replace for video (since we usually do 1 video)

        if (type === 'video') {
            // For video, single selection for now to keep it simple
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 0.8,
            });
            if (!result.canceled) {
                setMediaUris([result.assets[0].uri]); // Video replaces everything
                setPostType('video');
            }
        } else {
            // For photos, allow multiple
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true, // Enable multiple
                selectionLimit: 10,
                quality: 0.8,
            });

            if (!result.canceled) {
                const newUris = result.assets.map(a => a.uri);
                if (postType === 'photo') {
                    // Append if already photos
                    setMediaUris(prev => [...prev, ...newUris]);
                } else {
                    // Replace if was text or video
                    setMediaUris(newUris);
                }
                setPostType('photo');
            }
        }
    };

    const removeMedia = (index: number) => {
        setMediaUris(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (updated.length === 0 && postType === 'photo') {
                setPostType('text'); // Revert to text if no photos left
            }
            return updated;
        });
    };

    const handleVoiceRecording = (uri: string | null) => {
        if (uri) {
            setAudioUri(uri);
            // Clear other media
            setMediaUris([]);
        } else {
            setAudioUri(null);
        }
    };

    const handlePost = async () => {
        const trimmedContent = content.trim();

        if (!trimmedContent && mediaUris.length === 0 && !audioUri) {
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
            let uploadedUrls: string[] = [];
            let mainMediaUrl = undefined;

            if (mediaUris.length > 0) {
                if (postType === 'video') {
                    // Single video
                    const url = await PostService.uploadVideo(mediaUris[0], system.id);
                    uploadedUrls = [url];
                    mainMediaUrl = url;
                } else {
                    // Photos
                    // Upload all in parallel
                    uploadedUrls = await Promise.all(
                        mediaUris.map(uri => PostService.uploadImage(uri, system.id))
                    );
                    mainMediaUrl = uploadedUrls[0]; // First one is main
                }
            } else if (audioUri) {
                const url = await PostService.uploadAudio(audioUri, system.id);
                mainMediaUrl = url;
            }

            // Construct post data based on activeFront
            const postData: any = {
                system_id: system.id,
                content: content.trim(),
                visibility: 'public', // Could be selectable
                author_type: activeFront.type,
            };

            // Add media
            if (uploadedUrls.length > 0) {
                postData.media_urls = uploadedUrls;
                postData.media_url = uploadedUrls[0]; // Backward compatibility
            } else if (mainMediaUrl) {
                postData.media_url = mainMediaUrl; // For audio
            }

            if (activeFront.type === 'single' && activeFront.alters.length > 0) {
                postData.alter_id = activeFront.alters[0].id;
            } else if (activeFront.type === 'co-front') {
                postData.co_front_alter_ids = activeFront.alters.map(a => a.id);
                if (activeFront.alters.length > 0) postData.alter_id = activeFront.alters[0].id;
            } else if (activeFront.type === 'blurry') {
                // No specific alter_id
            }

            // Add mentions
            postData.mentioned_alter_ids = Array.from(mentionedIds);

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



    const handleMagicSuccess = (imageUri: string) => {
        setMediaUris([imageUri]);
        setPostType('photo');
        setShowMagicModal(false);
    };

    const renderTypeSelector = () => (
        <View>
            <TouchableOpacity
                style={styles.magicButton}
                onPress={() => setShowMagicModal(true)}
            >
                <LinearGradient
                    colors={[colors.secondary, '#8b5cf6']} // Gold/Purple gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.magicGradient}
                >
                    <Ionicons name="sparkles" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.magicButtonText}>Générer avec Magie IA</Text>
                </LinearGradient>
            </TouchableOpacity>

            <View style={[styles.typeSelector, themeColors && { backgroundColor: themeColors.backgroundCard }]}>
                <TouchableOpacity
                    style={[styles.typeButton, postType === 'text' && styles.typeButtonActive]}
                    onPress={() => {
                        setPostType('text');
                        setMediaUris([]);
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
                        setMediaUris([]);
                    }}
                >
                    <Ionicons name="mic" size={20} color={postType === 'audio' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.typeText, postType === 'audio' && styles.typeTextActive]}>Vocal</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, backgroundStyle]}
        >
            <View style={[styles.header, backgroundStyle, { borderBottomColor: themeColors?.border || colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={[styles.cancelText, themeColors && { color: themeColors.textSecondary }]}>Annuler</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, themeColors && { color: themeColors.text }]}>Nouveau post</Text>
                <TouchableOpacity
                    onPress={handlePost}
                    disabled={loading || (!content.trim() && mediaUris.length === 0 && !audioUri)}
                >
                    <LinearGradient
                        colors={
                            (content.trim() || mediaUris.length > 0 || audioUri)
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
                    {postType === 'audio' && mediaUris.length === 0 && (
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
                        style={[styles.input, themeColors && { color: themeColors.text }]}
                        placeholder={postType === 'audio' ? "Ajoutez une description..." : (postType === 'text' ? "Quoi de neuf ?" : "Ajoutez une légende...")}
                        placeholderTextColor={themeColors?.textSecondary || colors.textMuted}
                        value={content}
                        onChangeText={handleTextChange}
                        onSelectionChange={(event) => setCursorPosition(event.nativeEvent.selection.end)}
                        multiline
                        maxLength={500}
                    />

                    {/* Multi-Image Preview */}
                    {mediaUris.length > 0 && (
                        <View style={styles.mediaPreviewContainer}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                            >
                                {mediaUris.map((uri, index) => (
                                    <View key={index} style={styles.previewItem}>
                                        {postType === 'video' ? (
                                            <VideoPlayer uri={uri} autoPlay={false} />
                                        ) : (
                                            <Image source={{ uri }} style={styles.mediaImage} />
                                        )}
                                        <TouchableOpacity
                                            style={styles.removeMedia}
                                            onPress={() => removeMedia(index)}
                                        >
                                            <Ionicons name="close-circle" size={24} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {postType === 'photo' && mediaUris.length < 10 && (
                                    <TouchableOpacity
                                        style={styles.addMoreButton}
                                        onPress={() => pickMedia('photo')}
                                    >
                                        <Ionicons name="add" size={32} color={colors.textSecondary} />
                                        <Text style={styles.addMoreText}>Ajouter</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                            <Text style={styles.imageCountText}>{mediaUris.length} média(s)</Text>
                        </View>
                    )}
                </View>

                {/* Mention List showing above keyboard if needed, or embedded logic */}
            </ScrollView>

            {/* Mention Suggestions Layer */}
            {showMentions && (
                <View style={[styles.mentionContainer, { paddingBottom: 0 }]}>
                    <MentionList
                        data={filteredMentions}
                        onSelect={handleMentionSelect}
                    />
                </View>
            )}


            <MagicPostGenerator
                visible={showMagicModal}
                onClose={() => setShowMagicModal(false)}
                onSuccess={handleMagicSuccess}
                alters={alters} // Pass all alters, component filters for DNA
                activeAlterId={activeFront?.type === 'single' ? activeFront.alters[0]?.id : undefined}
            />
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    // ... existing styles ...
    mentionContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 0 : 0, // KeyboardAvoidingView handles the lift?
        // Actually KeyboardAvoidingView with behavior 'padding' pushes content up.
        // We might need to place this absolute relative to the INPUT or adjust accordingly.
        // For simplicity now, let's put it inside KeyboardAvoidingView but at the bottom.
        left: 0,
        right: 0,
        maxHeight: 220,
        backgroundColor: colors.backgroundCard,
        zIndex: 9999,
    },

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
    mediaPreviewContainer: {
        width: '100%',
        height: 220,
    },
    previewItem: {
        width: 200,
        height: 200,
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
    addMoreButton: {
        width: 100,
        height: 200,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addMoreText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 4
    },
    imageCountText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 8,
        textAlign: 'right'
    },
    audioPreview: {
        marginBottom: spacing.md,
        position: 'relative',
    },
    removeMedia: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
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

    magicButton: {
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    magicGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    magicButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
