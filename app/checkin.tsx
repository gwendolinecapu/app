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
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Alter } from '../src/types';
import { useAuth } from '../src/contexts/AuthContext';
import FrontingCheckInService from '../src/services/FrontingCheckInService';
import DynamicIslandService from '../src/services/DynamicIslandService';

export default function CheckInScreen() {
    const router = useRouter();
    const { alters, activeFront, setFronting, system } = useAuth();

    const [selectedAlters, setSelectedAlters] = useState<string[]>([]);
    const [isCoFront, setIsCoFront] = useState(false);

    useEffect(() => {
        // Pré-sélectionner le fronter actuel si existant
        if (activeFront?.alters?.length > 0) {
            setSelectedAlters(activeFront.alters.map(a => a.id));
            setIsCoFront(activeFront.type === 'co-front');
        }
    }, [activeFront]);

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

        const selectedAlterObjects = alters.filter((a: Alter) => selectedAlters.includes(a.id));
        if (selectedAlterObjects.length === 0) return;

        // Déterminer le type de front
        let type: 'single' | 'co-front' | 'blurry' = 'single';
        if (selectedAlterObjects.length > 1) {
             type = 'co-front';
        }

        // Mettre à jour le front via le contexte (persisté dans Firestore)
        await setFronting(selectedAlterObjects, type);

        // Enregistrer le check-in (timestamp pour les notifications)
        await FrontingCheckInService.recordCheckIn({
            confirmed: true,
            changed: true,
            newAlterId: selectedAlters[0]
        });

        // Mettre à jour le Dynamic Island
        const mainAlter = selectedAlterObjects[0];
        const coFronterCount = Math.max(0, selectedAlterObjects.length - 1);

        await DynamicIslandService.startFronterActivity({
            name: mainAlter.name,
            initial: mainAlter.name.charAt(0).toUpperCase(),
            color: mainAlter.color || '#8B5CF6',
            coFronterCount: coFronterCount,
            isCoFront: selectedAlterObjects.length > 1,
            systemName: system?.username || 'Mon Système'
        });

        router.back();
    };

    const handleSameFronter = async () => {
        // Confirmer que c'est le même fronter
        await FrontingCheckInService.recordCheckIn({
            confirmed: true,
            changed: false
        });

        router.back();
    };

    // Helper pour afficher l'avatar ou l'initiale
    const renderAvatar = (alter: Alter) => {
        if (alter.avatar || alter.avatar_url) {
            return (
                <Image
                    source={{ uri: alter.avatar || alter.avatar_url }}
                    style={[styles.avatarImage, { borderColor: alter.color || '#FFFFFF' }]}
                />
            );
        }
        return (
            <View style={[styles.avatar, { borderColor: alter.color || '#FFFFFF' }]}>
                <Text style={[styles.avatarText, { color: alter.color || '#FFFFFF' }]}>
                    {alter.name.charAt(0).toUpperCase()}
                </Text>
            </View>
        );
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
                    onPress={() => {
                        setIsCoFront(false);
                        // Si on passe en solo et qu'on a plusieurs sélectionnés, on garde le premier
                        if (selectedAlters.length > 1) {
                            setSelectedAlters([selectedAlters[0]]);
                        }
                    }}
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
                {alters.map((alter: Alter) => (
                    <TouchableOpacity
                        key={alter.id}
                        style={[
                            styles.alterCard,
                            selectedAlters.includes(alter.id) && {
                                borderColor: alter.color || '#FFFFFF',
                                borderWidth: 2,
                            },
                        ]}
                        onPress={() => toggleAlter(alter.id)}
                    >
                        {renderAvatar(alter)}
                        <Text style={styles.alterName}>{alter.name}</Text>
                        {selectedAlters.includes(alter.id) && (
                            <View style={[styles.checkmark, { backgroundColor: alter.color || '#FFFFFF' }]}>
                                <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
                {activeFront?.alters?.length > 0 && (
                    <TouchableOpacity
                        style={styles.sameButton}
                        onPress={handleSameFronter}
                    >
                        <Text style={styles.sameButtonText}>
                            Toujours {activeFront.alters.map(a => a.name).join(', ')}
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
        backgroundColor: '#1a1a2e',
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
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
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
        paddingHorizontal: 16,
    },
    alterListContent: {
        paddingBottom: 24,
    },
    alterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
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
        marginRight: 12,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        marginRight: 12,
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
        padding: 16,
        paddingBottom: 40,
    },
    sameButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    sameButtonText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    confirmButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmGradient: {
        padding: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
