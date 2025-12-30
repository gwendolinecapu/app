import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface ScaleButtonProps extends TouchableOpacityProps {
    scaleTo?: number;
    haptic?: boolean;
    children: React.ReactNode;
}

export const ScaleButton = ({
    scaleTo = 0.96,
    haptic = true,
    style,
    children,
    onPressIn,
    onPressOut,
    onPress,
    ...props
}: ScaleButtonProps) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (e: any) => {
        scale.value = withSpring(scaleTo, { damping: 10, stiffness: 300 });
        if (haptic) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
        onPressOut?.(e);
    };

    // We use Animated.createAnimatedComponent strictly on a View-like if needed, 
    // but here we wrap children in an Animated.View to apply the transform.
    // However, TouchableOpacity handles gestures. 
    // Best practice for "ScaleButton" is usually Pressable + Animated.View.
    // Let's us use Pressable for better state handling, but to keep props compatible with TouchableOpacity:

    return (
        <Animated.View style={[animatedStyle, style]}>
            <TouchableOpacity
                activeOpacity={1} // We handle visual feedback via scale
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
                {...props}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};
