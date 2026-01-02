import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { SecureContainer } from '../security/SecureContainer';
import { Alter } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';

import { ThemeColors } from '../../lib/cosmetics';

interface AlterJournalProps {
    alter: Alter;
    themeColors?: ThemeColors | null;
}

export const AlterJournal: React.FC<AlterJournalProps> = ({ alter, themeColors }) => {
    return (
        <SecureContainer title="Journal Privé" subtitle="Authentification requise">
            <ScrollView style={styles.container}>
                <Text style={[styles.title, themeColors && { color: themeColors.text }]}>Journal de {alter.name}</Text>
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={64} color={themeColors?.textSecondary || colors.textMuted} />
                    <Text style={[styles.emptyTitle, themeColors && { color: themeColors.text }]}>Journal personnel</Text>
                    <Text style={[styles.emptySubtitle, themeColors && { color: themeColors.textSecondary }]}>
                        Les entrées du journal de {alter.name} apparaîtront ici.
                        Ce journal est privé et indépendant des autres alters.
                    </Text>
                </View>
            </ScrollView>
        </SecureContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    title: {
        ...typography.h3,
        marginBottom: spacing.md,
        color: colors.text,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
