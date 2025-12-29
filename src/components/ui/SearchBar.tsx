import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../lib/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    containerStyle?: StyleProp<ViewStyle>;
}

export function SearchBar({ value, onChangeText, placeholder = "Rechercher...", containerStyle }: SearchBarProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            <Ionicons name="search" size={20} color={colors.textMuted} style={styles.icon} />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border,
    },
    icon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        height: '100%',
    },
    clearButton: {
        padding: spacing.xs,
    },
});
