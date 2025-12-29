import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useDrafts } from '../../hooks/useDrafts';

interface NoteCreatorModalProps {
    visible: boolean;
    onClose: () => void;
    onSend: (title: string, content: string) => void;
}

export const NoteCreatorModal: React.FC<NoteCreatorModalProps> = ({ visible, onClose, onSend }) => {
    const [title, setTitle] = useState('');
    const { draft: content, setDraft: setContent, clearDraft } = useDrafts('sticky_note_draft');

    const handleSendNote = () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Erreur', 'Le titre et le contenu sont requis');
            return;
        }

        onSend(title.trim(), content.trim());
        resetForm();
    };

    const resetForm = () => {
        setTitle('');
        clearDraft(); // Fire and forget
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <View style={styles.contentContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Nouvelle Note</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.notePreview}>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Titre de la note"
                            placeholderTextColor={colors.textMuted}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={50}
                        />
                        <View style={styles.divider} />
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Écrivez votre note ici..."
                            placeholderTextColor={colors.textMuted}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.createButton} onPress={handleSendNote}>
                            <Text style={styles.createButtonText}>Partager la note</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    contentContainer: {
        backgroundColor: colors.backgroundCard,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '70%',
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h3,
    },
    notePreview: {
        flex: 1,
        backgroundColor: '#FFF9C4', // Styled like a sticky note
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    titleInput: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000', // Always black for note look
        marginBottom: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: spacing.sm,
    },
    contentInput: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        lineHeight: 24,
    },
    footer: {
        paddingTop: spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    createButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    createButtonText: {
        color: colors.textOnPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
