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
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedImage = Animated.createAnimatedComponent(Image);

// ==================== CONFIGURATION ====================
// More particles for a denser fire
const NUM_FLAMES = 30;
const FLAME_COLORS = ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FFFFFF']; // Deep Red to White

// ==================== REALISTIC FLAME PARTICLE ====================
// Uses a specific SVG path that looks like a flickering flame tongue
const FlameShape = React.memo(({ color, width, height }: { color: string, width: number, height: number }) => (
    <Svg width={width} height={height} viewBox="0 0 100 200" style={{ overflow: 'visible' }}>
        <Defs>
            <LinearGradient id={`grad-${color}`} x1="0.5" y1="1" x2="0.5" y2="0">
                <Stop offset="0" stopColor={color} stopOpacity="1" />
                <Stop offset="0.6" stopColor={color} stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
        </Defs>
        {/* Organic Flame Shape */}
        <Path
            d="M50 200 
               C 80 180, 90 150, 85 120 
               C 80 90, 60 50, 50 0 
               C 40 50, 20 90, 15 120 
               C 10 150, 20 180, 50 200 Z"
            fill={`url(#grad-${color})`}
            // Also add a glow stroke
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.5}
        />
    </Svg>
));

const SingleFlame = React.memo(({ index, size }: { index: number; size: number }) => {
    const progress = useSharedValue(0);
    const randomConfig = useMemo(() => {
        // Spawn primarily along the bottom arc (-45 to 225 degrees) to cup the face
        // But we want a ring, so let's do full 360 but larger scale at bottom?
        // Let's do a full ring fire.
        const angle = Math.random() * 2 * Math.PI;
        const radius = size / 2 - 2;

        const startX = Math.cos(angle) * (radius);
        const startY = Math.sin(angle) * (radius);

        // Motion: UP (Negative Y) + Slight Wind
        const upForce = 40 + Math.random() * 40;
        const wind = (Math.random() - 0.5) * 20;

        const duration = 800 + Math.random() * 1200; // 0.8s - 2.0s
        const delay = Math.random() * 2000;
        const color = FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)];
        const flameW = 20 + Math.random() * 20;
        const flameH = 40 + Math.random() * 40;
        const rotation = (angle * 180 / Math.PI) + 90; // Point OUTWARDS from center? Or just UP?
        // Real fire goes UP. 
        // But for a ring, pointing outwards looks like a sun.
        // Let's point UP but slightly angled by position.
        const tilt = (startX / size) * 45; // Tilt based on X position [-20, 20]

        return { startX, startY, upForce, wind, duration, delay, color, flameW, flameH, tilt };
    }, [size]);

    useEffect(() => {
        progress.value = 0;
        progress.value = withDelay(randomConfig.delay, withRepeat(
            withSequence(
                withTiming(1, { duration: randomConfig.duration, easing: Easing.linear }),
                withTiming(0, { duration: 0 }) // Reset immediately
            ),
            -1,
            false
        ));
        return () => cancelAnimation(progress);
    }, [randomConfig]);

    const style = useAnimatedStyle(() => {
        // Lifecycle:
        // 0.0 - 0.2: Grow fast
        // 0.2 - 0.8: Full burn + wiggle
        // 0.8 - 1.0: Fade and shrink at tip

        const scale = interpolate(progress.value, [0, 0.2, 0.8, 1], [0.3, 1, 0.8, 0]);
        const alpha = interpolate(progress.value, [0, 0.1, 0.7, 1], [0, 0.9, 0.6, 0]);

        const currentY = interpolate(progress.value, [0, 1], [randomConfig.startY, randomConfig.startY - randomConfig.upForce]);
        const currentX = interpolate(progress.value, [0, 1], [randomConfig.startX, randomConfig.startX + randomConfig.wind]);

        // Wiggle effect
        const wiggle = Math.sin(progress.value * Math.PI * 4) * 5;

        return {
            position: 'absolute',
            left: size / 2,
            top: size / 2,
            marginLeft: -randomConfig.flameW / 2,
            marginTop: -randomConfig.flameH / 1.2, // Pivot near bottom
            opacity: alpha,
            transform: [
                { translateX: currentX + wiggle },
                { translateY: currentY },
                { rotate: `${randomConfig.tilt}deg` },
                { scale: scale }
            ]
        };
    });

    return (
        <AnimatedView style={style}>
            <FlameShape
                color={randomConfig.color}
                width={randomConfig.flameW}
                height={randomConfig.flameH}
            />
        </AnimatedView>
    );
});


// ==================== BASE FRAME (Image + Pulse) ====================
const MagmaBase = React.memo(({ size }: { size: number }) => {
    // Rotation animation
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1.10);

    useEffect(() => {
        // Slow rotation 
        rotation.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1
        );
        // Breathing scale
        scale.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotation.value}deg` },
            { scale: scale.value }
        ]
    }));

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <AnimatedImage
                source={require('../../../assets/frames/frame_flames_v2.png')}
                style={[{ width: size, height: size }, animatedStyle]}
                resizeMode="contain"
            />
        </View>
    );
});

// ==================== MAIN COMPONENT ====================

export const FlameFrame = ({ size = 88, children }: { size?: number, children: React.ReactNode }) => {
    const frameSize = size + 30; // Slightly larger for the fire ring

    return (
        <View style={{ width: frameSize, height: frameSize, justifyContent: 'center', alignItems: 'center' }}>

            {/* 1. LAYER: GLOW (Background) */}
            <View style={[styles.glow, { width: size, height: size, borderRadius: size / 2 }]} />

            {/* 2. LAYER: MAGMA RING (Background Image) */}
            <AnimatedView style={{ position: 'absolute' }}>
                <MagmaBase size={frameSize} />
            </AnimatedView>

            {/* 3. LAYER: FLAMES (Background - Behind Avatar) */}
            {/* A set of flames BEHIND to give depth */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 5 }]} pointerEvents="none">
                {Array.from({ length: 15 }).map((_, i) => (
                    <SingleFlame key={`bg-${i}`} index={i} size={frameSize} />
                ))}
            </View>

            {/* 4. CONTENT (Avatar) */}
            <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', zIndex: 10 }}>
                {children}
            </View>

            {/* 5. AVATAR BORDER (Foreground) - Removed static border to let the ring shine */}
            {/* <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: 'rgba(255, 69, 0, 0.5)', zIndex: 11 }} pointerEvents="none" /> */}

            {/* 6. LAYER: FLAMES (Foreground) */}
            {/* Flames in front but sparser/smaller to not block view */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]} pointerEvents="none">
                {Array.from({ length: 10 }).map((_, i) => (
                    <SingleFlame key={`fg-${i}`} index={i} size={frameSize} />
                ))}
            </View>

        </View>
    );
};

// ==================== MINI COMPONENT ====================

export const FlameFrameMini = React.memo(() => {
    const size = 50;
    const frameSize = size + 10;

    return (
        <View style={{ width: frameSize, height: frameSize, justifyContent: 'center', alignItems: 'center' }}>
            <View style={[styles.glow, { width: 30, height: 30, borderRadius: 15 }]} />
            <MagmaBase size={frameSize} />
            <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]} pointerEvents="none">
                {Array.from({ length: 8 }).map((_, i) => (
                    <SingleFlame key={i} index={i} size={frameSize} />
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    glow: {
        position: 'absolute',
        backgroundColor: '#FF4500',
        opacity: 0.3,
        shadowColor: "#FF4500",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    }
});
