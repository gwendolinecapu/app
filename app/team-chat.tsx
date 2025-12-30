import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../src/lib/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { db } from '../src/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { MessageList } from '../src/components/messaging/MessageList';
import { MessageInput } from '../src/components/messaging/MessageInput';
import { GroupService } from '../src/services/groups';
import { Message } from '../src/types';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PollCreatorModal } from '../src/components/messaging/PollCreatorModal';
import { NoteCreatorModal } from '../src/components/messaging/NoteCreatorModal';

export default function TeamChatScreen() {
    const { user, currentAlter } = useAuth();
    const [teamGroupId, setTeamGroupId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [pollModalVisible, setPollModalVisible] = useState(false);
    const [noteModalVisible, setNoteModalVisible] = useState(false);

    useEffect(() => {
        if (!user) return;
        initializeTeamChat();
    }, [user]);

    const initializeTeamChat = async () => {
        try {
            // Check for existing "System Team" group
            const q = query(
                collection(db, 'groups'),
                where('created_by', '==', user?.uid),
                where('is_internal', '==', true),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setTeamGroupId(snapshot.docs[0].id);
            } else {
                // Create if not exists
                const newGroupRef = await addDoc(collection(db, 'groups'), {
                    name: 'System Team Chat',
                    description: 'Internal communication channel',
                    created_by: user?.uid,
                    created_at: Date.now(),
                    type: 'private',
                    is_internal: true, // Special flag
                    members: [user?.uid], // System is the member
                    avatar_url: null
                });
                setTeamGroupId(newGroupRef.id);
            }
        } catch (error) {
            console.error("Error initializing Team Chat:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (content: string, type: 'text' | 'image' | 'poll' | 'note' = 'text', enrichments: any = {}) => {
        if (!teamGroupId || !user) return;

        // Use GroupService but we might need to adjust for internal logic if needed
        // For now, standard group message works, just internal context.
        await GroupService.sendGroupMessage(
            teamGroupId,
            user.uid,
            currentAlter?.id || 'unknown',
            content,
            type,
            enrichments
        );
    };

    const handleSendPoll = (question: string, options: string[]) => {
        handleSendMessage(question, 'poll', { pollOptions: options });
        setPollModalVisible(false);
    };

    const handleSendNote = (title: string, content: string) => {
        handleSendMessage(content, 'note', { noteTitle: title });
        setNoteModalVisible(false);
    };

    const handleTyping = (isTyping: boolean) => {
        if (!teamGroupId || !user) return;
        GroupService.setTypingStatus(
            teamGroupId,
            user.uid,
            isTyping,
            currentAlter?.name || 'System Member'
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (!teamGroupId) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: colors.text }}>Erreur de chargement du chat.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Ionicons name="people-circle" size={32} color={colors.primary} />
                <Text style={styles.headerTitle}>Team Chat (Interne)</Text>
                <Ionicons
                    name="close"
                    size={24}
                    color={colors.text}
                    onPress={() => router.back()}
                    style={{ marginLeft: 'auto' }}
                />
            </View>

            <View style={{ flex: 1 }}>
                {/* 
                  MessageList expects a groupId. 
                  We reuse the existing component which handles real-time subscription.
                */}
                <MessageList groupId={teamGroupId} />
            </View>

            <MessageInput
                onSend={(content, type) => handleSendMessage(content, type)}
                onOpenPoll={() => setPollModalVisible(true)}
                onOpenNote={() => setNoteModalVisible(true)}
                onTyping={handleTyping}
            />

            <PollCreatorModal
                visible={pollModalVisible}
                onClose={() => setPollModalVisible(false)}
                onSend={handleSendPoll}
            />

            <NoteCreatorModal
                visible={noteModalVisible}
                onClose={() => setNoteModalVisible(false)}
                onSend={handleSendNote}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    }
});
