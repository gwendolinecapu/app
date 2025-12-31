import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../lib/theme';
import { Alter } from '../../types';
import { triggerHaptic } from '../../lib/haptics';

interface AlterBubbleProps {
    alter?: Alter;
    type: 'alter' | 'blurry' | 'add';
    size: number;
    isSelected?: boolean;
    selectionMode: 'single' | 'multi';
    onPress: () => void;
    onLongPress?: () => void;
    dimmed?: boolean;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

const AlterBubbleComponent: React.FC<AlterBubbleProps> = ({
    alter,
    type,
    size,
    isSelected,
    selectionMode,
    onPress,
    onLongPress,
    dimmed,
}) => {
    const dynamicStyles = {
        bubble: {
            width: size,
            height: size,
            borderRadius: size / 2,
        },
        bubbleName: {
            maxWidth: size + 10,
        },
        iconSize: size < 60 ? 20 : size < 70 ? 24 : 28,
        initialFontSize: size < 60 ? 18 : size < 70 ? 22 : 28,
    };

    if (type === 'blurry') {
        return (
            <AnimatedPressable
                style={styles.bubbleWrapper}
                onPress={onPress}
                haptic={true}
            >
                <View style={[styles.bubble, styles.blurryBubble, dynamicStyles.bubble]}>
                    <Ionicons name="help" size={dynamicStyles.iconSize} color={colors.textMuted} />
                </View>
                <Text style={[styles.bubbleName, dynamicStyles.bubbleName]} numberOfLines={1}>Flou</Text>
            </AnimatedPressable>
        );
    }

    if (type === 'add') {
        return (
            <AnimatedPressable
                style={styles.bubbleWrapper}
                onPress={onPress}
                haptic={true}
            >
                <View style={[styles.bubble, styles.addBubble, dynamicStyles.bubble]}>
                    <Ionicons name="add" size={dynamicStyles.iconSize + 4} color={colors.textMuted} />
                </View>
                <Text style={[styles.bubbleName, dynamicStyles.bubbleName]} numberOfLines={1}>Ajouter</Text>
            </AnimatedPressable>
        );
    }

    // Alter bubble
    if (!alter) return null;

    const showCheck = selectionMode === 'multi' && isSelected;

    return (
        <AnimatedPressable
            style={[styles.bubbleWrapper, dimmed && styles.bubbleDimmed]}
            onPress={onPress}
            onLongPress={onLongPress}
            haptic={true}
        >
            <View style={[
                styles.bubble,
                dynamicStyles.bubble,
                { backgroundColor: alter.color },
                isSelected && styles.bubbleSelected
            ]}>
                {alter.avatar_url ? (
                    <AnimatedImage
                        source={{ uri: alter.avatar_url }}
                        style={styles.bubbleImage}
                        contentFit="cover"
                        transition={500}
                        {...({ sharedTransitionTag: `avatar-${alter.id}` } as any)}
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <Text style={[styles.bubbleInitial, { fontSize: dynamicStyles.initialFontSize }]}>
                        {alter.name.charAt(0).toUpperCase()}
                    </Text>
                )}
                {showCheck && (
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                )}
            </View>
            <Text
                style={[styles.bubbleName, dynamicStyles.bubbleName, isSelected && styles.bubbleNameSelected]}
                numberOfLines={1}
            >
                {alter.name}
            </Text>
        </AnimatedPressable>
    );
};

// Memoize to prevent unecessary re-renders during 2000+ item scroll
export const AlterBubble = React.memo(AlterBubbleComponent);

const styles = StyleSheet.create({
    bubbleWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    bubble: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    bubbleSelected: {
        borderColor: colors.primary,
        borderWidth: 3,
        transform: [{ scale: 1.05 }],
    },
    bubbleDimmed: {
        opacity: 0.4,
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
    },
    bubbleInitial: {
        ...typography.h2,
        color: 'white',
        fontWeight: 'bold',
    },
    bubbleName: {
        ...typography.tiny,
        marginTop: 6,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    bubbleNameSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    blurryBubble: {
        backgroundColor: colors.backgroundLight,
        borderStyle: 'dashed',
        borderColor: colors.border,
        borderWidth: 1.5,
    },
    addBubble: {
        backgroundColor: colors.backgroundLight,
        borderStyle: 'dashed',
        borderColor: colors.border,
        borderWidth: 1.5,
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
});
