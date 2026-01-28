
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Composant icône animée pour chaque carte
const AnimatedIcon = ({ icon, delay }: { icon: string; delay: number }) => {
    const bounce = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        // Bounce subtil
        bounce.value = withDelay(
            delay + 500,
            withRepeat(
                withSequence(
                    withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            )
        );
        // Légère rotation
        rotate.value = withDelay(
            delay + 500,
            withRepeat(
                withSequence(
                    withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: bounce.value },
            { rotate: `${rotate.value}deg` }
        ]
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={icon as any} size={32} color="#FFF" />
        </Animated.View>
    );
};

// Badge "populaire" pour la roadmap
const PopularBadge = () => {
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 800 }),
                withTiming(1, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }]
    }));

    return (
        <Animated.View style={[styles.popularBadge, animatedStyle]}>
            <Ionicons name="flame" size={10} color="#FFF" />
            <Text style={styles.popularBadgeText}>HOT</Text>
        </Animated.View>
    );
};

// Carte de menu animée
const MenuCard = ({
    item,
    index,
    colors,
    onPress
}: {
    item: any;
    index: number;
    colors: any;
    onPress: () => void;
}) => {
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 15 });
        glowOpacity.value = withTiming(0.3, { duration: 150 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15 });
        glowOpacity.value = withTiming(0, { duration: 200 });
    };

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value
    }));

    return (
        <Animated.View
            entering={FadeInDown.delay(100 + index * 100).duration(500).springify()}
        >
            <AnimatedTouchable
                style={[styles.card, { backgroundColor: colors.surface }, cardAnimatedStyle]}
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
            >
                {/* Glow effect */}
                <Animated.View
                    style={[
                        styles.cardGlow,
                        { backgroundColor: item.color },
                        glowStyle
                    ]}
                />

                {/* Icon container */}
                <LinearGradient
                    colors={item.gradient as any}
                    style={styles.iconContainer}
                >
                    <AnimatedIcon icon={item.icon} delay={index * 100} />

                    {/* Shine effect */}
                    <View style={styles.iconShine} />
                </LinearGradient>

                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            {item.title}
                        </Text>
                        {item.type === 'ROADMAP' && <PopularBadge />}
                    </View>
                    <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                        {item.description}
                    </Text>
                </View>

                <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color={item.color} />
                </View>
            </AnimatedTouchable>
        </Animated.View>
    );
};

export default function FeedbackMenuScreen() {
    const { colors } = useTheme();
    const router = useRouter();

    const menuItems = [
        {
            title: "Roadmap Publique",
            description: "Votez pour les prochaines fonctionnalités !",
            icon: "map-outline",
            type: "ROADMAP",
            color: "#8B5CF6",
            gradient: ['#A78BFA', '#8B5CF6']
        },
        {
            title: "Signaler un Bug",
            description: "Quelque chose ne fonctionne pas comme prévu ?",
            icon: "bug-outline",
            type: "BUG",
            color: "#EF4444",
            gradient: ['#FCA5A5', '#EF4444']
        },
        {
            title: "Proposer une idée",
            description: "Vous avez une idée pour améliorer l'application ?",
            icon: "bulb-outline",
            type: "FEATURE",
            color: "#F59E0B",
            gradient: ['#FCD34D', '#F59E0B']
        }
    ];

    const handleCardPress = (item: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (item.type === 'ROADMAP') {
            router.push('/settings/feedback/roadmap' as any);
        } else {
            router.push({
                pathname: "/settings/feedback/create",
                params: { type: item.type }
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header gradient avec effet de particules */}
            <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#4F46E5']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Particules décoratives */}
                <View style={[styles.particle, styles.particle1]} />
                <View style={[styles.particle, styles.particle2]} />
                <View style={[styles.particle, styles.particle3]} />
            </LinearGradient>

            <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.header}
            >
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <View style={styles.backButtonCircle}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>
                        Votre avis compte !
                    </Text>
                    <Text style={styles.headerEmoji}>💬</Text>
                </View>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Animated.Text
                    entering={FadeInDown.delay(50).duration(400)}
                    style={[styles.headerSubtitle, { color: colors.textSecondary }]}
                >
                    Aidez-nous à améliorer Plural Connect en nous signalant des problèmes ou en partageant vos idées.
                </Animated.Text>

                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <MenuCard
                            key={item.type}
                            item={item}
                            index={index}
                            colors={colors}
                            onPress={() => handleCardPress(item)}
                        />
                    ))}
                </View>

                {/* Bouton "Voir mes signalements" */}
                <Animated.View entering={FadeInUp.delay(400).duration(400)}>
                    <TouchableOpacity
                        style={[styles.myFeedbacksButton, { backgroundColor: colors.surface }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/settings/feedback/list' as any);
                        }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.myFeedbacksIcon}
                        >
                            <Ionicons name="list-outline" size={20} color="#FFF" />
                        </LinearGradient>
                        <Text style={[styles.myFeedbacksButtonText, { color: colors.text }]}>
                            Voir mes signalements
                        </Text>
                        <View style={styles.feedbackCount}>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Info box améliorée */}
                <Animated.View
                    entering={FadeInUp.delay(500).duration(400)}
                    style={[styles.infoBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}
                >
                    <View style={styles.infoIconContainer}>
                        <Ionicons name="information-circle" size={24} color="#6366F1" />
                    </View>
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoTitle, { color: colors.text }]}>
                            Suivez vos retours
                        </Text>
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            Suivez le statut de vos signalements, votez pour montrer leur importance et ajoutez des précisions.
                        </Text>
                    </View>
                </Animated.View>

                {/* Stats rapides */}
                <Animated.View
                    entering={FadeInUp.delay(600).duration(400)}
                    style={styles.statsContainer}
                >
                    <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                        <Text style={styles.statEmoji}>🐛</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bugs résolus</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>127</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                        <Text style={styles.statEmoji}>💡</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Idées ajoutées</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>43</Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 220,
    },
    particle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    particle1: {
        top: 20,
        right: -30,
        width: 120,
        height: 120,
    },
    particle2: {
        top: 80,
        left: -40,
        width: 80,
        height: 80,
    },
    particle3: {
        top: 140,
        right: 40,
        width: 60,
        height: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 10,
    },
    backButton: {
        marginRight: 16,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerEmoji: {
        fontSize: 24,
    },
    content: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    headerSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
        backgroundColor: 'transparent',
    },
    menuContainer: {
        gap: 16,
        marginBottom: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    cardGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
        overflow: 'hidden',
    },
    iconShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '50%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        transform: [{ skewX: '-20deg' }, { translateX: -10 }],
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    cardDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popularBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 3,
    },
    popularBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    myFeedbacksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    myFeedbacksIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    myFeedbacksButtonText: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginLeft: 12,
    },
    feedbackCount: {
        paddingHorizontal: 4,
    },
    infoBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'flex-start',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 19,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    statEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
