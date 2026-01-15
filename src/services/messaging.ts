
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface ConversationSummary {
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export const MessagingService = {
    getConversationId: (id1: string, id2: string) => {
        return [id1, id2].sort().join('_');
    },

    getLastMessage: async (currentAlterId: string, otherAlterId: string): Promise<ConversationSummary | null> => {
        try {
            const conversationId = [currentAlterId, otherAlterId].sort().join('_');
            const messagesRef = collection(db, 'messages');

            // Get last message
            const q = query(
                messagesRef,
                where('conversation_id', '==', conversationId),
                orderBy('created_at', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            const data = doc.data();

            // Count unread? (This would require another query or counter)
            // For now, let's just return 0 or do a separate count if critical
            // Optimization: unread count might be expensive to query every time

            return {
                lastMessage: data.type === 'image' ? '📷 Image' : (data.content || ''),
                lastMessageTime: data.created_at,
                unreadCount: (data.receiver_alter_id === currentAlterId && !data.is_read) ? 1 : 0
                // Note: accurate unread count needs 'where is_read == false' query
            };
        } catch (error) {
            console.error('Error fetching last message:', error);
            return null;
        }
    },

    getUnreadCount: async (currentAlterId: string, otherAlterId: string): Promise<number> => {
        try {
            const conversationId = [currentAlterId, otherAlterId].sort().join('_');
            const q = query(
                collection(db, 'messages'),
                where('conversation_id', '==', conversationId),
                where('receiver_alter_id', '==', currentAlterId),
                where('is_read', '==', false)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch {
            return 0;
        }
    },

    /**
     * Marque tous les messages non-lus d'une conversation comme lus
     */
    markAsRead: async (currentAlterId: string, otherAlterId: string): Promise<void> => {
        try {
            const { writeBatch, doc } = await import('firebase/firestore');
            const conversationId = [currentAlterId, otherAlterId].sort().join('_');
            const q = query(
                collection(db, 'messages'),
                where('conversation_id', '==', conversationId),
                where('receiver_alter_id', '==', currentAlterId),
                where('is_read', '==', false)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach((docSnapshot) => {
                batch.update(doc(db, 'messages', docSnapshot.id), { is_read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
};
