import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Modal,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { db } from '../src/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { triggerHaptic } from '../src/lib/haptics';

// Types
interface Subject {
    id: string;
    name: string;
    color: string;
    icon: string;
    systemId: string;
    createdAt: any;
}

interface Category {
    id: string;
    subjectId: string;
    name: string;
    systemId: string;
    createdAt: any;
}

interface Note {
    id: string;
    categoryId: string;
    subjectId: string;
    title: string;
    content: string;
    systemId: string;
    createdAt: any;
    updatedAt: any;
}

// Preset colors for subjects
const SUBJECT_COLORS = [
    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#FF9800',
    '#FF5722', '#795548'
];

const SUBJECT_ICONS = [
    'calculator', 'flask', 'globe', 'language', 'musical-notes',
    'brush', 'fitness', 'book', 'code', 'heart', 'leaf', 'rocket'
];

export default function CoursesScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);

    const [loading, setLoading] = useState(true);
    const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);

    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);
    const [newSubjectIcon, setNewSubjectIcon] = useState(SUBJECT_ICONS[0]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');

    // Fetch subjects
    const fetchSubjects = useCallback(async () => {
        if (!user?.uid) return;
        try {
            const q = query(
                collection(db, 'subjects'),
                where('systemId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
            setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    // Fetch categories for a subject
    const fetchCategories = useCallback(async (subjectId: string) => {
        if (!user?.uid) return;
        try {
            const q = query(
                collection(db, 'categories'),
                where('subjectId', '==', subjectId),
                where('systemId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, [user?.uid]);

    // Fetch notes for a category
    const fetchNotes = useCallback(async (categoryId: string) => {
        if (!user?.uid) return;
        try {
            const q = query(
                collection(db, 'course_notes'),
                where('categoryId', '==', categoryId),
                where('systemId', '==', user.uid),
                orderBy('updatedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
            setNotes(data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    useEffect(() => {
        if (selectedSubject) {
            fetchCategories(selectedSubject.id);
            setSelectedCategory(null);
            setNotes([]);
        }
    }, [selectedSubject, fetchCategories]);

    useEffect(() => {
        if (selectedCategory) {
            fetchNotes(selectedCategory.id);
        }
    }, [selectedCategory, fetchNotes]);

    // Add subject
    const handleAddSubject = async () => {
        if (!newSubjectName.trim() || !user?.uid) return;
        try {
            await addDoc(collection(db, 'subjects'), {
                name: newSubjectName.trim(),
                color: newSubjectColor,
                icon: newSubjectIcon,
                systemId: user.uid,
                createdAt: serverTimestamp()
            });
            setNewSubjectName('');
            setShowAddSubjectModal(false);
            fetchSubjects();
            triggerHaptic.success();
        } catch (error) {
            console.error('Error adding subject:', error);
            Alert.alert('Erreur', "Impossible d'ajouter la matière");
        }
    };

    // Add category
    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !selectedSubject || !user?.uid) return;
        try {
            await addDoc(collection(db, 'categories'), {
                name: newCategoryName.trim(),
                subjectId: selectedSubject.id,
                systemId: user.uid,
                createdAt: serverTimestamp()
            });
            setNewCategoryName('');
            setShowAddCategoryModal(false);
            fetchCategories(selectedSubject.id);
            triggerHaptic.success();
        } catch (error) {
            console.error('Error adding category:', error);
            Alert.alert('Erreur', "Impossible d'ajouter la catégorie");
        }
    };

    // Add note
    const handleAddNote = async () => {
        if (!newNoteTitle.trim() || !selectedCategory || !selectedSubject || !user?.uid) return;
        try {
            await addDoc(collection(db, 'course_notes'), {
                title: newNoteTitle.trim(),
                content: newNoteContent,
                categoryId: selectedCategory.id,
                subjectId: selectedSubject.id,
                systemId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            setNewNoteTitle('');
            setNewNoteContent('');
            setShowAddNoteModal(false);
            fetchNotes(selectedCategory.id);
            triggerHaptic.success();
        } catch (error) {
            console.error('Error adding note:', error);
            Alert.alert('Erreur', "Impossible d'ajouter la note");
        }
    };

    // Delete handlers
    const handleDeleteSubject = (subject: Subject) => {
        Alert.alert(
            'Supprimer la matière',
            `Voulez-vous supprimer "${subject.name}" et toutes ses notes ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'subjects', subject.id));
                            setSelectedSubject(null);
                            fetchSubjects();
                        } catch {
                            Alert.alert('Erreur', 'Impossible de supprimer');
                        }
                    }
                }
            ]
        );
    };

    // Breadcrumb navigation
    const renderBreadcrumb = () => (
        <View style={styles.breadcrumb}>
            <TouchableOpacity
                onPress={() => { setSelectedSubject(null); setSelectedCategory(null); }}
                style={styles.breadcrumbItem}
            >
                <Text style={[styles.breadcrumbText, !selectedSubject && styles.breadcrumbActive]}>
                    Matières
                </Text>
            </TouchableOpacity>

            {selectedSubject && (
                <>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    <TouchableOpacity
                        onPress={() => setSelectedCategory(null)}
                        style={styles.breadcrumbItem}
                    >
                        <Text style={[styles.breadcrumbText, selectedSubject && !selectedCategory && styles.breadcrumbActive]}>
                            {selectedSubject.name}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            {selectedCategory && (
                <>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>
                        {selectedCategory.name}
                    </Text>
                </>
            )}
        </View>
    );

    // Render subjects grid
    const renderSubjects = () => (
        <FlatList
            data={subjects}
            numColumns={2}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="school-outline" size={64} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>Aucune matière</Text>
                    <Text style={styles.emptySubtitle}>Ajoute ta première matière pour commencer</Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={[styles.subjectCard, { borderLeftColor: item.color }]}
                    onPress={() => setSelectedSubject(item)}
                    onLongPress={() => handleDeleteSubject(item)}
                >
                    <View style={[styles.subjectIcon, { backgroundColor: `${item.color}20` }]}>
                        <Ionicons name={item.icon as any} size={24} color={item.color} />
                    </View>
                    <Text style={styles.subjectName}>{item.name}</Text>
                </TouchableOpacity>
            )}
        />
    );

    // Render categories
    const renderCategories = () => (
        <FlatList
            data={categories}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="folder-outline" size={64} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>Aucune catégorie</Text>
                    <Text style={styles.emptySubtitle}>Crée des chapitres ou thèmes</Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.categoryItem}
                    onPress={() => setSelectedCategory(item)}
                >
                    <Ionicons name="folder" size={24} color={selectedSubject?.color || colors.primary} />
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            )}
        />
    );

    // Render notes
    const renderNotes = () => (
        <FlatList
            data={notes}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>Aucune note</Text>
                    <Text style={styles.emptySubtitle}>Commence à prendre des notes</Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.noteItem}
                    onPress={() => router.push({ pathname: '/course-note/[id]', params: { id: item.id } } as any)}
                >
                    <View style={styles.noteHeader}>
                        <Ionicons name="document-text" size={20} color={selectedSubject?.color || colors.primary} />
                        <Text style={styles.noteTitle}>{item.title}</Text>
                    </View>
                    {item.content && (
                        <Text style={styles.notePreview} numberOfLines={2}>
                            {item.content}
                        </Text>
                    )}
                </TouchableOpacity>
            )}
        />
    );

    // Get FAB action based on current view
    const getFabAction = () => {
        if (selectedCategory) {
            return { onPress: () => setShowAddNoteModal(true), icon: 'add' };
        } else if (selectedSubject) {
            return { onPress: () => setShowAddCategoryModal(true), icon: 'folder-open' };
        }
        return { onPress: () => setShowAddSubjectModal(true), icon: 'add' };
    };

    const fabAction = getFabAction();

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cours</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Breadcrumb */}
            {renderBreadcrumb()}

            {/* Content */}
            <View style={styles.content}>
                {!selectedSubject && renderSubjects()}
                {selectedSubject && !selectedCategory && renderCategories()}
                {selectedCategory && renderNotes()}
            </View>

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: selectedSubject?.color || colors.primary }]}
                onPress={fabAction.onPress}
            >
                <Ionicons name={fabAction.icon as any} size={28} color="white" />
            </TouchableOpacity>

            {/* Add Subject Modal */}
            <Modal visible={showAddSubjectModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nouvelle Matière</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nom de la matière"
                            placeholderTextColor={colors.textSecondary}
                            value={newSubjectName}
                            onChangeText={setNewSubjectName}
                        />

                        <Text style={styles.inputLabel}>Couleur</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                            {SUBJECT_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        newSubjectColor === color && styles.colorSelected
                                    ]}
                                    onPress={() => setNewSubjectColor(color)}
                                />
                            ))}
                        </ScrollView>

                        <Text style={styles.inputLabel}>Icône</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
                            {SUBJECT_ICONS.map(icon => (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconOption,
                                        newSubjectIcon === icon && { backgroundColor: `${newSubjectColor}30` }
                                    ]}
                                    onPress={() => setNewSubjectIcon(icon)}
                                >
                                    <Ionicons
                                        name={icon as any}
                                        size={24}
                                        color={newSubjectIcon === icon ? newSubjectColor : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddSubjectModal(false)}>
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: newSubjectColor }]}
                                onPress={handleAddSubject}
                            >
                                <Text style={styles.confirmButtonText}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Category Modal */}
            <Modal visible={showAddCategoryModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nouvelle Catégorie</Text>
                        <Text style={styles.modalSubtitle}>dans {selectedSubject?.name}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nom de la catégorie (ex: Chapitre 1)"
                            placeholderTextColor={colors.textSecondary}
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddCategoryModal(false)}>
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: selectedSubject?.color || colors.primary }]}
                                onPress={handleAddCategory}
                            >
                                <Text style={styles.confirmButtonText}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Note Modal */}
            <Modal visible={showAddNoteModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>Nouvelle Note</Text>
                        <Text style={styles.modalSubtitle}>{selectedCategory?.name}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Titre de la note"
                            placeholderTextColor={colors.textSecondary}
                            value={newNoteTitle}
                            onChangeText={setNewNoteTitle}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Contenu de la note..."
                            placeholderTextColor={colors.textSecondary}
                            value={newNoteContent}
                            onChangeText={setNewNoteContent}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddNoteModal(false)}>
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: selectedSubject?.color || colors.primary }]}
                                onPress={handleAddNote}
                            >
                                <Text style={styles.confirmButtonText}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text,
    },
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
    },
    breadcrumbItem: {
        paddingHorizontal: spacing.xs,
    },
    breadcrumbText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    breadcrumbActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    grid: {
        padding: spacing.md,
    },
    list: {
        padding: spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    subjectCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        margin: spacing.xs,
        borderLeftWidth: 4,
        minHeight: 100,
    },
    subjectIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    subjectName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    categoryName: {
        flex: 1,
        marginLeft: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    noteItem: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    noteTitle: {
        marginLeft: spacing.sm,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    notePreview: {
        marginTop: spacing.xs,
        color: colors.textSecondary,
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        height: 120,
    },
    inputLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    colorPicker: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: spacing.sm,
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: 'white',
    },
    iconPicker: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    iconOption: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        backgroundColor: colors.background,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});
