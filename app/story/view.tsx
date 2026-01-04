import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryViewer } from '../../src/components/StoryViewer';
import { StoriesService } from '../../src/services/stories';
import { Story } from '../../src/types';
import { colors } from '../../src/lib/theme';

export default function StoryViewScreen() {
    const { authorId } = useLocalSearchParams<{ authorId: string }>();
    const router = useRouter();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authorId) {
            router.back();
            return;
        }

        const loadStories = async () => {
            try {
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

        loadStories();
    }, [authorId]);

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
