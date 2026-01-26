import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { storage } from '../../lib/storage';

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

export function OnboardingScreenWeb() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [quizData, setQuizData] = useState({ systemName: '', alterCount: '' });

    const currentSlide = SLIDES[currentIndex];

    const handleInputChange = (key: string, value: string) => {
        setQuizData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            await storage.setHasSeenOnboarding(true);
            router.replace({
                pathname: '/(auth)/register',
                params: { systemName: quizData.systemName, alterCount: quizData.alterCount }
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.slide}>
                    <View style={[styles.iconContainer, { backgroundColor: currentSlide.color + '20' }]}>
                        <Ionicons name={currentSlide.icon} size={100} color={currentSlide.color} />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: currentSlide.color }]}>
                            {currentSlide.title}
                        </Text>
                        <Text style={styles.description}>
                            {currentSlide.description}
                        </Text>

                        {currentSlide.type === 'input' && currentSlide.inputKey && (
                            <TextInput
                                style={styles.input}
                                placeholder={currentSlide.placeholder}
                                placeholderTextColor={colors.textMuted}
                                value={quizData[currentSlide.inputKey as keyof typeof quizData]}
                                onChangeText={(value) => handleInputChange(currentSlide.inputKey!, value)}
                                keyboardType={(currentSlide.keyboardType as any) || 'default'}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.paginationContainer}>
                        {SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        width: index === currentIndex ? 30 : 10,
                                        opacity: index === currentIndex ? 1 : 0.3
                                    }
                                ]}
                            />
                        ))}
                    </View>

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
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
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
        maxWidth: '100%',
        paddingHorizontal: spacing.lg,
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
        width: '100%',
        maxWidth: 400,
        padding: spacing.md,
        marginTop: spacing.lg,
        textAlign: 'center',
        color: colors.text,
        fontSize: 16,
    },
    footer: {
        height: 150,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
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
});
