import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { SecureContainer } from '../security/SecureContainer';
import { Alter } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';

interface AlterJournalProps {
    alter: Alter;
}

export const AlterJournal: React.FC<AlterJournalProps> = ({ alter }) => {
    return (
        <SecureContainer title="Journal Privé" subtitle="Authentification requise">
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Journal de {alter.name}</Text>
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Journal personnel</Text>
                    <Text style={styles.emptySubtitle}>
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
