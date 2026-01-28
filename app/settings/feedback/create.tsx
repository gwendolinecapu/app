
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useToast } from '../../../src/components/ui/Toast';
import FeedbackService from '../../../src/services/FeedbackService';
import { FeedbackType } from '../../../src/types/Feedback';

import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Config GitHub pour le lien
const GITHUB_ISSUES_URL = 'https://github.com/gwendolinecapu/app/issues';

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
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

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

            // Afficher l'écran de succès
            setSubmitted(true);

        } catch (error) {
            console.error('Error sending feedback:', error);
            showToast("Erreur lors de l'envoi", 'error');
        } finally {
            setLoading(false);
        }
    };

    // Écran de succès après soumission
    if (submitted) {
        return (
            <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: "Envoyé !" }} />

                <View style={styles.successContent}>
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

                    <Text style={[styles.successTitle, { color: colors.text }]}>
                        Merci pour votre retour !
                    </Text>

                    <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
                        {isBug
                            ? "Votre signalement de bug a été enregistré et sera automatiquement ajouté à notre tracker GitHub."
                            : "Votre suggestion a été enregistrée. Elle apparaîtra bientôt sur la roadmap publique !"
                        }
                    </Text>

                    {/* Lien vers GitHub Issues */}
                    <TouchableOpacity
                        style={styles.githubLink}
                        onPress={() => Linking.openURL(GITHUB_ISSUES_URL)}
                    >
                        <Ionicons name="logo-github" size={20} color="#FFF" />
                        <Text style={styles.githubLinkText}>Voir sur GitHub</Text>
                        <Ionicons name="open-outline" size={16} color="#FFF" />
                    </TouchableOpacity>

                    <Text style={[styles.githubNote, { color: colors.textSecondary }]}>
                        Une issue GitHub sera créée automatiquement dans quelques secondes.
                        Vous pourrez suivre son statut et recevoir des notifications.
                    </Text>

                    {/* Bouton retour */}
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.surface }]}
                        onPress={() => router.back()}
                    >
                        <Text style={[styles.backButtonText, { color: colors.text }]}>
                            Retour aux paramètres
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderInput = (
        label: string,
        value: string,
        setValue: (t: string) => void,
        placeholder: string,
        multiline = false,
        required = true
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
                {label} {required && <Text style={{ color: colors.error }}>*</Text>}
            </Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                        minHeight: multiline ? 100 : 48,
                        textAlignVertical: multiline ? 'top' : 'center'
                    }
                ]}
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                multiline={multiline}
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: colors.background }}
        >
            <Stack.Screen options={{ title: isBug ? "Signaler un Bug" : "Proposer une idée" }} />

            <ScrollView contentContainerStyle={styles.content}>

                {renderInput(
                    "Titre",
                    title,
                    setTitle,
                    isBug ? "Ex: Crash quand j'ouvre le journal" : "Ex: Ajouter un mode sombre automatique"
                )}

                {renderInput(
                    "Description",
                    description,
                    setDescription,
                    "Décrivez plus en détail... (min 30 caractères)",
                    true
                )}

                {isBug ? (
                    <>
                        {renderInput("Étapes pour reproduire", steps, setSteps, "1. Aller sur... 2. Cliquer sur...", true)}
                        {renderInput("Résultat attendu", expected, setExpected, "Ce qui aurait dû se passer...", true)}
                        {renderInput("Résultat obtenu", actual, setActual, "Ce qui s'est passé réellement", true, false)}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Fréquence *</Text>
                            <View style={styles.radioGroup}>
                                {(['ONCE', 'SOMETIMES', 'ALWAYS'] as const).map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.radioButton,
                                            frequency === option && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setFrequency(option)}
                                    >
                                        <Text style={[
                                            styles.radioText,
                                            { color: frequency === option ? '#fff' : colors.text }
                                        ]}>
                                            {option === 'ONCE' ? 'Une fois' : option === 'SOMETIMES' ? 'Parfois' : 'Toujours'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        {renderInput("Problème que ça résout", problem, setProblem, "Pourquoi est-ce important ?", true)}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Priorité *</Text>
                            <View style={styles.radioGroup}>
                                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.radioButton,
                                            priority === option && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setPriority(option)}
                                    >
                                        <Text style={[
                                            styles.radioText,
                                            { color: priority === option ? '#fff' : colors.text }
                                        ]}>
                                            {option === 'LOW' ? 'Faible' : option === 'MEDIUM' ? 'Moyenne' : 'Haute'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setConsent(!consent)}
                >
                    <View style={[
                        styles.checkbox,
                        { borderColor: colors.primary },
                        consent && { backgroundColor: colors.primary }
                    ]}>
                        {consent && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <Text style={[styles.checkboxText, { color: colors.text }]}>
                        Je confirme ne pas inclure d'informations personnelles sensibles (mots de passe, adresses, etc.).
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: isValid() ? colors.primary : colors.border },
                        loading && { opacity: 0.7 }
                    ]}
                    onPress={handleSubmit}
                    disabled={!isValid() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Envoyer</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxText: {
        flex: 1,
        fontSize: 14,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 40,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    radioButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    radioText: {
        fontSize: 14,
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
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    githubLink: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#24292e',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 10,
        marginBottom: 16,
    },
    githubLinkText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    githubNote: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
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
        fontSize: 16,
        fontWeight: '500',
    },
});
