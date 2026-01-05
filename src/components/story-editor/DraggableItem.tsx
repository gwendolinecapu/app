import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

interface DraggableItemProps {
    children: React.ReactNode;
    initialScale?: number;
    initialX?: number;
    initialY?: number;
    style?: ViewStyle;
    onDragStart?: () => void;
    onDragEnd?: (x: number, y: number) => void;
}

export function DraggableItem({ children, initialScale = 1, initialX = 0, initialY = 0, style, onDragStart, onDragEnd }: DraggableItemProps) {
    const translateX = useSharedValue(initialX);
    const translateY = useSharedValue(initialY);
    const scale = useSharedValue(initialScale);
    const rotate = useSharedValue(0);

    const savedTranslateX = useSharedValue(initialX);
    const savedTranslateY = useSharedValue(initialY);
    const savedScale = useSharedValue(initialScale);
    const savedRotate = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            if (onDragStart) runOnJS(onDragStart)();
        })
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            if (onDragEnd) runOnJS(onDragEnd)(translateX.value, translateY.value);
        });

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const rotationGesture = Gesture.Rotation()
        .onUpdate((e) => {
            rotate.value = savedRotate.value + e.rotation;
        })
        .onEnd(() => {
            savedRotate.value = rotate.value;
        });

    const composed = Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: `${rotate.value}rad` },
        ],
    }));

    return (
        <GestureDetector gesture={composed}>
            <Animated.View style={[styles.box, animatedStyle, style]}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    box: {
        position: 'absolute',
    },
});
