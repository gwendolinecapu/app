/**
 * PushNotificationService.ts
 * Service pour gérer les notifications push via Firebase Cloud Messaging (FCM)
 * 
 * Utilisé pour:
 * - Notifications sociales (nouveau follower, message, réaction)
 * - Notifications système (updates)
 * - Notifications entre appareils (sync Watch)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const FCM_TOKEN_COLLECTION = 'fcm_tokens';

interface PushTokenData {
    token: string;
    platform: 'ios' | 'android';
    deviceId: string;
    createdAt: any;
    updatedAt: any;
}

class PushNotificationService {
    private static instance: PushNotificationService;
    private expoPushToken: string | null = null;
    private currentUserId: string | null = null;

    private constructor() { }

    static getInstance(): PushNotificationService {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }

    // ==================== TOKEN MANAGEMENT ====================

    /**
     * Enregistre l'appareil pour les notifications push
     */
    async registerForPushNotifications(userId: string): Promise<string | null> {
        if (!Device.isDevice) {
            console.warn('[PushService] Push notifications are not available on simulators');
            return null;
        }

        try {
            // Demander les permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.warn('[PushService] Permission not granted for push notifications');
                return null;
            }

            // Obtenir le token Expo Push
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
            });

            this.expoPushToken = tokenData.data;
            this.currentUserId = userId;

            // Sauvegarder le token dans Firestore
            await this.saveTokenToFirestore(userId, this.expoPushToken);

            console.log('[PushService] Registered with token:', this.expoPushToken);
            return this.expoPushToken;

        } catch (error) {
            console.error('[PushService] Failed to register:', error);
            return null;
        }
    }

    /**
     * Sauvegarde le token dans Firestore pour l'utilisateur
     */
    private async saveTokenToFirestore(userId: string, token: string): Promise<void> {
        try {
            const deviceId = Device.modelId || 'unknown';
            const tokenRef = doc(db, FCM_TOKEN_COLLECTION, `${userId}_${deviceId}`);

            const tokenData: PushTokenData = {
                token,
                platform: Platform.OS as 'ios' | 'android',
                deviceId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Vérifier si le document existe
            const existingDoc = await getDoc(tokenRef);
            if (existingDoc.exists()) {
                await updateDoc(tokenRef, {
                    token,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await setDoc(tokenRef, tokenData);
            }

            console.log('[PushService] Token saved to Firestore');
        } catch (error) {
            console.error('[PushService] Failed to save token:', error);
        }
    }

    /**
     * Supprime le token lors de la déconnexion
     */
    async unregisterPushNotifications(userId: string): Promise<void> {
        if (!this.expoPushToken) return;

        try {
            const deviceId = Device.modelId || 'unknown';
            const tokenRef = doc(db, FCM_TOKEN_COLLECTION, `${userId}_${deviceId}`);

            await updateDoc(tokenRef, {
                token: null,
                updatedAt: serverTimestamp(),
            });

            this.expoPushToken = null;
            this.currentUserId = null;

            console.log('[PushService] Unregistered push notifications');
        } catch (error) {
            console.error('[PushService] Failed to unregister:', error);
        }
    }

    // ==================== SEND NOTIFICATIONS ====================

    /**
     * Envoie une notification push à un utilisateur spécifique
     * Note: En production, ceci devrait être fait via Cloud Functions
     */
    async sendPushToUser(
        targetUserId: string,
        title: string,
        body: string,
        data?: Record<string, any>
    ): Promise<boolean> {
        try {
            // Récupérer les tokens de l'utilisateur cible
            const tokens = await this.getUserTokens(targetUserId);

            if (tokens.length === 0) {
                console.warn('[PushService] No tokens found for user:', targetUserId);
                return false;
            }

            // Envoyer via Expo Push API
            const messages = tokens.map(token => ({
                to: token,
                title,
                body,
                data: data || {},
                sound: 'default',
                priority: 'high' as const,
            }));

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            const result = await response.json();
            console.log('[PushService] Push sent:', result);
            return true;

        } catch (error) {
            console.error('[PushService] Failed to send push:', error);
            return false;
        }
    }

    /**
     * Récupère tous les tokens d'un utilisateur
     */
    private async getUserTokens(userId: string): Promise<string[]> {
        try {
            // Note: En production, utiliser une query pour tous les tokens de l'utilisateur
            const deviceId = Device.modelId || 'unknown';
            const tokenRef = doc(db, FCM_TOKEN_COLLECTION, `${userId}_${deviceId}`);
            const tokenDoc = await getDoc(tokenRef);

            if (tokenDoc.exists() && tokenDoc.data()?.token) {
                return [tokenDoc.data().token];
            }
            return [];
        } catch (error) {
            console.error('[PushService] Failed to get user tokens:', error);
            return [];
        }
    }

    // ==================== SOCIAL NOTIFICATIONS ====================

    /**
     * Envoie une notification de nouveau follower
     */
    async sendNewFollowerNotification(
        targetUserId: string,
        followerName: string
    ): Promise<void> {
        await this.sendPushToUser(
            targetUserId,
            'Nouveau follower',
            `${followerName} a commencé à te suivre`,
            {
                type: 'new_follower',
                followerName,
            }
        );
    }

    /**
     * Envoie une notification de nouveau message
     */
    async sendNewMessageNotification(
        targetUserId: string,
        senderName: string,
        messagePreview?: string
    ): Promise<void> {
        await this.sendPushToUser(
            targetUserId,
            'Nouveau message',
            messagePreview
                ? `${senderName}: ${messagePreview.slice(0, 50)}...`
                : `Tu as un nouveau message de ${senderName}`,
            {
                type: 'new_message',
                senderName,
            }
        );
    }

    /**
     * Envoie une notification de réaction à un post
     */
    async sendPostReactionNotification(
        targetUserId: string,
        reactorName: string,
        reaction: string
    ): Promise<void> {
        await this.sendPushToUser(
            targetUserId,
            'Nouvelle réaction',
            `${reactorName} a réagi ${reaction} à ton post`,
            {
                type: 'post_reaction',
                reactorName,
                reaction,
            }
        );
    }

    // ==================== GETTERS ====================

    getExpoPushToken(): string | null {
        return this.expoPushToken;
    }

    getCurrentUserId(): string | null {
        return this.currentUserId;
    }
}

export default PushNotificationService.getInstance();
