import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    Image,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, alterColors } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';

interface AddAlterModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (data: {
        name: string;
        pronouns: string;
        bio: string;
        color: string;
        image: string | null;
    }) => Promise<void>;
    loading: boolean;
    pickImage: () => Promise<string | null>;
}

/**
 * AddAlterModal - Premium creation experience for new system members.
 * Includes live color preview, image picking, and glassmorphism-inspired UI.
 */
export const AddAlterModal: React.FC<AddAlterModalProps> = ({
    visible,
    onClose,
    onCreate,
    loading,
    pickImage,
}) => {
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [bio, setBio] = useState('');
    const [color, setColor] = useState(alterColors[0]);
    const [image, setImage] = useState<string | null>(null);

    const handleCreate = async () => {
        await onCreate({ name, pronouns, bio, color, image });
        // Reset form after creation
        setName('');
        setPronouns('');
        setBio('');
        setColor(alterColors[0]);
        setImage(null);
    };

    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri) setImage(uri);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                {Platform.OS !== 'web' ? (
                    <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                )}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouvel Alter</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            {/* Avatar Picker */}
                            <View style={styles.avatarPickerContainer}>
                                <TouchableOpacity onPress={handlePickImage} style={styles.avatarPicker}>
                                    {image ? (
                                        <Image source={{ uri: image }} style={styles.avatarPreview} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: color }]}>
                                            <Text style={styles.avatarPlaceholderText}>
                                                {name ? name.charAt(0).toUpperCase() : '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.cameraIcon}>
                                        <Ionicons name="camera" size={16} color="white" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Pseudo *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Nom de l'alter"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Pronoms</Text>
                                <TextInput
                                    style={styles.input}
                                    value={pronouns}
                                    onChangeText={setPronouns}
                                    placeholder="elle/lui, iel..."
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Bio</Text>
                                <TextInput
                                    style={[styles.input, styles.inputMultiline]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Description..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Couleur</Text>
                                <View style={styles.colorPicker}>
                                    {alterColors.map((c: string) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                styles.colorOption,
                                                { backgroundColor: c },
                                                color === c && styles.colorOptionSelected,
                                            ]}
                                            onPress={() => {
                                                triggerHaptic.selection();
                                                setColor(c);
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.createButton, loading && styles.createButtonDisabled]}
                                onPress={handleCreate}
                                disabled={loading || !name.trim()}
                            >
                                <Text style={styles.createButtonText}>
                                    {loading ? 'Création...' : 'Créer'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    keyboardView: {
        width: '100%',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
        maxHeight: '90%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
    },
    avatarPickerContainer: {
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    avatarPicker: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: 'relative',
    },
    avatarPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 40,
        color: 'white',
        fontWeight: 'bold',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.surface,
    },
    inputContainer: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
        color: colors.text,
    },
    input: {
        backgroundColor: colors.backgroundLight,
        borderRadius: 12,
        padding: spacing.md,
        ...typography.body,
        color: colors.text,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: spacing.xs,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: colors.primary,
    },
    modalActions: {
        paddingHorizontal: spacing.xl,
        marginTop: spacing.sm,
    },
    createButton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        ...typography.body,
        color: 'white',
        fontWeight: 'bold',
    },
});
