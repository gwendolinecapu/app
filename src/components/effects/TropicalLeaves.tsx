/**
 * TropicalLeaves.tsx
 * Cadre Tropical Premium - Image Asset Version
 * 
 * Utilise l'image PNG (assets/frames/frame_tropical.png) 
 * avec les animations de feuilles par-dessus.
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
// Use a relative path or make sure this asset exists. 
// Assuming assets/frames/frame_tropical.png exists as per previous tasks.
const TROPICAL_FRAME_IMAGE = require('../../../assets/frames/frame_tropical.png');

// ==================== CONFIGURATION ====================
const NUM_LEAVES = 8;

// ==================== LEAVES ====================

const Leaf = React.memo(({ index, size, scale = 1 }: { index: number; size: number; scale?: number }) => {
    const translateY = useSharedValue(-20);
    const translateX = useSharedValue(0);
    const rotation = useSharedValue(Math.random() * 360);
    const opacity = useSharedValue(0);

    const startX = size * (0.1 + Math.random() * 0.8);

    useEffect(() => {
        // Slower duration for "lazy" tropical feel
        const duration = 5000 + Math.random() * 3000;
        const delay = index * 1000;

        const animate = () => {
            opacity.value = withDelay(delay, withSequence(
                withTiming(1, { duration: 800 }),
                withDelay(duration - 1500, withTiming(0, { duration: 700 }))
            ));

            translateY.value = withDelay(delay, withRepeat(
                withTiming(size + 30, { duration, easing: Easing.linear }),
                -1
            ));

            // Swaying motion (side to side)
            translateX.value = withDelay(delay, withRepeat(
                withSequence(
                    withTiming(20 * scale, { duration: duration / 3, easing: Easing.sin }),
                    withTiming(-20 * scale, { duration: duration / 3, easing: Easing.sin }),
                    withTiming(0, { duration: duration / 3, easing: Easing.sin })
                ),
                -1
            ));

            // Gentle rotation
            rotation.value = withDelay(delay, withRepeat(
                withTiming(rotation.value + 180, { duration: duration, easing: Easing.linear }),
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
            {/* Simple Leaf SVG Shape */}
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="#4ade80">
                <Path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z" />
            </Svg>
        </AnimatedView>
    );
});

// ==================== MAIN COMPONENT ====================

export const TropicalFrame = ({ size = 88, children }: { size?: number, children: React.ReactNode }) => {
    // Frame needs to be larger than avatar
    const frameSize = size * 1.5;

    return (
        <View style={{ width: frameSize, height: frameSize, justifyContent: 'center', alignItems: 'center' }}>

            {/* BACK GLOW */}
            <View style={[styles.glow, { width: size, height: size, borderRadius: size / 2 }]} />

            {/* FRAME IMAGE */}
            <Image
                source={TROPICAL_FRAME_IMAGE}
                style={{ width: frameSize, height: frameSize, position: 'absolute', zIndex: 10 }}
                resizeMode="contain"
            />

            {/* AVATAR CONTENT */}
            <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
                {children}
            </View>

            {/* FALLING LEAVES (Overlay) */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]} pointerEvents="none">
                {Array.from({ length: NUM_LEAVES }).map((_, i) => (
                    <Leaf key={i} index={i} size={frameSize} />
                ))}
            </View>
        </View>
    );
};

// ==================== SHOP PREVIEW ====================

export const TropicalFrameMini = React.memo(() => {
    const containerSize = 65;

    return (
        <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
            <View style={[styles.avatar, { width: 40, height: 40, borderRadius: 20 }]} />

            {/* MINI IMAGE */}
            <Image
                source={TROPICAL_FRAME_IMAGE}
                style={{ width: containerSize, height: containerSize, position: 'absolute' }}
                resizeMode="contain"
            />

            {/* MINI LEAF ANIMATION */}
            <View style={{ position: 'absolute', width: 50, height: 50 }} pointerEvents="none">
                <Leaf index={0} size={50} scale={0.6} />
                <Leaf index={1} size={50} scale={0.4} />
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
        backgroundColor: 'rgba(74, 222, 128, 0.3)', // Green glow
        shadowColor: "#4ade80",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        zIndex: 0
    }
});

export default TropicalFrame;
