import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '../../services/tasks';
import { Task, Alter } from '../../types';

// Constants for Dropdowns
const CATEGORIES = [
    { id: 'general', label: 'Général', icon: 'list', color: colors.text },
    { id: 'care', label: 'Self-Care', icon: 'heart', color: '#FF6B6B' },
    { id: 'admin', label: 'Admin', icon: 'briefcase', color: '#4ECDC4' },
    { id: 'work', label: 'Travail', icon: 'laptop-outline', color: '#45B7D1' }, // laptop -> laptop-outline
    { id: 'fun', label: 'Fun', icon: 'game-controller', color: '#96CEB4' }
];

const RECURRENCE = [
    { id: 'none', label: 'Une fois' },
    { id: 'daily', label: 'Quotidien' },
    { id: 'weekly', label: 'Hebdo' }
];

export const SystemTasks = () => {
    const { user, alters } = useAuth();
    // const { alters } = useAlterData(); // Removed incorrect hook usage
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [adding, setAdding] = useState(false);

    // New Task State
    const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null); // null = System
    const [selectedCategory, setSelectedCategory] = useState<string>('general');
    const [selectedRecurrence, setSelectedRecurrence] = useState<string>('none');

    // UI State
    const [showOptions, setShowOptions] = useState(false);

    const loadTasks = React.useCallback(async () => {
        if (!user) return;
        try {
            const data = await TaskService.getTasks(user.uid, 'all');
            setTasks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadTasks();
    }, [user, loadTasks]);

    const handleAddTask = async () => {
        if (!newTask.trim() || !user) return;

        setAdding(true);
        try {
            await TaskService.createTask({
                system_id: user.uid,
                title: newTask.trim(),
                assigned_to: selectedAssignee,
                created_by: user.uid, // Or current fronter ID if available
                category: selectedCategory as any,
                recurrence: selectedRecurrence as any,
                visibility: 'public'
            });
            setNewTask('');
            setShowOptions(false);
            // Reset defaults
            setSelectedAssignee(null);
            setSelectedCategory('general');
            setSelectedRecurrence('none');

            // Reload
            loadTasks();
        } catch (err) {
            Alert.alert("Erreur", "Impossible d'ajouter la tâche");
        } finally {
            setAdding(false);
        }
    };

    const toggleTask = async (task: Task) => {
        try {
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            );
            setTasks(updatedTasks);

            const result = await TaskService.toggleTaskCompletion(task.id, !task.is_completed, task);

            if (result.rewardEarned) {
                Alert.alert("🎉 Bravo !", "Vous avez gagné +5 Crédits !");
            }

            // Reload to sync state (important for recurring tasks that might have been created)
            loadTasks();
        } catch (err) {
            console.error("Error toggling task:", err);
            loadTasks(); // Revert on error
        }
    };

    const deleteTask = async (taskId: string) => {
        Alert.alert(
            "Supprimer",
            "Voulez-vous supprimer cette tâche ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await TaskService.deleteTask(taskId);
                            loadTasks();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            ]
        );
    };

    const getAssigneeName = (id: string | null) => {
        if (!id) return "Système";
        const alt = alters.find((a: Alter) => a.id === id);
        return alt ? alt.name : "Inconnu";
    };

    const renderItem = ({ item }: { item: Task }) => {
        const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];

        return (
            <View style={styles.taskItem}>
                <TouchableOpacity
                    style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}
                    onPress={() => toggleTask(item)}
                >
                    {item.is_completed && <Ionicons name="checkmark" size={16} color="white" />}
                </TouchableOpacity>

                <View style={styles.taskContent}>
                    <Text style={[styles.taskText, item.is_completed && styles.taskTextDone]}>
                        {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                        {/* Category Badge */}
                        <View style={[styles.miniBadge, { backgroundColor: cat.color + '20' }]}>
                            <Ionicons name={cat.icon as any} size={10} color={cat.color} />
                            <Text style={[styles.miniBadgeText, { color: cat.color }]}>{cat.label}</Text>
                        </View>

                        {/* Assignee Badge */}
                        <View style={styles.miniBadge}>
                            <Ionicons name="person" size={10} color={colors.textSecondary} />
                            <Text style={styles.miniBadgeText}>{getAssigneeName(item.assigned_to)}</Text>
                        </View>

                        {/* Recurrence Badge */}
                        {item.recurrence && item.recurrence !== 'none' && (
                            <View style={styles.miniBadge}>
                                <Ionicons name="repeat" size={10} color={colors.primary} />
                            </View>
                        )}
                    </View>
                </View>

                <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Tâches & Quêtes</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {tasks.filter(t => !t.is_completed).length}
                    </Text>
                </View>
            </View>

            {/* Input Area */}
            <View style={styles.inputContainer}>
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
                        style={styles.optionsButton}
                        onPress={() => setShowOptions(!showOptions)}
                    >
                        <Ionicons name="options" size={20} color={showOptions ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
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

                {/* Extended Options (Collapsible) */}
                {showOptions && (
                    <View style={styles.optionsContainer}>
                        {/* Assignee Scroller */}
                        <Text style={styles.optionLabel}>Pour qui ?</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                            <TouchableOpacity
                                style={[styles.chip, selectedAssignee === null && styles.chipActive]}
                                onPress={() => setSelectedAssignee(null)}
                            >
                                <Text style={[styles.chipText, selectedAssignee === null && styles.chipTextActive]}>Système</Text>
                            </TouchableOpacity>
                            {alters.map((alter: Alter) => (
                                <TouchableOpacity
                                    key={alter.id}
                                    style={[styles.chip, selectedAssignee === alter.id && styles.chipActive]}
                                    onPress={() => setSelectedAssignee(alter.id)}
                                >
                                    <Text style={[styles.chipText, selectedAssignee === alter.id && styles.chipTextActive]}>{alter.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Category Scroller */}
                        <Text style={styles.optionLabel}>Catégorie</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.chip, selectedCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Ionicons name={cat.icon as any} size={14} color={cat.color} style={{ marginRight: 4 }} />
                                    <Text style={{ color: cat.color, fontWeight: '600', fontSize: 12 }}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Recurrence Scroller */}
                        <Text style={styles.optionLabel}>Récurrence</Text>
                        <View style={styles.row}>
                            {RECURRENCE.map(rec => (
                                <TouchableOpacity
                                    key={rec.id}
                                    style={[styles.chip, selectedRecurrence === rec.id && styles.chipActive]}
                                    onPress={() => setSelectedRecurrence(rec.id)}
                                >
                                    <Text style={[styles.chipText, selectedRecurrence === rec.id && styles.chipTextActive]}>{rec.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
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
    inputContainer: {
        marginBottom: spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
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
        height: 40,
    },
    optionsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.md,
        backgroundColor: colors.background,
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
    optionsContainer: {
        marginTop: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    optionLabel: {
        ...typography.tiny,
        color: colors.textSecondary,
        marginBottom: 4,
        fontWeight: 'bold',
    },
    optionScroll: {
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.backgroundCard,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    chipTextActive: {
        color: 'white',
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
        borderLeftWidth: 3,
        borderLeftColor: 'transparent', // Default
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
    metaRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 6,
    },
    miniBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    miniBadgeText: {
        fontSize: 10,
        color: colors.textSecondary,
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
