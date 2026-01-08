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
    const { authorId, highlightId } = useLocalSearchParams<{ authorId: string, highlightId: string }>();
    const router = useRouter();
    const { user, currentAlter } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ((!authorId && !highlightId) || !user) {
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

                if (!isOwner) {
                    // Start of Strict Friendship Check
                    // User requested strict Alter-Alter friendship.
                    const status = await FriendService.checkStatus(currentAlter?.id || '', authorId);
                    if (status !== 'friends') {
                        Alert.alert("Accès refusé", "Cette story est visible uniquement par les amis.");
                        router.back();
                        return;
                    }
                }

                if (highlightId) {
                    // Highlight Mode
                    // 1. Fetch Highlight to verify ownership/visibility (optional but good)
                    // For now, just load the stories using ids
                    // Note: Ideally we should fetch highlight first to check permissions if private?
                    // Assuming highlights are public for friends of author.

                    // We need the highlight object to get story_ids
                    // But we don't have a direct "getHighlightById" method that is singular?
                    // We can't fetch all author highlights.
                    // But wait, we received highlightId.

                    // Let's assume we pass the storyIds ? No, URL limit.
                    // We need getHighlightById.
                    // Wait, I didn't add getHighlightById.

                    // Let's implement a quick fetch for highlight or just rely on passing storyIds via service?
                    // No, let's add fetchHighlightById to service or...
                    // Wait, fetchHighlights returns all.

                    // Let's add fetchHighlight(id) to service or just iterate if not too many?
                    // Better: add fetchHighlight to service.

                    // Re-evaluating: I missed checking if fetchHighlight exists.
                    // It does NOT.

                    // Okay, plan change: 
                    // I will implement fetching the specific highlight in StoryView using a direct doc get (using firebase/firestore imports if needed, but better via Service).

                    // Let's assume I will adding fetchHighlight to service in next step?
                    // Or I can use fetchHighlights(authorId) and find it. 
                    // But I might not know authorId if I only have highlightId? 
                    // The params have authorId usually.
                    // Let's try finding it in author's highlights if authorId is present.

                    if (authorId) {
                        const highlights = await StoriesService.fetchHighlights(authorId);
                        const highlight = highlights.find(h => h.id === highlightId);
                        if (highlight && highlight.story_ids.length > 0) {
                            const rawStories = await StoriesService.fetchStoriesByIds(highlight.story_ids);

                            // Filter stories based on author friendship
                            // Start Promise.all to check status for each unique author if needed?
                            // Optimization: We know friendStatus with the Highlight Owner (Mona).
                            // But stories inside might be from others (Alice).

                            // 1. Get unique authors
                            const authors = [...new Set(rawStories.map(s => s.author_id))];

                            // 2. Filter allowed authors
                            const allowedAuthors = new Set<string>();
                            allowedAuthors.add(currentAlter?.id || '');
                            if (user) allowedAuthors.add(user.uid);

                            for (const authorId of authors) {
                                if (allowedAuthors.has(authorId)) continue;
                                // Check friendship
                                try {
                                    const status = await FriendService.checkStatus(currentAlter?.id || '', authorId);
                                    if (status === 'friends') {
                                        allowedAuthors.add(authorId);
                                    }
                                } catch (e) {
                                    console.warn("Failed to check story privacy for author", authorId);
                                }
                            }

                            const validStories = rawStories.filter(s => allowedAuthors.has(s.author_id));

                            if (validStories.length === 0) {
                                // Silent fail: behave as if content doesn't exist
                                router.back();
                                return;
                            }

                            setStories(validStories);
                        } else {
                            setStories([]);
                        }
                    }
                } else {
                    // Active Stories Mode
                    const fetchedStories = await StoriesService.fetchAuthorStories(authorId);
                    if (fetchedStories.length === 0) {
                        router.back();
                    } else {
                        setStories(fetchedStories);
                    }
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
