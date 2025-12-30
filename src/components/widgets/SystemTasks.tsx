import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { collection, addDoc, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeTime } from '../../lib/date';

interface SystemTask {
    id: string;
    content: string;
    completed: boolean;
    created_at: number;
    created_by: string; // system_id or alter_id if avail
}

export const SystemTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<SystemTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Tasks stored in a subcollection of the user (system) or root collection
        // Let's use a root collection 'system_tasks' linked by system_id for easier querying
        const q = query(
            collection(db, 'system_tasks'),
            where('system_id', '==', user.uid),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SystemTask));
            setTasks(loadedTasks);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching tasks:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAddTask = async () => {
        if (!newTask.trim() || !user) return;

        setAdding(true);
        try {
            await addDoc(collection(db, 'system_tasks'), {
                system_id: user.uid,
                content: newTask.trim(),
                completed: false,
                created_at: Date.now(),
            });
            setNewTask('');
        } catch (err) {
            Alert.alert("Erreur", "Impossible d'ajouter la tâche");
        } finally {
            setAdding(false);
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            const taskRef = doc(db, 'system_tasks', taskId);
            await updateDoc(taskRef, { completed: !currentStatus });
        } catch (err) {
            console.error("Error toggling task:", err);
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const taskRef = doc(db, 'system_tasks', taskId);
            await deleteDoc(taskRef);
        } catch (err) {
            console.error("Error deleting task:", err);
        }
    };

    const renderItem = ({ item }: { item: SystemTask }) => (
        <View style={styles.taskItem}>
            <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                onPress={() => toggleTask(item.id, item.completed)}
            >
                {item.completed && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
                    {item.content}
                </Text>
            </View>

            <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Tâches Système</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {tasks.filter(t => !t.completed).length}
                    </Text>
                </View>
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Nouvelle tâche..."
                    placeholderTextColor={colors.textMuted}
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={handleAddTask}
                />
                <TouchableOpacity
                    style={[styles.addButton, !newTask.trim() && styles.addButtonDisabled]}
                    onPress={handleAddTask}
                    disabled={!newTask.trim() || adding}
                >
                    {adding ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Ionicons name="add" size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            ) : (
                <View style={styles.listContainer}>
                    {tasks.length === 0 ? (
                        <Text style={styles.emptyText}>Aucune tâche en cours</Text>
                    ) : (
                        tasks.map(task => (
                            <View key={task.id}>
                                {renderItem({ item: task })}
                            </View>
                        ))
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        // Shadow style
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    title: {
        ...typography.h3,
        color: colors.text,
        fontSize: 18,
    },
    badge: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    inputRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: 8,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    addButton: {
        backgroundColor: colors.primary,
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: colors.textMuted,
        opacity: 0.5,
    },
    listContainer: {
        gap: spacing.sm,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
    },
    taskContent: {
        flex: 1,
    },
    taskText: {
        color: colors.text,
        fontSize: 16,
    },
    taskTextDone: {
        textDecorationLine: 'line-through',
        color: colors.textMuted,
    },
    deleteButton: {
        padding: 4,
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: spacing.sm,
    }
});
