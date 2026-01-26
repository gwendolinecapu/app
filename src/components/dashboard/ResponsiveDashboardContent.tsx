/**
 * ResponsiveDashboardContent - Contenu du dashboard adapté pour desktop et mobile
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { Ionicons } from '@expo/vector-icons';

interface Alter {
    id: string;
    name: string;
    color?: string;
    pronouns?: string;
    age?: number | string;
    role?: string;
    avatarUrl?: string;
}

interface ResponsiveDashboardContentProps {
    alters: Alter[];
    selectedAlters: string[];
    selectionMode: 'single' | 'multi';
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onAlterPress: (alter: Alter) => void;
    onAddPress: () => void;
    onToggleMode: (mode: 'single' | 'multi') => void;
}

export function ResponsiveDashboardContent({
    alters,
    selectedAlters,
    selectionMode,
    searchQuery,
    onSearchChange,
    onAlterPress,
    onAddPress,
    onToggleMode,
}: ResponsiveDashboardContentProps) {
    const { isDesktop, width } = useResponsive();

    // Calculer le nombre de colonnes selon la largeur
    const getColumns = () => {
        if (isDesktop) {
            if (width > 1400) return 8;
            if (width > 1200) return 6;
            return 5;
        }
        return 4;
    };

    const columns = getColumns();
    const alterSize = isDesktop ? 100 : 80;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header avec titre et contrôles */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
                        Qui est là ?
                    </Text>
                    <Text style={styles.subtitle}>
                        {selectedAlters.length > 0
                            ? `${selectedAlters.length} alter${selectedAlters.length > 1 ? 's' : ''} en front`
                            : 'Sélectionnez qui est en front'}
                    </Text>
                </View>

                {/* Mode toggles pour desktop */}
                {isDesktop && (
                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                selectionMode === 'single' && styles.modeButtonActive
                            ]}
                            onPress={() => onToggleMode('single')}
                        >
                            <Text style={[
                                styles.modeButtonText,
                                selectionMode === 'single' && styles.modeButtonTextActive
                            ]}>
                                Solo
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                selectionMode === 'multi' && styles.modeButtonActive
                            ]}
                            onPress={() => onToggleMode('multi')}
                        >
                            <Text style={[
                                styles.modeButtonText,
                                selectionMode === 'multi' && styles.modeButtonTextActive
                            ]}>
                                Co-Front
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Barre de recherche */}
            <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
                <Ionicons name="search" size={20} color={colors.textMuted} />
                <Text style={styles.searchPlaceholder}>
                    Chercher un alter...
                </Text>
            </View>

            {/* Grille d'alters */}
            <View style={[styles.grid, { marginTop: spacing.xl }]}>
                {/* Bouton Flou */}
                <View style={[styles.alterCard, { width: alterSize, height: alterSize }]}>
                    <View style={[styles.alterAvatar, styles.alterAvatarFlou]}>
                        <Text style={styles.alterAvatarText}>?</Text>
                    </View>
                    <Text style={styles.alterName}>Flou</Text>
                </View>

                {/* Bouton Ajouter */}
                <TouchableOpacity
                    style={[styles.alterCard, { width: alterSize, height: alterSize }]}
                    onPress={onAddPress}
                >
                    <View style={[styles.alterAvatar, styles.alterAvatarAdd]}>
                        <Ionicons name="add" size={32} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.alterName}>Ajouter</Text>
                </TouchableOpacity>

                {/* Alters */}
                {alters.map((alter) => {
                    const isSelected = selectedAlters.includes(alter.id);
                    return (
                        <TouchableOpacity
                            key={alter.id}
                            style={[styles.alterCard, { width: alterSize, height: alterSize }]}
                            onPress={() => onAlterPress(alter)}
                        >
                            <View style={[
                                styles.alterAvatar,
                                { backgroundColor: alter.color || colors.primaryLight },
                                isSelected && styles.alterAvatarSelected
                            ]}>
                                {alter.avatarUrl ? (
                                    <Text style={styles.alterAvatarText}>
                                        {alter.name.charAt(0).toUpperCase()}
                                    </Text>
                                ) : (
                                    <Text style={styles.alterAvatarText}>
                                        {alter.name.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.alterName} numberOfLines={1}>
                                {alter.name}
                            </Text>
                            {isDesktop && alter.role && (
                                <Text style={styles.alterRole} numberOfLines={1}>
                                    {alter.role}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    titleDesktop: {
        fontSize: 32,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: 4,
    },
    modeButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    modeButtonActive: {
        backgroundColor: colors.primary,
    },
    modeButtonText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    searchContainerDesktop: {
        maxWidth: 500,
    },
    searchPlaceholder: {
        ...typography.body,
        color: colors.textMuted,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    alterCard: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    alterAvatar: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundLight,
    },
    alterAvatarFlou: {
        backgroundColor: colors.backgroundLight,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    alterAvatarAdd: {
        backgroundColor: colors.backgroundLight,
        borderWidth: 2,
        borderColor: colors.border,
    },
    alterAvatarSelected: {
        borderWidth: 4,
        borderColor: colors.primary,
    },
    alterAvatarText: {
        ...typography.h2,
        color: colors.text,
    },
    alterName: {
        ...typography.bodySmall,
        color: colors.text,
        textAlign: 'center',
        fontWeight: '600',
    },
    alterRole: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
