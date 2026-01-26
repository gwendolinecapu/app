/**
 * Détection de plateforme robuste pour PluralConnect
 * Gère web desktop, web mobile, iOS et Android
 */

import { Platform, Dimensions } from 'react-native';

// Types de plateformes
export type PlatformType = 'web-desktop' | 'web-mobile' | 'ios' | 'android';
export type DeviceCategory = 'desktop' | 'tablet' | 'mobile';

/**
 * Détecte la plateforme actuelle
 */
export function getPlatformType(): PlatformType {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';

  // Sur web, détecter si c'est mobile ou desktop
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);

      // Vérifier aussi la taille d'écran
      const { width } = Dimensions.get('window');
      const isSmallScreen = width < 768;

      if (isMobile || (isSmallScreen && !isTablet)) {
        return 'web-mobile';
      }
    }
    return 'web-desktop';
  }

  return 'web-desktop'; // Fallback
}

/**
 * Détecte la catégorie d'appareil
 */
export function getDeviceCategory(): DeviceCategory {
  const { width } = Dimensions.get('window');

  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

/**
 * Vérifie si on est sur une plateforme native (iOS/Android)
 */
export function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Vérifie si on est sur web (desktop ou mobile)
 */
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

/**
 * Vérifie si on est sur web mobile (smartphone/tablette)
 */
export function isWebMobile(): boolean {
  return getPlatformType() === 'web-mobile';
}

/**
 * Vérifie si on est sur web desktop
 */
export function isWebDesktop(): boolean {
  return getPlatformType() === 'web-desktop';
}

/**
 * Vérifie si on est sur iOS (natif)
 */
export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Vérifie si on est sur Android (natif)
 */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/**
 * Vérifie si l'appareil est un mobile (natif ou web)
 */
export function isMobileDevice(): boolean {
  return isNative() || isWebMobile() || getDeviceCategory() === 'mobile';
}

/**
 * Vérifie si l'appareil est une tablette
 */
export function isTablet(): boolean {
  return getDeviceCategory() === 'tablet';
}

/**
 * Vérifie si l'appareil est un desktop
 */
export function isDesktop(): boolean {
  return getDeviceCategory() === 'desktop';
}

/**
 * Détecte si l'appareil a un écran tactile
 */
export function isTouchDevice(): boolean {
  if (isNative()) return true;

  if (typeof window !== 'undefined') {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  return false;
}

/**
 * Obtient le nom lisible de la plateforme
 */
export function getPlatformName(): string {
  const type = getPlatformType();

  switch (type) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'web-mobile':
      return 'Web Mobile';
    case 'web-desktop':
      return 'Web Desktop';
    default:
      return 'Unknown';
  }
}

/**
 * Sélectionne une valeur selon la plateforme
 */
export function selectByPlatform<T>(values: {
  ios?: T;
  android?: T;
  webMobile?: T;
  webDesktop?: T;
  web?: T; // Fallback pour tout web
  native?: T; // Fallback pour iOS/Android
  default: T; // Valeur par défaut
}): T {
  const platformType = getPlatformType();

  // Correspondance exacte
  if (platformType === 'ios' && values.ios !== undefined) return values.ios;
  if (platformType === 'android' && values.android !== undefined) return values.android;
  if (platformType === 'web-mobile' && values.webMobile !== undefined) return values.webMobile;
  if (platformType === 'web-desktop' && values.webDesktop !== undefined) return values.webDesktop;

  // Fallbacks
  if (isNative() && values.native !== undefined) return values.native;
  if (isWeb() && values.web !== undefined) return values.web;

  return values.default;
}

/**
 * Informations détaillées sur la plateforme
 */
export function getPlatformInfo() {
  const { width, height } = Dimensions.get('window');

  return {
    platformType: getPlatformType(),
    platformName: getPlatformName(),
    deviceCategory: getDeviceCategory(),
    isNative: isNative(),
    isWeb: isWeb(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isWebMobile: isWebMobile(),
    isWebDesktop: isWebDesktop(),
    isMobile: isMobileDevice(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    isTouchDevice: isTouchDevice(),
    screenWidth: width,
    screenHeight: height,
    aspectRatio: width / height,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}

/**
 * Log les informations de plateforme (debug)
 */
export function logPlatformInfo() {
  const info = getPlatformInfo();
  console.log('📱 Platform Info:', {
    platform: info.platformName,
    category: info.deviceCategory,
    screen: `${info.screenWidth}x${info.screenHeight}`,
    touch: info.isTouchDevice ? 'Yes' : 'No',
  });
}
