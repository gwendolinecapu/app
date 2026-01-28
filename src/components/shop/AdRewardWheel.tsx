import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
    FadeIn,
    FadeInDown,
    ZoomIn,
} from 'react-native-reanimated';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WheelReward, WHEEL_SEGMENTS } from '../../services/MonetizationTypes';
import { spacing } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 60, 320);
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const CENTER = WHEEL_RADIUS;
const NUM_SEGMENTS = WHEEL_SEGMENTS.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

interface AdRewardWheelProps {
    visible: boolean;
    onClose: (rewards: WheelReward[]) => void;
}

function pickWeightedSegment(): number {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
        cumulative += WHEEL_SEGMENTS[i].probability;
        if (rand <= cumulative) return i;
    }
    return 0;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function getRewardLabel(reward: WheelReward): string {
    switch (reward.type) {
        case 'credits': return `${reward.amount} Credits`;
        case 'dust': return `${reward.amount} Poussiere`;
        case 'pack': return `Pack ${reward.packTier || 'Basic'}`;
        case 'extra_spin': return `+${reward.amount} Tour${reward.amount > 1 ? 's' : ''}`;
        default: return reward.label;
    }
}

function getRewardIcon(type: string): string {
    switch (type) {
        case 'credits': return 'diamond';
        case 'dust': return 'sparkles';
        case 'pack': return 'cube';
        case 'extra_spin': return 'reload';
        default: return 'gift';
    }
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AdRewardWheel({ visible, onClose }: AdRewardWheelProps) {
    const rotation = useSharedValue(0);
    const [spinning, setSpinning] = useState(false);
    const [allRewards, setAllRewards] = useState<WheelReward[]>([]);
    const [currentResult, setCurrentResult] = useState<WheelReward | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [extraSpins, setExtraSpins] = useState(0);
    const [spinCount, setSpinCount] = useState(0);
    const resultScale = useSharedValue(0);
    const totalRotationRef = useRef(0);

    useEffect(() => {
        if (visible) {
            rotation.value = 0;
            totalRotationRef.current = 0;
            setSpinning(false);
            setAllRewards([]);
            setCurrentResult(null);
            setShowResult(false);
            setExtraSpins(0);
            setSpinCount(0);
            resultScale.value = 0;
        }
    }, [visible]);

    const onSpinComplete = useCallback((segmentIndex: number) => {
        const seg = WHEEL_SEGMENTS[segmentIndex];
        const reward: WheelReward = {
            type: seg.rewardType,
            amount: seg.amount,
            segmentIndex,
            label: seg.label,
            packTier: seg.packTier,
        };

        setCurrentResult(reward);
        setShowResult(true);
        resultScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) });

        if (seg.rewardType === 'extra_spin') {
            setExtraSpins(prev => prev + seg.amount);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
            setAllRewards(prev => [...prev, reward]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setSpinning(false);
    }, []);

    const spin = useCallback(() => {
        if (spinning) return;
        setSpinning(true);
        setShowResult(false);
        setCurrentResult(null);
        resultScale.value = 0;

        const targetIndex = pickWeightedSegment();
        const segmentCenter = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        const fullSpins = 360 * (5 + Math.random() * 3);
        const targetRotation = totalRotationRef.current + fullSpins + (360 - segmentCenter) - (totalRotationRef.current % 360);
        totalRotationRef.current = targetRotation;

        setSpinCount(prev => prev + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        rotation.value = withTiming(targetRotation, {
            duration: 4000,
            easing: Easing.out(Easing.cubic),
        }, (finished) => {
            if (finished) {
                runOnJS(onSpinComplete)(targetIndex);
            }
        });
    }, [spinning, onSpinComplete]);

    const handleContinue = () => {
        // Use an extra spin
        setExtraSpins(prev => prev - 1);
        setShowResult(false);
        setCurrentResult(null);
        resultScale.value = 0;
        // Auto spin after short delay
        setTimeout(() => spin(), 400);
    };

    const handleClaim = () => {
        onClose(allRewards);
    };

    const wheelStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const resultStyle = useAnimatedStyle(() => ({
        transform: [{ scale: resultScale.value }],
        opacity: resultScale.value,
    }));

    const isExtraSpin = currentResult?.type === 'extra_spin';
    const hasMoreSpins = extraSpins > 0;

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
                    {/* Title */}
                    <Text style={styles.title}>ROUE DE LA FORTUNE</Text>
                    <View style={styles.spinInfo}>
                        <Text style={styles.subtitle}>
                            {spinCount === 0 ? 'Tournez pour gagner !' : `Tour ${spinCount}`}
                        </Text>
                        {extraSpins > 0 && (
                            <View style={styles.extraSpinBadge}>
                                <Ionicons name="reload" size={12} color="#14B8A6" />
                                <Text style={styles.extraSpinText}>+{extraSpins} bonus</Text>
                            </View>
                        )}
                    </View>

                    {/* Wheel Container */}
                    <View style={styles.wheelContainer}>
                        <View style={styles.pointer}>
                            <Ionicons name="caret-down" size={32} color="#FFF" />
                        </View>

                        <Animated.View style={[styles.wheel, wheelStyle]}>
                            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                                <G>
                                    {WHEEL_SEGMENTS.map((seg, i) => {
                                        const startAngle = i * SEGMENT_ANGLE;
                                        const endAngle = startAngle + SEGMENT_ANGLE;
                                        const d = describeArc(CENTER, CENTER, WHEEL_RADIUS - 2, startAngle, endAngle);

                                        const labelAngle = startAngle + SEGMENT_ANGLE / 2;
                                        const labelR = WHEEL_RADIUS * 0.65;
                                        const labelPos = polarToCartesian(CENTER, CENTER, labelR, labelAngle);

                                        return (
                                            <G key={i}>
                                                <Path d={d} fill={seg.color} stroke="#0F172A" strokeWidth={2} />
                                                <SvgText
                                                    x={labelPos.x}
                                                    y={labelPos.y}
                                                    fill="#FFF"
                                                    fontSize={NUM_SEGMENTS > 10 ? 9 : 12}
                                                    fontWeight="bold"
                                                    textAnchor="middle"
                                                    alignmentBaseline="middle"
                                                >
                                                    {seg.label}
                                                </SvgText>
                                            </G>
                                        );
                                    })}
                                </G>
                            </Svg>
                            <View style={styles.centerCircle}>
                                <Ionicons name="star" size={24} color="#F59E0B" />
                            </View>
                        </Animated.View>
                    </View>

                    {/* Result or Spin Button */}
                    {showResult && currentResult ? (
                        <Animated.View style={[styles.resultContainer, resultStyle]}>
                            <View style={[styles.resultBadge, { backgroundColor: WHEEL_SEGMENTS[currentResult.segmentIndex].color }]}>
                                <Ionicons
                                    name={getRewardIcon(currentResult.type) as any}
                                    size={28}
                                    color="#FFF"
                                />
                                <Text style={styles.resultAmount}>
                                    {isExtraSpin ? `+${currentResult.amount}` : `+${currentResult.amount}`}
                                </Text>
                                <Text style={styles.resultType}>
                                    {getRewardLabel(currentResult)}
                                </Text>
                            </View>

                            {WHEEL_SEGMENTS[currentResult.segmentIndex].isJackpot && (
                                <Animated.Text entering={ZoomIn.delay(200)} style={styles.jackpotText}>
                                    JACKPOT !
                                </Animated.Text>
                            )}

                            {/* Collected rewards summary */}
                            {allRewards.length > 1 && (
                                <View style={styles.rewardsSummary}>
                                    <Text style={styles.summaryTitle}>Total accumule :</Text>
                                    <View style={styles.summaryRow}>
                                        {allRewards.map((r, i) => (
                                            <View key={i} style={[styles.summaryChip, { backgroundColor: WHEEL_SEGMENTS[r.segmentIndex].color }]}>
                                                <Ionicons name={getRewardIcon(r.type) as any} size={10} color="#FFF" />
                                                <Text style={styles.summaryChipText}>{r.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Action buttons */}
                            {isExtraSpin || hasMoreSpins ? (
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={isExtraSpin ? () => {
                                        setShowResult(false);
                                        setCurrentResult(null);
                                        resultScale.value = 0;
                                        setTimeout(() => spin(), 400);
                                    } : handleContinue}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="reload" size={20} color="#FFF" />
                                    <Text style={styles.continueText}>
                                        Tourner encore ! ({isExtraSpin ? extraSpins : extraSpins} restant{extraSpins !== 1 ? 's' : ''})
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.claimButton} onPress={handleClaim} activeOpacity={0.8}>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                    <Text style={styles.claimText}>
                                        Recuperer tout ({allRewards.length} gain{allRewards.length > 1 ? 's' : ''})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    ) : (
                        <AnimatedTouchable
                            entering={FadeIn.delay(300)}
                            style={[styles.spinButton, spinning && styles.spinButtonDisabled]}
                            onPress={spin}
                            disabled={spinning}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="reload" size={22} color="#FFF" />
                            <Text style={styles.spinText}>
                                {spinning ? 'En cours...' : spinCount === 0 ? 'TOURNER LA ROUE' : 'TOURNER'}
                            </Text>
                        </AnimatedTouchable>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        width: '100%',
    },
    title: {
        color: '#F59E0B',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 4,
    },
    spinInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: spacing.lg,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    extraSpinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(20,184,166,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#14B8A6',
    },
    extraSpinText: {
        color: '#14B8A6',
        fontSize: 12,
        fontWeight: 'bold',
    },
    wheelContainer: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    pointer: {
        position: 'absolute',
        top: -20,
        zIndex: 10,
        alignSelf: 'center',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    wheel: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        borderRadius: WHEEL_RADIUS,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#F59E0B',
    },
    centerCircle: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1E293B',
        borderWidth: 3,
        borderColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        top: WHEEL_RADIUS - 24,
    },
    spinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    spinButtonDisabled: {
        opacity: 0.5,
    },
    spinText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    resultContainer: {
        alignItems: 'center',
        gap: spacing.md,
    },
    resultBadge: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 20,
        borderRadius: 20,
        gap: 4,
    },
    resultAmount: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: '900',
    },
    resultType: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
    },
    jackpotText: {
        color: '#FFD700',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 3,
        textShadowColor: '#FFD700',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    rewardsSummary: {
        alignItems: 'center',
        gap: 6,
    },
    summaryTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
    },
    summaryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    summaryChipText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#14B8A6',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 25,
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    continueText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    claimButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 25,
    },
    claimText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
