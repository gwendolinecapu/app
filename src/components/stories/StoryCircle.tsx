import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../lib/theme';

interface StoryCircleProps {
    authorName: string;
    authorAvatar?: string;
    hasUnviewed?: boolean;
    isAddStory?: boolean;
    onPress: () => void;
}

export const StoryCircle = ({
    authorName,
    authorAvatar,
    hasUnviewed = false,
    isAddStory = false,
    onPress,
}: StoryCircleProps) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.ringContainer}>
                {isAddStory ? (
                    <View style={styles.addStoryRing}>
                        <View style={styles.addStoryInner}>
                            {authorAvatar ? (
                                <Image source={{ uri: authorAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatar]} />
                            )}
                            <View style={styles.plusBadge}>
                                <Ionicons name="add" size={12} color="white" />
                            </View>
                        </View>
                    </View>
                ) : hasUnviewed ? (
                    <LinearGradient
                        colors={[colors.secondary, colors.primary]}
                        style={styles.gradientRing}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.innerContainer}>
                            {authorAvatar ? (
                                <Image source={{ uri: authorAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatar]}>
                                    <Text style={styles.initial}>{authorName.charAt(0)}</Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                ) : (
                    <View style={styles.seenRing}>
                        <View style={styles.innerContainer}>
                            {authorAvatar ? (
                                <Image source={{ uri: authorAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatar]}>
                                    <Text style={styles.initial}>{authorName.charAt(0)}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
            <Text style={styles.name} numberOfLines={1}>
                {isAddStory ? 'Votre story' : authorName}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginRight: spacing.md,
        width: 72,
    },
    ringContainer: {
        marginBottom: 4,
    },
    gradientRing: {
        width: 68,
        height: 68,
        borderRadius: 34,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seenRing: {
        width: 68,
        height: 68,
        borderRadius: 34,
        padding: 2,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addStoryRing: {
        width: 68,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerContainer: {
        backgroundColor: colors.background,
        borderRadius: 32,
        padding: 2,
        width: 64,
        height: 64,
    },
    addStoryInner: {
        width: 64,
        height: 64,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
    },
    placeholderAvatar: {
        backgroundColor: colors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    name: {
        ...typography.caption,
        fontSize: 11,
        textAlign: 'center',
        color: colors.text,
    },
    plusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
});
