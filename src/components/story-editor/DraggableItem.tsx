import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

interface DraggableItemProps {
    children: React.ReactNode;
    initialScale?: number;
    initialRotation?: number;
    initialX?: number;
    initialY?: number;
    style?: ViewStyle;
    snapToGrid?: boolean;
    onDragStart?: () => void;
    onDragEnd?: (x: number, y: number) => void;
    onScaleEnd?: (scale: number) => void;
    onRotateEnd?: (rotation: number) => void;
}

export function DraggableItem({
    children,
    initialScale = 1,
    initialRotation = 0,
    initialX = 0,
    initialY = 0,
    style,
    snapToGrid = false,
    onDragStart,
    onDragEnd,
    onScaleEnd,
    onRotateEnd
}: DraggableItemProps) {
    const translateX = useSharedValue(initialX);
    const translateY = useSharedValue(initialY);
    const scale = useSharedValue(initialScale);
    const rotate = useSharedValue(initialRotation);

    const savedTranslateX = useSharedValue(initialX);
    const savedTranslateY = useSharedValue(initialY);
    const savedScale = useSharedValue(initialScale);
    const savedRotate = useSharedValue(initialRotation);

    // Sync shared values when props change
    React.useEffect(() => {
        translateX.value = initialX;
        translateY.value = initialY;
        savedTranslateX.value = initialX;
        savedTranslateY.value = initialY;
    }, [initialX, initialY]);

    React.useEffect(() => {
        scale.value = initialScale;
        savedScale.value = initialScale;
    }, [initialScale]);

    React.useEffect(() => {
        rotate.value = initialRotation;
        savedRotate.value = initialRotation;
    }, [initialRotation]);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            if (onDragStart) runOnJS(onDragStart)();
        })
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            let finalX = translateX.value;
            let finalY = translateY.value;

            if (snapToGrid) {
                const GRID_SIZE = 20;
                finalX = Math.round(finalX / GRID_SIZE) * GRID_SIZE;
                finalY = Math.round(finalY / GRID_SIZE) * GRID_SIZE;
                translateX.value = finalX;
                translateY.value = finalY;
            }

            savedTranslateX.value = finalX;
            savedTranslateY.value = finalY;
            if (onDragEnd) runOnJS(onDragEnd)(finalX, finalY);
        });

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (onScaleEnd) runOnJS(onScaleEnd)(scale.value);
        });

    const rotationGesture = Gesture.Rotation()
        .onUpdate((e) => {
            rotate.value = savedRotate.value + e.rotation;
        })
        .onEnd(() => {
            let finalRotation = rotate.value;
            // Optional: Snap rotation to 45 degrees
            // const SNAP_DEG = Math.PI / 4;
            // finalRotation = Math.round(finalRotation / SNAP_DEG) * SNAP_DEG;
            // rotate.value = finalRotation;

            savedRotate.value = finalRotation;
            if (onRotateEnd) runOnJS(onRotateEnd)(finalRotation);
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
        top: 0,
        left: 0,
    },
});
