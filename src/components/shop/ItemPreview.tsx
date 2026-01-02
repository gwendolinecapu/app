/**
 * ItemPreview.tsx
 * 
 * Composant réutilisable pour afficher l'aperçu d'un item cosmétique.
 * Utilisé dans ShopItemCard ET LootBoxOpening pour garantir la cohérence.
 * 
 * Types supportés:
 * - theme: Mini mockup d'interface avec les couleurs du thème
 * - frame: Avatar avec le cadre appliqué
 * - bubble: Bulle de chat stylisée
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing
} from 'react-native-reanimated';
import { ShopItem } from '../../services/MonetizationTypes';
import { colors } from '../../lib/theme';
import { getThemeColors } from '../../lib/cosmetics';
import { SakuraFrameMini } from '../effects/SakuraPetals';

// ==================== MINI SNOWFALL (for Winter theme) ====================

const MiniSnowfall = React.memo(() => {
    const flakes = useMemo(() =>
        Array.from({ length: 8 }).map((_, i) => ({
            key: i,
            left: 5 + (i * 6),
            size: 2 + Math.random() * 2,
            duration: 1500 + Math.random() * 1500,
            delay: i * 200,
        })), []
    );

    return (
        <View style={snowStyles.container}>
            {flakes.map(({ key, left, size, duration, delay }) => (
                <MiniFlake key={key} left={left} size={size} duration={duration} delay={delay} />
            ))}
        </View>
    );
});

const MiniFlake = React.memo(({ left, size, duration, delay }: { left: number; size: number; duration: number; delay: number }) => {
    const translateY = useSharedValue(-5);

    useEffect(() => {
        translateY.value = withDelay(delay, withRepeat(
            withTiming(90, { duration, easing: Easing.linear }),
            -1
        ));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[snowStyles.flake, animatedStyle, { left, width: size, height: size, borderRadius: size / 2 }]} />
    );
});

const snowStyles = StyleSheet.create({
    container: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
    flake: { position: 'absolute', backgroundColor: '#FFFFFF', opacity: 0.7 }
});

// ==================== MAIN COMPONENT ====================

interface ItemPreviewProps {
    item: ShopItem;
    size?: 'small' | 'medium' | 'large';
}

export const ItemPreview = React.memo(({ item, size = 'small' }: ItemPreviewProps) => {
    const isAnimated = item.id.includes('anim_');

    // Scale factor based on size
    const scale = size === 'large' ? 1.8 : size === 'medium' ? 1.3 : 1;

    if (item.type === 'theme') {
        return <ThemePreview item={item} scale={scale} isAnimated={isAnimated} />;
    }

    if (item.type === 'frame') {
        return <FramePreview item={item} scale={scale} isAnimated={isAnimated} />;
    }

    if (item.type === 'bubble') {
        return <BubblePreview item={item} scale={scale} isAnimated={isAnimated} />;
    }

    // Generic/Bundle preview
    return (
        <View style={[styles.genericPreview, { transform: [{ scale }] }]}>
            <Ionicons name={item.icon as any || "gift-outline"} size={32} color={colors.primary} />
        </View>
    );
});

// ==================== THEME PREVIEW ====================

const ThemePreview = React.memo(({ item, scale, isAnimated }: { item: ShopItem; scale: number; isAnimated: boolean }) => {
    const themeColors = getThemeColors(item.id);
    const bgColor = themeColors?.background || item.preview || '#1a1a2e';
    const cardColor = themeColors?.backgroundCard || 'rgba(255,255,255,0.15)';
    const primaryColor = themeColors?.primary || colors.primary;
    const textColor = themeColors?.text || 'rgba(255,255,255,0.5)';
    const borderColor = themeColors?.border || 'rgba(255,255,255,0.2)';
    const isWinterTheme = item.id === 'theme_winter';

    return (
        <View style={[styles.themePreview, { backgroundColor: bgColor, borderColor, transform: [{ scale }] }]}>
            {isWinterTheme && <MiniSnowfall />}

            {/* Mini app mockup */}
            <View style={styles.mockHeader}>
                <View style={styles.mockStatusBar}>
                    <View style={[styles.mockNotch, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                </View>
                <View style={[styles.mockTitleBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            </View>

            <View style={styles.mockBody}>
                <View style={[styles.mockCard1, { backgroundColor: cardColor }]}>
                    <View style={{ height: 2, width: '40%', backgroundColor: textColor, opacity: 0.7, marginBottom: 2, borderRadius: 1 }} />
                    <View style={{ height: 2, width: '80%', backgroundColor: textColor, opacity: 0.4, borderRadius: 1 }} />
                </View>
                <View style={[styles.mockCard2, { backgroundColor: cardColor }]} />
                <View style={[styles.mockCard3, { backgroundColor: cardColor }]} />
            </View>

            {/* FAB */}
            <View style={{
                position: 'absolute',
                bottom: 16,
                alignSelf: 'center',
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: primaryColor,
                shadowColor: primaryColor,
                shadowOpacity: 0.5,
                shadowRadius: 2,
                elevation: 2
            }} />

            <View style={[styles.mockTabBar, { backgroundColor: themeColors?.backgroundCard || 'rgba(0,0,0,0.2)' }]}>
                <View style={[styles.mockTab, { backgroundColor: textColor, opacity: 0.3 }]} />
                <View style={[styles.mockTab, { backgroundColor: primaryColor }]} />
                <View style={[styles.mockTab, { backgroundColor: textColor, opacity: 0.3 }]} />
            </View>

            {isAnimated && (
                <View style={styles.animatedBadge}>
                    <Text style={styles.animatedText}>✨</Text>
                </View>
            )}
        </View>
    );
});

// ==================== FRAME PREVIEW ====================

const FramePreview = React.memo(({ item, scale, isAnimated }: { item: ShopItem; scale: number; isAnimated: boolean }) => {
    // Special Sakura frame
    if (item.id === 'frame_anim_sakura') {
        return (
            <View style={[styles.framePreviewContainer, { transform: [{ scale }] }]}>
                <SakuraFrameMini />
            </View>
        );
    }

    const getFrameStyle = () => {
        if (item.id.includes('neon')) {
            return { borderColor: '#00ff00', shadowColor: '#00ff00', shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } };
        }
        if (item.id.includes('rainbow')) return { borderColor: '#ff6b6b', borderWidth: 4 };
        if (item.id.includes('double')) return { borderWidth: 4, borderColor: colors.primary };
        if (item.id.includes('flames')) return { borderColor: '#ff4500' };
        if (item.id.includes('leaves') || item.id.includes('floral')) return { borderColor: '#22c55e' };
        if (item.id.includes('gold')) return { borderColor: '#ffd700' };
        if (item.id.includes('glitch')) return { borderColor: '#00ffff' };
        if (item.id.includes('galaxy')) return { borderColor: '#8b5cf6' };
        if (item.id.includes('futuristic')) return { borderColor: '#06b6d4' };
        if (item.id.includes('nature')) return { borderColor: '#22c55e' };
        return { borderColor: colors.border };
    };

    const frameStyle = getFrameStyle();
    const isSquare = item.id.includes('square');

    return (
        <View style={[styles.framePreviewContainer, { transform: [{ scale }] }]}>
            <View style={[styles.frameCircle, frameStyle, isSquare && { borderRadius: 12 }]}>
                <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    style={[styles.avatarGradient, isSquare && { borderRadius: 8 }]}
                >
                    <Text style={styles.avatarInitial}>A</Text>
                </LinearGradient>
            </View>

            {isAnimated && (
                <View style={styles.animatedBadgeSmall}>
                    <Text style={styles.animatedTextSmall}>✨</Text>
                </View>
            )}
        </View>
    );
});

// ==================== BUBBLE PREVIEW ====================

const BubblePreview = React.memo(({ item, scale, isAnimated }: { item: ShopItem; scale: number; isAnimated: boolean }) => {
    const getBubbleStyle = () => {
        if (item.id.includes('square')) return { borderRadius: 4 };
        if (item.id.includes('round')) return { borderRadius: 20 };
        if (item.id.includes('cloud')) return { borderRadius: 18, borderBottomLeftRadius: 4 };
        if (item.id.includes('pixel')) return { borderRadius: 0 };
        if (item.id.includes('comic')) return { borderRadius: 4, borderWidth: 2, borderColor: '#000' };
        if (item.id.includes('neon')) return { borderRadius: 14, borderWidth: 2, borderColor: '#00ff00' };
        if (item.id.includes('classic')) return { borderRadius: 16 };
        return {};
    };

    const getBubbleColor = (): readonly [string, string] => {
        if (item.id.includes('gradient')) return ['#8b5cf6', '#ec4899'] as const;
        if (item.id.includes('glass')) return ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] as const;
        if (item.id.includes('neon')) return ['#001a00', '#003300'] as const;
        return [colors.primary, colors.primary] as const;
    };

    return (
        <View style={[styles.bubblePreviewContainer, { transform: [{ scale }] }]}>
            <LinearGradient
                colors={getBubbleColor()}
                style={[styles.bubblePreview, getBubbleStyle()]}
            >
                <Text style={styles.bubbleText}>Hello!</Text>
            </LinearGradient>

            {isAnimated && (
                <View style={styles.animatedBadgeSmall}>
                    <Text style={styles.animatedTextSmall}>✨</Text>
                </View>
            )}
        </View>
    );
});

// ==================== STYLES ====================

const styles = StyleSheet.create({
    // Theme preview
    themePreview: {
        width: 55,
        height: 90,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mockHeader: { height: 16 },
    mockStatusBar: { height: 8, alignItems: 'center', justifyContent: 'center' },
    mockNotch: { width: 20, height: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 2 },
    mockTitleBar: { height: 6, marginHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2 },
    mockBody: { flex: 1, padding: 4, gap: 4 },
    mockCard1: { height: 14, borderRadius: 2, padding: 2 },
    mockCard2: { height: 10, width: '70%', borderRadius: 2 },
    mockCard3: { height: 10, width: '50%', borderRadius: 2 },
    mockTabBar: { height: 12, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
    mockTab: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)' },

    // Frame preview
    framePreviewContainer: { justifyContent: 'center', alignItems: 'center' },
    frameCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        padding: 3,
        backgroundColor: colors.background,
    },
    avatarGradient: { flex: 1, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    // Bubble preview
    bubblePreviewContainer: { alignItems: 'center' },
    bubblePreview: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderBottomLeftRadius: 4 },
    bubbleText: { color: '#FFF', fontSize: 11, fontWeight: '500' },

    // Generic
    genericPreview: { opacity: 0.7 },

    // Badges
    animatedBadge: { position: 'absolute', top: 4, right: 4 },
    animatedText: { fontSize: 12 },
    animatedBadgeSmall: { position: 'absolute', top: 0, right: 0 },
    animatedTextSmall: { fontSize: 10 },
});

export default ItemPreview;
