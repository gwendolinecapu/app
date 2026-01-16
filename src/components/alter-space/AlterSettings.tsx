import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alter } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';

import { ThemeColors } from '../../lib/cosmetics';

interface AlterSettingsProps {
    alter: Alter;
    themeColors?: ThemeColors;
}

export const AlterSettings: React.FC<AlterSettingsProps> = ({ alter, themeColors }) => {
    const textColor = themeColors?.text || colors.text;
    const textSecondaryColor = themeColors?.textSecondary || colors.textSecondary;
    const cardBg = themeColors?.backgroundCard || colors.surface;
    const borderColor = themeColors?.border || colors.border;
    const iconColor = themeColors?.primary || colors.primary;

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors?.background || 'transparent' }]}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Compte</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={() => router.push(`/alter-space/${alter.id}/edit`)}>
                    <Ionicons name="person-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Modifier le profil</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="lock-closed-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Confidentialité</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="notifications-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]} onPress={() => router.push('/settings')}>
                    <Ionicons name="settings-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Paramètres de l'application</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Interactions</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="people-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Abonnés proches</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <Ionicons name="ban-outline" size={24} color={textColor} />
                    <Text style={[styles.itemText, { color: textColor }]}>Comptes bloqués</Text>
                    <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>Système</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: cardBg, borderColor: borderColor }]}>
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
