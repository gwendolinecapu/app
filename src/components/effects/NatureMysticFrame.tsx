import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    withSequence,
    Easing,
    cancelAnimation,
    interpolate,
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

// ==================== CONFIGURATION ====================
const NUM_SPORES = 20;
const SPORE_COLORS = ['#d8f3dc', '#b7e4c7', '#ffffb7', '#fff']; // Pale Green/Gold/White

// ==================== SPORE COMPONENT ====================
// Tiny floating particles representing magic spores or fireflies
const Spore = React.memo(({ index, size }: { index: number; size: number }) => {
    const progress = useSharedValue(0);

    const config = useMemo(() => {
        const startAngle = Math.random() * 2 * Math.PI;
        const radius = size / 2 + (Math.random() * 20 - 10); // Around the edge

        const startX = Math.cos(startAngle) * radius;
        const startY = Math.sin(startAngle) * radius;

        // Gentle drift
        const driftX = (Math.random() - 0.5) * 30;
        const driftY = -1 * (20 + Math.random() * 30); // Float UP

        const duration = 2000 + Math.random() * 3000;
        const delay = Math.random() * 2000;
        const color = SPORE_COLORS[Math.floor(Math.random() * SPORE_COLORS.length)];
        const particleSize = 2 + Math.random() * 3;

        return { startX, startY, driftX, driftY, duration, delay, color, particleSize };
    }, [size]);

    useEffect(() => {
        progress.value = withDelay(config.delay, withRepeat(
            withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
            -1,
            false
        ));
        return () => cancelAnimation(progress);
    }, [config]);

    const style = useAnimatedStyle(() => {
        const translateX = interpolate(progress.value, [0, 1], [config.startX, config.startX + config.driftX]);
        const translateY = interpolate(progress.value, [0, 1], [config.startY, config.startY + config.driftY]);
        const opacity = interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 0.8, 0.8, 0]);
        const scale = interpolate(progress.value, [0, 0.5, 1], [0.5, 1.2, 0.5]);

        return {
            position: 'absolute',
            left: size / 2,
            top: size / 2,
            width: config.particleSize,
            height: config.particleSize,
            borderRadius: config.particleSize / 2,
            backgroundColor: config.color,
            opacity,
            transform: [{ translateX }, { translateY }, { scale }],
            shadowColor: config.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 3,
            elevation: 2,
        };
    });

    return <AnimatedView style={style} />;
});

// ==================== MAIN COMPONENT ====================

export const NatureMysticFrame = ({ size = 88, children }: { size?: number, children: React.ReactNode }) => {
    // The uploaded image is usually square, we center it.
    // The frame image needs to be larger than the avatar.
    const imageSize = size * 1.55;

    return (
        <View style={{ width: imageSize, height: imageSize, justifyContent: 'center', alignItems: 'center' }}>

            {/* 1. LAYER: GLOW (Background) */}
            <View style={[styles.glow, { width: size, height: size, borderRadius: size / 2 }]} />

            {/* 2. LAYER: FRAME IMAGE (Background) - If intended to be behind? 
               Usually frames are FRONT. But if it's a wreath, the avatar sits inside.
               For this heavy forest frame, it likely frames the avatar *over* the edges.
               Let's put the avatar in the middle, and the frame OVER it.
               BUT we need to make sure the "hole" is transparent. I assume the user's PNG has transparency.
            */}

            {/* 3. AVATAR (Content) */}
            <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, overflow: 'hidden', zIndex: 10 }}>
                {children}
            </View>

            {/* 4. FRAME IMAGE (Foreground) */}
            <Image
                source={require('../../../assets/frames/frame_nature_mystic.png')}
                style={{
                    width: imageSize,
                    height: imageSize,
                    position: 'absolute',
                    zIndex: 20
                }}
                resizeMode="contain"
            />

            {/* 5. SPORES (Foreground Overlay) */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]} pointerEvents="none">
                {Array.from({ length: NUM_SPORES }).map((_, i) => (
                    <Spore key={i} index={i} size={imageSize} />
                ))}
            </View>
        </View>
    );
};

// ==================== MINI COMPONENT ====================

export const NatureMysticFrameMini = React.memo(() => {
    const size = 50;
    const imageSize = size * 1.55;

    return (
        <View style={{ width: imageSize, height: imageSize, justifyContent: 'center', alignItems: 'center' }}>
            <View style={[styles.glow, { width: 30, height: 30, borderRadius: 15 }]} />
            {/* Mini Avatar Placeholder handled by parent usually, but here we just show frame? 
                 No, Mini usually just shows the frame effect.
             */}
            <Image
                source={require('../../../assets/frames/frame_nature_mystic.png')}
                style={{
                    width: imageSize,
                    height: imageSize,
                    position: 'absolute',
                    zIndex: 20
                }}
                resizeMode="contain"
            />
            <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]} pointerEvents="none">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Spore key={i} index={i} size={imageSize} />
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    glow: {
        position: 'absolute',
        backgroundColor: '#2d6a4f',
        opacity: 0.2, // Subtle ambient glow
        shadowColor: "#4ade80",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    }
});
