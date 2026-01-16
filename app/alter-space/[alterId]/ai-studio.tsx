import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAlterData } from '../../../src/hooks/useAlterData';
import { colors, spacing, typography, borderRadius } from '../../../src/lib/theme';
import { getThemeColors } from '../../../src/lib/cosmetics';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';

const { width } = Dimensions.get('window');

export default function AIStudioScreen() {
    const { alterId } = useLocalSearchParams<{ alterId: string }>();
    const { alter } = useAlterData(alterId);

    const themeColors = getThemeColors(alter?.equipped_items?.theme);
    const primaryColor = themeColors?.primary || colors.primary;
    const accentColor = '#A855F7'; // Mystical purple

    const features = [
        {
            id: 'avatar',
            title: "Génération d'Avatar",
            description: "Créez une représentation visuelle unique de votre alter à partir de références.",
            icon: "sparkles",
            route: `/alter-space/${alterId}/ritual`,
            enabled: true,
            badge: null
        },
        {
            id: 'magic_post',
            title: "Magie IA (Post)",
            description: "Générez des posts magiques avec des images contextuelles pour votre fil d'actualité.",
            icon: "image",
            route: `/story/create?mode=magic&alterId=${alterId}`, // Assuming this routes to Magic Post creation
            enabled: true,
            badge: "NEW"
        },
        {
            id: 'emoji',
            title: "Génération d'Emojis",
            description: "Créez des emojis personnalisés basés sur l'apparence de votre alter.",
            icon: "happy",
            route: null,
            enabled: false,
            badge: "BIENTÔT"
        }
    ];

    const handlePress = (feature: any) => {
        if (!feature.enabled) {
            Alert.alert("Bientôt disponible", "Cette fonctionnalité sera bientôt disponible !");
            return;
        }

        if (feature.id === 'magic_post') {
            // Check if we have a direct route or need to open a modal
            // For now, let's route to the feed or post creation with a param
            // Actually, usually Magic Post is triggered via a specific flow.
            // Let's assume navigating to /post/create with params is correct or handle it
            router.push({ pathname: '/post/create', params: { type: 'magic', authorId: alterId } });
        } else {
            router.push(feature.route);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors?.background || colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={themeColors?.text || colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors?.text || colors.text }]}>Studio IA</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.introCard}>
                    <LinearGradient
                        colors={[primaryColor + '30', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                    <Text style={[styles.introTitle, { color: themeColors?.text || colors.text }]}>
                        Atelier de Création
                    </Text>
                    <Text style={[styles.introDesc, { color: themeColors?.textSecondary || colors.textSecondary }]}>
                        Utilisez la puissance de l'IA pour donner vie à votre alter.
                        Générez des avatars réalistes, créez des mises en scène magiques pour vos posts,
                        et bientôt, personnalisez vos emojis.
                    </Text>
                </View>

                <View style={styles.grid}>
                    {features.map((feature, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.featureCard,
                                {
                                    backgroundColor: themeColors?.backgroundCard || 'rgba(30,30,40,0.6)',
                                    opacity: feature.enabled ? 1 : 0.7,
                                    borderColor: themeColors?.border || 'rgba(255,255,255,0.1)'
                                }
                            ]}
                            onPress={() => handlePress(feature)}
                            activeOpacity={feature.enabled ? 0.7 : 1}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: feature.enabled ? primaryColor + '20' : 'rgba(255,255,255,0.05)' }]}>
                                <Ionicons name={feature.icon as any} size={32} color={feature.enabled ? primaryColor : colors.textSecondary} />
                            </View>

                            <View style={styles.textContainer}>
                                <View style={styles.titleRow}>
                                    <Text style={[styles.cardTitle, { color: themeColors?.text || colors.text }]}>{feature.title}</Text>
                                    {feature.badge && <StatusBadge status={feature.badge === 'NEW' ? 'new' : 'coming-soon'} />}
                                </View>
                                <Text style={[styles.cardDesc, { color: themeColors?.textSecondary || colors.textSecondary }]}>{feature.description}</Text>
                            </View>

                            {feature.enabled && (
                                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Note */}
                <View style={[styles.noteContainer, { backgroundColor: themeColors?.backgroundCard || 'rgba(255,255,255,0.03)' }]}>
                    <Ionicons name="bulb-outline" size={20} color={themeColors?.textSecondary || colors.textSecondary} />
                    <Text style={[styles.noteText, { color: themeColors?.textSecondary || colors.textSecondary }]}>
                        Chaque création coûte des crédits. Vous pouvez en gagner en accomplissant des tâches ou en regardant des publicités.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        ...typography.h3,
        fontWeight: 'bold',
    },
    backButton: {
        padding: spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.full,
    },
    content: {
        padding: spacing.lg,
    },
    introCard: {
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: spacing.xxl,
        overflow: 'hidden',
    },
    introTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
    },
    introDesc: {
        ...typography.body,
        lineHeight: 22,
    },
    grid: {
        gap: spacing.lg,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30,30,40,0.6)',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    cardTitle: {
        ...typography.h3,
        fontSize: 18,
    },
    cardDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    noteContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.xxl,
        gap: spacing.sm,
    },
    noteText: {
        ...typography.caption,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 18,
    }
});
