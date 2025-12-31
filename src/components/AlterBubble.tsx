import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { Alter } from '../types';
import { colors, spacing, borderRadius } from '../lib/theme';

interface AlterBubbleProps {
    alter: Alter;
    isActive: boolean;
    onPress: () => void;
    onLongPress?: () => void;
    size?: number;
    showName?: boolean;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const AlterBubble: React.FC<AlterBubbleProps> = ({
    alter,
    isActive,
    onPress,
    onLongPress,
    size = 85,
    showName = true,
}) => {
    return (
        <TouchableOpacity
            style={[styles.container, { width: size }]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Alter ${alter.name}`}
            accessibilityHint={isActive ? "Actuellement actif" : "Appuyez pour changer"}
        >
            <View
                style={[
                    styles.bubble,
                    {
                        width: size - 15,
                        height: size - 15,
                        backgroundColor: alter.color,
                        borderColor: isActive ? colors.primary : 'transparent',
                        borderWidth: isActive ? 3 : 0,
                    },
                ]}
            >
                {alter.avatar_url ? (
                    <AnimatedImage
                        source={{ uri: alter.avatar_url }}
                        style={styles.image}
                        contentFit="cover"
                        transition={500}
                        sharedTransitionTag={`avatar-${alter.id}`}
                    />
                ) : (
                    <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
                        {alter.name.charAt(0).toUpperCase()}
                    </Text>
                )}
                {alter.is_host && <View style={styles.hostIndicator} />}
            </View>
            {showName && (
                <Text
                    style={[
                        styles.name,
                        isActive && styles.activeName
                    ]}
                    numberOfLines={1}
                >
                    {alter.name}
                </Text>
            )}
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    bubble: {
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: spacing.xs,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    initial: {
        color: colors.text,
        fontWeight: 'bold',
    },
    hostIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.secondary,
        borderWidth: 2,
        borderColor: colors.backgroundCard,
    },
    name: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        width: '100%',
    },
    activeName: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});
