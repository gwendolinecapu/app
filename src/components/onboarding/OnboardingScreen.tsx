import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, ViewToken } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
    useAnimatedScrollHandler,
    SharedValue
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../lib/theme';
import { storage } from '../../lib/storage';
import { triggerHaptic } from '../../lib/haptics';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Bienvenue sur Plural Connect',
        description: 'L\'espace sécurisé conçu pour faciliter la communication et l\'organisation des systèmes pluriels.',
        icon: 'people-circle-outline' as const,
        color: '#6366f1'
    },
    {
        id: '2',
        title: 'Gérez vos Alters',
        description: 'Créez des profils détaillés, suivez qui front, et gardez une trace de vos états émotionnels.',
        icon: 'albums-outline' as const,
        color: '#8b5cf6'
    },
    {
        id: '3',
        title: 'Espace Sécurisé',
        description: 'Vos données sont privées. Utilisez le mode discret et le verrouillage pour protéger votre jardin secret.',
        icon: 'shield-checkmark-outline' as const,
        color: '#ec4899'
    },
];

const Slide = ({ item, index, scrollX }: { item: typeof SLIDES[0], index: number, scrollX: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0, 1, 0],
            Extrapolation.CLAMP
        );

        const translateY = interpolate(
            scrollX.value,
            inputRange,
            [100, 0, 100],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }, { translateY }],
            opacity
        };
    });

    return (
        <View style={styles.slide}>
            <Animated.View style={[styles.iconContainer, animatedStyle, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={100} color={item.color} />
            </Animated.View>
            <Animated.View style={[styles.textContainer, animatedStyle]}>
                <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
        </View>
    );
};

const Paginator = ({ data, scrollX }: { data: typeof SLIDES, scrollX: SharedValue<number> }) => {
    return (
        <View style={styles.paginationContainer}>
            {data.map((_, i) => {
                const animatedDotStyle = useAnimatedStyle(() => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const widthDot = interpolate(
                        scrollX.value,
                        inputRange,
                        [10, 20, 10],
                        Extrapolation.CLAMP
                    );
                    const opacity = interpolate(
                        scrollX.value,
                        inputRange,
                        [0.3, 1, 0.3],
                        Extrapolation.CLAMP
                    );
                    return {
                        width: widthDot,
                        opacity
                    };
                });

                return (
                    <Animated.View style={[styles.dot, animatedDotStyle]} key={i.toString()} />
                );
            })}
        </View>
    );
};

export function OnboardingScreen() {
    const router = useRouter();
    const scrollX = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            triggerHaptic.selection();
        } else {
            triggerHaptic.success();
            await storage.setHasSeenOnboarding(true);
            router.replace('/(auth)/login');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.backgroundCircles}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={({ item, index }) => <Slide item={item} index={index} scrollX={scrollX} />}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            />

            <View style={styles.footer}>
                <Paginator data={SLIDES} scrollX={scrollX} />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
                    </Text>
                    <Ionicons
                        name={currentIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
                        size={20}
                        color="#fff"
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        width,
        height: height * 0.7, // Take up 70% of screen height
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    textContainer: {
        alignItems: 'center',
        maxWidth: '80%',
    },
    title: {
        ...typography.h1,
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 32,
    },
    description: {
        ...typography.body,
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 16,
        lineHeight: 24,
    },
    footer: {
        height: height * 0.2, // Bottom 20%
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 50,
        width: '100%',
    },
    paginationContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        marginHorizontal: 5,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backgroundCircles: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.1,
    },
    circle1: {
        width: width * 1.5,
        height: width * 1.5,
        backgroundColor: colors.primary,
        top: -width * 0.5,
        right: -width * 0.5,
    },
    circle2: {
        width: width,
        height: width,
        backgroundColor: colors.secondary,
        bottom: -width * 0.2,
        left: -width * 0.2,
    },
});
