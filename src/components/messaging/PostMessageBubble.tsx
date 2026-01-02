import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Post } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface PostMessageBubbleProps {
    postId: string;
}

export const PostMessageBubble: React.FC<PostMessageBubbleProps> = ({ postId }) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const docRef = doc(db, 'posts', postId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() } as Post);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };

        if (postId) fetchPost();
    }, [postId]);

    if (loading) return <ActivityIndicator size="small" color={colors.primary} />;

    if (!post) {
        return (
            <View style={styles.container}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.notFoundText}>Post introuvable</Text>
            </View>
        );
    }

    const hasImage = post.media_url || (post.media_urls && post.media_urls.length > 0);
    const imageUrl = post.media_url || (post.media_urls ? post.media_urls[0] : null);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push(`/post/${post.id}` as any)}
        >
            {hasImage && imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            )}
            <View style={styles.content}>
                <Text style={styles.author}>{post.author_name}</Text>
                <Text style={styles.text} numberOfLines={3}>{post.content}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 4,
        minWidth: 200,
    },
    image: {
        width: '100%',
        height: 120,
    },
    content: {
        padding: spacing.sm,
    },
    author: {
        ...typography.caption,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    text: {
        ...typography.bodySmall,
        color: colors.text,
    },
    notFoundText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    }
});
