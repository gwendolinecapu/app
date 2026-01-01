
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useToast } from '../../../src/components/ui/Toast';
import FeedbackService from '../../../src/services/FeedbackService';
import { Feedback, FeedbackStatus } from '../../../src/types/Feedback';

export default function AdminFeedbackDetailScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { showToast } = useToast();

    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [adminNotes, setAdminNotes] = useState('');
    const [rewardAmount, setRewardAmount] = useState('50');

    useEffect(() => {
        loadFeedback();
    }, [id]);

    const loadFeedback = async () => {
        try {
            if (typeof id !== 'string') return;
            // distinct service method or just re-use getFeedbacks + filter? 
            // Ideally we'd have getFeedbackById in service, but let's implement if missing or fetch list
            // Implementing fetch by ID locally here since logic is simple
            // Actually, let's assume we might need to add getFeedbackById to Service if not exists
            // Checking Service... createFeedback, getFeedbacks, getUserFeedbacks, updateFeedbackStatus, rewardReporter
            // It seems we missed getFeedbackById. Let's fetch all and find (inefficient but works for now)
            // or better, implement get by ID properly in service later. For now, fetch all.

            // Wait, actually I can just use getFeedbacks() and find.
            const { feedbacks: all } = await FeedbackService.getFeedbacks();
            const found = all.find(f => f.id === id);

            if (found) {
                setFeedback(found);
                setAdminNotes(found.adminNotes || '');
            } else {
                showToast('Feedback introuvable', 'error');
                router.back();
            }
        } catch (error) {
            console.error(error);
            showToast('Erreur chargement', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: FeedbackStatus) => {
        if (!feedback) return;
        setUpdating(true);
        try {
            await FeedbackService.updateStatus(feedback.id, newStatus, adminNotes);
            setFeedback({ ...feedback, status: newStatus, adminNotes });
            showToast('Statut mis à jour', 'success');
        } catch (error) {
            console.error(error);
            showToast('Erreur mise à jour', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleReward = () => {
        if (!feedback) return;
        const amount = parseInt(rewardAmount);
        if (isNaN(amount) || amount <= 0) {
            showToast('Montant invalide', 'error');
            return;
        }

        Alert.alert(
            "Confirmer la récompense",
            `Donner ${amount} crédits à l'utilisateur et marquer comme CONFIRMED_BUG ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            await FeedbackService.rewardReporter(feedback.id, amount);
                            // Refresh
                            loadFeedback();
                            showToast(`Récompensé de ${amount} crédits`, 'success');
                        } catch (error) {
                            console.error(error);
                            showToast('Erreur récompense', 'error');
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading || !feedback) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const renderSection = (title: string, content: React.ReactNode) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
            {content}
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ title: 'Détail Feedback' }} />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Header Info */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.row}>
                        <View style={[styles.badge, { backgroundColor: feedback.type === 'BUG' ? colors.error + '20' : colors.success + '20' }]}>
                            <Text style={[styles.badgeText, { color: feedback.type === 'BUG' ? colors.error : colors.success }]}>
                                {feedback.type}
                            </Text>
                        </View>
                        <Text style={[styles.date, { color: colors.textSecondary }]}>
                            {new Date(feedback.createdAt).toLocaleString()}
                        </Text>
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>{feedback.title}</Text>
                    <Text style={[styles.idText, { color: colors.textMuted }]}>ID: {feedback.id}</Text>
                    <Text style={[styles.idText, { color: colors.textMuted }]}>User: {feedback.userId}</Text>
                </View>

                {/* Main Content */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    {renderSection("Description", <Text style={{ color: colors.text }}>{feedback.description}</Text>)}

                    {feedback.type === 'BUG' && (
                        <>
                            {renderSection("Étapes", <Text style={{ color: colors.text }}>{feedback.stepsToReproduce}</Text>)}
                            {renderSection("Attendu", <Text style={{ color: colors.text }}>{feedback.expectedResult}</Text>)}
                            {renderSection("Réel", <Text style={{ color: colors.text }}>{feedback.actualResult}</Text>)}
                            {renderSection("Fréquence", <Text style={{ color: colors.text }}>{feedback.frequency}</Text>)}
                        </>
                    )}

                    {feedback.type === 'FEATURE' && (
                        <>
                            {renderSection("Problème résolu", <Text style={{ color: colors.text }}>{feedback.problemToSolve}</Text>)}
                            {renderSection("Priorité", <Text style={{ color: colors.text }}>{feedback.priority}</Text>)}
                        </>
                    )}

                    {renderSection("Device Info", <Text style={{ color: colors.textMuted, fontSize: 12 }}>{feedback.deviceInfo} - v{feedback.appVersion}</Text>)}
                </View>

                {/* Actions */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions Admin</Text>

                    {/* Status Picker (Simplified as buttons) */}
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Changer statut:</Text>
                    <View style={styles.statusRow}>
                        {['NEW', 'PLANNED', 'DONE', 'REJECTED'].map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[
                                    styles.statusButton,
                                    {
                                        backgroundColor: feedback.status === s ? colors.primary : colors.background,
                                        borderColor: colors.border
                                    }
                                ]}
                                onPress={() => handleStatusUpdate(s as FeedbackStatus)}
                                disabled={updating}
                            >
                                <Text style={{ color: feedback.status === s ? '#fff' : colors.text, fontSize: 12 }}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Admin Notes */}
                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Notes Admin:</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={adminNotes}
                        onChangeText={setAdminNotes}
                        placeholder="Notes internes..."
                        placeholderTextColor={colors.textMuted}
                        onBlur={() => handleStatusUpdate(feedback.status)} // Save on blur
                    />

                    {/* Reward Section (Only for Bugs) */}
                    {feedback.type === 'BUG' && (
                        <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
                            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Récompense Bug Hunter</Text>

                            {feedback.creditRewardAmount ? (
                                <View style={[styles.rewardInfo, { backgroundColor: colors.secondary + '20' }]}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
                                    <Text style={{ color: colors.secondary, fontWeight: 'bold' }}>
                                        Déjà récompensé: {feedback.creditRewardAmount} crédits
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.rewardRow}>
                                    <TextInput
                                        style={[styles.rewardInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        value={rewardAmount}
                                        onChangeText={setRewardAmount}
                                        keyboardType="numeric"
                                    />
                                    <TouchableOpacity
                                        style={[styles.rewardButton, { backgroundColor: colors.secondary }]}
                                        onPress={handleReward}
                                        disabled={updating}
                                    >
                                        <Text style={{ color: '#000', fontWeight: 'bold' }}>Donner Crédits</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    idText: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    rewardRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    rewardInput: {
        width: 80,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
    },
    rewardButton: {
        flex: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    }
});
