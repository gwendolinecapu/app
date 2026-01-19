import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../lib/theme';

interface RichTextProps {
    content: string;
    style?: TextStyle | TextStyle[];
    onMentionPress?: (mention: string) => void;
}

export const RichText: React.FC<RichTextProps> = ({ content, style, onMentionPress }) => {
    // Regex to match @mentions (alphanumeric, underscores, dots, hyphens often used in usernames)
    // Note: This regex assumes mentions are "words" starting with @. Adjust as needed for space-allowed names if using a different convention.
    // For now, supporting @Username or @SystemName (no spaces).
    const mentionRegex = /(@[\w.-]+)/g;

    const parts = content.split(mentionRegex);

    return (
        <Text style={style}>
            {parts.map((part, index) => {
                const isMention = part.startsWith('@') && part.length > 1;

                if (isMention) {
                    return (
                        <Text
                            key={index}
                            style={styles.mention}
                            onPress={() => onMentionPress ? onMentionPress(part) : null}
                        >
                            {part}
                        </Text>
                    );
                }
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
};

const styles = StyleSheet.create({
    mention: {
        color: colors.primary, // Using primary color for links
        fontWeight: '600',
    },
});
