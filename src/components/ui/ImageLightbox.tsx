import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';

// =====================================================
// IMAGE LIGHTBOX
// Modal plein écran pour afficher une image zoomable
// Fermeture par tap sur le backdrop ou bouton X
// =====================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageLightboxProps {
    visible: boolean;
    imageUrl: string;
    onClose: () => void;
}

export const ImageLightbox = ({ visible, imageUrl, onClose }: ImageLightboxProps) => {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);

    const onPinchEvent = (event: any) => {
        scale.value = savedScale.value * event.nativeEvent.scale;
    };

    const onPinchStateChange = (event: any) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            savedScale.value = scale.value;
            // Reset if scale is too small
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
            }
            // Limit max zoom
            if (scale.value > 4) {
                scale.value = withSpring(4);
                savedScale.value = 4;
            }
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleClose = () => {
        scale.value = withTiming(1, { duration: 200 });
        savedScale.value = 1;
        onClose();
    };

    if (!imageUrl) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <StatusBar backgroundColor="black" barStyle="light-content" />
            <View style={styles.container}>
                {/* Close Button */}
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>

                {/* Zoomable Image */}
                <GestureHandlerRootView style={styles.gestureContainer}>
                    <PinchGestureHandler
                        onGestureEvent={onPinchEvent}
                        onHandlerStateChange={onPinchStateChange}
                    >
                        <Animated.View style={[styles.imageContainer, animatedStyle]}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </PinchGestureHandler>
                </GestureHandlerRootView>

                {/* Tap backdrop to close */}
                <TouchableOpacity
                    style={styles.backdrop}
                    onPress={handleClose}
                    activeOpacity={1}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gestureContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
});
