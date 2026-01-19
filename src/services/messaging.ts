
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc, addDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';

export interface ConversationSummary {
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export interface ConversationMeta {
    id: string;
    participants: string[];
    lastMessage: string;
    lastMessageTime: string;
    unreadCounts: { [key: string]: number };
}

export const MessagingService = {
    getConversationId: (id1: string, id2: string) => {
        return [id1, id2].sort().join('_');
    },

    getConversations: async (alterId: string): Promise<ConversationMeta[]> => {
        try {
            const q = query(
                collection(db, 'conversations'),
                where('participants', 'array-contains', alterId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversationMeta));
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
    },

    setConversationMetadata: async (id1: string, id2: string, data: Partial<ConversationMeta>) => {
        try {
            const conversationId = [id1, id2].sort().join('_');
            const ref = doc(db, 'conversations', conversationId);
            // We use setDoc with merge: true to create or update
            await setDoc(ref, {
                id: conversationId,
                participants: [id1, id2], // Ensure participants are set
                ...data
            }, { merge: true });
        } catch (error) {
            console.error('Error setting conversation metadata:', error);
        }
    },

    sendMessage: async (
        senderId: string,
        receiverId: string,
        content: string,
        extra: { imageUrl?: string; type?: string; systemId?: string; is_internal?: boolean; system_tag?: string | null } = {}
    ) => {
        try {
            const conversationId = [senderId, receiverId].sort().join('_');
            const messageData = {
                sender_alter_id: senderId,
                receiver_alter_id: receiverId,
                conversation_id: conversationId,
                content: content,
                is_read: false,
                created_at: new Date().toISOString(),
                ...extra
            };

            await addDoc(collection(db, 'messages'), messageData);

            // Update conversation metadata
            const convRef = doc(db, 'conversations', conversationId);

            const updateData: any = {
                id: conversationId,
                participants: [senderId, receiverId],
                lastMessage: extra.type === 'image' ? '📷 Image' : content,
                lastMessageTime: messageData.created_at,
                unreadCounts: {
                    [receiverId]: increment(1),
                    [senderId]: 0
                }
            };

            await setDoc(convRef, updateData, { merge: true });

        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
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
            const conversationId = [currentAlterId, otherAlterId].sort().join('_');

            // 1. Mark messages as read
            const q = query(
                collection(db, 'messages'),
                where('conversation_id', '==', conversationId),
                where('receiver_alter_id', '==', currentAlterId),
                where('is_read', '==', false)
            );
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);

            // Even if no messages to update, we might want to ensure conversation metadata is clean
            if (!snapshot.empty) {
                snapshot.docs.forEach((docSnapshot) => {
                    batch.update(doc(db, 'messages', docSnapshot.id), { is_read: true });
                });
            }

            // 2. Update conversation metadata
            const convRef = doc(db, 'conversations', conversationId);
            // Set unread count for current user to 0
            batch.set(convRef, {
                unreadCounts: {
                    [currentAlterId]: 0
                }
            }, { merge: true });

            await batch.commit();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
};
