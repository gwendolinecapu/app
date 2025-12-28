import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../src/lib/theme';

export default function SearchScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Recherche</Text>
            </View>

            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher des systèmes, alters..."
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Chercher des amis</Text>
                <Text style={styles.emptySubtitle}>
                    Recherchez d'autres systèmes par pseudo ou email pour les ajouter en ami
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    title: {
        ...typography.h2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        marginHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        textAlign: 'center',
        color: colors.textSecondary,
    },
});
