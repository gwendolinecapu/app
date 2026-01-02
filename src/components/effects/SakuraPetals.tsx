/**
 * SakuraPetals.tsx
 * Cadre Sakura Premium V6 - "Elegant Vector"
 * 
 * Corrections :
 * - Branche bcp plus fine et élégante (fini le côté "saucisse")
 * - Couleur plus sombre et premium (Charcoal Brown)
 * - Design "Knotty" (noueux) réaliste
 * - Fleurs posées précisément sur les noeuds
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
import Svg, { Path, Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';

const AnimatedView = Animated.createAnimatedComponent(View);

// ==================== CONFIGURATION ====================
const NUM_PETALS = 10;

// ==================== V6 BRANCH PATH ====================
// Fine, noueuse, élégante. Épouse la forme gauche.
// M: Move, C: Cubic Bezier
const ElegantBranchPath = `
  M 30 95
  C 28 85, 25 75, 28 65    
  C 29 60, 32 55, 30 50    
  C 28 45, 20 40, 25 30   
  C 30 20, 50 15, 70 20    
  C 85 24, 95 35, 110 30   
`;

// Petites branches secondaires fines
const Twig1 = "M 28 65 Q 15 60 10 55"; // Gauche bas
const Twig2 = "M 30 50 Q 40 40 45 42"; // Petit retour intérieur
const Twig3 = "M 70 20 Q 80 10 85 8";  // Haut

// ==================== COMPOSANTS SVG ====================

const FlowerGroup = ({ x, y, scale = 1, rotation = 0 }: any) => (
    <View style={{ position: 'absolute', left: x, top: y, transform: [{ rotate: `${rotation}deg` }, { scale }] }}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
            <Defs>
                <RadialGradient id="pGrad" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFF0F5" />
                    <Stop offset="100%" stopColor="#FF69B4" />
                </RadialGradient>
                <RadialGradient id="cGrad" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFFACD" />
                    <Stop offset="100%" stopColor="#FFD700" />
                </RadialGradient>
            </Defs>

            {/* Fleur Principale 5 pétales */}
            <G transform="translate(10,5)">
                <Path d="M10,10 C8,6 12,2 15,2 C18,2 22,6 22,10 C22,14 18,18 15,18 C15,18 15,18 15,18 C18,20 22,24 22,28 C22,32 18,36 15,36 C12,36 10,32 10,28 C10,28 10,28 10,28 C8,32 6,36 3,36 C0,36 -4,32 -4,28 C-4,24 0,20 3,18 C3,18 3,18 3,18 C0,18 -4,14 -4,10 C-4,6 0,2 3,2 C6,2 10,6 10,10 Z" fill="url(#pGrad)" />
                <Circle cx="10" cy="18" r="2.5" fill="url(#cGrad)" />
            </G>
        </Svg>
    </View>
);

const VectorBranch = ({ size, strokeWidth = 3.5 }: { size: number, strokeWidth?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 120 120" style={styles.branchSvg}>
        {/* Style de trait : Fin, foncé, extrémités arrondies */}
        <G stroke="#3E2723" strokeLinecap="round" fill="none">
            {/* Branche Principale */}
            <Path d={ElegantBranchPath} strokeWidth={strokeWidth} />

            {/* Texture fine sur la branche (Lumière) */}
            <Path d={ElegantBranchPath} stroke="#5D4037" strokeWidth={strokeWidth / 2} transform="translate(-0.5, -0.5)" opacity="0.6" />

            {/* Brindilles */}
            <Path d={Twig1} strokeWidth={strokeWidth * 0.6} />
            <Path d={Twig2} strokeWidth={strokeWidth * 0.6} />
            <Path d={Twig3} strokeWidth={strokeWidth * 0.6} />
        </G>
    </Svg>
);

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
    const frameSize = size + 40;

    return (
        <View style={{ width: frameSize, height: frameSize, justifyContent: 'center', alignItems: 'center' }}>

            {/* GLOW */}
            <View style={[styles.glow, { width: size, height: size, borderRadius: size / 2 }]} />

            {/* 1. BRANCHE Vectorielle */}
            <View style={{ position: 'absolute', width: frameSize, height: frameSize, zIndex: 10, pointerEvents: 'none' }}>
                <VectorBranch size={frameSize} />

                {/* 2. FLEURS (Placées sur la branche) */}
                <FlowerGroup x={frameSize * 0.70} y={frameSize * 0.15} scale={1.0} rotation={25} />
                <FlowerGroup x={frameSize * 0.82} y={frameSize * 0.22} scale={0.8} rotation={45} />
                <FlowerGroup x={frameSize * 0.60} y={frameSize * 0.10} scale={0.9} rotation={-10} />
                <FlowerGroup x={frameSize * 0.20} y={frameSize * 0.25} scale={0.7} rotation={-80} /> {/* Sur la brindille retour */}
                <FlowerGroup x={frameSize * 0.08} y={frameSize * 0.50} scale={0.8} rotation={-90} /> {/* Gauche */}
            </View>

            {/* 3. AVATAR */}
            <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
                {children}
            </View>

            {/* 4. PETALES */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]} pointerEvents="none">
                {Array.from({ length: NUM_PETALS }).map((_, i) => (
                    <Petal key={i} index={i} size={frameSize} />
                ))}
            </View>
        </View>
    );
};

// ==================== SHOP PREVIEW - FIXED ====================

export const SakuraFrameMini = React.memo(() => {
    // On n'utilise plus de "scale" CSS bizarre qui casse tout.
    // On rend les composants avec une taille adaptée directement via les props SVG.

    // Le conteneur fait 50x50.
    // On veut simuler un avatar de ~40px avec la branche autour.
    // La branche doit faire ~60px pour déborder un peu.
    const containerSize = 65;

    return (
        <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
            <View style={[styles.avatar, { width: 40, height: 40, borderRadius: 20 }]} />

            {/* Branche centrée correctement */}
            <View style={{ position: 'absolute', width: containerSize, height: containerSize, justifyContent: 'center', alignItems: 'center' }}>
                <VectorBranch size={containerSize} strokeWidth={6} />

                {/* Mini Fleurs (Positionnées relatives à containerSize = 65) */}
                <FlowerGroup x={containerSize * 0.70} y={containerSize * 0.15} scale={0.5} rotation={25} />
                <FlowerGroup x={containerSize * 0.82} y={containerSize * 0.22} scale={0.4} rotation={45} />
                <FlowerGroup x={containerSize * 0.60} y={containerSize * 0.10} scale={0.45} rotation={-10} />
                <FlowerGroup x={containerSize * 0.20} y={containerSize * 0.25} scale={0.35} rotation={-80} />
            </View>

            {/* Animation Mini Pétale */}
            <View style={{ position: 'absolute', width: 50, height: 50 }} pointerEvents="none">
                <Petal index={0} size={50} scale={0.4} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    avatar: {
        borderWidth: 2,
        borderColor: '#FFC0CB',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
        zIndex: 5,
        elevation: 5,
    },
    branchSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    glow: {
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
