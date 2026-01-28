/**
 * PlatformSafeView - Composant qui gère automatiquement les marges de sécurité
 * sur toutes les plateformes (iOS notch, Android status bar, web)
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isWeb } from '../../lib/platformDetection';

interface PlatformSafeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

/**
 * Composant qui utilise SafeAreaView sur mobile natif
 * et un View simple sur web (pas besoin de safe area)
 */
export function PlatformSafeView({
  children,
  style,
  edges = ['top', 'bottom'],
}: PlatformSafeViewProps) {
  // Sur web, pas besoin de SafeAreaView
  if (isWeb()) {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  // Sur mobile natif, utiliser SafeAreaView
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
