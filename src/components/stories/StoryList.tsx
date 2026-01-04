import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { StoryCircle } from './StoryCircle';
import { StoriesService } from '../../services/stories';
import { useAuth } from '../../contexts/AuthContext';
import { FriendService } from '../../services/friends';
import { StoryGroup, Story } from '../../types';
import { colors, spacing } from '../../lib/theme';

interface StoryListProps {
    refreshTrigger?: number; // To force refresh
}

export const StoryList = ({ refreshTrigger }: StoryListProps) => {
    const { user, currentAlter } = useAuth(); // currentAlter needed for "create" author
    const router = useRouter();
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
    const [loading, setLoading] = useState(false);

    // Pour "Votre story" (current system/alter)
    // On pourrait checker si on a déjà une story active
    const [myStories, setMyStories] = useState<Story[]>([]);

    useEffect(() => {
        if (!user) return;
        loadStories();
    }, [user, refreshTrigger]);

    const loadStories = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Get ALL system friends (aggregated)
            const friendSystemIds = await FriendService.getAllSystemFriendSystemIds(user.uid);

            // 2. Fetch active stories from friends AND self
            const allStories = await StoriesService.fetchActiveStories(friendSystemIds, user.uid);

            // 3. Group by author
            // But first separate "my" stories
            const mine = allStories.filter(s => s.system_id === user.uid);
            const others = allStories.filter(s => s.system_id !== user.uid);

            setMyStories(mine);

            const grouped = StoriesService.groupStoriesByAuthor(others);
            setStoryGroups(grouped);

        } catch (error) {
            console.error('Failed to load stories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStory = () => {
        router.push('/story/create');
    };

    const handleViewStory = (authorId: string) => {
        router.push({
            pathname: '/story/view',
            params: { authorId }
        });
    };

    if (loading && storyGroups.length === 0) {
        return (
            <View style={[styles.container, { height: 100, justifyContent: 'center' }]}>
                {/* Skeleton or simple loading? */}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* "Your Story" Circle */}
                <StoryCircle
                    authorName="Votre story"
                    authorAvatar={currentAlter?.avatar_url || undefined}
                    isAddStory={myStories.length === 0}
                    hasUnviewed={myStories.length > 0} // Or check if *I* have viewed my own stories? usually regular ring if active
                    onPress={() => {
                        if (myStories.length > 0) {
                            // View my stories
                            // But usually tapping "Your Story" when active shows them.
                            // If want to add more? Usually long press or separate button.
                            // Let's simple: if stories exist, view them.
                            handleViewStory(currentAlter?.id || user!.uid); // Actually authorId might be mixed if system has multiple alters posting?
                            // StoriesService.fetchActiveStories returns stories. 
                            // If "myStories" contains stories from different alters of mine...
                            // We should probably group "My Stories" as well or view all "My System" stories?
                            // For MVP: View stories of specific author.
                            // If I have multiple alters, where do they go?
                            // StoriesService groups by AUTHOR (Alter).
                            // So "My Stories" should probably be separate bubbles per Alter if multiple posted?
                            // OR one "System Story" bubble?
                            // Instagram is per account.
                            // Let's assume for now "Your Story" = Current Front's story or System's story.

                            // Re-think: "Your Story" usually implies the current user context.
                            // If I switch alters, do I see that alter's story as "Your Story"?
                            // Yes.

                            // What if other alters in my system posted?
                            // They should appear in the list as "others" (but internal)?
                            // Let's keep it simple: "Your Story" is for creating.
                            // If I have stories, viewing them.
                            // Grouping logic might need refinement for system-mates.
                            handleViewStory(myStories[0].author_id);
                        } else {
                            handleCreateStory();
                        }
                    }}
                />

                {/* Other Stories */}
                {storyGroups.map(group => (
                    <StoryCircle
                        key={group.authorId}
                        authorName={group.authorName}
                        authorAvatar={group.authorAvatar}
                        hasUnviewed={group.hasUnviewed}
                        onPress={() => handleViewStory(group.authorId)}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 100,
        backgroundColor: colors.background,
        borderBottomWidth: 1, // Optional separator
        borderBottomColor: 'transparent', // or colors.border
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
});
