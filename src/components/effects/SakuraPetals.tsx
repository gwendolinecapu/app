/**
 * SakuraPetals.tsx
 * Cadre Sakura Premium V5 - "Organic Hug & Smooth Flow"
 * 
 * Corrections :
 * - Courbe de la branche ajustée pour mieux épouser le cercle (gauche)
 * - Animation des pétales corrigée et fluidifiée (moins "buggée")
 * - Irrugularité organique préservée
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
    interpolate,
    withSequence,
    cancelAnimation
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, RadialGradient, LinearGradient, Stop, G } from 'react-native-svg';

const AnimatedView = Animated.createAnimatedComponent(View);

// ==================== CONFIGURATION ====================
const NUM_PETALS = 12;

// ==================== SVG PATHS ====================

// Fleur 5 pétales
const SakuraPath = "M10,10 C8,6 12,2 15,2 C18,2 22,6 22,10 C22,14 18,18 15,18 C15,18 15,18 15,18 C18,20 22,24 22,28 C22,32 18,36 15,36 C12,36 10,32 10,28 C10,28 10,28 10,28 C8,32 6,36 3,36 C0,36 -4,32 -4,28 C-4,24 0,20 3,18 C3,18 3,18 3,18 C0,18 -4,14 -4,10 C-4,6 0,2 3,2 C6,2 10,6 10,10 Z";

// Branche V5 : Épouse mieux la forme gauche du cercle (Radius ~44-50)
// Starts bottom-left but stays closer to the arc before twisting up-right
const HuggingBranchPath = `
  M 15 100
  C 10 90, 8 70, 15 50    
  C 20 35, 35 20, 60 15   
  C 80 10, 100 20, 110 25 
  L 112 28
  C 90 25, 70 18, 55 25   
  C 35 32, 25 45, 22 60   
  C 19 75, 22 90, 25 105  
  Z
`;

const BranchHighlightPath = `
  M 18 95
  C 15 80, 18 60, 25 50
  C 30 40, 45 30, 65 25
`;

// ==================== COMPOSANTS SVG ====================

const FlowerCluster = ({ x, y, scale = 1, rotation = 0 }: any) => {
    return (
        <View style={{ position: 'absolute', left: x, top: y, transform: [{ rotate: `${rotation}deg` }, { scale }] }}>
            <Svg width={40} height={40} viewBox="0 0 40 40">
                <Defs>
                    <RadialGradient id="flowerGrad" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#FFF5F7" />
                        <Stop offset="40%" stopColor="#FFC0CB" />
                        <Stop offset="100%" stopColor="#FF69B4" />
                    </RadialGradient>
                    <RadialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#FFFACD" />
                        <Stop offset="100%" stopColor="#FFD700" />
                    </RadialGradient>
                </Defs>

                <G transform="translate(10, 2)">
                    <Path d={SakuraPath} fill="url(#flowerGrad)" />
                    <Path d="M10 18 L10 14 M10 18 L13 15 M10 18 L7 15" stroke="#FF1493" strokeWidth="0.5" opacity="0.5" />
                    <Circle cx="10" cy="18" r="2.5" fill="url(#centerGrad)" />
                </G>

                {/* Petit bouton aléatoire */}
                {Math.random() > 0.5 && (
                    <G transform="translate(30, 25) scale(0.5)">
                        <Circle cx="10" cy="10" r="8" fill="#FFB7C5" />
                    </G>
                )}
            </Svg>
        </View>
    );
};

const HuggingBranch = ({ size }: { size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 120 120" style={styles.branchSvg}>
        <Defs>
            <LinearGradient id="barkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#3E2723" />
                <Stop offset="40%" stopColor="#5D4037" />
                <Stop offset="80%" stopColor="#795548" />
            </LinearGradient>
        </Defs>

        {/* Ombre portée douce */}
        <Path d={HuggingBranchPath} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="6" transform="translate(2, 2)" />

        {/* Corps principal */}
        <Path d={HuggingBranchPath} fill="url(#barkGrad)" />

        {/* Highlight pour volume 3D */}
        <Path
            d={BranchHighlightPath}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            strokeLinecap="round"
        />

        {/* Brindilles fines pour connecter les fleurs */}
        <Path d="M 60 25 Q 70 10 75 5" stroke="#5D4037" strokeWidth="2" fill="none" />
        <Path d="M 85 22 Q 95 12 100 12" stroke="#5D4037" strokeWidth="1.5" fill="none" />
    </Svg>
);

// ==================== ANIMATION CORRIGÉE ====================

const FallingPetal = React.memo(({ index, size }: { index: number; size: number }) => {
    // Shared Values
    const translateY = useSharedValue(-20);
    const translateX = useSharedValue(0);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(0);

    // Config aléatoire stable
    const startX = React.useMemo(() => size * (0.2 + Math.random() * 0.6), [size]);
    const duration = React.useMemo(() => 4000 + Math.random() * 3000, []);
    const delay = React.useMemo(() => index * 600, [index]);
    const swayAmplitude = React.useMemo(() => 15 + Math.random() * 20, []);

    useEffect(() => {
        // Reset (au cas où)
        translateY.value = -20;
        opacity.value = 0;

        // Séquence d'animation principale
        const animate = () => {
            // 1. Fade In
            opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));

            // 2. Chute verticale
            translateY.value = withDelay(delay, withRepeat(
                withTiming(size + 20, { duration, easing: Easing.linear }),
                -1, // Infini
                false
            ));

            // 3. Sway (Oscillation latérale)
            translateX.value = withDelay(delay, withRepeat(
                withSequence(
                    withTiming(swayAmplitude, { duration: duration / 2, easing: Easing.sin }),
                    withTiming(-swayAmplitude, { duration: duration / 2, easing: Easing.sin })
                ),
                -1,
                true // Reverse
            ));

            // 4. Rotation continue
            rotation.value = withDelay(delay, withRepeat(
                withTiming(360, { duration: duration * 0.8, easing: Easing.linear }),
                -1,
                false
            ));
        };

        animate();

        return () => {
            cancelAnimation(translateY);
            cancelAnimation(translateX);
            cancelAnimation(rotation);
            cancelAnimation(opacity);
        };
    }, [size, delay, duration, swayAmplitude]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            left: startX,
            top: 0,
            opacity: opacity.value,
            transform: [
                { translateY: translateY.value },
                { translateX: translateX.value },
                { rotate: `${rotation.value}deg` },
                { rotateX: `${rotation.value * 0.5}deg` } // Effet 3D léger
            ]
        };
    });

    return (
        <AnimatedView style={animatedStyle}>
            <Svg width={12} height={12} viewBox="0 0 12 12">
                <Path d="M6 0 C3 4 1 7 6 12 C11 7 9 4 6 0" fill="#FFB7C5" />
            </Svg>
        </AnimatedView>
    );
});

// ==================== MAIN COMPONENT ====================

export const SakuraFrame = ({ size = 88, children }: { size?: number, children: React.ReactNode }) => {
    const frameSize = size + 40;
    const offset = 20;

    return (
        <View style={{ width: frameSize, height: frameSize, justifyContent: 'center', alignItems: 'center' }}>

            {/* AMBIENT GLOW */}
            <View style={[styles.ambientGlow, { width: size, height: size, borderRadius: size / 2 }]} />

            {/* 1. LAYER BRANCHE */}
            <View style={{ position: 'absolute', width: frameSize, height: frameSize, zIndex: 10, pointerEvents: 'none' }}>
                <HuggingBranch size={frameSize} />

                {/* 2. LAYER FLEURS (Positionnées sur la nouvelle courbe) */}
                {/* Grappe Principale (Haut Droite) */}
                <FlowerCluster x={frameSize * 0.75} y={frameSize * 0.10} scale={1.0} rotation={20} />
                <FlowerCluster x={frameSize * 0.85} y={frameSize * 0.18} scale={0.8} rotation={45} />

                {/* Grappe Secondaire (Haut Centre) */}
                <FlowerCluster x={frameSize * 0.55} y={frameSize * 0.05} scale={0.9} rotation={-10} />
                <FlowerCluster x={frameSize * 0.45} y={frameSize * 0.12} scale={0.7} rotation={-30} />

                {/* Petite fleur isolée (Gauche, sur la courbe montante) */}
                <FlowerCluster x={frameSize * 0.15} y={frameSize * 0.45} scale={0.8} rotation={-70} />
                <FlowerCluster x={frameSize * 0.22} y={frameSize * 0.80} scale={0.6} rotation={-100} />
            </View>

            {/* 3. AVATAR */}
            <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2 }]}>
                {children}
            </View>

            {/* 4. FALLING PETALS */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]} pointerEvents="none">
                {Array.from({ length: NUM_PETALS }).map((_, i) => (
                    <FallingPetal key={i} index={i} size={frameSize} />
                ))}
            </View>
        </View>
    );
};

// ==================== SHOP PREVIEW ====================

export const SakuraFrameMini = React.memo(() => (
    <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}>
        <View style={[styles.avatarContainer, { width: 40, height: 40, borderRadius: 20, borderWidth: 1 }]} />
        <Svg width={55} height={55} viewBox="0 0 100 100" style={{ position: 'absolute', left: -5, top: -5 }}>
            {/* Mini Branche Hugging */}
            <Path d="M 15 80 C 10 60 40 20 90 20" stroke="#5D4037" strokeWidth="3" fill="none" />
            <Circle cx="85" cy="20" r="7" fill="#FFC0CB" />
            <Circle cx="50" cy="30" r="5" fill="#FFB7C5" />
            <Circle cx="20" cy="50" r="4" fill="#FFB7C5" />
        </Svg>
    </View>
));

const styles = StyleSheet.create({
    avatarContainer: {
        borderWidth: 2,
        borderColor: '#FFC0CB',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
        zIndex: 5,
        shadowColor: "#FF69B4",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    branchSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    ambientGlow: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        shadowColor: "#FF69B4",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        zIndex: 0
    }
});

export default SakuraFrame;
