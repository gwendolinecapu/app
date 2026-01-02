/**
 * SakuraPetals.tsx
 * Cadre Sakura Premium - Image Asset Version
 * 
 * Utilise l'image PNG générée (assets/frames/sakura_frame.png) 
 * avec les animations de pétales par-dessus.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    withSequence,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedView = Animated.createAnimatedComponent(View);
const SAKURA_FRAME_IMAGE = require('../../../assets/frames/sakura_frame.png');

// ==================== CONFIGURATION ====================
const NUM_PETALS = 10;

// ==================== PETALS ====================

const Petal = React.memo(({ index, size, scale = 1 }: { index: number; size: number; scale?: number }) => {
    const translateY = useSharedValue(-20);
    const translateX = useSharedValue(0);
    const rotation = useSharedValue(Math.random() * 360);
    const opacity = useSharedValue(0);

    const startX = size * (0.2 + Math.random() * 0.6);

    useEffect(() => {
        const duration = 4000 + Math.random() * 2000;
        const delay = index * 800;

        const animate = () => {
            opacity.value = withDelay(delay, withSequence(
                withTiming(1, { duration: 500 }),
                withDelay(duration - 1000, withTiming(0, { duration: 500 }))
            ));

            translateY.value = withDelay(delay, withRepeat(
                withTiming(size + 20, { duration, easing: Easing.linear }),
                -1
            ));

            translateX.value = withDelay(delay, withRepeat(
                withSequence(
                    withTiming(15 * scale, { duration: duration / 2, easing: Easing.sin }),
                    withTiming(-15 * scale, { duration: duration / 2, easing: Easing.sin })
                ),
                -1
            ));

            rotation.value = withDelay(delay, withRepeat(
                withTiming(rotation.value + 360, { duration: duration * 0.8, easing: Easing.linear }),
                -1
            ));
        };
        animate();
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        left: startX,
        top: 0,
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotation.value}deg` },
            { scale }
        ]
    }));

    return (
        <AnimatedView style={style}>
            <Svg width={10} height={10} viewBox="0 0 10 10">
                <Path d="M5 0 C2 3 0 6 5 10 C10 6 8 3 5 0" fill="#FFB7C5" />
            </Svg>
        </AnimatedView>
    );
});

// ==================== MAIN COMPONENT ====================

export const SakuraFrame = ({ size = 88, children }: { size?: number, children: React.ReactNode }) => {
    // Calcul de la taille du cadre pour qu'il déborde un peu de l'avatar (qui fail 'size')
    const frameSize = size * 1.5;

    return (
        <View style={{ width: frameSize, height: frameSize, justifyContent: 'center', alignItems: 'center' }}>

            {/* LUEUR ARRIÈRE */}
            <View style={[styles.glow, { width: size, height: size, borderRadius: size / 2 }]} />

            {/* IMAGE CADRE (PNG) */}
            <Image
                source={SAKURA_FRAME_IMAGE}
                style={{ width: frameSize, height: frameSize, position: 'absolute', zIndex: 10 }}
                resizeMode="contain"
            />

            {/* AVATAR */}
            <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
                {children}
            </View>

            {/* PETALES (Par dessus l'image et l'avatar) */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]} pointerEvents="none">
                {Array.from({ length: NUM_PETALS }).map((_, i) => (
                    <Petal key={i} index={i} size={frameSize} />
                ))}
            </View>
        </View>
    );
};

// ==================== SHOP PREVIEW ====================

export const SakuraFrameMini = React.memo(() => {
    // Preview size logic
    const containerSize = 65;

    return (
        <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
            <View style={[styles.avatar, { width: 40, height: 40, borderRadius: 20 }]} />

            {/* IMAGE MINIATURE */}
            <Image
                source={SAKURA_FRAME_IMAGE}
                style={{ width: containerSize, height: containerSize, position: 'absolute' }}
                resizeMode="contain"
            />

            {/* Animation Mini Pétale */}
            <View style={{ position: 'absolute', width: 50, height: 50 }} pointerEvents="none">
                <Petal index={0} size={50} scale={0.4} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    avatar: {
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
        zIndex: 5,
        elevation: 5,
    },
    glow: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 105, 180, 0.2)',
        shadowColor: "#FF69B4",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        zIndex: 0
    }
});

export default SakuraFrame;
