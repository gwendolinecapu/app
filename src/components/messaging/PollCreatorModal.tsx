import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface PollCreatorModalProps {
    visible: boolean;
    onClose: () => void;
    onSend: (question: string, options: string[]) => void;
}

export const PollCreatorModal: React.FC<PollCreatorModalProps> = ({ visible, onClose, onSend }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']);

    const handleAddOption = () => {
        if (options.length < 5) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (text: string, index: number) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handleSendPoll = () => {
        if (!question.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer une question');
            return;
        }

        const validOptions = options.filter(opt => opt.trim().length > 0);
        if (validOptions.length < 2) {
            Alert.alert('Erreur', 'Veuillez entrer au moins deux options');
            return;
        }

        onSend(question, validOptions);
        resetForm();
    };

    const resetForm = () => {
        setQuestion('');
        setOptions(['', '']);
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
                        <Text style={styles.title}>Nouveau Sondage</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Question</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Posez votre question..."
                            placeholderTextColor={colors.textMuted}
                            value={question}
                            onChangeText={setQuestion}
                            maxLength={100}
                        />

                        <Text style={styles.label}>Options</Text>
                        {options.map((option, index) => (
                            <View key={index} style={styles.optionContainer}>
                                <TextInput
                                    style={styles.optionInput}
                                    placeholder={`Option ${index + 1}`}
                                    placeholderTextColor={colors.textMuted}
                                    value={option}
                                    onChangeText={(text) => handleOptionChange(text, index)}
                                    maxLength={50}
                                />
                                {options.length > 2 && (
                                    <TouchableOpacity onPress={() => handleRemoveOption(index)}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        {options.length < 5 && (
                            <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption}>
                                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                <Text style={styles.addOptionText}>Ajouter une option</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.createButton} onPress={handleSendPoll}>
                            <Text style={styles.createButtonText}>Créer le sondage</Text>
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
        height: '80%',
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
    form: {
        flex: 1,
    },
    label: {
        ...typography.subtitle,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    input: {
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
        marginBottom: spacing.md,
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    optionInput: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
        marginRight: spacing.sm,
    },
    addOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.md,
        borderStyle: 'dashed',
    },
    addOptionText: {
        marginLeft: spacing.xs,
        color: colors.primary,
        fontWeight: '600',
    },
    footer: {
        paddingTop: spacing.md,
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
