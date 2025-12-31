import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

import { DeviceEventEmitter } from 'react-native';

const SHOW_SUCCESS_EVENT = 'SHOW_SUCCESS_ANIMATION';

export const triggerSuccessAnimation = () => {
    DeviceEventEmitter.emit(SHOW_SUCCESS_EVENT);
};

export const SuccessAnimation = ({ onAnimationFinish }: { onAnimationFinish?: () => void }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [isVisible, setIsVisible] = React.useState(false);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(SHOW_SUCCESS_EVENT, () => {
            setIsVisible(true);
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (isVisible) {
            opacity.value = 1;
            scale.value = withSequence(
                withSpring(1.2, { damping: 10 }),
                withSpring(1, { damping: 12 }),
                withTiming(1, { duration: 1000 }),
                withTiming(0, { duration: 300 }, (finished) => {
                    if (finished) {
                        runOnJS(setIsVisible)(false);
                        if (onAnimationFinish) runOnJS(onAnimationFinish)();
                    }
                })
            );
        } else {
            scale.value = 0;
            opacity.value = 0;
        }
    }, [isVisible]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value
    }));

    if (!isVisible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <BlurView intensity={30} tint="light" style={styles.blur}>
                <Animated.View style={[styles.circle, style]}>
                    <Ionicons name="checkmark" size={60} color="white" />
                </Animated.View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)'
    },
    circle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
});
