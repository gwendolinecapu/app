
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useToast } from '../../../src/components/ui/Toast';
import FeedbackService from '../../../src/services/FeedbackService';
import { FeedbackType } from '../../../src/types/Feedback';

import Constants from 'expo-constants';
import * as Device from 'expo-device';


// Composant checkbox animée
const AnimatedCheckbox = ({
    checked,
    onToggle,
    colors
}: {
    checked: boolean;
    onToggle: () => void;
    colors: any;
}) => {
    const scale = useSharedValue(1);
    const checkScale = useSharedValue(checked ? 1 : 0);

    useEffect(() => {
        checkScale.value = withSpring(checked ? 1 : 0, { damping: 12 });
    }, [checked]);

    const handlePress = () => {
        scale.value = withSequence(
            withTiming(0.85, { duration: 100 }),
            withSpring(1, { damping: 10 })
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const checkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
        opacity: checkScale.value
    }));

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
            <Animated.View
                style={[
                    styles.checkbox,
                    { borderColor: checked ? colors.primary : colors.border },
                    checked && { backgroundColor: colors.primary },
                    containerStyle
                ]}
            >
                <Animated.View style={checkStyle}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// Composant input amélioré avec animation focus
const AnimatedInput = ({
    label,
    value,
    setValue,
    placeholder,
    multiline = false,
    required = true,
    colors,
    delay = 0,
}: {
    label: string;
    value: string;
    setValue: (t: string) => void;
    placeholder: string;
    multiline?: boolean;
    required?: boolean;
    colors: any;
    delay?: number;
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const borderColor = useSharedValue(0);
    const labelScale = useSharedValue(1);

    useEffect(() => {
        borderColor.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
        labelScale.value = withTiming(isFocused ? 1.02 : 1, { duration: 200 });
    }, [isFocused]);

    const inputContainerStyle = useAnimatedStyle(() => ({
        borderColor: isFocused ? colors.primary : colors.border,
        borderWidth: interpolate(borderColor.value, [0, 1], [1, 2]),
    }));

    const labelAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: labelScale.value }]
    }));

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={styles.inputGroup}
        >
            <Animated.View style={[styles.labelContainer, labelAnimatedStyle]}>
                <Text style={[styles.label, { color: colors.text }]}>
                    {label}
                </Text>
                {required && (
                    <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Requis</Text>
                    </View>
                )}
            </Animated.View>
            <Animated.View
                style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surface },
                    inputContainerStyle,
                    multiline && styles.inputContainerMultiline,
                ]}
            >
                <TextInput
                    style={[
                        styles.input,
                        { color: colors.text },
                        multiline && styles.inputMultiline,
                    ]}
                    value={value}
                    onChangeText={setValue}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    multiline={multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                {value.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setValue('')}
                    >
                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </Animated.View>
            {multiline && (
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                    {value.length} caractères
                </Text>
            )}
        </Animated.View>
    );
};

// Options radio animées
const RadioGroup = ({
    options,
    value,
    onChange,
    colors,
}: {
    options: { key: string; label: string; icon?: string; color?: string }[];
    value: string;
    onChange: (v: string) => void;
    colors: any;
}) => {
    return (
        <View style={styles.radioGroup}>
            {options.map((option, index) => {
                const isSelected = value === option.key;
                const scale = useSharedValue(1);

                const handlePress = () => {
                    scale.value = withSequence(
                        withTiming(0.95, { duration: 100 }),
                        withSpring(1, { damping: 12 })
                    );
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChange(option.key);
                };

                const buttonStyle = useAnimatedStyle(() => ({
                    transform: [{ scale: scale.value }]
                }));

                return (
                    <Animated.View
                        key={option.key}
                        entering={FadeInDown.delay(100 + index * 50).duration(300)}
                        style={buttonStyle}
                    >
                        <TouchableOpacity
                            style={[
                                styles.radioButton,
                                {
                                    backgroundColor: isSelected
                                        ? (option.color || colors.primary)
                                        : colors.surface,
                                    borderColor: isSelected
                                        ? (option.color || colors.primary)
                                        : colors.border,
                                }
                            ]}
                            onPress={handlePress}
                            activeOpacity={0.8}
                        >
                            {option.icon && (
                                <Ionicons
                                    name={option.icon as any}
                                    size={16}
                                    color={isSelected ? '#fff' : colors.textSecondary}
                                    style={{ marginRight: 6 }}
                                />
                            )}
                            <Text style={[
                                styles.radioText,
                                { color: isSelected ? '#fff' : colors.text }
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}
        </View>
    );
};

// Animation de succès avec confetti
const SuccessAnimation = ({ isBug }: { isBug: boolean }) => {
    const iconScale = useSharedValue(0);
    const ringScale = useSharedValue(0);
    const ringOpacity = useSharedValue(1);

    useEffect(() => {
        iconScale.value = withSequence(
            withDelay(200, withSpring(1.2, { damping: 8 })),
            withSpring(1, { damping: 12 })
        );

        ringScale.value = withDelay(300, withTiming(2, { duration: 600 }));
        ringOpacity.value = withDelay(300, withTiming(0, { duration: 600 }));

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }]
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value
    }));

    return (
        <View style={styles.successAnimationContainer}>
            {/* Ring pulse */}
            <Animated.View
                style={[
                    styles.successRing,
                    { borderColor: isBug ? '#EF4444' : '#F59E0B' },
                    ringStyle
                ]}
            />
            {/* Icon */}
            <Animated.View style={iconStyle}>
                <LinearGradient
                    colors={isBug ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706']}
                    style={styles.successIcon}
                >
                    <Ionicons
                        name={isBug ? "bug" : "bulb"}
                        size={48}
                        color="#FFF"
                    />
                </LinearGradient>
            </Animated.View>
        </View>
    );
};

// Particules de confetti
const Confetti = () => {
    const particles = Array(12).fill(0).map((_, i) => {
        const translateY = useSharedValue(0);
        const translateX = useSharedValue(0);
        const opacity = useSharedValue(1);
        const rotate = useSharedValue(0);

        useEffect(() => {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 80 + Math.random() * 40;

            translateX.value = withDelay(
                i * 30,
                withTiming(Math.cos(angle) * distance, { duration: 600, easing: Easing.out(Easing.cubic) })
            );
            translateY.value = withDelay(
                i * 30,
                withTiming(Math.sin(angle) * distance, { duration: 600, easing: Easing.out(Easing.cubic) })
            );
            rotate.value = withDelay(
                i * 30,
                withTiming(360, { duration: 600 })
            );
            opacity.value = withDelay(
                i * 30 + 400,
                withTiming(0, { duration: 200 })
            );
        }, []);

        const style = useAnimatedStyle(() => ({
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate.value}deg` }
            ],
            opacity: opacity.value
        }));

        const colors = ['#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'];
        const color = colors[i % colors.length];

        return (
            <Animated.View
                key={i}
                style={[
                    styles.confettiParticle,
                    { backgroundColor: color },
                    style
                ]}
            />
        );
    });

    return <View style={styles.confettiContainer}>{particles}</View>;
};

export default function CreateFeedbackScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const { showToast } = useToast();

    const type: FeedbackType = (params.type as FeedbackType) || 'BUG';
    const isBug = type === 'BUG';

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [consent, setConsent] = useState(false);

    // Bug Fields
    const [steps, setSteps] = useState('');
    const [expected, setExpected] = useState('');
    const [actual, setActual] = useState('');
    const [frequency, setFrequency] = useState<'ONCE' | 'SOMETIMES' | 'ALWAYS'>('ONCE');

    // Feature Fields
    const [problem, setProblem] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

    // Animation pour le bouton submit
    const submitScale = useSharedValue(1);

    const isValid = () => {
        if (!title.trim()) return false;
        if (description.trim().length < 30) return false;
        if (!consent) return false;

        if (isBug) {
            if (!steps.trim() || !expected.trim()) return false;
        } else {
            if (!problem.trim()) return false;
        }
        return true;
    };

    const getDeviceInfo = () => {
        if (Platform.OS === 'web') {
            return `Web (Browser): ${navigator.userAgent}`;
        }
        return `${Platform.OS} ${Device.osVersion}, ${Device.modelName}`;
    };

    const handleSubmit = async () => {
        if (!user) {
            showToast('Vous devez être connecté', 'error');
            return;
        }
        if (!isValid()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        submitScale.value = withSpring(0.95, { damping: 15 });

        setLoading(true);
        try {
            const deviceInfo = getDeviceInfo();
            const appVersion = Constants.expoConfig?.version || '1.0.0';

            const feedbackData: any = {
                userId: user.uid,
                userEmail: user.email || undefined,
                type,
                title: title.trim(),
                description: description.trim(),
                deviceInfo,
                appVersion,
            };

            if (isBug) {
                feedbackData.stepsToReproduce = steps.trim();
                feedbackData.expectedResult = expected.trim();
                feedbackData.actualResult = actual.trim();
                feedbackData.frequency = frequency;
            } else {
                feedbackData.problemToSolve = problem.trim();
                feedbackData.priority = priority;
            }

            await FeedbackService.createFeedback(feedbackData);
            submitScale.value = withSpring(1, { damping: 12 });
            setSubmitted(true);

        } catch (error) {
            console.error('Error sending feedback:', error);
            submitScale.value = withSpring(1, { damping: 12 });
            showToast("Erreur lors de l'envoi", 'error');
        } finally {
            setLoading(false);
        }
    };

    const submitButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: submitScale.value }]
    }));

    // Écran de succès après soumission
    if (submitted) {
        return (
            <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: "Envoyé !" }} />

                <Confetti />

                <Animated.View
                    entering={FadeIn.duration(400)}
                    style={styles.successContent}
                >
                    <SuccessAnimation isBug={isBug} />

                    <Animated.Text
                        entering={FadeInUp.delay(400).duration(400)}
                        style={[styles.successTitle, { color: colors.text }]}
                    >
                        Merci pour votre retour !
                    </Animated.Text>

                    <Animated.Text
                        entering={FadeInUp.delay(500).duration(400)}
                        style={[styles.successMessage, { color: colors.textSecondary }]}
                    >
                        {isBug
                            ? "Votre signalement a été enregistré. Notre équipe va l'examiner rapidement."
                            : "Votre suggestion a été enregistrée. Elle apparaîtra bientôt sur la roadmap publique !"
                        }
                    </Animated.Text>

                    {/* Badge de statut */}
                    <Animated.View
                        entering={FadeInUp.delay(600).duration(400)}
                        style={styles.statusBadge}
                    >
                        <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            Statut : En attente de review
                        </Text>
                    </Animated.View>

                    {/* Bouton pour voir ses feedbacks */}
                    <Animated.View entering={FadeInUp.delay(700).duration(400)}>
                        <TouchableOpacity
                            style={styles.viewFeedbackButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.back();
                                router.push('/settings/feedback/list' as any);
                            }}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.viewFeedbackGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="list-outline" size={20} color="#FFF" />
                                <Text style={styles.viewFeedbackButtonText}>Voir mes signalements</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.Text
                        entering={FadeInUp.delay(800).duration(400)}
                        style={[styles.successNote, { color: colors.textSecondary }]}
                    >
                        Vous recevrez des notifications quand votre {isBug ? 'bug' : 'suggestion'} sera traité.
                    </Animated.Text>

                    {/* Bouton retour */}
                    <Animated.View entering={FadeInUp.delay(900).duration(400)}>
                        <TouchableOpacity
                            style={[styles.backButton, { backgroundColor: colors.surface }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.back();
                            }}
                        >
                            <Text style={[styles.backButtonText, { color: colors.text }]}>
                                Retour aux paramètres
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>
        );
    }

    const frequencyOptions = [
        { key: 'ONCE', label: 'Une fois', icon: 'radio-button-off' },
        { key: 'SOMETIMES', label: 'Parfois', icon: 'sync-outline' },
        { key: 'ALWAYS', label: 'Toujours', icon: 'repeat', color: '#EF4444' },
    ];

    const priorityOptions = [
        { key: 'LOW', label: 'Faible', icon: 'arrow-down', color: '#10B981' },
        { key: 'MEDIUM', label: 'Moyenne', icon: 'remove', color: '#F59E0B' },
        { key: 'HIGH', label: 'Haute', icon: 'arrow-up', color: '#EF4444' },
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: colors.background }}
        >
            <Stack.Screen
                options={{
                    title: isBug ? "Signaler un Bug" : "Proposer une idée",
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header visuel */}
                <Animated.View
                    entering={FadeInDown.duration(400)}
                    style={styles.formHeader}
                >
                    <LinearGradient
                        colors={isBug ? ['#FCA5A5', '#EF4444'] : ['#FCD34D', '#F59E0B']}
                        style={styles.formHeaderIcon}
                    >
                        <Ionicons
                            name={isBug ? "bug-outline" : "bulb-outline"}
                            size={28}
                            color="#FFF"
                        />
                    </LinearGradient>
                    <Text style={[styles.formHeaderTitle, { color: colors.text }]}>
                        {isBug ? "Décrivez le problème" : "Partagez votre idée"}
                    </Text>
                    <Text style={[styles.formHeaderSubtitle, { color: colors.textSecondary }]}>
                        {isBug
                            ? "Plus vous êtes précis, plus vite on pourra le corriger !"
                            : "Chaque suggestion compte pour améliorer l'app !"
                        }
                    </Text>
                </Animated.View>

                <AnimatedInput
                    label="Titre"
                    value={title}
                    setValue={setTitle}
                    placeholder={isBug ? "Ex: Crash quand j'ouvre le journal" : "Ex: Ajouter un mode sombre automatique"}
                    colors={colors}
                    delay={100}
                />

                <AnimatedInput
                    label="Description"
                    value={description}
                    setValue={setDescription}
                    placeholder="Décrivez plus en détail... (min 30 caractères)"
                    multiline
                    colors={colors}
                    delay={150}
                />

                {isBug ? (
                    <>
                        <AnimatedInput
                            label="Étapes pour reproduire"
                            value={steps}
                            setValue={setSteps}
                            placeholder="1. Aller sur... 2. Cliquer sur..."
                            multiline
                            colors={colors}
                            delay={200}
                        />
                        <AnimatedInput
                            label="Résultat attendu"
                            value={expected}
                            setValue={setExpected}
                            placeholder="Ce qui aurait dû se passer..."
                            multiline
                            colors={colors}
                            delay={250}
                        />
                        <AnimatedInput
                            label="Résultat obtenu"
                            value={actual}
                            setValue={setActual}
                            placeholder="Ce qui s'est passé réellement"
                            multiline
                            required={false}
                            colors={colors}
                            delay={300}
                        />

                        <Animated.View
                            entering={FadeInDown.delay(350).duration(400)}
                            style={styles.inputGroup}
                        >
                            <View style={styles.labelContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>Fréquence</Text>
                                <View style={styles.requiredBadge}>
                                    <Text style={styles.requiredText}>Requis</Text>
                                </View>
                            </View>
                            <RadioGroup
                                options={frequencyOptions}
                                value={frequency}
                                onChange={(v) => setFrequency(v as any)}
                                colors={colors}
                            />
                        </Animated.View>
                    </>
                ) : (
                    <>
                        <AnimatedInput
                            label="Problème que ça résout"
                            value={problem}
                            setValue={setProblem}
                            placeholder="Pourquoi est-ce important ?"
                            multiline
                            colors={colors}
                            delay={200}
                        />

                        <Animated.View
                            entering={FadeInDown.delay(250).duration(400)}
                            style={styles.inputGroup}
                        >
                            <View style={styles.labelContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>Priorité</Text>
                                <View style={styles.requiredBadge}>
                                    <Text style={styles.requiredText}>Requis</Text>
                                </View>
                            </View>
                            <RadioGroup
                                options={priorityOptions}
                                value={priority}
                                onChange={(v) => setPriority(v as any)}
                                colors={colors}
                            />
                        </Animated.View>
                    </>
                )}

                {/* Consent checkbox */}
                <Animated.View
                    entering={FadeInDown.delay(400).duration(400)}
                    style={styles.checkboxContainer}
                >
                    <AnimatedCheckbox
                        checked={consent}
                        onToggle={() => setConsent(!consent)}
                        colors={colors}
                    />
                    <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
                        Je confirme ne pas inclure d'informations personnelles sensibles (mots de passe, adresses, etc.).
                    </Text>
                </Animated.View>

                {/* Info device */}
                <Animated.View
                    entering={FadeInDown.delay(450).duration(400)}
                    style={[styles.deviceInfo, { backgroundColor: colors.surface }]}
                >
                    <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.deviceInfoText, { color: colors.textSecondary }]}>
                        Infos appareil incluses automatiquement
                    </Text>
                </Animated.View>

                {/* Submit Button */}
                <Animated.View
                    entering={FadeInUp.delay(500).duration(400)}
                    style={submitButtonStyle}
                >
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            !isValid() && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!isValid() || loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={isValid()
                                ? (isBug ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706'])
                                : ['#4B5563', '#374151']
                            }
                            style={styles.submitGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={isBug ? "send" : "rocket"}
                                        size={20}
                                        color="#fff"
                                    />
                                    <Text style={styles.submitButtonText}>
                                        {isBug ? "Envoyer le rapport" : "Soumettre l'idée"}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Helper text */}
                <Animated.Text
                    entering={FadeIn.delay(550).duration(400)}
                    style={[styles.helperText, { color: colors.textSecondary }]}
                >
                    {!isValid() && "Remplissez tous les champs requis pour envoyer"}
                </Animated.Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    formHeader: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 16,
    },
    formHeaderIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    formHeaderTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    formHeaderSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
    requiredBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    requiredText: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: '600',
    },
    inputContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputContainerMultiline: {
        alignItems: 'flex-start',
        minHeight: 100,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 15,
    },
    inputMultiline: {
        minHeight: 100,
        paddingTop: 14,
    },
    clearButton: {
        padding: 10,
    },
    charCount: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'right',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    radioText: {
        fontSize: 14,
        fontWeight: '500',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
        marginBottom: 16,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        gap: 10,
    },
    deviceInfoText: {
        fontSize: 12,
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
        shadowOpacity: 0.1,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    helperText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        minHeight: 16,
    },
    // Success screen styles
    successContainer: {
        flex: 1,
    },
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    successAnimationContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confettiContainer: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        width: 0,
        height: 0,
    },
    confettiParticle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    successTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 24,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
    },
    viewFeedbackButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    viewFeedbackGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 10,
    },
    viewFeedbackButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    successNote: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    backButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
