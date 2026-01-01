/**
 * CheckInScreen.tsx
 * Écran de sélection rapide du fronter lors d'un check-in
 * 
 * Affiché quand l'utilisateur tape sur la notification ou le Dynamic Island
 * Permet de sélectionner rapidement qui est en front
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { useAlters } from '@/contexts/AlterContext';
import { useFronting } from '@/contexts/FrontingContext';
import FrontingCheckInService from '@/services/FrontingCheckInService';
import DynamicIslandService from '@/services/DynamicIslandService';

interface Alter {
    id: string;
    name: string;
    color: string;
    avatarUrl?: string;
}

export default function CheckInScreen() {
    const router = useRouter();
    const { alters } = useAlters();
    const { currentFronter, setFronter } = useFronting();
    const [selectedAlters, setSelectedAlters] = useState<string[]>([]);
    const [isCoFront, setIsCoFront] = useState(false);

    useEffect(() => {
        // Pré-sélectionner le fronter actuel si existant
        if (currentFronter?.id) {
            setSelectedAlters([currentFronter.id]);
        }
    }, [currentFronter]);

    const toggleAlter = (alterId: string) => {
        if (isCoFront) {
            // Mode co-front : toggle dans la liste
            setSelectedAlters(prev =>
                prev.includes(alterId)
                    ? prev.filter(id => id !== alterId)
                    : [...prev, alterId]
            );
        } else {
            // Mode solo : un seul sélectionné
            setSelectedAlters([alterId]);
        }
    };

    const handleConfirm = async () => {
        if (selectedAlters.length === 0) return;

        const mainAlter = alters.find(a => a.id === selectedAlters[0]);
        if (!mainAlter) return;

        // Mettre à jour le front
        await setFronter(selectedAlters, isCoFront);

        // Enregistrer le check-in
        await FrontingCheckInService.recordCheckIn({
            confirmed: true,
            changed: currentFronter?.id !== selectedAlters[0],
            newAlterId: selectedAlters[0],
        });

        // Mettre à jour le Dynamic Island
        await DynamicIslandService.updateFronterActivity({
            name: mainAlter.name,
            initial: mainAlter.name.charAt(0).toUpperCase(),
            color: mainAlter.color,
            coFronterCount: selectedAlters.length - 1,
            isCoFront: isCoFront,
        });

        // Retourner à l'app
        router.back();
    };

    const handleSameFronter = async () => {
        // Confirmer que c'est le même fronter
        await FrontingCheckInService.recordCheckIn({
            confirmed: true,
            changed: false,
        });
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f0f23']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.emoji}>🎭</Text>
                <Text style={styles.title}>Qui est là ?</Text>
                <Text style={styles.subtitle}>
                    Sélectionnez qui est en front maintenant
                </Text>
            </View>

            {/* Toggle Co-Front */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, !isCoFront && styles.toggleActive]}
                    onPress={() => setIsCoFront(false)}
                >
                    <Text style={[styles.toggleText, !isCoFront && styles.toggleTextActive]}>
                        Solo
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, isCoFront && styles.toggleActive]}
                    onPress={() => setIsCoFront(true)}
                >
                    <Text style={[styles.toggleText, isCoFront && styles.toggleTextActive]}>
                        Co-Front
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Liste des alters */}
            <ScrollView style={styles.alterList} contentContainerStyle={styles.alterListContent}>
                {alters.map((alter) => (
                    <TouchableOpacity
                        key={alter.id}
                        style={[
                            styles.alterCard,
                            selectedAlters.includes(alter.id) && {
                                borderColor: alter.color,
                                borderWidth: 2,
                            },
                        ]}
                        onPress={() => toggleAlter(alter.id)}
                    >
                        <View style={[styles.avatar, { borderColor: alter.color }]}>
                            <Text style={[styles.avatarText, { color: alter.color }]}>
                                {alter.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.alterName}>{alter.name}</Text>
                        {selectedAlters.includes(alter.id) && (
                            <View style={[styles.checkmark, { backgroundColor: alter.color }]}>
                                <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
                {currentFronter && (
                    <TouchableOpacity
                        style={styles.sameButton}
                        onPress={handleSameFronter}
                    >
                        <Text style={styles.sameButtonText}>
                            Toujours {currentFronter.name}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        selectedAlters.length === 0 && styles.confirmButtonDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={selectedAlters.length === 0}
                >
                    <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        style={styles.confirmGradient}
                    >
                        <Text style={styles.confirmButtonText}>
                            Confirmer {selectedAlters.length > 1 ? `(${selectedAlters.length})` : ''}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.lg,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    toggleActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    alterList: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    alterListContent: {
        paddingBottom: 24,
    },
    alterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    alterName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    actions: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    sameButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sameButtonText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    confirmButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmGradient: {
        padding: spacing.md,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
