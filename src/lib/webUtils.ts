/**
 * Utilitaires Web - Helpers pour améliorer l'expérience web
 */

import { Platform } from 'react-native';

/**
 * Vérifie si on est sur web
 */
export const isWeb = Platform.OS === 'web';

/**
 * Ouvre un lien externe de manière sécurisée
 */
export function openExternalLink(url: string) {
  if (isWeb) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    // Sur mobile, utiliser Linking
    const { Linking } = require('react-native');
    Linking.openURL(url);
  }
}

/**
 * Copie du texte dans le presse-papier
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (isWeb && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Sur mobile, utiliser expo-clipboard
      const { setStringAsync } = await import('expo-clipboard');
      await setStringAsync(text);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Détecte si on est sur un appareil tactile
 */
export function isTouchDevice(): boolean {
  if (isWeb) {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  return true; // Mobile est toujours tactile
}

/**
 * Obtient la taille de la fenêtre
 */
export function getWindowSize() {
  if (isWeb) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  } else {
    const { Dimensions } = require('react-native');
    return Dimensions.get('window');
  }
}

/**
 * Recharge la page (web) ou redémarre l'app (mobile)
 */
export function reloadApp() {
  if (isWeb) {
    window.location.reload();
  } else {
    // Sur mobile, il faudrait utiliser Updates de expo
    console.warn('App reload not implemented on mobile');
  }
}

/**
 * Détecte si on est en mode développement
 */
export function isDevelopment(): boolean {
  return __DEV__;
}

/**
 * Log seulement en développement
 */
export function devLog(...args: any[]) {
  if (isDevelopment()) {
    console.log('[DEV]', ...args);
  }
}

/**
 * Formatage des URLs pour web
 */
export function formatUrl(url: string): string {
  if (!url) return '';

  // Ajouter https:// si manquant
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}

/**
 * Détecte le navigateur sur web
 */
export function getBrowser(): string {
  if (!isWeb) return 'native';

  const userAgent = navigator.userAgent;

  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Safari')) return 'safari';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Edge')) return 'edge';

  return 'unknown';
}

/**
 * Obtient l'URL de base de l'application
 */
export function getBaseUrl(): string {
  if (isWeb) {
    return window.location.origin;
  }
  return 'pluralconnect://';
}

/**
 * Partage du contenu (natif ou web)
 */
export async function shareContent(
  content: { title?: string; text?: string; url?: string }
): Promise<boolean> {
  try {
    if (isWeb && navigator.share) {
      await navigator.share(content);
      return true;
    } else if (!isWeb) {
      const { Share } = await import('react-native');
      await Share.share({
        message: content.text || '',
        url: content.url,
        title: content.title,
      });
      return true;
    }

    // Fallback : copier dans le presse-papier
    const textToShare = [content.title, content.text, content.url]
      .filter(Boolean)
      .join('\n');
    return await copyToClipboard(textToShare);
  } catch (error) {
    console.error('Failed to share content:', error);
    return false;
  }
}
