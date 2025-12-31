import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DissociationGuideScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Guide de Dissociation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>

                {/* Introduction */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Qu'est-ce que la dissociation ?</Text>
                    <Text style={styles.text}>
                        La dissociation est un mécanisme de défense qui crée une déconnexion entre les pensées, les souvenirs, les émotions, les actions ou le sens de l&apos;identité.
                    </Text>
                    <Text style={[styles.text, { marginTop: 8 }]}>
                        C&apos;est une réaction normale à un stress intense, mais qui peut devenir envahissante.
                    </Text>
                </View>

                {/* Techniques d'Ancrage */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="leaf" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Techniques d'Ancrage</Text>
                    </View>
                    <Text style={styles.description}>
                        L'ancrage (grounding) aide à se reconnecter au présent et à la réalité physique.
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>La méthode 5-4-3-2-1</Text>
                        <Text style={styles.cardText}>
                            Nommez mentalement ou à voix haute :
                        </Text>
                        <View style={styles.list}>
                            <Text style={styles.listItem}>👀 5 choses que vous voyez</Text>
                            <Text style={styles.listItem}>✋ 4 choses que vous pouvez toucher</Text>
                            <Text style={styles.listItem}>👂 3 sons que vous entendez</Text>
                            <Text style={styles.listItem}>👃 2 odeurs que vous sentez</Text>
                            <Text style={styles.listItem}>👅 1 chose que vous pouvez goûter (ou une qualité que vous aimez chez vous)</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Respiration Carrée</Text>
                        <Text style={styles.cardText}>
                            1. Inspirez sur 4 temps 🌬️{'\n'}
                            2. Bloquez sur 4 temps 🛑{'\n'}
                            3. Expirez sur 4 temps 💨{'\n'}
                            4. Bloquez sur 4 temps 🛑
                        </Text>
                        <Text style={[styles.cardText, { marginTop: 8, fontStyle: 'italic' }]}>
                            Répétez ce cycle 3 à 5 fois.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Stimulation Sensorielle</Text>
                        <View style={styles.list}>
                            <Text style={styles.listItem}>❄️ Tenez un glaçon dans votre main</Text>
                            <Text style={styles.listItem}>🚿 Passez de l'eau froide sur vos poignets</Text>
                            <Text style={styles.listItem}>🦶 Marchez pieds nus sur le sol</Text>
                            <Text style={styles.listItem}>🛋️ Touchez une texture rugueuse ou douce</Text>
                        </View>
                    </View>
                </View>

                {/* Communication Interne */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="people" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Communication Interne</Text>
                    </View>
                    <Text style={styles.text}>
                        Si vous sentez une "switch" ou une confusion :
                    </Text>
                    <View style={styles.card}>
                        <Text style={styles.cardText}>
                            • Essayez de dire à l'intérieur : "Nous sommes en sécurité maintenant."{'\n'}
                            • Demandez doucement : "Qui a besoin d'aide ?" ou "De quoi avons-nous besoin ?"
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    headerTitle: {
        ...typography.h3,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    sectionTitle: {
        ...typography.h2,
        color: colors.primaryLight,
        marginBottom: spacing.xs,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    text: {
        ...typography.body,
        lineHeight: 24,
    },
    card: {
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    cardTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
        color: colors.text,
    },
    cardText: {
        ...typography.body,
        color: colors.text,
        lineHeight: 22,
    },
    list: {
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    listItem: {
        ...typography.body,
        color: colors.text,
        marginBottom: 4,
    },
});
