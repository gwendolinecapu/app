import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { ThemeColors } from '../../lib/cosmetics';

interface PasswordModalProps {
    visible: boolean;
    onConfirm: (password: string) => void;
    onCancel: () => void;
    alterName: string;
    error?: string;
    loading?: boolean;
    themeColors?: ThemeColors;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
    visible,
    onConfirm,
    onCancel,
    alterName,
    error,
    loading = false,
    themeColors
}) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const bgColor = themeColors?.background || colors.background;
    const cardBg = themeColors?.backgroundCard || colors.backgroundCard;
    const textColor = themeColors?.text || colors.text;
    const textSecondary = themeColors?.textSecondary || colors.textSecondary;
    const borderColor = themeColors?.border || colors.border;
    const primaryColor = themeColors?.primary || colors.primary;

    const handleConfirm = () => {
        if (password.trim()) {
            onConfirm(password);
        }
    };

    const handleCancel = () => {
        setPassword('');
        onCancel();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.container, { backgroundColor: cardBg }]}>
                    {/* Lock Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: `${primaryColor}20` }]}>
                        <Ionicons name="lock-closed" size={32} color={primaryColor} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: textColor }]}>
                        Espace protégé
                    </Text>
                    <Text style={[styles.subtitle, { color: textSecondary }]}>
                        L'espace de {alterName} est protégé par un mot de passe
                    </Text>

                    {/* Password Input */}
                    <View style={[styles.inputContainer, { backgroundColor: bgColor, borderColor }]}>
                        <TextInput
                            style={[styles.input, { color: textColor }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Entrez le mot de passe"
                            placeholderTextColor={textSecondary}
                            secureTextEntry={!showPassword}
                            autoFocus
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color={textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { borderColor }]}
                            onPress={handleCancel}
                            disabled={loading}
                        >
                            <Text style={[styles.cancelButtonText, { color: textSecondary }]}>
                                Retour
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.confirmButton,
                                { backgroundColor: primaryColor },
                                !password.trim() && styles.buttonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!password.trim() || loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirmer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h2,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: 16,
    },
    eyeButton: {
        padding: spacing.xs,
    },
    errorText: {
        color: colors.error,
        fontSize: 13,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    button: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: colors.primary,
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default PasswordModal;
