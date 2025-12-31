import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../lib/theme';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);

export const ToolsGrid: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Boîte à outils</Text>
            </View>

            <View style={styles.toolsGrid}>
                <TouchableOpacity
                    style={styles.toolItem}
                    onPress={() => router.push('/team-chat')}
                >
                    <View style={[styles.toolIcon, { backgroundColor: colors.backgroundLight }]}>
                        <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.toolLabel}>Team Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.toolItem}
                    onPress={() => { /* Modal ou navigation vers tâches */ }}
                >
                    <View style={[styles.toolIcon, { backgroundColor: colors.backgroundLight }]}>
                        <Ionicons name="list" size={24} color={colors.success} />
                    </View>
                    <Text style={styles.toolLabel}>Tâches</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.toolItem}
                    onPress={() => { /* Navigation History/Stats */ }}
                >
                    <View style={[styles.toolIcon, { backgroundColor: colors.backgroundLight }]}>
                        <Ionicons name="calendar" size={24} color={colors.warning} />
                    </View>
                    <Text style={styles.toolLabel}>Calendrier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.toolItem}
                    onPress={() => { /* Toggle Mood picker */ }}
                >
                    <View style={[styles.toolIcon, { backgroundColor: colors.backgroundLight }]}>
                        <Ionicons name="sunny" size={24} color={colors.info} />
                    </View>
                    <Text style={styles.toolLabel}>Météo</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: spacing.lg,
    },
    sectionHeader: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        fontSize: 18,
    },
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    toolItem: {
        width: (AVAILABLE_WIDTH - spacing.md * 2) / 4,
        alignItems: 'center',
        gap: 8,
    },
    toolIcon: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toolLabel: {
        ...typography.tiny,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
