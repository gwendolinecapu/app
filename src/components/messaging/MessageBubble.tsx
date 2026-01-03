import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image as RNImage } from 'react-native';
import { Message, Alter } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { GroupService } from '../../services/groups';
import { getBubbleStyle, getThemeColors } from '../../lib/cosmetics';

interface MessageBubbleProps {
    message: Message;
    isMine: boolean;
    senderAlter?: Alter;
    currentUserId?: string; // system ID or alter ID depending on logic. Here assumes systemId for voting
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isMine,
    senderAlter,
    currentUserId
}) => {
    const senderName = senderAlter ? senderAlter.name : "Membre inconnu";
    const senderColor = senderAlter ? senderAlter.color : colors.textSecondary;
    const [showReactions, setShowReactions] = React.useState(false);

    // Get bubble style from cosmetics
    const bubbleId = senderAlter?.equipped_items?.bubble;
    const themeId = senderAlter?.equipped_items?.theme;
    const bubbleStyle = getBubbleStyle(bubbleId, isMine);
    const themeColors = getThemeColors(themeId);

    // Dynamic Colors
    const myBubbleColor = themeColors?.primary || colors.primary;
    const myTextColor = themeColors?.text || colors.text; // Actually usually white on primary, checking usage below
    // The original code used 'white' text on primary bubbles implicitly or explicit color style?
    // Original: messageTextMine: { color: colors.text } but overridden?
    // Actually original `messageTextMine` has `color: colors.text`. Wait.
    // Line 258: `color: colors.text, //OnPrimary if primary is dark` -> this looks like a comment or mistake in my reading?
    // Let's look at line 258 in the file content I read:
    // 257:     messageTextMine: {
    // 258:         color: colors.text,//OnPrimary if primary is dark
    // 259:     },
    // So it was using `colors.text`. If `colors.primary` is dark (e.g. blue), then `colors.text` (white/black) might be wrong depending on theme.
    // Usually "Mine" bubbles have white text if the background is dark primary.
    // Let's assume specific "onPrimary" text color if possible, or default to white for strong primary colors.
    // For now, I will use `#fff` for mine bubbles to match typical primary button styles, or `themeColors.background` if inverted?
    // Most themes have a dark/vibrant primary, so white text is safe.

    // Group callbacks for reactions
    const groupByEmoji = (reactions: { emoji: string; user_id: string }[]) => {
        const grouped: Record<string, number> = {};
        reactions.forEach(r => {
            grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
        });
        return Object.entries(grouped);
    };

    const handleLongPress = () => {
        // Toggle reaction picker (simplified)
        setShowReactions(!showReactions);
    };

    const handleReaction = (emoji: string) => {
        if (!currentUserId) return;
        GroupService.toggleReaction(message.id, emoji, currentUserId);
        setShowReactions(false);
    };

    const REACTION_OPTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

    // --- Renderers for types ---

    const renderText = () => (
        <Text style={[
            styles.messageText,
            isMine ? { color: '#fff' } : { color: themeColors?.text || colors.text },
            bubbleStyle?.textStyle
        ]}>
            {message.content}
        </Text>
    );

    const renderNote = () => {
        const parts = message.content.split('|||');
        const title = parts.length > 1 ? parts[0] : 'Note';
        const body = parts.length > 1 ? parts[1] : message.content;

        return (
            <View style={styles.noteContainer}>
                <View style={styles.noteHeader}>
                    <Ionicons name="document-text" size={20} color={colors.text} />
                    <Text style={styles.noteTitle}>{title}</Text>
                </View>
                <View style={styles.noteDivider} />
                <Text style={styles.noteBody}>{body}</Text>
            </View>
        );
    };

    const renderPoll = () => {
        const options = message.poll_options || [];
        const votes = message.poll_votes || [];
        const totalVotes = votes.length;

        // Check if I voted
        const myVote = votes.find(v => v.user_id === currentUserId);

        const handleVote = (optionId: string) => {
            if (!currentUserId) return;
            GroupService.votePoll(message.id, optionId, currentUserId);
        };

        return (
            <View style={styles.pollContainer}>
                <Text style={styles.pollQuestion}>{message.content}</Text>
                {options.map((opt) => {
                    const optVotes = votes.filter(v => v.option_id === opt.id).length;
                    const percent = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;
                    const isSelected = myVote?.option_id === opt.id;

                    return (
                        <TouchableOpacity
                            key={opt.id}
                            style={[
                                styles.pollOption,
                                isSelected && { borderColor: myBubbleColor }
                            ]}
                            onPress={() => handleVote(opt.id)}
                        >
                            <View style={[styles.pollProgress, { width: `${percent}%`, backgroundColor: myBubbleColor, opacity: 0.1 }]} />
                            <View style={styles.pollContent}>
                                <Text style={[styles.pollLabel, isSelected && { color: myBubbleColor, fontWeight: 'bold' }]}>
                                    {opt.label}
                                </Text>
                                <Text style={styles.pollCount}>{optVotes}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <Text style={styles.pollTotal}>{totalVotes} vote{totalVotes > 1 ? 's' : ''}</Text>
            </View>
        );
    };

    const renderContent = () => {
        switch (message.type) {
            case 'poll': return renderPoll();
            case 'note': return renderNote();
            case 'image': return (
                <View>
                    <RNImage
                        source={{ uri: message.media_url || message.imageUrl || message.content }}
                        style={{ width: 200, height: 200, borderRadius: 8, resizeMode: 'cover' }}
                    />
                    {(message.media_url || message.imageUrl) && message.content && message.content !== message.media_url ? (
                        <Text style={{ marginTop: 4, color: isMine ? '#fff' : (themeColors?.text || '#000') }}>{message.content}</Text>
                    ) : null}
                </View>
            );
            default: return renderText();
        }
    };

    return (
        <View style={[
            styles.container,
            isMine ? styles.containerMine : styles.containerOther
        ]}>
            {!isMine && (
                <View style={[styles.avatar, { backgroundColor: senderColor }]}>
                    <Text style={styles.avatarText}>
                        {senderName.charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}

            <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={handleLongPress}
                style={[
                    styles.bubble,
                    isMine ? { backgroundColor: myBubbleColor, borderBottomRightRadius: 4 } : styles.bubbleOther,
                    message.type !== 'text' && styles.bubbleRich,
                    bubbleStyle?.containerStyle
                ]}
            >
                {!isMine && <Text style={[styles.senderName, { color: themeColors?.textSecondary || colors.textSecondary }]}>{senderName}</Text>}

                {renderContent()}

                <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>

                {/* Reactions Display */}
                {message.reactions && message.reactions.length > 0 && (
                    <View style={styles.reactionsContainer}>
                        {groupByEmoji(message.reactions).map(([emoji, count]) => (
                            <View key={emoji} style={styles.reactionBadge}>
                                <Text style={styles.reactionEmoji}>{emoji}</Text>
                                <Text style={styles.reactionCount}>{count}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </TouchableOpacity>

            {/* Reaction Picker Popup */}
            {showReactions && (
                <View style={[styles.reactionPicker, isMine ? { right: 0 } : { left: 0 }]}>
                    {REACTION_OPTIONS.map(emoji => (
                        <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.reactionOption}>
                            <Text style={{ fontSize: 20 }}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        maxWidth: '85%', // Slightly wider for polls
    },
    containerMine: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    containerOther: {
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        marginTop: 4,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    bubble: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        minWidth: 100,
    },
    bubbleMine: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: colors.backgroundCard,
        borderBottomLeftRadius: 4,
    },
    bubbleRich: {
        width: 250, // Fixed width for rich content like polls
        padding: spacing.sm,
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    messageText: {
        ...typography.body,
        color: colors.text,
    },
    messageTextMine: {
        color: colors.text,//OnPrimary if primary is dark
    },
    time: {
        fontSize: 10,
        color: colors.textMuted,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    timeMine: {
        color: 'rgba(0,0,0,0.6)',
    },
    timeOther: {
        color: colors.textMuted,
    },

    // Note Styles
    noteContainer: {
        backgroundColor: '#FFF9C4',
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    noteTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: spacing.xs,
        color: '#000',
    },
    noteDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: spacing.xs,
    },
    noteBody: {
        color: '#333',
        fontSize: 14,
    },

    // Poll Styles
    pollContainer: {
        backgroundColor: 'white',
        borderRadius: borderRadius.md,
        padding: spacing.sm,
    },
    pollQuestion: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: spacing.sm,
        color: colors.text,
    },
    pollOption: {
        flexDirection: 'row', // Overlay progress
        marginBottom: spacing.xs,
        height: 40,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pollOptionSelected: {
        borderColor: colors.primary,
    },
    pollProgress: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(98, 0, 238, 0.1)', // Primary customized opacity
    },
    pollContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        zIndex: 1,
    },
    pollLabel: {
        fontSize: 14,
        color: colors.text,
    },
    pollLabelSelected: {
        fontWeight: 'bold',
        color: colors.primary,
    },
    pollCount: {
        fontSize: 12,
        color: colors.textMuted,
    },
    pollTotal: {
        fontSize: 10,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    reactionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        gap: 4,
    },
    reactionBadge: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignItems: 'center',
    },
    reactionEmoji: {
        fontSize: 12,
        marginRight: 2,
    },
    reactionCount: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: 'bold',
    },
    reactionPicker: {
        position: 'absolute',
        top: -45,
        backgroundColor: 'white',
        borderRadius: 20,
        flexDirection: 'row',
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 100,
    },
    reactionOption: {
        padding: 6,
    }
});
