import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { TaskService } from '../../src/services/tasks';
import { Task, Alter } from '../../src/types';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TasksListScreen() {
    const { system, alters, currentAlter } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'mine' | 'system' | 'all'>('mine');

    const loadTasks = async () => {
        if (!system) return;
        setLoading(true);
        try {
            const allTasks = await TaskService.getTasks(system.id);

            // Enrichir avec les données des alters
            const enrichedTasks = allTasks.map(t => ({
                ...t,
                creator_alter: alters.find(a => a.id === t.created_by),
                assigned_alter: t.assigned_to ? alters.find(a => a.id === t.assigned_to) : undefined
            }));

            setTasks(enrichedTasks);
        } catch (error) {
            console.error("Error loading tasks:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadTasks();
        }, [system])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const handleToggleTask = async (task: Task) => {
        try {
            // Optimistic update
            const newStatus = !task.is_completed;
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));

            await TaskService.toggleTaskCompletion(task.id, newStatus);
        } catch (error) {
            console.error("Error toggling task:", error);
            loadTasks(); // Revert on error
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            await TaskService.deleteTask(taskId);
        } catch (error) {
            console.error("Error deleting task:", error);
            loadTasks();
        }
    };

    const getFilteredTasks = () => {
        let filtered = tasks;

        if (filter === 'mine') {
            if (!currentAlter) return [];
            filtered = tasks.filter(t => t.assigned_to === currentAlter.id);
        } else if (filter === 'system') {
            filtered = tasks.filter(t => t.assigned_to === null);
        }

        // Trier par statut (non-complété en premier) puis par date
        return filtered.sort((a, b) => {
            if (a.is_completed === b.is_completed) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return a.is_completed ? 1 : -1;
        });
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <View style={[styles.taskItem, item.is_completed && styles.taskItemCompleted]}>
            <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleTask(item)}
            >
                {item.is_completed && <Ionicons name="checkmark" size={18} color="white" />}
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, item.is_completed && styles.taskTitleCompleted]}>
                    {item.title}
                </Text>
                {item.description ? (
                    <Text style={styles.taskDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}

                <View style={styles.taskMeta}>
                    <Text style={styles.taskMetaText}>
                        Par {item.creator_alter?.name || 'Inconnu'} • {item.assigned_to ? (item.assigned_alter?.name || 'Inconnu') : 'Système'}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => handleDeleteTask(item.id)}
                style={styles.deleteButton}
            >
                <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tâches</Text>
                <TouchableOpacity onPress={() => router.push('/tasks/create')} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, filter === 'mine' && styles.activeTab]}
                    onPress={() => setFilter('mine')}
                >
                    <Text style={[styles.tabText, filter === 'mine' && styles.activeTabText]}>Mes Tâches</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'system' && styles.activeTab]}
                    onPress={() => setFilter('system')}
                >
                    <Text style={[styles.tabText, filter === 'system' && styles.activeTabText]}>Système</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'all' && styles.activeTab]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.tabText, filter === 'all' && styles.activeTabText]}>Tout</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={getFilteredTasks()}
                    renderItem={renderTaskItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Aucune tâche trouvée</Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => router.push('/tasks/create')}
                            >
                                <Text style={styles.emptyButtonText}>Créer une tâche</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        ...typography.h3,
    },
    addButton: {
        padding: spacing.sm,
    },
    tabs: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.full,
        backgroundColor: colors.backgroundCard,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeTab: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.textOnPrimary,
    },
    loader: {
        marginTop: spacing.xl,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    taskItemCompleted: {
        opacity: 0.6,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        ...typography.body,
        fontWeight: '600',
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    taskDescription: {
        ...typography.caption, // Using caption for description to be smaller
        color: colors.textSecondary,
        marginTop: 2,
    },
    taskMeta: {
        marginTop: 4,
    },
    taskMetaText: {
        fontSize: 10,
        color: colors.textMuted,
    },
    deleteButton: {
        padding: spacing.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: spacing.xl * 2,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    emptyButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
    },
    emptyButtonText: {
        color: colors.textOnPrimary,
        fontWeight: 'bold',
    },
});
