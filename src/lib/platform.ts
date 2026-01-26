import { Platform } from 'react-native';

/**
 * Utilitaires pour gérer les différences de plateforme
 */

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobileNative = isIOS || isAndroid;

/**
 * Vérifie si une fonctionnalité native est disponible
 */
export function isNativeFeatureAvailable(feature: 'biometrics' | 'push-notifications' | 'admob' | 'revenucat' | 'watch' | 'widgets' | 'dynamic-island'): boolean {
  // Sur web, aucune fonctionnalité native n'est disponible
  if (isWeb) return false;

  switch (feature) {
    case 'biometrics':
      return isMobileNative;

    case 'push-notifications':
      return isMobileNative;

    case 'admob':
    case 'revenucat':
      return isMobileNative;

    case 'watch':
      return isIOS;

    case 'widgets':
      return isMobileNative;

    case 'dynamic-island':
      return isIOS;

    default:
      return false;
  }
}

/**
 * Retourne une valeur selon la plateforme
 */
export function platformSelect<T>(values: {
  web?: T;
  ios?: T;
  android?: T;
  native?: T;
  default: T;
}): T {
  if (isWeb && values.web !== undefined) return values.web;
  if (isIOS && values.ios !== undefined) return values.ios;
  if (isAndroid && values.android !== undefined) return values.android;
  if (isMobileNative && values.native !== undefined) return values.native;
  return values.default;
}
