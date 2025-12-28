import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

export default function CreatePostScreen() {
    const { currentAlter, system } = useAuth();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert('Erreur', 'Écrivez quelque chose !');
            return;
        }

        if (!system || !currentAlter) {
            Alert.alert('Erreur', 'Sélectionnez un alter avant de poster');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('posts').insert({
                system_id: system.id,
                alter_id: currentAlter.id,
                content: content.trim(),
                visibility: 'system',
            });

            if (error) throw error;

            router.back();
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handlePost}
                    disabled={loading || !content.trim()}
                >
                    <LinearGradient
                        colors={
                            content.trim()
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

            <View style={styles.composer}>
                <View style={styles.alterInfo}>
                    <View
                        style={[
                            styles.avatar,
                            { backgroundColor: currentAlter?.color || colors.primary },
                        ]}
                    >
                        <Text style={styles.avatarText}>
                            {currentAlter?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.alterName}>
                            {currentAlter?.name || 'Sélectionnez un alter'}
                        </Text>
                        <Text style={styles.visibility}>🔒 Visible par le système</Text>
                    </View>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Que voulez-vous partager ?"
                    placeholderTextColor={colors.textMuted}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    autoFocus
                    maxLength={500}
                />

                <Text style={styles.charCount}>{content.length}/500</Text>
            </View>
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
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
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
    composer: {
        flex: 1,
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
    },
    input: {
        flex: 1,
        ...typography.body,
        fontSize: 18,
        textAlignVertical: 'top',
    },
    charCount: {
        ...typography.caption,
        textAlign: 'right',
        marginTop: spacing.md,
    },
});
