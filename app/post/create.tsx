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
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

type PostType = 'text' | 'photo' | 'video';

export default function CreatePostScreen() {
    const { currentAlter, system } = useAuth();
    const [postType, setPostType] = useState<PostType>('text');
    const [content, setContent] = useState('');
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'photo'
                ? ImagePicker.MediaTypeOptions.Images
                : ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            aspect: type === 'photo' ? [4, 5] : undefined, // Portrait ratio for instagram feel
            quality: 0.8,
        });

        if (!result.canceled) {
            setMediaUri(result.assets[0].uri);
            setPostType(type);
        }
    };

    const handlePost = async () => {
        if (!content.trim() && !mediaUri) {
            Alert.alert('Erreur', 'Ajoutez du contenu à votre post !');
            return;
        }

        if (!system || !currentAlter) {
            Alert.alert('Erreur', 'Sélectionnez un alter avant de poster');
            return;
        }

        setLoading(true);
        try {
            // Upload media if present
            // Note: Actual Supabase storage upload is mocked here as we don't have bucket setup/context confirmed.
            // We'll proceed as if the URI is valid or store it directly (DB might reject long URI).
            // For production, insert upload logic here.

            const postData = {
                system_id: system.id,
                alter_id: currentAlter.id,
                content: content.trim(),
                media_url: mediaUri, // This should be the public URL after upload
                visibility: 'public', // Default to public as requested
                // type: postType, // If we had a type column
            };

            const { error } = await supabase.from('posts').insert(postData);

            if (error) throw error;

            router.back();
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
                onPress={() => setPostType('text')}
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
                    disabled={loading || (!content.trim() && !mediaUri)}
                >
                    <LinearGradient
                        colors={
                            (content.trim() || mediaUri)
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
                            { backgroundColor: currentAlter?.color || colors.primary },
                        ]}
                    >
                        {currentAlter?.avatar_url ? (
                            <Image source={{ uri: currentAlter.avatar_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {currentAlter?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        )}
                    </View>
                    <View>
                        <Text style={styles.alterName}>
                            {currentAlter?.name || 'Sélectionnez un alter'}
                        </Text>
                        <Text style={styles.visibility}>🔒 Public</Text>
                    </View>
                </View>

                {renderTypeSelector()}

                <View style={styles.contentContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={postType === 'text' ? "Quoi de neuf ?" : "Ajoutez une légende..."}
                        placeholderTextColor={colors.textMuted}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={500}
                    />

                    {mediaUri && (
                        <View style={styles.mediaPreview}>
                            <Image source={{ uri: mediaUri }} style={styles.mediaImage} />
                            <TouchableOpacity
                                style={styles.removeMedia}
                                onPress={() => {
                                    setMediaUri(null);
                                    setPostType('text');
                                }}
                            >
                                <Ionicons name="close-circle" size={24} color={colors.text} />
                            </TouchableOpacity>
                            {postType === 'video' && (
                                <View style={styles.videoBadge}>
                                    <Ionicons name="play" size={20} color="#FFF" />
                                </View>
                            )}
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
    },
    typeTextActive: {
        color: colors.text,
    },
    contentContainer: {
        flex: 1,
    },
    input: {
        ...typography.body,
        fontSize: 18,
        textAlignVertical: 'top',
        minHeight: 100,
        marginBottom: spacing.md,
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
    removeMedia: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
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
