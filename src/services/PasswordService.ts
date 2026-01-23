import * as Crypto from 'expo-crypto';

/**
 * Service de hashage des mots de passe pour les AlterSpaces
 * Utilise SHA-256 avec un salt unique par password
 */

const SALT_LENGTH = 16;

/**
 * Génère un salt aléatoire
 */
async function generateSalt(): Promise<string> {
    try {
        const saltBytes = await Crypto.getRandomBytesAsync(SALT_LENGTH);
        return Array.from(new Uint8Array(saltBytes))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch {
        // Fallback si expo-crypto n'est pas disponible
        return Math.random().toString(36).substring(2, 18) +
            Math.random().toString(36).substring(2, 18);
    }
}

/**
 * Hash un mot de passe avec SHA-256 et un salt
 * @returns Format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await generateSalt();

    try {
        const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            salt + password
        );
        return `${salt}:${hash}`;
    } catch {
        // Fallback simple si expo-crypto n'est pas disponible
        const simpleHash = btoa(salt + password);
        return `${salt}:${simpleHash}`;
    }
}

/**
 * Vérifie un mot de passe contre un hash stocké
 * @param password Le mot de passe en clair à vérifier
 * @param storedHash Le hash stocké (format salt:hash)
 * @returns true si le mot de passe est correct
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // Support des anciens passwords en clair (migration)
    if (!storedHash.includes(':')) {
        // C'est un ancien password en clair, comparer directement
        return password === storedHash;
    }

    const [salt, hash] = storedHash.split(':');

    try {
        const computedHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            salt + password
        );
        return computedHash === hash;
    } catch {
        // Fallback
        const simpleHash = btoa(salt + password);
        return simpleHash === hash;
    }
}

export const PasswordService = {
    hashPassword,
    verifyPassword,
};
