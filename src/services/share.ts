import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { triggerHaptic } from '../lib/haptics';

// =====================================================
// SHARE SERVICE
// Partage de contenu via le système natif
// Support iOS/Android avec fallback clipboard
// =====================================================

export interface ShareContent {
    title?: string;
    message: string;
    url?: string;
}

/**
 * Partage un post via le système natif
 * @returns true si partagé avec succès
 */
export async function sharePost(postId: string, postContent: string, authorName: string): Promise<boolean> {
    const shareUrl = `https://pluralconnect.app/post/${postId}`; // Deep link URL
    const message = postContent.length > 100
        ? `${postContent.substring(0, 100)}...`
        : postContent;

    return shareContent({
        title: `Post de ${authorName}`,
        message: `${message}\n\nVoir sur Plural Connect:`,
        url: shareUrl,
    });
}

/**
 * Partage un profil d'alter
 */
export async function shareAlterProfile(alterId: string, alterName: string): Promise<boolean> {
    const shareUrl = `https://pluralconnect.app/alter/${alterId}`;

    return shareContent({
        title: `Profil de ${alterName}`,
        message: `Découvre le profil de ${alterName} sur Plural Connect`,
        url: shareUrl,
    });
}

/**
 * Partage une story
 */
export async function shareStory(storyId: string, authorName: string): Promise<boolean> {
    const shareUrl = `https://pluralconnect.app/story/${storyId}`;

    return shareContent({
        title: `Story de ${authorName}`,
        message: `Regarde cette story de ${authorName} sur Plural Connect`,
        url: shareUrl,
    });
}

/**
 * Partage générique via le système natif
 */
export async function shareContent(content: ShareContent): Promise<boolean> {
    try {
        triggerHaptic.selection();

        // Construire le message complet
        let fullMessage = content.message;
        if (content.url) {
            fullMessage += `\n${content.url}`;
        }

        const result = await Share.share(
            {
                title: content.title,
                message: fullMessage,
                url: Platform.OS === 'ios' ? content.url : undefined, // iOS supporte url séparé
            },
            {
                dialogTitle: content.title || 'Partager',
                subject: content.title, // Pour emails
            }
        );

        if (result.action === Share.sharedAction) {
            triggerHaptic.success();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Share failed:', error);
        triggerHaptic.error();
        return false;
    }
}

/**
 * Copie le lien dans le presse-papier (fallback)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await Clipboard.setStringAsync(text);
        triggerHaptic.success();
        return true;
    } catch (error) {
        console.error('Copy failed:', error);
        triggerHaptic.error();
        return false;
    }
}

export const ShareService = {
    sharePost,
    shareAlterProfile,
    shareStory,
    shareContent,
    copyToClipboard,
};
