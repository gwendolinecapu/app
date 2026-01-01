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
import { LinearGradient } from 'expo-linear-gradient';

// Types locaux pour éviter les erreurs d'import
interface Alter {
    id: string;
    name: string;
    color: string;
    avatarUrl?: string;
}

// Exemple de données (à remplacer par les vrais contextes)
const mockAlters: Alter[] = [
    { id: '1', name: 'Luna', color: '#8B5CF6' },
    { id: '2', name: 'Alex', color: '#3B82F6' },
    { id: '3', name: 'Maya', color: '#10B981' },
    { id: '4', name: 'Sam', color: '#F59E0B' },
];

export default function CheckInScreen() {
    const router = useRouter();
    const [alters] = useState<Alter[]>(mockAlters);
    const [currentFronter] = useState<Alter | null>(mockAlters[0]);
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

        const mainAlter = alters.find((a: Alter) => a.id === selectedAlters[0]);
        if (!mainAlter) return;

        // TODO: Mettre à jour le front via le contexte
        // TODO: Enregistrer le check-in
        // TODO: Mettre à jour le Dynamic Island

        router.back();
    };

    const handleSameFronter = async () => {
        // Confirmer que c'est le même fronter
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
                {alters.map((alter: Alter) => (
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
