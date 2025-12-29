import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Text,
    Platform
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
    onSend: (content: string, type: 'text') => void;
    onOpenPoll: () => void;
    onOpenNote: () => void;
    onPickImage?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    onOpenPoll,
    onOpenNote,
    onPickImage
}) => {
    const [text, setText] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text.trim(), 'text');
        setText('');
    };

    return (
        <View style={styles.container}>
            {/* Attachment Menu Modal (simple overlay for now) */}
            <Modal
                transparent
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onOpenPoll(); }}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="stats-chart" size={24} color="#1565C0" />
                            </View>
                            <Text style={styles.menuText}>Sondage</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onOpenNote(); }}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                                <Ionicons name="document-text" size={24} color="#EF6C00" />
                            </View>
                            <Text style={styles.menuText}>Note</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onPickImage?.(); }}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="image" size={24} color="#2E7D32" />
                            </View>
                            <Text style={styles.menuText}>Image</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <TouchableOpacity
                style={styles.attachButton}
                onPress={() => setMenuVisible(true)}
            >
                <Ionicons name="add" size={24} color={colors.text} />
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                placeholder="Message..."
                placeholderTextColor={colors.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={1000}
            />

            <TouchableOpacity
                style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!text.trim()}
            >
                <Ionicons name="send" size={20} color={colors.background} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'end',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.sm,
        marginHorizontal: spacing.sm,
        fontSize: 16,
        color: colors.text,
        maxHeight: 100,
        minHeight: 40,
    },
    attachButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: colors.backgroundLight,
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: colors.primary,
    },
    sendButtonDisabled: {
        backgroundColor: colors.textMuted,
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    menuContainer: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    },
    menuItem: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    menuText: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
    }
});
