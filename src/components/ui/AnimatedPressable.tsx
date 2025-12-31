import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { triggerHaptic } from '../../lib/haptics';

interface AnimatedPressableProps {
    children: React.ReactNode;
    onPress?: () => void;
    onLongPress?: () => void;
    style?: StyleProp<ViewStyle>;
    scaleMin?: number;
    haptic?: boolean;
    disabled?: boolean;
}

/**
 * AnimatedPressable provides a premium tactile feel with scale animations
 * and optional haptic feedback on interaction.
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    children,
    onPress,
    onLongPress,
    style,
    scaleMin = 0.96,
    haptic = true,
    disabled = false
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        if (disabled) return;
        scale.value = withSpring(scaleMin, {
            mass: 0.5,
            stiffness: 200,
            damping: 10
        });
        if (haptic) triggerHaptic.selection();
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1, {
            mass: 0.5,
            stiffness: 200,
            damping: 10
        });
    };

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            delayLongPress={200}
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
