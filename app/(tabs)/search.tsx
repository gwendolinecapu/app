import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { db } from '../../src/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface SearchResult {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    color: string;
    type: 'system' | 'alter';
}

export default function SearchScreen() {
    const { system } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

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
    }, [searchQuery]);

    const performSearch = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) return;

        setLoading(true);
        setHasSearched(true);

        try {
            const searchResults: SearchResult[] = [];
            const searchLower = searchQuery.toLowerCase();

            // Recherche dans les systèmes par email
            const systemsQuery = query(
                collection(db, 'systems'),
                where('email', '>=', searchLower),
                where('email', '<=', searchLower + '\uf8ff'),
                limit(10)
            );

            const systemsSnapshot = await getDocs(systemsQuery);
            systemsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (doc.id !== system?.id) {
                    searchResults.push({
                        id: doc.id,
                        name: data.name || data.email?.split('@')[0] || 'Système',
                        email: data.email,
                        color: '#7C3AED',
                        type: 'system',
                    });
                }
            });

            // Recherche dans les alters par nom (publics uniquement)
            const altersQuery = query(
                collection(db, 'alters'),
                limit(20)
            );

            const altersSnapshot = await getDocs(altersQuery);
            altersSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.system_id !== system?.id &&
                    data.name?.toLowerCase().includes(searchLower)) {
                    searchResults.push({
                        id: doc.id,
                        name: data.name,
                        avatar_url: data.avatar_url,
                        color: data.color || '#7C3AED',
                        type: 'alter',
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

    const renderResult = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity style={styles.resultItem}>
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
                </Text>
            </View>
            <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Suivre</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderSuggestedBubbles = () => (
        <View style={styles.suggestedSection}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <View style={styles.bubblesRow}>
                {/* Placeholder bubbles comme dans le design Canva */}
                <View style={styles.suggestionBubble}>
                    <View style={[styles.bubbleAvatar, { backgroundColor: '#E879F9' }]}>
                        <Text style={styles.bubbleInitial}>L</Text>
                    </View>
                    <Text style={styles.bubbleName}>Lilou</Text>
                </View>
                <View style={styles.suggestionBubble}>
                    <View style={[styles.bubbleAvatar, { backgroundColor: '#60A5FA' }]}>
                        <Ionicons name="person-add" size={20} color="white" />
                    </View>
                    <Text style={styles.bubbleName}>Ajouter</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Recherche</Text>
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
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Results Section */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
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
                            Recherchez d'autres systèmes par pseudo ou email pour les ajouter en ami
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
    followButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
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
});
