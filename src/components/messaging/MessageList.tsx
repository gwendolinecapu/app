import React, { useEffect, useState, useRef } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { MessageBubble } from './MessageBubble';
import { colors, spacing } from '../../lib/theme';

interface Props {
    groupId: string;
}

export const MessageList = ({ groupId }: Props) => {
    const { user, currentAlter, alters } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!groupId) return;

        const q = query(
            collection(db, 'messages'),
            where('group_id', '==', groupId),
            orderBy('created_at', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);
            setLoading(false);
            // Scroll to bottom on new message
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }, (error) => {
            console.error("MessageList Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [groupId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (messages.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>Aucun message.</Text>
            </View>
        );
    }

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
                const isMine = item.sender_alter_id === currentAlter?.id;
                const senderAlter = alters.find(a => a.id === item.sender_alter_id);
                return (
                    <MessageBubble
                        message={item}
                        isMine={isMine}
                        senderAlter={senderAlter}
                        currentUserId={user?.uid}
                    />
                );
            }}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xl
    },
    emptyText: {
        color: colors.textMuted,
        fontStyle: 'italic'
    }
});
