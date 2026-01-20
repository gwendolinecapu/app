import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolate,
    withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LootBoxTier } from '../../services/MonetizationTypes';

interface BoosterPackProps {
    tier: LootBoxTier;
    onOpen: () => void;
}

const { width } = Dimensions.get('window');
const PACK_WIDTH = width * 0.7;
const PACK_HEIGHT = PACK_WIDTH * 1.4;

const TIER_CONFIG: Record<LootBoxTier, { colors: string[], icon: string, label: string }> = {
    basic: {
        colors: ['#9CA3AF', '#4B5563'], // Gray
        icon: 'cube-outline',
        label: 'BASIC'
    },
    standard: {
        colors: ['#60A5FA', '#2563EB'], // Blue
        icon: 'layers-outline',
        label: 'STANDARD'
    },
    elite: {
        colors: ['#FCD34D', '#D97706'], // Gold
        icon: 'star',
        label: 'ELITE'
    }
};

export default React.memo(function BoosterPack({ tier, onOpen }: BoosterPackProps) {
    const config = TIER_CONFIG[tier];
    const [opened, setOpened] = useState(false);
    const [isOpening, setIsOpening] = useState(false); // Anti-spam lock

    // Animation values
    const tearProgress = useSharedValue(0); // 0 -> 1 (swiped across)
    const packOpenScale = useSharedValue(1);
    const packOpacity = useSharedValue(1);

    const pan = Gesture.Pan()
        .onChange((event) => {
            if (opened) return;
            // Only consider horizontal movement
            const progress = (event.translationX + PACK_WIDTH / 2) / PACK_WIDTH;
            tearProgress.value = Math.max(0, Math.min(1, progress));

            // Haptics based on progress milestones to simulate "ripping" texture
            if (Math.random() > 0.8) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }
        })
        .onEnd(() => {
            if (tearProgress.value > 0.7 && !isOpening) {
                // Completed
                runOnJS(setIsOpening)(true); // Lock pour éviter double-opening
                tearProgress.value = withTiming(1, { duration: 200 });
                runOnJS(setOpened)(true);
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);

                // Trigger opening sequence
                packOpenScale.value = withTiming(1.1, { duration: 300 }, () => {
                    packOpacity.value = withTiming(0, { duration: 300 }, () => {
                        runOnJS(onOpen)();
                    });
                });
            } else {
                // Reset
                tearProgress.value = withSpring(0);
            }
        });

    const topPieceStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: interpolate(tearProgress.value, [0, 1], [0, PACK_WIDTH], Extrapolate.CLAMP) },
                { rotate: `${interpolate(tearProgress.value, [0, 1], [0, 15])}deg` }
            ],
            opacity: interpolate(tearProgress.value, [0.8, 1], [1, 0])
        };
    });

    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: packOpenScale.value }],
            opacity: packOpacity.value
        };
    });

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.container, containerStyle]}>

                {/* Main Body of the Pack */}
                <View style={styles.packBody}>
                    <LinearGradient
                        colors={config.colors as any}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.packContent}>
                            <Ionicons name={config.icon as any} size={64} color="white" style={styles.icon} />
                            <Text style={styles.label}>{config.label}</Text>
                            <Text style={styles.subLabel}>BOOSTER PACK</Text>

                            <View style={styles.ripHint}>
                                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.ripText}>GLISSER POUR DÉCHIRER</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Tear Strip (Top Part) */}
                <Animated.View style={[styles.tearStrip, topPieceStyle]}>
                    <LinearGradient
                        colors={[config.colors[0], '#ffffff', config.colors[0]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.stripGradient}
                    >
                        <View style={styles.serratedEdge} />
                    </LinearGradient>
                </Animated.View>

            </Animated.View>
        </GestureDetector>
    );
});

const styles = StyleSheet.create({
    container: {
        width: PACK_WIDTH,
        height: PACK_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    packBody: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    gradient: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packContent: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
    },
    label: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
        fontStyle: 'italic',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 4,
        marginTop: 5,
    },
    ripHint: {
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ripText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    tearStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40, // Height of the tear strip
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    stripGradient: {
        flex: 1,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        justifyContent: 'flex-end',
    },
    serratedEdge: {
        height: 4,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.2)',
    },
});
