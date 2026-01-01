
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function FeedbackMenuScreen() {
    const { colors } = useTheme();
    const router = useRouter();

    const menuItems = [
        {
            title: "Signaler un Bug",
            description: "Quelque chose ne fonctionne pas comme prévu ?",
            icon: "bug-outline",
            type: "BUG",
            color: "#EF4444" // Red
        },
        {
            title: "Proposer une idée",
            description: "Vous avez une idée pour améliorer l'application ?",
            icon: "bulb-outline",
            type: "FEATURE",
            color: "#F59E0B" // Amber
        }
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Votre avis compte !
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Aidez-nous à améliorer Plural Connect en nous signalant des problèmes ou en partageant vos idées.
                </Text>
            </View>

            <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.type}
                        style={[styles.card, { backgroundColor: colors.surface }]}
                        onPress={() => router.push({
                            pathname: "/settings/feedback/create",
                            params: { type: item.type }
                        })}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon as any} size={32} color={item.color} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                                {item.title}
                            </Text>
                            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                                {item.description}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Nous lisons tous les retours, mais nous ne pouvons pas répondre individuellement à chacun. Merci de votre compréhension.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        lineHeight: 22,
    },
    menuContainer: {
        padding: 16,
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 2,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 18,
    },
    infoBox: {
        margin: 24,
        marginTop: 8,
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: 'rgba(100, 100, 100, 0.1)', // Light gray background
        borderRadius: 12,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    }
});
