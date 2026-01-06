import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

interface MagicalLoadingViewProps {
    visible: boolean;
    message?: string;
    subMessage?: string;
}

export const MagicalLoadingView: React.FC<MagicalLoadingViewProps> = ({
    visible,
    message = "Incantation en cours...",
    subMessage = "La magie opère..."
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={['rgba(26, 16, 37, 0.95)', 'rgba(0, 0, 0, 0.98)']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
                    <View style={styles.iconOverlay}>
                        <Ionicons name="sparkles" size={24} color={colors.primary} />
                    </View>
                </View>

                <Text style={styles.message}>{message}</Text>
                <Text style={styles.subMessage}>{subMessage}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        padding: spacing.xl,
        width: '80%',
    },
    iconContainer: {
        marginBottom: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: 80,
    },
    spinner: {
        transform: [{ scale: 1.5 }],
    },
    iconOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        ...typography.h3,
        color: 'white',
        textAlign: 'center',
        marginBottom: spacing.sm,
        textShadowColor: colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subMessage: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        opacity: 0.8,
    },
});
