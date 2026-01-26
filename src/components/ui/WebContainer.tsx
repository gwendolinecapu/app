import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, spacing } from '../../lib/theme';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  scrollable?: boolean;
  style?: ViewStyle;
  noPadding?: boolean;
}

/**
 * Container responsive pour le web
 * Centre le contenu sur desktop/tablet et limite la largeur maximale
 *
 * @example
 * <WebContainer maxWidth={800}>
 *   <YourContent />
 * </WebContainer>
 */
export function WebContainer({
  children,
  maxWidth = 1200,
  scrollable = false,
  style,
  noPadding = false
}: WebContainerProps) {
  const { isDesktop, isTablet, isWeb } = useResponsive();

  // Sur mobile natif, pas de container spécial
  if (!isWeb) {
    return <>{children}</>;
  }

  const containerStyle: ViewStyle = {
    flex: 1,
    width: '100%',
    maxWidth: isDesktop ? maxWidth : isTablet ? 900 : '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: noPadding ? 0 : isDesktop ? spacing.xl : isTablet ? spacing.lg : spacing.md,
  };

  if (scrollable) {
    return (
      <ScrollView
        contentContainerStyle={[containerStyle, style]}
        style={styles.scrollView}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
