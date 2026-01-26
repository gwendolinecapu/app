import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveInfo {
  deviceType: DeviceType;
  orientation: Orientation;
  width: number;
  height: number;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

function getDeviceType(width: number): DeviceType {
  if (width < MOBILE_MAX_WIDTH) return 'mobile';
  if (width < TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
}

function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Hook pour gérer le responsive design sur web et mobile
 * Retourne des informations sur le type d'appareil et l'orientation
 */
export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const deviceType = getDeviceType(dimensions.width);
  const orientation = getOrientation(dimensions.width, dimensions.height);
  const isWeb = Platform.OS === 'web';

  return {
    deviceType,
    orientation,
    width: dimensions.width,
    height: dimensions.height,
    isWeb,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
}

/**
 * Hook pour obtenir des valeurs différentes selon le type d'appareil
 *
 * @example
 * const padding = useResponsiveValue({ mobile: 16, tablet: 24, desktop: 32 });
 */
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { deviceType } = useResponsive();

  if (deviceType === 'desktop' && values.desktop !== undefined) {
    return values.desktop;
  }

  if (deviceType === 'tablet' && values.tablet !== undefined) {
    return values.tablet;
  }

  return values.mobile;
}
