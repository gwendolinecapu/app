import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, ViewToken, TextInput } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
    useAnimatedScrollHandler,
    SharedValue,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { storage } from '../../lib/storage';
import { triggerHaptic } from '../../lib/haptics';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        type: 'info',
        title: 'Bienvenue sur Plural Connect',
        description: 'L\'espace sécurisé pour la communication et l\'organisation des systèmes pluriels.',
        icon: 'people-circle-outline' as const,
        color: '#6366f1'
    },
    {
        id: '2',
        type: 'info',
        title: 'Suivi du Front',
        description: 'Enregistrez qui est en front, la durée, et analysez les statistiques pour mieux comprendre votre système.',
        icon: 'swap-horizontal-outline' as const,
        color: '#8b5cf6'
    },
    {
        id: '3',
        type: 'info',
        title: 'Journal Intime',
        description: 'Un espace privé pour chaque alter, ou un journal partagé pour le système. Exprimez-vous librement.',
        icon: 'book-outline' as const,
        color: '#10b981'
    },
    {
        id: '4',
        type: 'info',
        title: 'Espace Sécurisé',
        description: 'Protégez votre jardin secret avec un code PIN, le mode discret et des données chiffrées.',
        icon: 'shield-checkmark-outline' as const,
        color: '#ec4899'
    },
    {
        id: '5',
        type: 'input',
        title: 'Comment s\'appelle votre système ?',
        description: 'Ce nom sera visible par les autres si vous le rendez public.',
        icon: 'sparkles-outline' as const,
        color: '#f59e0b',
        inputKey: 'systemName',
        placeholder: 'Ex: Le Collectif Stellaire'
    },
    {
        id: '6',
        type: 'input',
        title: 'Combien d\'alters êtes-vous ?',
        description: 'Une estimation suffit, vous pourrez toujours modifier cela plus tard.',
        icon: 'list-outline' as const,
        color: '#3b82f6',
        inputKey: 'alterCount',
        placeholder: 'Ex: 5',
        keyboardType: 'numeric'
    },
];

const Slide = ({ item, index, scrollX, onInputChange, quizData }: { item: typeof SLIDES[0], index: number, scrollX: SharedValue<number>, onInputChange: (key: string, value: string) => void, quizData: any }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const scale = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
        const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
        const translateY = interpolate(scrollX.value, inputRange, [100, 0, 100], Extrapolation.CLAMP);

        return { transform: [{ scale }, { translateY }], opacity };
    });

    return (
        <View style={styles.slide}>
            <Animated.View style={[styles.iconContainer, animatedStyle, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={100} color={item.color} />
            </Animated.View>
            <Animated.View style={[styles.textContainer, animatedStyle]}>
                <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                {item.type === 'input' && (
                    <TextInput
                        style={styles.input}
                        placeholder={item.placeholder}
                        placeholderTextColor={colors.textMuted}
                        value={quizData[item.inputKey]}
                        onChangeText={(text) => onInputChange(item.inputKey, text)}
                        keyboardType={item.keyboardType || 'default'}
                        autoCapitalize="sentences"
                    />
                )}
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
                    const widthDot = interpolate(scrollX.value, inputRange, [10, 20, 10], Extrapolation.CLAMP);
                    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
                    return { width: widthDot, opacity };
                });

                return <Animated.View style={[styles.dot, animatedDotStyle]} key={i.toString()} />;
            })}
        </View>
    );
};

const BackgroundBubbles = () => {
    const anim1 = useSharedValue(0);
    const anim2 = useSharedValue(0);

    useEffect(() => {
        anim1.value = withRepeat(withSequence(withTiming(1, { duration: 15000 }), withTiming(0, { duration: 15000 })), -1, true);
        anim2.value = withRepeat(withSequence(withTiming(1, { duration: 20000 }), withTiming(0, { duration: 20000 })), -1, true);
    }, []);

    const circle1Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(anim1.value, [0, 1], [-width * 0.2, width * 0.1]) },
            { translateY: interpolate(anim1.value, [0, 1], [-height * 0.1, height * 0.1]) },
        ],
    }));

    const circle2Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(anim2.value, [0, 1], [width * 0.1, -width * 0.1]) },
            { translateY: interpolate(anim2.value, [0, 1], [height * 0.1, -height * 0.1]) },
        ],
    }));

    return (
        <View style={styles.backgroundCircles}>
            <Animated.View style={[styles.circle, styles.circle1, circle1Style]} />
            <Animated.View style={[styles.circle, styles.circle2, circle2Style]} />
        </View>
    )
}

export function OnboardingScreen() {
    const router = useRouter();
    const scrollX = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [quizData, setQuizData] = useState({ systemName: '', alterCount: '' });

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const handleInputChange = (key: string, value: string) => {
        setQuizData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            triggerHaptic.selection();
        } else {
            triggerHaptic.success();
            await storage.setHasSeenOnboarding(true);
            router.replace({
                pathname: '/(auth)/register',
                params: { systemName: quizData.systemName, alterCount: quizData.alterCount }
            });
        }
    };

    return (
        <View style={styles.container}>
            <BackgroundBubbles />

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={({ item, index }) => <Slide item={item} index={index} scrollX={scrollX} onInputChange={handleInputChange} quizData={quizData} />}
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

                <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Créer mon compte' : 'Suivant'}
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
        height: height * 0.7,
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
        maxWidth: '85%',
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
    input: {
        ...typography.body,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundLight,
        borderRadius: borderRadius.md,
        width: width * 0.8,
        padding: spacing.md,
        marginTop: spacing.lg,
        textAlign: 'center',
        color: colors.text,
    },
    footer: {
        height: height * 0.2,
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