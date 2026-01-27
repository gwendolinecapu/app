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
    const [importMode, setImportMode] = useState<{ active: boolean, system: SearchResult | null, alters: SearchResult[], selectedIds: Set<string> }>({
        active: false,
        system: null,
        alters: [],
        selectedIds: new Set()
    });
    // Add local filter state for import view
    const [filterText, setFilterText] = useState('');

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
            if (searchTrimmed.length === 28) {
                console.log('Searching by System ID (Cloud Function):', searchTrimmed);
                try {
                    const { httpsCallable } = require('firebase/functions');
                    const { functions } = require('../../src/lib/firebase');
                    const searchSystemAlters = httpsCallable(functions, 'searchSystemAlters');

                    const result = await searchSystemAlters({ systemId: searchTrimmed });
                    const data = result.data as any;

                    if (data && data.system && data.alters) {
                        const systemData = data.system;
                        const targetSystem = {
                            id: systemData.id,
                            name: systemData.name,
                            avatar_url: systemData.avatar_url,
                            email: '', // Not returned for privacy
                            color: colors.primary,
                            type: 'system' as const,
                            systemId: systemData.id
                        };

                        const systemAlters: SearchResult[] = data.alters.map((a: any) => ({
                            id: a.id,
                            name: a.name,
                            avatar_url: a.avatar_url,
                            color: a.color || '#7C3AED',
                            type: 'alter',
                            systemId: searchTrimmed,
                            isSelectable: true
                        }));

                        setImportMode({
                            active: true,
                            system: targetSystem,
                            alters: systemAlters,
                            selectedIds: new Set()
                        });

                        setLoading(false);
                        return;
                    }
                } catch (fnError) {
                    console.warn('Cloud Function Search Failed, falling back to client-side:', fnError);

                    // FALLBACK: Client-side search (Respects Security Rules)
                    // 1. Fetch System
                    const systemDocRef = doc(db, 'systems', searchTrimmed);
                    try {
                        const systemDocSnap = await getDoc(systemDocRef);

                        if (systemDocSnap.exists() && systemDocSnap.id !== system?.id) {
                            const sysData = systemDocSnap.data();
                            const targetSystem = {
                                id: systemDocSnap.id,
                                name: sysData.username || 'Système sans nom',
                                avatar_url: sysData.avatar_url,
                                email: '', // Privacy
                                color: colors.primary,
                                type: 'system' as const,
                                systemId: systemDocSnap.id
                            };

                            // Fetch ALL alters for this system (Best effort - relies on relaxed rules for Code Search)
                            const altersQ = query(
                                collection(db, 'alters'),
                                where('system_id', '==', searchTrimmed)
                                // VISIBILITY FILTER REMOVED: To allow "Code Access" logic
                            );

                            try {
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
                                    selectedIds: new Set()
                                });

                                setLoading(false);
                                return;
                            } catch (queryErr) {
                                console.error('Fallback Alters Query Error:', queryErr);
                                // Even if alters fail, show system?
                            }
                        }
                    } catch (docErr) {
                        console.error('Fallback System Doc Error:', docErr);
                    }
                }
            } // Normal Search Flow
            // Recherche dans les profils publics (systèmes) via FollowService
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
            // Fix: Must filter by visibility to satisfy security rules
            const altersQuery = query(
                collection(db, 'alters'),
                where('visibility', 'in', ['public', 'friends']),
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
                        where('visibility', '==', 'public'),
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
        let successCount = 0;
        let pendingCount = 0;

        try {
            const promises = Array.from(importMode.selectedIds).map(async (alterId) => {
                try {
                    await FriendService.sendRequest(currentAlter.id, alterId);
                    successCount++;
                } catch (err: any) {
                    if (err.message?.includes('already pending') || err.message?.includes('already friends')) {
                        pendingCount++;
                    } else {
                        console.warn(`Failed to import alter ${alterId}:`, err);
                    }
                }
            });

            await Promise.all(promises);

            // Save unselected as suggestions
            const unselectedAlters = importMode.alters.filter(a => !importMode.selectedIds.has(a.id));
            if (unselectedAlters.length > 0) {
                await FriendService.saveSuggestions(system.id, unselectedAlters);
                // Update local suggestions state immediately
                setSuggestions(prev => {
                    const existingIds = new Set(prev.map(s => s.id));
                    const newSuggestions = unselectedAlters.filter(a => !existingIds.has(a.id));
                    return [...prev, ...newSuggestions];
                });
            }

            triggerHaptic.success();

            let message = '';
            if (successCount > 0) message += `${successCount} demande(s) envoyée(s). `;
            if (pendingCount > 0) message += `${pendingCount} déjà en attente/amis.`;

            toast.showToast(message || "Import terminé", "success");

            if (unselectedAlters.length > 0) {
                toast.showToast(`${unselectedAlters.length} suggestion(s) sauvegardée(s)`, "info");
            }

            // Reset and go back
            setSearchQuery('');
            setImportMode({ active: false, system: null, alters: [], selectedIds: new Set() });
            setFilterText(''); // Reset filter
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

        // Filter logic
        const filteredAlters = importMode.alters.filter(alter =>
            alter.name.toLowerCase().includes(filterText.toLowerCase())
        );

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
                    {/* Add Filter Input */}
                    <View style={styles.filterContainer}>
                        <Ionicons name="search" size={16} color={colors.textMuted} style={styles.filterIcon} />
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Filtrer par nom..."
                            placeholderTextColor={colors.textMuted}
                            value={filterText}
                            onChangeText={setFilterText}
                            autoCorrect={false}
                        />
                        {filterText.length > 0 && (
                            <TouchableOpacity onPress={() => setFilterText('')}>
                                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.selectionHeader}>
                        <Text style={styles.sectionTitle}>Alters ({filteredAlters.length})</Text>
                        <TouchableOpacity onPress={() => {
                            // Select/Deselect All FILTERED items
                            const allFilteredIds = filteredAlters.map(a => a.id);
                            const allSelected = allFilteredIds.every(id => importMode.selectedIds.has(id));

                            setImportMode(prev => {
                                const newSet = new Set(prev.selectedIds);
                                if (allSelected) {
                                    // Deselect all filtered
                                    allFilteredIds.forEach(id => newSet.delete(id));
                                } else {
                                    // Select all filtered
                                    allFilteredIds.forEach(id => newSet.add(id));
                                }
                                return { ...prev, selectedIds: newSet };
                            });
                        }}>
                            <Text style={styles.selectAllText}>
                                {filteredAlters.length > 0 && filteredAlters.every(a => importMode.selectedIds.has(a.id)) ? 'Tout désélectionner' : 'Tout sélectionner'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    data={filteredAlters}
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
                    placeholder="Entrer le code"
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
        marginBottom: spacing.md,
        paddingHorizontal: 0, // Reset padding here as parent handles it or selectionHeader
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
        marginBottom: spacing.md,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
        marginHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterIcon: {
        marginRight: spacing.sm,
    },
    filterInput: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        paddingVertical: 4,
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg || 20, // Fallback if spacing.lg is undefined
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
