/**
 * Subsystem Selector Screen
 * Écran de sélection du subsystem au démarrage de l'app
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../src/lib/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { useSubsystems } from '../src/hooks/useSubsystems';
import { AnimatedPressable } from '../src/components/ui/AnimatedPressable';
import { triggerHaptic } from '../src/lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SUBSYSTEM_KEY = 'last_selected_subsystem';

export default function SubsystemSelectorScreen() {
    const { user, system } = useAuth();
    const { subsystems, loading, switchTo } = useSubsystems(user?.uid);
    const [selecting, setSelecting] = useState(false);

    // Check si on a un subsystem par défaut et rediriger automatiquement
    useEffect(() => {
        const checkAutoRedirect = async () => {
            if (loading || !subsystems || subsystems.length === 0) {
                return;
            }

            // Si un seul subsystem, rediriger automatiquement
            if (subsystems.length === 1) {
                await handleSelectSubsystem(subsystems[0].id);
                return;
            }

            // Sinon, vérifier le dernier subsystem sélectionné
            try {
                const lastSubsystemId = await AsyncStorage.getItem(LAST_SUBSYSTEM_KEY);
                if (lastSubsystemId && subsystems.find(s => s.id === lastSubsystemId)) {
                    // Auto-redirect vers le dernier subsystem
                    await handleSelectSubsystem(lastSubsystemId);
                }
            } catch (error) {
                console.error('Error checking last subsystem:', error);
            }
        };

        checkAutoRedirect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, subsystems]);

    const handleSelectSubsystem = async (subsystemId: string) => {
        setSelecting(true);
        triggerHaptic.selection();

        try {
            // Sauvegarder le choix
            await AsyncStorage.setItem(LAST_SUBSYSTEM_KEY, subsystemId);

            // Switcher vers ce subsystem
            await switchTo(subsystemId);

            // Rediriger vers le dashboard
            router.replace('/(tabs)/dashboard');
        } catch (error) {
            console.error('Error selecting subsystem:', error);
        } finally {
            setSelecting(false);
        }
    };

    const handleViewAll = () => {
        triggerHaptic.selection();
        // Retirer le subsystem sélectionné pour voir tous les alters
        AsyncStorage.removeItem(LAST_SUBSYSTEM_KEY);
        router.replace('/(tabs)/dashboard');
    };

    const handleCreateNew = () => {
        triggerHaptic.selection();
        router.push('/settings/subsystems' as any);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Si pas de subsystems, créer le premier ou rediriger vers dashboard
    if (subsystems.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Aucun sous-système</Text>
                    <Text style={styles.emptySubtitle}>
                        Créez votre premier sous-système pour organiser vos alters
                    </Text>
                    <AnimatedPressable
                        style={styles.createButton}
                        onPress={handleCreateNew}
                    >
                        <Ionicons name="add" size={24} color="white" />
                        <Text style={styles.createButtonText}>Créer un sous-système</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                        style={styles.skipButton}
                        onPress={handleViewAll}
                    >
                        <Text style={styles.skipButtonText}>Continuer sans sous-système</Text>
                    </AnimatedPressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.title}>Quel système choisir ?</Text>
                    {system?.display_name && (
                        <Text style={styles.systemName}>{system.display_name}</Text>
                    )}
                </View>

                {/* Subsystems List */}
                <View style={styles.subsystemsList}>
                    {subsystems.map((subsystem) => (
                        <AnimatedPressable
                            key={subsystem.id}
                            style={[
                                styles.subsystemCard,
                                { borderLeftColor: subsystem.color, borderLeftWidth: 4 }
                            ]}
                            onPress={() => handleSelectSubsystem(subsystem.id)}
                            disabled={selecting}
                        >
                            <View style={styles.subsystemHeader}>
                                <View style={[styles.subsystemIcon, { backgroundColor: subsystem.color }]}>
                                    <Ionicons name="people" size={24} color="white" />
                                </View>
                                <View style={styles.subsystemInfo}>
                                    <Text style={styles.subsystemName}>{subsystem.name}</Text>
                                    {subsystem.description && (
                                        <Text style={styles.subsystemDescription} numberOfLines={1}>
                                            {subsystem.description}
                                        </Text>
                                    )}
                                </View>
                                {subsystem.is_default && (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultBadgeText}>Par défaut</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.subsystemFooter}>
                                <View style={styles.subsystemStat}>
                                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                                    <Text style={styles.subsystemStatText}>
                                        {subsystem.alter_count} alter{subsystem.alter_count !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                {subsystem.last_accessed_at && (
                                    <Text style={styles.lastAccessedText}>
                                        Vu {formatTimeAgo(subsystem.last_accessed_at)}
                                    </Text>
                                )}
                            </View>
                        </AnimatedPressable>
                    ))}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <AnimatedPressable
                        style={styles.createNewButton}
                        onPress={handleCreateNew}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.createNewButtonText}>Créer un sous-système</Text>
                    </AnimatedPressable>

                    <AnimatedPressable
                        style={styles.viewAllButton}
                        onPress={handleViewAll}
                    >
                        <Text style={styles.viewAllButtonText}>Voir tous les alters</Text>
                    </AnimatedPressable>
                </View>
            </ScrollView>

            {selecting && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </SafeAreaView>
    );
}

// Helper pour formater le temps
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'à l&apos;instant';
    if (diffMins < 60) return `il y a ${diffMins}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return `il y a ${Math.floor(diffDays / 7)} sem`;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    header: {
        marginBottom: spacing.xl,
    },
    greeting: {
        ...typography.body,
        color: colors.textSecondary,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        marginTop: spacing.xs,
    },
    systemName: {
        ...typography.bodySmall,
        color: colors.primary,
        marginTop: spacing.xs,
    },
    subsystemsList: {
        gap: spacing.md,
    },
    subsystemCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    subsystemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    subsystemIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    subsystemInfo: {
        flex: 1,
    },
    subsystemName: {
        ...typography.h3,
        color: colors.text,
    },
    subsystemDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    defaultBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    defaultBadgeText: {
        ...typography.caption,
        color: 'white',
        fontWeight: '600',
    },
    subsystemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subsystemStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    subsystemStatText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    lastAccessedText: {
        ...typography.caption,
        color: colors.textMuted,
    },
    actions: {
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        gap: spacing.sm,
    },
    createNewButtonText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
    viewAllButton: {
        padding: spacing.md,
        alignItems: 'center',
    },
    viewAllButtonText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyTitle: {
        ...typography.h2,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    createButtonText: {
        ...typography.body,
        color: 'white',
        fontWeight: '600',
    },
    skipButton: {
        marginTop: spacing.md,
        padding: spacing.md,
    },
    skipButtonText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
