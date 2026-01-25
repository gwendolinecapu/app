
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export default function ArchivedAltersScreen() {
    const { alters, toggleArchive } = useAuth();

    const archivedAlters = useMemo(() => {
        return alters.filter(alter => alter.isArchived);
    }, [alters]);

    const handleUnarchive = (alterId: string, alterName: string) => {
        Alert.alert(
            "Désarchiver",
            `Voulez-vous restaurer ${alterName} ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Restaurer",
                    onPress: async () => {
                        await toggleArchive(alterId);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: item.color || colors.primary }]}>
                        <Text style={styles.avatarInitial}>{item.name[0]?.toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.role}>{item.pronouns || 'Aucun pronom'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => handleUnarchive(item.id, item.name)}
                >
                    <Ionicons name="refresh-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primaryDark, colors.background]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Alters Archivés</Text>
                </View>

                {archivedAlters.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="archive-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Aucun alter archivé</Text>
                        <Text style={styles.emptySubtext}>Les alters que vous archivez apparaîtront ici.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={archivedAlters}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        opacity: 0.8,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        height: 60,
    },
    backButton: {
        marginRight: spacing.md,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text,
        flex: 1,
    },
    list: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing.md,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
    },
    name: {
        ...typography.h4,
        color: colors.text,
        marginBottom: 2,
    },
    role: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    restoreButton: {
        padding: spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
