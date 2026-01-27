import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
    useAnimatedProps,
    interpolate,
    SharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface PackTearEffectProps {
    tearProgress: SharedValue<number>;
    glowColor: string;
    width: number;
    height: number;
}

/**
 * Composant d'effet de déchirure style R6
 * Affiche des fissures lumineuses qui s'ouvrent progressivement
 * avec une lueur de la couleur de rareté qui émane de l'intérieur
 */
export default function PackTearEffect({
    tearProgress,
    glowColor,
    width,
    height,
}: PackTearEffectProps) {
    // Path de déchirure principal - zigzag irrégulier horizontal
    const mainTearPath = `
        M 0,${height * 0.12}
        L ${width * 0.08},-3
        L ${width * 0.15},5
        L ${width * 0.25},-2
        L ${width * 0.35},4
        L ${width * 0.45},-4
        L ${width * 0.55},3
        L ${width * 0.65},-1
        L ${width * 0.75},5
        L ${width * 0.85},-3
        L ${width * 0.92},4
        L ${width},${height * 0.12}
    `;

    // Fissures secondaires (craquelures)
    const crack1Path = `M ${width * 0.3},${height * 0.12} L ${width * 0.35},${height * 0.25} L ${width * 0.28},${height * 0.35}`;
    const crack2Path = `M ${width * 0.6},${height * 0.12} L ${width * 0.65},${height * 0.22} L ${width * 0.7},${height * 0.3}`;
    const crack3Path = `M ${width * 0.8},${height * 0.12} L ${width * 0.75},${height * 0.2}`;

    // Animation du path principal
    const mainPathProps = useAnimatedProps(() => {
        const progress = tearProgress.value;
        return {
            strokeDashoffset: interpolate(progress, [0.3, 0.7], [width * 2, 0]),
            strokeOpacity: interpolate(progress, [0.25, 0.4], [0, 1]),
            strokeWidth: interpolate(progress, [0.3, 0.7], [2, 8]),
        };
    });

    // Animation de la lueur principale
    const glowPathProps = useAnimatedProps(() => {
        const progress = tearProgress.value;
        return {
            strokeDashoffset: interpolate(progress, [0.3, 0.7], [width * 2, 0]),
            strokeOpacity: interpolate(progress, [0.35, 0.5], [0, 0.9]),
            strokeWidth: interpolate(progress, [0.3, 0.7], [10, 35]),
        };
    });

    // Animation des craquelures secondaires
    const crackPathProps = useAnimatedProps(() => {
        const progress = tearProgress.value;
        return {
            strokeDashoffset: interpolate(progress, [0.5, 0.75], [100, 0]),
            strokeOpacity: interpolate(progress, [0.45, 0.6], [0, 0.8]),
        };
    });

    // Lueur diffuse qui s'élargit
    const innerGlowProps = useAnimatedProps(() => {
        const progress = tearProgress.value;
        return {
            opacity: interpolate(progress, [0.4, 0.6, 0.9], [0, 0.6, 0.3]),
            y: interpolate(progress, [0.4, 0.7], [height * 0.08, height * 0.05]),
            height: interpolate(progress, [0.4, 0.7], [10, 40]),
        };
    });

    // Style pour le container avec blur
    const containerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(tearProgress.value, [0.25, 0.35], [0, 1]),
    }));

    return (
        <Animated.View style={[styles.container, { width, height: height * 0.5 }, containerStyle]}>
            <Svg width={width} height={height * 0.5} style={styles.svg}>
                <Defs>
                    {/* Gradient pour la lueur principale */}
                    <LinearGradient id="tearGlow" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={glowColor} stopOpacity="1" />
                        <Stop offset="0.5" stopColor={glowColor} stopOpacity="0.5" />
                        <Stop offset="1" stopColor={glowColor} stopOpacity="0" />
                    </LinearGradient>

                    {/* Gradient pour la lueur diffuse intérieure */}
                    <LinearGradient id="innerGlow" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={glowColor} stopOpacity="0.8" />
                        <Stop offset="1" stopColor={glowColor} stopOpacity="0" />
                    </LinearGradient>

                    {/* Gradient pour les craquelures */}
                    <LinearGradient id="crackGlow" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={glowColor} stopOpacity="0.9" />
                        <Stop offset="1" stopColor={glowColor} stopOpacity="0.2" />
                    </LinearGradient>
                </Defs>

                {/* Lueur diffuse qui émane de l'intérieur */}
                <AnimatedRect
                    x={0}
                    width={width}
                    fill="url(#innerGlow)"
                    animatedProps={innerGlowProps}
                />

                {/* Lueur large derrière la déchirure */}
                <AnimatedPath
                    d={mainTearPath}
                    stroke="url(#tearGlow)"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={width * 2}
                    animatedProps={glowPathProps}
                />

                {/* Ligne de déchirure principale (trait fin sombre) */}
                <AnimatedPath
                    d={mainTearPath}
                    stroke="rgba(0,0,0,0.8)"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={width * 2}
                    animatedProps={mainPathProps}
                />

                {/* Craquelures secondaires avec lueur */}
                <AnimatedPath
                    d={crack1Path}
                    stroke="url(#crackGlow)"
                    fill="none"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={100}
                    animatedProps={crackPathProps}
                />
                <AnimatedPath
                    d={crack1Path}
                    stroke="rgba(0,0,0,0.6)"
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeDasharray={100}
                    animatedProps={crackPathProps}
                />

                <AnimatedPath
                    d={crack2Path}
                    stroke="url(#crackGlow)"
                    fill="none"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={100}
                    animatedProps={crackPathProps}
                />
                <AnimatedPath
                    d={crack2Path}
                    stroke="rgba(0,0,0,0.6)"
                    fill="none"
                    strokeWidth={1}
                    strokeLinecap="round"
                    strokeDasharray={100}
                    animatedProps={crackPathProps}
                />

                <AnimatedPath
                    d={crack3Path}
                    stroke="url(#crackGlow)"
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray={100}
                    animatedProps={crackPathProps}
                />
            </Svg>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 20,
        pointerEvents: 'none',
    },
    svg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
