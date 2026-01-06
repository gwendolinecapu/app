import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryViewer } from '../../src/components/StoryViewer';
import { StoriesService } from '../../src/services/stories';
import { FriendService } from '../../src/services/friends';
import { useAuth } from '../../src/contexts/AuthContext';
import { Story } from '../../src/types';
import { colors } from '../../src/lib/theme';

export default function StoryViewScreen() {
    const { authorId } = useLocalSearchParams<{ authorId: string }>();
    const router = useRouter();
    const { user, currentAlter } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authorId || !user) {
            router.back();
            return;
        }

        const verifyAndLoad = async () => {
            try {
                // 1. Security Check
                const isSystemOwner = authorId === user.uid; // Check if it's the system
                // Note: authorId is usually an Alter ID for stories.
                // If it's an alter ID, we check if it belongs to us via currentAlter logic or system map? 
                // Simple: if currentAlter.id === authorId -> Owner.
                // If authorId is a System ID (rare for stories but possible), user.uid === authorId -> Owner.

                let isOwner = false;
                if (currentAlter && currentAlter.id === authorId) isOwner = true;
                if (user.uid === authorId) isOwner = true;

                // If not owner, check friendship
                if (!isOwner) {
                    if (!currentAlter) {
                        // Must be in an alter context to view stories usually?
                        // If system admin, maybe allowed? But typical flow is via alter.
                        // Let's assume strictness: need active alter or fail.
                        router.back();
                        return;
                    }

                    const status = await FriendService.checkStatus(currentAlter.id, authorId);
                    if (status !== 'friends') {
                        Alert.alert("Accès refusé", "Cette story est visible uniquement par les amis.");
                        router.back();
                        return;
                    }
                }

                // 2. Load Stories
                const fetchedStories = await StoriesService.fetchAuthorStories(authorId);
                if (fetchedStories.length === 0) {
                    router.back();
                } else {
                    setStories(fetchedStories);
                }
            } catch (error) {
                console.error('Error fetching stories:', error);
                router.back();
            } finally {
                setLoading(false);
            }
        };

        verifyAndLoad();
    }, [authorId, user, currentAlter]);

    const handleClose = () => {
        router.back();
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (stories.length === 0) return null;

    return (
        <StoryViewer
            visible={true}
            stories={stories}
            onClose={handleClose}
        />
    );
}
