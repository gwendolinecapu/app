import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * EncryptionService - Service de chiffrement end-to-end pour PluralConnect
 * 
 * ⚠️ VERSION CORRIGÉE avec vrai chiffrement XOR-AES simulé
 * 
 * Architecture :
 * - Clé unique par système stockée dans SecureStore (Keychain/Keystore natif)
 * - Chiffrement XOR avec clé dérivée (simulation AES car expo-crypto ne supporte pas AES directement)
 * - Préfixe "enc:" pour identifier les données chiffrées
 * - Support Unicode via TextEncoder/TextDecoder
 * - Backward compatible avec données non chiffrées
 * 
 * Limitations connues :
 * - Utilise XOR avec clé dérivée (moins sécurisé que vrai AES-GCM)
 * - Web: Utilise localStorage comme fallback (moins sécurisé)
 * - Pour production enterprise: Migrer vers react-native-crypto ou airtable-crypto
 */

const ENCRYPTION_KEY_PREFIX = 'encryption_key_';
const ENCRYPTED_PREFIX = 'enc:';
const ENCRYPTION_ENABLED_PREFIX = 'encryption_enabled_';

// Fallback pour Web (localStorage)
const SecureStorageFallback = {
    async getItemAsync(key: string): Promise<string | null> {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem(key);
        }
        return null;
    },
    async setItemAsync(key: string, value: string): Promise<void> {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, value);
        }
    },
    async deleteItemAsync(key: string): Promise<void> {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
        }
    }
};

// Choisir le bon storage selon la plateforme
const Storage = Platform.OS === 'web' ? SecureStorageFallback : SecureStore;

/**
 * Encode une chaîne en base64 avec support Unicode
 */
function encodeBase64(str: string): string {
    try {
        // Utiliser TextEncoder pour supporter Unicode (emojis, accents, etc.)
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    } catch {
        // Fallback: escape pour les anciens environnements
        return btoa(unescape(encodeURIComponent(str)));
    }
}

/**
 * Décode une chaîne base64 avec support Unicode
 */
function decodeBase64(base64: string): string {
    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch {
        // Fallback
        return decodeURIComponent(escape(atob(base64)));
    }
}

export class EncryptionService {
    /**
     * Génère ou récupère la clé de chiffrement du système
     * La clé est générée une seule fois et stockée de manière sécurisée
     */
    static async getOrCreateSystemKey(systemId: string): Promise<string> {
        try {
            const keyName = `${ENCRYPTION_KEY_PREFIX}${systemId}`;

            // Vérifier si une clé existe déjà
            let key = await Storage.getItemAsync(keyName);

            if (!key) {
                // Générer une nouvelle clé AES-256 (32 bytes = 256 bits)
                const randomBytes = await Crypto.getRandomBytesAsync(32);

                // Convertir en hexadécimal pour stockage
                key = Array.from(randomBytes)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                // Stocker de manière sécurisée
                await Storage.setItemAsync(keyName, key);
                console.log(`✅ [EncryptionService] Nouvelle clé générée pour système ${systemId}`);
            }

            return key;
        } catch (error) {
            console.error('[EncryptionService] Erreur lors de la récupération/génération de clé:', error);
            throw new Error('Impossible de gérer la clé de chiffrement');
        }
    }

    /**
     * Dérive une clé de chiffrement à partir de la clé principale et de l'IV
     * Utilise SHA-256 pour créer une clé unique par message
     */
    private static async deriveKey(masterKey: string, iv: string): Promise<Uint8Array> {
        const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            `${masterKey}:${iv}:derived`
        );

        // Convertir le hash hex en Uint8Array
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            bytes[i] = parseInt(hash.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    /**
     * Chiffre un texte avec XOR (clé dérivée de SHA-256)
     * 
     * Architecture :
     * 1. Génère un IV aléatoire unique par message
     * 2. Dérive une clé unique via SHA-256(masterKey + IV)
     * 3. XOR le texte avec la clé dérivée
     * 4. Stocke : IV + HMAC + données chiffrées en base64
     * 
     * @param text Texte en clair à chiffrer
     * @param systemId ID du système (pour récupérer la clé)
     * @returns Texte chiffré avec préfixe "enc:"
     */
    static async encrypt(text: string, systemId: string): Promise<string> {
        try {
            if (!text || text.trim() === '') {
                return text; // Ne pas chiffrer les chaînes vides
            }

            // Récupérer la clé maîtresse
            const masterKey = await this.getOrCreateSystemKey(systemId);

            // Générer un IV (Initialization Vector) aléatoire de 16 bytes
            const ivBytes = await Crypto.getRandomBytesAsync(16);
            const iv = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');

            // Dériver une clé unique pour ce message
            const derivedKey = await this.deriveKey(masterKey, iv);

            // Convertir le texte en bytes
            const textBytes = new TextEncoder().encode(text);

            // Chiffrer avec XOR
            const encryptedBytes = new Uint8Array(textBytes.length);
            for (let i = 0; i < textBytes.length; i++) {
                encryptedBytes[i] = textBytes[i] ^ derivedKey[i % derivedKey.length];
            }

            // Convertir en base64
            let encryptedBinary = '';
            encryptedBytes.forEach(byte => {
                encryptedBinary += String.fromCharCode(byte);
            });
            const encryptedBase64 = btoa(encryptedBinary);

            // Calculer HMAC pour vérification d'intégrité
            const hmac = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                `${masterKey}:${iv}:${encryptedBase64}:hmac`
            );

            // Format final : iv:hmac:encryptedData
            const payload = `${iv}:${hmac.substring(0, 16)}:${encryptedBase64}`;

            return `${ENCRYPTED_PREFIX}${encodeBase64(payload)}`;
        } catch (error) {
            console.error('[EncryptionService] Erreur lors du chiffrement:', error);
            throw new Error('Échec du chiffrement');
        }
    }

    /**
     * Déchiffre un texte chiffré
     * 
     * @param encryptedText Texte chiffré (avec préfixe "enc:")
     * @param systemId ID du système (pour récupérer la clé)
     * @returns Texte en clair
     */
    static async decrypt(encryptedText: string, systemId: string): Promise<string> {
        try {
            // Vérifier si le texte est chiffré
            if (!this.isEncrypted(encryptedText)) {
                return encryptedText; // Retourner tel quel si non chiffré (backward compatibility)
            }

            // Retirer le préfixe et décoder
            const withoutPrefix = encryptedText.substring(ENCRYPTED_PREFIX.length);
            const payload = decodeBase64(withoutPrefix);

            // Parser la structure iv:hmac:data
            const parts = payload.split(':');
            if (parts.length !== 3) {
                throw new Error('Format de données chiffrées invalide');
            }

            const [iv, storedHmac, encryptedBase64] = parts;

            // Récupérer la clé maîtresse
            const masterKey = await this.getOrCreateSystemKey(systemId);

            // Vérifier l'intégrité via HMAC
            const computedHmac = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                `${masterKey}:${iv}:${encryptedBase64}:hmac`
            );

            if (computedHmac.substring(0, 16) !== storedHmac) {
                throw new Error('Données corrompues ou clé incorrecte (HMAC mismatch)');
            }

            // Décoder les données chiffrées
            const encryptedBinary = atob(encryptedBase64);
            const encryptedBytes = new Uint8Array(encryptedBinary.length);
            for (let i = 0; i < encryptedBinary.length; i++) {
                encryptedBytes[i] = encryptedBinary.charCodeAt(i);
            }

            // Dériver la même clé
            const derivedKey = await this.deriveKey(masterKey, iv);

            // Déchiffrer avec XOR (XOR est réversible)
            const decryptedBytes = new Uint8Array(encryptedBytes.length);
            for (let i = 0; i < encryptedBytes.length; i++) {
                decryptedBytes[i] = encryptedBytes[i] ^ derivedKey[i % derivedKey.length];
            }

            // Convertir en texte
            return new TextDecoder().decode(decryptedBytes);
        } catch (error) {
            console.error('[EncryptionService] Erreur lors du déchiffrement:', error);
            // Retourner un placeholder plutôt que de crasher
            return '🔒 [Message chiffré - impossible à déchiffrer]';
        }
    }

    /**
     * Vérifie si une chaîne est chiffrée
     */
    static isEncrypted(text: string): boolean {
        return text?.startsWith(ENCRYPTED_PREFIX) || false;
    }

    /**
     * Active le chiffrement pour un système
     */
    static async enableEncryption(systemId: string): Promise<void> {
        try {
            const settingName = `${ENCRYPTION_ENABLED_PREFIX}${systemId}`;
            await Storage.setItemAsync(settingName, 'true');

            // Générer la clé immédiatement si elle n'existe pas
            await this.getOrCreateSystemKey(systemId);

            console.log(`🔒 [EncryptionService] Chiffrement activé pour système ${systemId}`);
        } catch (error) {
            console.error('[EncryptionService] Erreur lors de l\'activation:', error);
            throw error;
        }
    }

    /**
     * Désactive le chiffrement pour un système
     */
    static async disableEncryption(systemId: string): Promise<void> {
        try {
            const settingName = `${ENCRYPTION_ENABLED_PREFIX}${systemId}`;
            await Storage.deleteItemAsync(settingName);
            console.log(`🔓 [EncryptionService] Chiffrement désactivé pour système ${systemId}`);
        } catch (error) {
            console.error('[EncryptionService] Erreur lors de la désactivation:', error);
            throw error;
        }
    }

    /**
     * Vérifie si le chiffrement est activé pour un système
     */
    static async isEncryptionEnabled(systemId: string): Promise<boolean> {
        try {
            const settingName = `${ENCRYPTION_ENABLED_PREFIX}${systemId}`;
            const value = await Storage.getItemAsync(settingName);
            return value === 'true';
        } catch (error) {
            console.error('[EncryptionService] Erreur lors de la vérification:', error);
            return false; // Par défaut, chiffrement désactivé
        }
    }

    /**
     * Supprime la clé de chiffrement (dangereux - perte définitive)
     * À utiliser uniquement lors de la suppression de compte
     */
    static async deleteSystemKey(systemId: string): Promise<void> {
        try {
            const keyName = `${ENCRYPTION_KEY_PREFIX}${systemId}`;
            await Storage.deleteItemAsync(keyName);

            const settingName = `${ENCRYPTION_ENABLED_PREFIX}${systemId}`;
            await Storage.deleteItemAsync(settingName);

            console.log(`🗑️ [EncryptionService] Clé supprimée pour système ${systemId}`);
        } catch (error) {
            console.error('[EncryptionService] Erreur lors de la suppression:', error);
            throw error;
        }
    }
}
