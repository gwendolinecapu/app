import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    withRepeat,
    Easing,
    runOnJS,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ShopItem, LootBoxType } from '../../services/MonetizationTypes';
import { LootBoxService } from '../../services/LootBoxService';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

interface Props {
    visible: boolean;
    box: LootBoxType | null;
    onClose: () => void;
    onReward: (item: ShopItem) => void;
}

export const LootBoxOpening = ({ visible, box, onClose, onReward }: Props) => {
    const [phase, setPhase] = useState<'idle' | 'charging' | 'opening' | 'revealed'>('idle');
    const [reward, setReward] = useState<{ item: ShopItem, rarity: string } | null>(null);

    // Valeurs d'animation
    const scale = useSharedValue(1);
    const shake = useSharedValue(0);
    const glowOpacity = useSharedValue(0);
    const itemScale = useSharedValue(0);
    const itemRotate = useSharedValue(0);
    const bgOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible && box) {
            resetAnimation();
            // Pré-calculer la récompense
            const result = LootBoxService.openBox(box.id);
            if (result) {
                setReward(result);
                onReward(result.item); // Notifier le parent (achat validé)
            }
        }
    }, [visible, box]);

    const resetAnimation = () => {
        setPhase('idle');
        scale.value = 1;
        shake.value = 0;
        glowOpacity.value = 0;
        itemScale.value = 0;
        itemRotate.value = 0;
        bgOpacity.value = 0;
    };

    const handlePressIn = () => {
        if (phase !== 'idle') return;
        setPhase('charging');

        // Charger : tremblements + scale down
        scale.value = withTiming(0.8, { duration: 1000 });
        shake.value = withRepeat(withTiming(10, { duration: 50 }), -1, true);
        glowOpacity.value = withTiming(1, { duration: 1000 });
    };

    const handlePressOut = () => {
        if (phase === 'charging') {
            // Déclenchement de l'ouverture
            setPhase('opening');
            shake.value = 0; // Stop shake

            // 1. Explosion
            scale.value = withSequence(
                withTiming(1.2, { duration: 100 }), // Pop out
                withTiming(0, { duration: 200 }, (finished) => {
                    if (finished) runOnJS(startReveal)();
                })
            );

            bgOpacity.value = withTiming(1, { duration: 300 }); // Flash background
        }
    };

    const startReveal = () => {
        setPhase('revealed');
        // 2. Reveal Item
        itemScale.value = withSpring(1, { damping: 12 });
        itemRotate.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1);
    };

    // Styles animés
    const boxStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: shake.value }
        ]
    }));

    const itemStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: itemScale.value },
        ],
        opacity: itemScale.value
    }));

    const raysStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${itemRotate.value}deg` }],
        opacity: phase === 'revealed' ? 1 : 0
    }));

    if (!visible || !box || !reward) return null;

    const rarityColor = LootBoxService.getRarityColor(reward.rarity as any);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <BlurView intensity={90} tint="dark" style={styles.container}>

                {/* BOITE (Phase Idle/Charging) */}
                {phase !== 'revealed' && (
                    <Animated.View style={[styles.boxContainer, boxStyle]}>
                        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                            <View style={[styles.box, { backgroundColor: box.color }]}>
                                <Text style={styles.boxLabel}>?</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.hint}>Maintenir pour ouvrir</Text>
                    </Animated.View>
                )}

                {/* RAYONS DE LUMIÈRE (Background Rarity) */}
                <Animated.View style={[styles.raysContainer, raysStyle]}>
                    <View style={[styles.ray, { backgroundColor: rarityColor }]} />
                    <View style={[styles.ray, { backgroundColor: rarityColor, transform: [{ rotate: '45deg' }] }]} />
                    <View style={[styles.ray, { backgroundColor: rarityColor, transform: [{ rotate: '90deg' }] }]} />
                    <View style={[styles.ray, { backgroundColor: rarityColor, transform: [{ rotate: '135deg' }] }]} />
                </Animated.View>

                {/* REVEAL ITEM */}
                {phase === 'revealed' && (
                    <Animated.View style={[styles.rewardContainer, itemStyle]}>
                        <Text style={[styles.rarityLabel, { color: rarityColor }]}>{reward.rarity.toUpperCase()}</Text>

                        <View style={styles.itemCard}>
                            {/* Reuse ShopItem logic or simpler view */}
                            <View style={[styles.itemPreview, { backgroundColor: reward.item.preview || rarityColor }]} />
                            <Text style={styles.itemName}>{reward.item.name}</Text>
                            <Text style={styles.itemType}>{reward.item.type}</Text>
                        </View>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>Génial !</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxContainer: {
        alignItems: 'center',
    },
    box: {
        width: 150,
        height: 150,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    boxLabel: {
        fontSize: 80,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.8)'
    },
    hint: {
        marginTop: 20,
        color: '#fff',
        opacity: 0.7,
        fontSize: 16
    },
    raysContainer: {
        position: 'absolute',
        width: width * 2,
        height: width * 2,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
        zIndex: -1
    },
    ray: {
        position: 'absolute',
        width: width * 2,
        height: 100,
        opacity: 0.3
    },
    rewardContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    rarityLabel: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
        letterSpacing: 2
    },
    itemCard: {
        backgroundColor: '#1E1E1E',
        padding: 30,
        borderRadius: 25,
        alignItems: 'center',
        width: width * 0.7,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    itemPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
        backgroundColor: '#333'
    },
    itemName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5
    },
    itemType: {
        color: '#aaa',
        fontSize: 14,
        textTransform: 'uppercase'
    },
    closeButton: {
        marginTop: 40,
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30
    },
    closeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18
    }
});
