import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GroundingBreathing } from '../../src/components/tools/GroundingBreathing';
import { colors, spacing, typography } from '../../src/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroundingScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>SOS / Ancrage</Text>
                <View style={{ width: 40 }} />
            </View>

            <GroundingBreathing />
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
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
});
