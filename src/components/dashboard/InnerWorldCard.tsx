import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';

export const InnerWorldCard = () => {
    const router = useRouter();

    const handlePress = () => {
        triggerHaptic.selection();
        router.push('/inner-world');
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.9}
            style={styles.container}
        >
            <LinearGradient
                colors={['#E0F7FA', '#E1F5FE']} // Soft pastel blue/cyan gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.textContainer}>
                        <View style={styles.headerRow}>
                            <Ionicons name="sparkles-outline" size={16} color="#457B9D" />
                            <Text style={styles.title}>Inner World</Text>
                        </View>
                        <Text style={styles.subtitle}>
                            Un espace calme pour créer et explorer votre monde intérieur.
                        </Text>
                    </View>
                    <View style={styles.iconContainer}>
                        <Ionicons name="planet-outline" size={32} color="#457B9D" />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        shadowColor: "#457B9D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    gradient: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        paddingRight: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1D3557',
        fontFamily: typography.fontFamily,
    },
    subtitle: {
        fontSize: 12,
        color: '#457B9D',
        lineHeight: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
