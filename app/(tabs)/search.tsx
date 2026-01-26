import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { FriendService } from '../../src/services/friends';
import { FollowService } from '../../src/services/follows';
import { useToast } from '../../src/components/ui/Toast';
import { triggerHaptic } from '../../src/lib/haptics';
import { AnimatedPressable } from '../../src/components/ui/AnimatedPressable';


interface SearchResult {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    color: string;
    type: 'system' | 'alter';
    systemId?: string;
    isSelectable?: boolean;
}

interface ImportState {
    active: boolean;
    system: SearchResult | null;
    alters: SearchResult[];
    selectedIds: Set<string>;
}

export default function SearchScreen() {
    const { system, currentAlter } = useAuth();
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    // Track status per result: 'none' | 'pending' | 'friends' | 'loading'
    const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({});
    // Suggested friends (recent systems with public alters)
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);

    // Import Mode State
    const [importMode, setImportMode] = useState<ImportState>({
        active: false,
        system: null,
        alters: [],
        selectedIds: new Set()
    });

    // Recherche en temps réel avec debounce
    useEffect(() => {
        if (searchQuery.length < 2) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        const timer = setTimeout(() => {
            performSearch();
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const performSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) return;

        setLoading(true);
        setHasSearched(true);
        // Reset Import Mode on new search
        setImportMode({ active: false, system: null, alters: [], selectedIds: new Set() });

        try {
            const searchResults: SearchResult[] = [];
            const searchLower = searchQuery.toLowerCase();
            const searchTrimmed = searchQuery.trim();

            // 1. Check if it's a System Code (UID) - Exact Match
            // Note: Firebase UIDs are typically 28 chars. But we check exact match on 'systems' collection.
            const systemDocRef = doc(db, 'systems', searchTrimmed);
            const systemDocSnap = await getDoc(systemDocRef);

            if (systemDocSnap.exists() && systemDocSnap.id !== system?.id) {
                // Found a system by Code! Enter Import Mode.
                const sysData = systemDocSnap.data();
                const targetSystem: SearchResult = {
                    id: systemDocSnap.id,
                    name: sysData.username || 'Système sans nom',
                    avatar_url: sysData.avatar_url,
                    color: colors.primary,
                    type: 'system',
                    systemId: systemDocSnap.id
                };

                // Fetch all public alters for this system
                const altersQ = query(
                    collection(db, 'alters'),
                    where('system_id', '==', searchTrimmed),
                    where('is_public', '==', true)
                );
                const altersSnap = await getDocs(altersQ);
                const systemAlters: SearchResult[] = [];
                altersSnap.forEach(doc => {
                    const d = doc.data();
                    systemAlters.push({
                        id: doc.id,
                        name: d.name,
                        avatar_url: d.avatar_url,
                        color: d.color || '#7C3AED',
                        type: 'alter',
                        systemId: searchTrimmed,
                        isSelectable: true
                    });
                });

                setImportMode({
                    active: true,
                    system: targetSystem,
                    alters: systemAlters,
                    selectedIds: new Set() // Start with none selected? Or all? User said "Select the ones you want".
                });

                // We stop here and show the Import UI
                setLoading(false);
                return;
            }

            // Normal Search Flow
            // Recherche dans les profils publics (systèmes) via FollowService
            // Note: La recherche directe dans 'systems' est restreinte par les règles de sécurité.

            // Recherche dans les profils publics (systèmes)
            const publicProfiles = await FollowService.searchUsers(searchLower, 5);
            publicProfiles.forEach(profile => {
                if (profile.system_id !== system?.id) {
                    searchResults.push({
                        id: profile.system_id,
                        name: profile.display_name,
                        email: profile.email,
                        avatar_url: profile.avatar_url,
                        color: colors.primary,
                        type: 'system',
                        systemId: profile.system_id,
                    });
                }
            });

            // Recherche dans les alters par nom (tous les alters accessibles)
            const altersQuery = query(
                collection(db, 'alters'),
                limit(50)
            );

            const altersSnapshot = await getDocs(altersQuery);
            altersSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.name?.toLowerCase().includes(searchLower)) {
                    searchResults.push({
                        id: doc.id,
                        name: data.name,
                        avatar_url: data.avatar_url,
                        color: data.color || '#7C3AED',
                        type: 'alter',
                        systemId: data.system_id,
                    });
                }
            });
            setResults(searchResults.slice(0, 15));
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check friend status for all results
    useEffect(() => {
        const checkStatuses = async () => {
            if (!currentAlter || !system || results.length === 0) return;

            const statuses: Record<string, string> = {};
            for (const result of results) {
                try {
                    if (result.type === 'alter') {
                        const status = await FriendService.checkStatus(currentAlter.id, result.id);
                        statuses[result.id] = status;
                    } else if (result.type === 'system') {
                        const following = await FollowService.isFollowing(system!.id, result.id);
                        statuses[result.id] = following ? 'following' : 'none';
                    }
                } catch {
                    statuses[result.id] = 'none';
                }
            }
            setFriendStatuses(statuses);
        };
        checkStatuses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [results, currentAlter?.id]);

    // Load suggestions (From saved suggestions + public random)
    useEffect(() => {
        const loadSuggestions = async () => {
            if (!system) return;
            try {
                // 1. Try to load saved suggestions first
                const savedSuggestions = await FriendService.getSuggestions(system.id);

                if (savedSuggestions.length > 0) {
                    setSuggestions(savedSuggestions);
                } else {
                    // 2. Fallback: random public alters (existing logic)
                    const q = query(
                        collection(db, 'alters'),
                        where('is_public', '==', true),
                        limit(10)
                    );
                    const snap = await getDocs(q);
                    const sugg: SearchResult[] = [];
                    snap.forEach(doc => {
                        const data = doc.data();
                        if (data.system_id !== system.id) {
                            sugg.push({
                                id: doc.id,
                                name: data.name,
                                avatar_url: data.avatar_url,
                                color: data.color || '#7C3AED',
                                type: 'alter',
                                systemId: data.system_id,
                            });
                        }
                    });
                    setSuggestions(sugg.slice(0, 5));
                }
            } catch (e) {
                console.error("Error loading suggestions:", e);
                // Fail silently for UI, maybe empty suggestions
            }
        };
        loadSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [system?.id]);

    // Send friend request
    // Send friend request or follow system
    const handleFollow = useCallback(async (target: SearchResult) => {
        if (!currentAlter || !system) {
            toast.showToast('Sélectionnez un alter d\'abord', 'warning');
            return;
        }

        const targetId = target.id;
        const targetName = target.name;
        const currentStatus = friendStatuses[targetId];

        if (currentStatus === 'friends' || currentStatus === 'following') {
            toast.showToast('Déjà connecté !', 'info');
            return;
        }
        if (currentStatus === 'pending') {
            toast.showToast('Demande déjà envoyée', 'info');
            return;
        }

        setFriendStatuses(prev => ({ ...prev, [targetId]: 'loading' }));
        triggerHaptic.selection();

        try {
            if (target.type === 'alter') {
                await FriendService.sendRequest(currentAlter.id, targetId);
                setFriendStatuses(prev => ({ ...prev, [targetId]: 'pending' }));
                toast.showToast(`Demande envoyée à ${targetName}`, 'success');
            } else {
                await FollowService.followUser(system.id, targetId);
                setFriendStatuses(prev => ({ ...prev, [targetId]: 'following' }));
                toast.showToast(`Vous suivez maintenant ${targetName}`, 'success');
            }
        } catch (error: any) {
            console.error('Action error:', error);
            setFriendStatuses(prev => ({ ...prev, [targetId]: 'none' }));
            toast.showToast(error.message || 'Erreur lors de l\'action', 'error');
        }
    }, [currentAlter, system, friendStatuses, toast]);

    // Get button text & style based on status
    const getButtonProps = (status: string | undefined, type: 'system' | 'alter') => {
        switch (status) {
            case 'friends':
                return { text: 'Amis ✓', style: styles.friendsButton };
            case 'following':
                return { text: 'Suivi ✓', style: styles.friendsButton };
            case 'pending':
                return { text: 'En attente', style: styles.pendingButton };
            case 'loading':
                return { text: '...', style: styles.pendingButton };
            default:
                return { text: type === 'system' ? 'Suivre' : 'Ajouter', style: styles.followButton };
        }
    };

    // Import Mode Handlers
    const toggleImportSelection = (alterId: string) => {
        setImportMode(prev => {
            const newSet = new Set(prev.selectedIds);
            if (newSet.has(alterId)) newSet.delete(alterId);
            else newSet.add(alterId);
            return { ...prev, selectedIds: newSet };
        });
        triggerHaptic.selection();
    };

    const handleImportSubmit = async () => {
        if (!currentAlter || !importMode.system) return;

        const count = importMode.selectedIds.size;
        if (count === 0) {
            toast.showToast("Sélectionnez au moins un alter", "warning");
            return;
        }

        setLoading(true);
        try {
            const promises = Array.from(importMode.selectedIds).map(alterId =>
                FriendService.sendRequest(currentAlter.id, alterId)
            );
            await Promise.all(promises);

            // Save unselected as suggestions
            const unselectedAlters = importMode.alters.filter(a => !importMode.selectedIds.has(a.id));
            if (unselectedAlters.length > 0) {
                await FriendService.saveSuggestions(system.id, unselectedAlters);
                // Optional: update local suggestions state immediately?
                // setSuggestions(prev => [...prev, ...unselectedAlters]); 
                // But better to reload or let next visit handle it.
            }

            triggerHaptic.success();
            toast.showToast(`${count} demande(s) envoyée(s) !`, "success");
            if (unselectedAlters.length > 0) {
                toast.showToast(`${unselectedAlters.length} suggestion(s) sauvegardée(s)`, "info");
            }

            // Reset and go back
            setSearchQuery('');
            setImportMode({ active: false, system: null, alters: [], selectedIds: new Set() });
            setHasSearched(false);
            setResults([]);
        } catch (error) {
            console.error("Import error", error);
            toast.showToast("Erreur lors de l'envoi", "error");
        } finally {
            setLoading(false);
        }
    };

    const renderImportView = () => {
        if (!importMode.system) return null;
        return (
            <View style={styles.importContainer}>
                <View style={styles.importHeader}>
                    <View style={styles.importAvatarContainer}>
                        {importMode.system.avatar_url ? (
                            <Image source={{ uri: importMode.system.avatar_url }} style={styles.importAvatar} />
                        ) : (
                            <View style={[styles.importAvatar, { backgroundColor: colors.primary }]}>
                                <Ionicons name="people" size={32} color="white" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.importTitle}>{importMode.system.name}</Text>
                    <Text style={styles.importSubtitle}>Système trouvé ! Sélectionnez les alters à ajouter.</Text>
                </View>

                <View style={styles.importListHeader}>
                    <Text style={styles.sectionTitle}>Alters du système ({importMode.alters.length})</Text>
                    <TouchableOpacity onPress={() => {
                        // Select/Deselect All logic
                        if (importMode.selectedIds.size === importMode.alters.length) {
                            setImportMode(prev => ({ ...prev, selectedIds: new Set() }));
                        } else {
                            const allIds = new Set(importMode.alters.map(a => a.id));
                            setImportMode(prev => ({ ...prev, selectedIds: allIds }));
                        }
                    }}>
                        <Text style={styles.selectAllText}>
                            {importMode.selectedIds.size === importMode.alters.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={importMode.alters}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => {
                        const isSelected = importMode.selectedIds.has(item.id);
                        return (
                            <TouchableOpacity
                                style={[styles.importItem, isSelected && styles.importItemSelected]}
                                onPress={() => toggleImportSelection(item.id)}
                            >
                                <View style={[styles.resultAvatar, { width: 44, height: 44, borderRadius: 22, backgroundColor: item.color }]}>
                                    {item.avatar_url ? (
                                        <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={[styles.avatarText, { fontSize: 18 }]}>{item.name.charAt(0)}</Text>
                                    )}
                                </View>
                                <Text style={[styles.importItemName, isSelected && styles.importItemNameSelected]}>{item.name}</Text>
                                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />

                <View style={styles.importFooter}>
                    <TouchableOpacity style={styles.importButton} onPress={handleImportSubmit}>
                        <Text style={styles.importButtonText}>
                            Ajouter {importMode.selectedIds.size > 0 ? `(${importMode.selectedIds.size})` : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderResult = ({ item }: { item: SearchResult }) => {
        const status = friendStatuses[item.id];
        const buttonProps = getButtonProps(status, item.type);
        const isDisabled = status === 'friends' || status === 'pending' || status === 'loading' || status === 'following';

        return (
            <AnimatedPressable
                style={styles.resultItem}
                onPress={() => {
                    if (item.type === 'system') {
                        router.push(`/profile/${item.id}`);
                    } else {
                        router.push(`/alter-space/${item.id}`);
                    }
                }}
            >
                <View style={[styles.resultAvatar, { backgroundColor: item.color }]}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
                <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    {item.email && (
                        <Text style={styles.resultEmail}>{item.email}</Text>
                    )}
                    <Text style={styles.resultType}>
                        {item.type === 'system' ? 'Système' : 'Alter'}
                        {item.systemId === system?.id && ' (Votre système)'}
                    </Text>
                </View>
                <AnimatedPressable
                    style={buttonProps.style}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleFollow(item);
                    }}
                    disabled={isDisabled || (item.id === currentAlter?.id)}
                >
                    <Text style={styles.followButtonText}>{buttonProps.text}</Text>
                </AnimatedPressable>
            </AnimatedPressable>
        );
    };

    const renderSuggestedBubbles = () => (
        <View style={styles.suggestedSection}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <View style={styles.bubblesRow}>
                {suggestions.length > 0 ? (
                    suggestions.map((sugg) => {
                        const status = friendStatuses[sugg.id];
                        return (
                            <AnimatedPressable
                                key={sugg.id}
                                style={styles.suggestionBubble}
                                onPress={() => handleFollow(sugg)}
                            >
                                <View style={[styles.bubbleAvatar, { backgroundColor: sugg.color }]}>
                                    {sugg.avatar_url ? (
                                        <Image source={{ uri: sugg.avatar_url }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                                    ) : (
                                        <Text style={styles.bubbleInitial}>{sugg.name.charAt(0)}</Text>
                                    )}
                                    {status === 'pending' && (
                                        <View style={styles.pendingBadge}>
                                            <Ionicons name="time" size={12} color="#fff" />
                                        </View>
                                    )}
                                    {status === 'friends' && (
                                        <View style={styles.friendsBadge}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.bubbleName} numberOfLines={1}>{sugg.name}</Text>
                            </AnimatedPressable>
                        );
                    })
                ) : (
                    <View style={styles.suggestionBubble}>
                        <View style={[styles.bubbleAvatar, { backgroundColor: '#60A5FA' }]}>
                            <Ionicons name="people" size={24} color="white" />
                        </View>
                        <Text style={styles.bubbleName}>Aucun</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <AnimatedPressable onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </AnimatedPressable>
                    <Text style={styles.title}>Recherche</Text>
                </View>
            </View>

            {/* Search Input - Design Canva avec "Email ou pseudo" */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Email ou pseudo"
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <AnimatedPressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </AnimatedPressable>
                )}
            </View>

            {/* Results Section OR Import View */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : importMode.active ? (
                renderImportView()
            ) : hasSearched && results.length > 0 ? (
                <View style={styles.resultsSection}>
                    <Text style={styles.sectionTitle}>Résultats</Text>
                    <FlatList
                        data={results}
                        renderItem={renderResult}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.resultsList}
                    />
                </View>
            ) : hasSearched && results.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Aucun résultat</Text>
                    <Text style={styles.emptySubtitle}>
                        Essayez avec un autre email ou pseudo
                    </Text>
                </View>
            ) : (
                /* État initial - Suggestions */
                <View style={styles.initialState}>
                    {renderSuggestedBubbles()}

                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyTitle}>Chercher des amis</Text>
                        <Text style={styles.emptySubtitle}>
                            Recherchez d&apos;autres systèmes par pseudo ou email pour les ajouter en ami
                        </Text>
                    </View>
                </View>
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
        padding: spacing.lg,
        paddingTop: spacing.md,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        paddingVertical: spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsSection: {
        flex: 1,
        paddingTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    resultsList: {
        paddingHorizontal: spacing.lg,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    resultAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    resultInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    resultName: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.text,
    },
    resultEmail: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    resultType: {
        ...typography.caption,
        color: colors.primary,
        marginTop: 2,
    },
    followButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
    },
    pendingButton: {
        backgroundColor: colors.textMuted,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
    },
    friendsButton: {
        backgroundColor: colors.success,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
    },
    followButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },
    pendingBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.warning,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    friendsBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.success,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    suggestedSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    bubblesRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    suggestionBubble: {
        alignItems: 'center',
    },
    bubbleAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    bubbleInitial: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    bubbleName: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    initialState: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
    },
    // Import Styles
    importContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    importHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    importAvatarContainer: {
        marginBottom: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    importAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    importTitle: {
        ...typography.h2,
        color: colors.text,
        textAlign: 'center',
    },
    importSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    importListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    selectAllText: {
        color: colors.primary,
        fontWeight: '600',
    },
    importItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    importItemSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    importItemName: {
        flex: 1,
        marginLeft: spacing.md,
        ...typography.body,
        fontWeight: '500',
        color: colors.text,
    },
    importItemNameSelected: {
        fontWeight: '700',
        color: colors.primary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.textMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    importFooter: {
        position: 'absolute',
        bottom: 30,
        left: spacing.lg,
        right: spacing.lg,
    },
    importButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    importButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
