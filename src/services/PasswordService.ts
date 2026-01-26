import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

/**
 * Service de hashage des mots de passe pour les AlterSpaces
 * Utilise PBKDF2 (Standard NIST) pour une sécurité robuste
 */

// Configuration PBKDF2
const ITERATIONS = 100000;
const KEY_SIZE = 256 / 32; // 256-bit key
const SALT_LENGTH = 32;

/**
 * Génère un salt aléatoire sécurisé
 */
async function generateSalt(): Promise<string> {
    try {
        const saltBytes = await Crypto.getRandomBytesAsync(SALT_LENGTH);
        return Array.from(new Uint8Array(saltBytes))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (e) {
        console.warn('Crypto.getRandomBytesAsync failed, falling back to lower entropy salt', e);
        // Fallback d'urgence uniquement (moins sécurisé mais évite le crash)
        return CryptoJS.lib.WordArray.random(SALT_LENGTH).toString();
    }
}

/**
 * Hash un mot de passe avec PBKDF2
 * @returns Format: v2:salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await generateSalt();

    const hash = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), {
        keySize: KEY_SIZE,
        iterations: ITERATIONS,
        hasher: CryptoJS.algo.SHA256
    }).toString(CryptoJS.enc.Hex);

    return `v2:${salt}:${hash}`;
}

/**
 * Vérifie un mot de passe contre un hash stocké
 * Compatible avec la migration v1 -> v2
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // 1. Gestion des anciens formats (Migration)
    if (!storedHash.startsWith('v2:')) {
        // Migration forcée : on considère le mot de passe invalide pour le forcer à être reset
        // OU on tente de le valider avec l'ancienne méthode pour permettre le "re-hash" transparent
        // Pour la sécurité critique demandée, on bloque les anciens formats non sécurisés
        console.warn('Legacy password format detected. User must reset password.');
        return false;
    }

    // 2. Vérification format v2 (PBKDF2)
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;

    const [version, salt, originalHash] = parts;

    const computedHash = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), {
        keySize: KEY_SIZE,
        iterations: ITERATIONS,
        hasher: CryptoJS.algo.SHA256
    }).toString(CryptoJS.enc.Hex);

    return computedHash === originalHash;
}

/**
 * Valide la force d'un mot de passe
 * - Minimum 10 caractères
 * - Au moins une majuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 10) {
        errors.push("Le mot de passe doit contenir au moins 10 caractères.");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins une majuscule.");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins un chiffre.");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins un caractère spécial.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export const PasswordService = {
    hashPassword,
    verifyPassword,
    validatePassword
};
