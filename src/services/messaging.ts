
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
        } catch (error) {
            return 0;
        }
    }
};
