import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alter } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';

interface AlterSettingsProps {
    alter: Alter;
}

export const AlterSettings: React.FC<AlterSettingsProps> = ({ alter }) => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Compte</Text>
                <TouchableOpacity style={styles.item} onPress={() => router.push(`/alter-space/${alter.id}/edit`)}>
                    <Ionicons name="person-outline" size={24} color={colors.text} />
                    <Text style={styles.itemText}>Modifier le profil</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.item}>
                    <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
                    <Text style={styles.itemText}>Confidentialité</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.item}>
                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                    <Text style={styles.itemText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.item} onPress={() => router.push('/settings')}>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                    <Text style={styles.itemText}>Paramètres de l'application</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interactions</Text>
                <TouchableOpacity style={styles.item}>
                    <Ionicons name="people-outline" size={24} color={colors.text} />
                    <Text style={styles.itemText}>Abonnés proches</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.item}>
                    <Ionicons name="ban-outline" size={24} color={colors.text} />
                    <Text style={styles.itemText}>Comptes bloqués</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Système</Text>
                <TouchableOpacity style={styles.item}>
                    <Ionicons name="eye-off-outline" size={24} color={colors.error} />
                    <Text style={[styles.itemText, { color: colors.error }]}>Masquer cet alter</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 16, // Override slightly smaller if needed
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemText: {
        flex: 1,
        marginLeft: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
});
