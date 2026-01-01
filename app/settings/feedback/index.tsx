
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography, borderRadius } from '../../../src/lib/theme';

export default function FeedbackMenuScreen() {
    const { colors } = useTheme();
    const router = useRouter();

    const menuItems = [
        {
            title: "Roadmap Publique",
            description: "Votez pour les prochaines fonctionnalités !",
            icon: "map-outline",
            type: "ROADMAP",
            color: "#8B5CF6", // Violet
            gradient: ['#A78BFA', '#8B5CF6']
        },
        {
            title: "Signaler un Bug",
            description: "Quelque chose ne fonctionne pas comme prévu ?",
            icon: "bug-outline",
            type: "BUG",
            color: "#EF4444", // Red
            gradient: ['#FCA5A5', '#EF4444']
        },
        {
            title: "Proposer une idée",
            description: "Vous avez une idée pour améliorer l'application ?",
            icon: "bulb-outline",
            type: "FEATURE",
            color: "#F59E0B", // Amber
            gradient: ['#FCD34D', '#F59E0B']
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Votre avis compte !
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Aidez-nous à améliorer Plural Connect en nous signalant des problèmes ou en partageant vos idées.
                </Text>

                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.type}
                            style={[
                                styles.card,
                                { backgroundColor: colors.surface }
                            ]}
                            activeOpacity={0.9}
                            onPress={() => {
                                if (item.type === 'ROADMAP') {
                                    router.push('/settings/feedback/roadmap' as any);
                                } else {
                                    router.push({
                                        pathname: "/settings/feedback/create",
                                        params: { type: item.type }
                                    });
                                }
                            }}
                        >
                            <LinearGradient
                                colors={item.gradient as any}
                                style={styles.iconContainer}
                            >
                                <Ionicons name={item.icon as any} size={32} color="#FFF" />
                            </LinearGradient>

                            <View style={styles.textContainer}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                                    {item.description}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.infoBox, { backgroundColor: 'rgba(100, 100, 100, 0.1)' }]}>
                    <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Nous lisons tous les retours, mais nous ne pouvons pas répondre individuellement à chacun. Merci de votre compréhension.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        opacity: 0.9,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 10,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    headerSubtitle: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 30,
        backgroundColor: 'transparent',
    },
    menuContainer: {
        gap: 20,
        marginBottom: 30,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        // Premium Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 16,
        padding: 20,
        borderRadius: 20,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    }
});
