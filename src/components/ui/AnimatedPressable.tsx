import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { triggerHaptic } from '../../lib/haptics';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scaleMin?: number;
    haptic?: boolean;
}

/**
 * AnimatedPressable provides a premium tactile feel with scale animations
 * and optional haptic feedback on interaction.
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    children,
    style,
    scaleMin = 0.96,
    haptic = true,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        if (props.disabled) return;
        scale.value = withSpring(scaleMin, {
            mass: 0.5,
            stiffness: 200,
            damping: 10
        });
        if (haptic) triggerHaptic.selection();
    };

    const handlePressOut = () => {
        if (props.disabled) return;
        scale.value = withSpring(1, {
            mass: 0.5,
            stiffness: 200,
            damping: 10
        });
    };

    return (
        <Pressable
            {...props}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={200}
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
