import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CrisisModeScreen() {
    const { alters } = useAuth();
    const [selectedAlterId, setSelectedAlterId] = useState<string | null>(null);

    // Find active alter or host by default
    useEffect(() => {
        if (alters.length > 0) {
            const active = alters.find(a => a.is_active) || alters.find(a => a.is_host) || alters[0];
            setSelectedAlterId(active.id);
        }
    }, [alters]);

    const activeAlter = alters.find(a => a.id === selectedAlterId);

    const handleEmergencyCall = () => {
        Alert.alert(
            'Appel d\'urgence',
            'Voulez-vous appeler les secours (112) ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Appeler',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const url = 'tel:112';
                            if (await Linking.canOpenURL(url)) {
                                await Linking.openURL(url);
                            } else {
                                Alert.alert('Erreur', 'Impossible de passer l\'appel sur cet appareil.');
                            }
                        } catch {
                            Alert.alert('Erreur', 'Impossible de lancer l\'appel.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FF5252', '#B71C1C']} // Red gradient for crisis mode
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mode Crise / S.O.S</Text>
                <Text style={styles.headerSubtitle}>Respire. Tu es en sécurité.</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* 1. Grounding Technique */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="leaf" size={24} color={colors.primary} />
                        <Text style={styles.cardTitle}>Ancrage Rapide (5-4-3-2-1)</Text>
                    </View>
                    <View style={styles.groundingList}>
                        <Text style={styles.groundingItem}>👀 <Text style={styles.bold}>5</Text> choses que tu vois</Text>
                        <Text style={styles.groundingItem}>✋ <Text style={styles.bold}>4</Text> choses que tu touches</Text>
                        <Text style={styles.groundingItem}>👂 <Text style={styles.bold}>3</Text> sons que tu entends</Text>
                        <Text style={styles.groundingItem}>👃 <Text style={styles.bold}>2</Text> odeurs</Text>
                        <Text style={styles.groundingItem}>👅 <Text style={styles.bold}>1</Text> goût</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.guideButton}
                        onPress={() => router.push('/crisis/guide')}
                    >
                        <Text style={styles.guideButtonText}>📖 Voir le guide complet</Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Alter Selector */}
                <View style={styles.selectorContainer}>
                    <Text style={styles.sectionLabel}>Qui est là ?</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {alters.map(alter => (
                            <TouchableOpacity
                                key={alter.id}
                                style={[
                                    styles.alterChip,
                                    selectedAlterId === alter.id && styles.alterChipSelected,
                                    { borderColor: alter.color || colors.border }
                                ]}
                                onPress={() => setSelectedAlterId(alter.id)}
                            >
                                <Text style={[
                                    styles.alterChipText,
                                    selectedAlterId === alter.id && { fontWeight: 'bold' }
                                ]}>
                                    {alter.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 3. Safety Card for Active Alter */}
                {activeAlter && (
                    <View style={[styles.card, styles.safetyCard, { borderColor: activeAlter.color }]}>
                        <Text style={styles.safetyTitle}>Aide pour {activeAlter.name}</Text>

                        {activeAlter.fronting_help ? (
                            <View style={styles.infoBlock}>
                                <Text style={styles.label}>🤝 Comment aider :</Text>
                                <Text style={styles.infoText}>{activeAlter.fronting_help}</Text>
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>Pas d&apos;instructions d&apos;aide spécifiques.</Text>
                        )}

                        {activeAlter.triggers && activeAlter.triggers.length > 0 && (
                            <View style={styles.infoBlock}>
                                <Text style={styles.label}>⚠️ Attention aux Triggers :</Text>
                                <View style={styles.tagsContainer}>
                                    {activeAlter.triggers.map((t, i) => (
                                        <View key={i} style={styles.triggerTag}>
                                            <Text style={styles.triggerText}>{t}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {activeAlter.crisis_contact && (
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => Linking.openURL(`tel:${activeAlter.crisis_contact}`)}
                            >
                                <Ionicons name="call" size={20} color="white" />
                                <Text style={styles.contactButtonText}>Appeler Contact Confiance</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* 4. Internal Help Request */}
                <TouchableOpacity
                    style={styles.internalHelpButton}
                    onPress={() => router.push('/help/create')}
                >
                    <Ionicons name="hand-left-outline" size={24} color="white" />
                    <Text style={styles.internalHelpText}>DEMANDER DE L&apos;AIDE AU SYSTÈME</Text>
                </TouchableOpacity>

                {/* 5. Emergency Button */}
                <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
                    <Ionicons name="warning" size={32} color="white" />
                    <Text style={styles.emergencyText}>APPELER URGENCES (112)</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.xl,
        paddingTop: 60,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: spacing.md,
        padding: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    cardTitle: {
        ...typography.h3,
        fontWeight: 'bold',
    },
    groundingList: {
        gap: spacing.sm,
    },
    groundingItem: {
        fontSize: 16,
        color: colors.text,
        lineHeight: 24,
    },
    bold: {
        fontWeight: 'bold',
        color: colors.primary,
    },
    selectorContainer: {
        marginBottom: spacing.lg,
    },
    sectionLabel: {
        ...typography.h3,
        marginBottom: spacing.md,
    },
    alterChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        marginRight: spacing.sm,
        backgroundColor: colors.background,
    },
    alterChipSelected: {
        backgroundColor: colors.backgroundCard,
    },
    alterChipText: {
        color: colors.text,
    },
    safetyCard: {
        borderWidth: 2,
    },
    safetyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
        textAlign: 'center',
        color: colors.text,
    },
    infoBlock: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    infoText: {
        fontSize: 16,
        color: colors.text,
        lineHeight: 22,
    },
    emptyText: {
        fontStyle: 'italic',
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    triggerTag: {
        backgroundColor: '#FFE5E5',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: '#FFCDCD',
    },
    triggerText: {
        color: '#D32F2F',
        fontWeight: '600',
    },
    contactButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    contactButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emergencyButton: {
        backgroundColor: '#D32F2F',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        marginBottom: 40,
        gap: spacing.md,
        shadowColor: "#D32F2F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    emergencyText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    guideButton: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        alignItems: 'center',
    },
    guideButtonText: {
        color: colors.primary,
        fontWeight: '600',
    },
    internalHelpButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        gap: spacing.md,
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    internalHelpText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
