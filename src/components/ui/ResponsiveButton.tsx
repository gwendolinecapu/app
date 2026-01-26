/**
 * ResponsiveButton - Bouton qui s'adapte automatiquement à la plateforme
 * - Desktop : hover effects
 * - Mobile : touch feedback
 * - Taille adaptée selon l'écran
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { isTouchDevice } from '../../lib/platformDetection';

interface ResponsiveButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function ResponsiveButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ResponsiveButtonProps) {
  const { isMobile, isTablet } = useResponsive();
  const isTouch = isTouchDevice();

  // Adapter la taille selon l'appareil
  const getSizeStyles = () => {
    const baseSize = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1;
    const mobileMultiplier = isMobile ? 1.1 : 1; // Boutons plus gros sur mobile

    return {
      paddingVertical: spacing.md * baseSize * mobileMultiplier,
      paddingHorizontal: spacing.lg * baseSize * mobileMultiplier,
      minHeight: 44 * baseSize * mobileMultiplier, // Minimum 44px pour touch targets
    };
  };

  // Styles selon la variante
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.border : colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? colors.border : colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? colors.border : colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? colors.border : colors.error,
        };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    if (variant === 'outline') return colors.primary;
    return colors.text;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSizeStyles(),
        getVariantStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={isTouch ? 0.7 : 0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              ...(size === 'small' ? [styles.smallText] : []),
              ...(size === 'large' ? [styles.largeText] : []),
              ...(icon ? [styles.textWithIcon] : []),
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  textWithIcon: {
    marginLeft: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
