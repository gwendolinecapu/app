/**
 * ResponsiveInput - Input qui s'adapte automatiquement à la plateforme
 * - Desktop : focus visible, taille normale
 * - Mobile : taille augmentée pour éviter le zoom iOS
 * - Gestion automatique du clavier
 */

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { isIOS } from '../../lib/platformDetection';

interface ResponsiveInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export function ResponsiveInput({
  label,
  error,
  containerStyle,
  icon,
  style,
  ...props
}: ResponsiveInputProps) {
  const { isMobile, isWebMobile } = useResponsive();
  const [isFocused, setIsFocused] = useState(false);

  // Sur iOS web, utiliser une taille de police >= 16px pour éviter le zoom automatique
  const getFontSize = () => {
    if (isWebMobile && isIOS()) {
      return 16; // Minimum pour éviter le zoom iOS
    }
    return isMobile ? 16 : 14;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}

        <TextInput
          style={[
            styles.input,
            { fontSize: getFontSize() },
            icon ? styles.inputWithIcon : undefined,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48, // Minimum pour touch targets
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.md,
    // Désactiver les effets de focus web par défaut
    outlineStyle: 'none' as any,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
